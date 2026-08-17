"""Retry helper for transient LLM API failures that LangChain's own retry
logic does not cover.

`ChatMistralAI`'s built-in retry (controlled by `LLM_MAX_RETRIES`) only
catches network-level failures - `httpx.RequestError` / `httpx.StreamError`
(see `langchain_mistralai.chat_models._create_retry_decorator`). It does
NOT retry HTTP error *responses* such as a 429 rate limit or a momentary
502/503, which are raised as `httpx.HTTPStatusError` and propagate straight
up through the chain. Left unhandled, that turns a routine rate limit into
a full pipeline failure.

`ainvoke_with_retry()` adds that missing layer: exponential backoff with
jitter, capped attempts, and it honours the API's `Retry-After` header when
one is provided instead of guessing.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx
from tenacity import AsyncRetrying, RetryCallState, retry_if_exception, stop_after_attempt, wait_exponential_jitter

from config import get_settings

logger = logging.getLogger(__name__)

_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


def _is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in _RETRYABLE_STATUS_CODES
    if isinstance(exc, (httpx.RequestError, httpx.StreamError)):
        return True
    return False


def _retry_after_seconds(exc: BaseException) -> float | None:
    if isinstance(exc, httpx.HTTPStatusError):
        header = exc.response.headers.get("retry-after")
        if header:
            try:
                return float(header)
            except ValueError:
                return None
    return None


def _wait(retry_state: RetryCallState) -> float:
    exc = retry_state.outcome.exception() if retry_state.outcome else None
    if exc is not None:
        retry_after = _retry_after_seconds(exc)
        if retry_after is not None:
            return retry_after
    settings = get_settings()
    fallback = wait_exponential_jitter(initial=2, max=settings.rate_limit_max_wait_seconds)
    return fallback(retry_state)


def _before_sleep(retry_state: RetryCallState) -> None:
    exc = retry_state.outcome.exception() if retry_state.outcome else None
    wait_seconds = retry_state.next_action.sleep if retry_state.next_action else 0
    status = exc.response.status_code if isinstance(exc, httpx.HTTPStatusError) else None
    logger.warning(
        "Transient LLM API error on attempt %d (status=%s): %s - retrying in %.1fs",
        retry_state.attempt_number,
        status,
        exc,
        wait_seconds,
    )


async def ainvoke_with_retry(runnable: Any, payload: Any, *, config: dict | None = None) -> Any:
    settings = get_settings()
    retryer = AsyncRetrying(
        retry=retry_if_exception(_is_retryable),
        wait=_wait,
        stop=stop_after_attempt(settings.rate_limit_max_attempts),
        before_sleep=_before_sleep,
        reraise=True,
    )
    if config is not None:
        return await retryer(runnable.ainvoke, payload, config=config)
    return await retryer(runnable.ainvoke, payload)
