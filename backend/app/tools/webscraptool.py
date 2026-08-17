from __future__ import annotations
import logging
import requests
from bs4 import BeautifulSoup
from langchain.tools import tool

logger = logging.getLogger(__name__)

_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ResearchOrchestratorBot/1.0)"}
_TIMEOUT_SECONDS = 10
_MAX_CHARS = 5000


@tool
def scrape(url: str) -> str:
    """Fetch a web page by URL and return its readable text content (with
    scripts, nav, footers, and headers stripped out, truncated to a
    reasonable length). Use this on URLs that looked promising in the
    search results."""
    try:
        response = requests.get(url, timeout=_TIMEOUT_SECONDS, headers=_HEADERS)
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.info("Failed to scrape %s: %s", url, exc)
        return f"Could not scrape '{url}': {exc}"

    content_type = response.headers.get("Content-Type", "")
    if "html" not in content_type and "text" not in content_type:
        return f"Skipped '{url}': unsupported content type '{content_type}'."

    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()

    text = soup.get_text(separator=" ", strip=True)
    if not text:
        return f"No readable text extracted from '{url}'."

    return text[:_MAX_CHARS]
