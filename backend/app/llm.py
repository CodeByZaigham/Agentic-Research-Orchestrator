from __future__ import annotations

from functools import lru_cache

from langchain_mistralai import ChatMistralAI

from config import get_settings


@lru_cache(maxsize=8)
def get_llm(temperature: float = 0.3) -> ChatMistralAI:
    """Return a cached `ChatMistralAI` instance for the given temperature."""
    settings = get_settings()
    return ChatMistralAI(
        model=settings.mistral_model,
        api_key=settings.mistral_api_key,
        temperature=temperature,
        timeout=settings.llm_timeout,
        max_retries=settings.llm_max_retries,
    )
