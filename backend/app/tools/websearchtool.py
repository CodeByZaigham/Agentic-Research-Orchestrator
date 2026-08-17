from __future__ import annotations
import logging
from functools import lru_cache
from langchain.tools import tool
from tavily import TavilyClient
from config import get_settings

logger = logging.getLogger(__name__)

@lru_cache(maxsize=1)
def _get_client() -> TavilyClient:
    settings = get_settings()
    return TavilyClient(api_key=settings.tavily_api_key)

@tool
def web_search(query: str) -> str:
    """Search the live web for a query and return titles, URLs, and short
    content snippets for the most relevant results. Use this to discover
    candidate sources before deciding what to read in depth."""
    settings = get_settings()
    try:
        client = _get_client()
        result = client.search(query=query, max_results=settings.search_max_results)
    except Exception as exc:  # noqa: BLE001 - surface the failure to the agent, don't crash it
        logger.warning("Tavily search failed for query=%r: %s", query, exc)
        return f"Search failed for query '{query}': {exc}"

    hits = result.get("results", [])
    if not hits:
        return f"No search results found for query '{query}'."

    chunks: list[str] = []
    for hit in hits:
        title = hit.get("title", "Untitled")
        url = hit.get("url", "")
        content = (hit.get("content") or "")[:500]
        chunks.append(f"title: {title}\nURL: {url}\ncontent: {content}\n")

    return "-----\n".join(chunks)
