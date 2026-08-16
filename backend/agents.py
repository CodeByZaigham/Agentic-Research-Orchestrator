"""Agent factories for the research pipeline.
Two ReAct-style agents are exposed, both built with LangChain's prebuilt
create_agent (a compiled LangGraph ReAct loop) so they can call their tool
repeatedly until they decide they have enough information:
Both factories are cached (lru_cache) so the underlying compiled graph is
built once per process and reused across requests.
"""
from __future__ import annotations

from functools import lru_cache

from langchain.agents import create_agent

from config import get_settings
from llm import get_llm
from tools.webscraptool import scrape
from tools.websearchtool import web_search

SEARCH_SYSTEM_PROMPT = """You are a meticulous research assistant working the \
first stage of a research pipeline.

Your job:
- Use the `web_search` tool (call it more than once, with different queries, \
if the topic has multiple angles) to gather the most relevant, credible, and \
recent information on the given topic.
- Prefer primary sources, research papers, reputable news outlets, official \
documentation, and recognized institutions over blogs or low-quality sites.
- Report your findings as clear bullet points grouped by sub-topic.
- ALWAYS include the direct source URL next to every fact, statistic, or \
claim you report.
- Do not fabricate sources, statistics, or facts that did not come from the \
tool's results.
- If results are thin or conflicting, say so explicitly rather than papering \
over the gap.
"""

SCRAPE_SYSTEM_PROMPT = """You are a meticulous research assistant working the \
second stage of a research pipeline.

You will be given a topic plus raw search results (titles, URLs, snippets).

Your job:
- Identify the most relevant and credible URLs from the material you were \
given.
- Call the `scrape` tool once per URL worth reading in full (use several \
calls if several URLs look promising - do not stop after just one).
- Extract the important facts, findings, insights, statistics, and \
supporting evidence from each page.
- Note the author/publication and the source URL for every fact you extract, \
so it can be cited later.
- Skip URLs that fail to scrape or that turn out to be irrelevant, \
duplicate, or low-value - don't dwell on them.
- Do not fabricate content that wasn't actually returned by the tool.
"""


@lru_cache(maxsize=1)
def search_agent():
    """Web-search agent: topic -> findings with sources."""
    return create_agent(
        model=get_llm(temperature=0.2),
        tools=[web_search],
        system_prompt=SEARCH_SYSTEM_PROMPT,
    )


@lru_cache(maxsize=1)
def scrape_agent():
    """Web-scrape agent: candidate URLs -> extracted facts with citations."""
    settings = get_settings()
    prompt = SCRAPE_SYSTEM_PROMPT + (
        f"\nAs a rough guide, aim to scrape up to {settings.search_max_results * 2} "
        "of the most promising URLs - quality and relevance matter more than hitting "
        "that number exactly."
    )
    return create_agent(
        model=get_llm(temperature=0.2),
        tools=[scrape],
        system_prompt=prompt,
    )
