from __future__ import annotations

import logging
import sys

from config import get_settings

_CONFIGURED = False


def configure_logging() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return

    settings = get_settings()
    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    handler = logging.StreamHandler(stream=sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = [handler]

    # Quiet down noisy third-party loggers unless we're debugging.
    if level > logging.DEBUG:
        for noisy in ("httpx", "httpcore", "urllib3"):
            logging.getLogger(noisy).setLevel(logging.WARNING)

    _CONFIGURED = True
