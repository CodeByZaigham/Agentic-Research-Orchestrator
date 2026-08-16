"""Core pipeline orchestration.

Implements the flow described in the project README:

This module has no FastAPI-specific code, so it can be reused, scripted, or
unit-tested independently of the HTTP layer.
"""
from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from typing import Optional

from agents import scrape_agent, search_agent
from config import get_settings
from exceptions import (
    PDFGenerationError,
    ReportEvaluationError,
    ReportGenerationError,
    ScrapeAgentError,
    SearchAgentError,
)
from pipelines.generate_pdf import generate_report_pdf
from pipelines.report_checker import checker, parse_evaluation
from pipelines.report_generator import refine_writer, writer
from resilience import ainvoke_with_retry

logger = logging.getLogger(__name__)


@dataclass
class IterationRecord:
    iteration: int
    score: Optional[int]
    quality_level: Optional[str]


@dataclass
class PipelineResult:
    report_id: str
    topic: str
    report: str
    evaluation: str
    score: Optional[int]
    quality_level: Optional[str]
    meets_quality_threshold: bool
    iterations: int
    iteration_history: list[IterationRecord] = field(default_factory=list)
    pdf_path: Optional[str] = None


async def _run_search(topic: str) -> str:
    settings = get_settings()
    try:
        result = await ainvoke_with_retry(
            search_agent(),
            {
                "messages": [
                    {
                        "role": "user",
                        "content": (
                            f"Research the topic: {topic}\n\n"
                            "Give me useful information, key points, and bullet points, "
                            "while also including relevant research papers, articles, and "
                            "other credible sources with their direct URLs."
                        ),
                    }
                ]
            },
            config={"recursion_limit": settings.agent_recursion_limit},
        )
        return result["messages"][-1].content
    except Exception as exc:  # noqa: BLE001
        logger.exception("Search agent failed for topic=%r", topic)
        raise SearchAgentError(str(exc)) from exc


async def _run_scrape(topic: str, search_findings: str) -> str:
    settings = get_settings()
    try:
        result = await ainvoke_with_retry(
            scrape_agent(),
            {
                "messages": [
                    {
                        "role": "user",
                        "content": (
                            f"Research topic: {topic}\n\n"
                            f"Raw search results:\n{search_findings}\n\n"
                            "Identify the most relevant URLs, scrape those pages, and "
                            "extract the important facts, findings, insights, and "
                            "supporting information useful for researching this topic. "
                            "Also give authors and citations of content taken. "
                            "Prioritize credible sources and ignore irrelevant, "
                            "duplicate, or low-value content."
                        ),
                    }
                ]
            },
            config={"recursion_limit": settings.agent_recursion_limit},
        )
        return result["messages"][-1].content
    except Exception as exc:  # noqa: BLE001
        logger.exception("Scrape agent failed for topic=%r", topic)
        raise ScrapeAgentError(str(exc)) from exc


async def run_research_pipeline(topic: str) -> PipelineResult:
    """Run the full search -> scrape -> write -> check -> refine -> PDF
    pipeline for a topic and return the final result."""
    settings = get_settings()
    report_id = uuid.uuid4().hex[:12]
    logger.info("[%s] starting pipeline for topic=%r", report_id, topic)

    # --- Step 1: search -----------------------------------------------------
    search_findings = await _run_search(topic)

    # --- Step 2: scrape ------------------------------------------------------
    scrape_findings = await _run_scrape(topic, search_findings)

    research_material = (
        f"SEARCH RESULTS:\n{search_findings}\n\nSCRAPED WEB PAGE DATA:\n{scrape_findings}"
    )

    # --- Step 3: write the first draft --------------------------------------
    try:
        report_md = await ainvoke_with_retry(writer(), {"topic": topic, "research": research_material})
    except Exception as exc:  # noqa: BLE001
        logger.exception("[%s] writer failed", report_id)
        raise ReportGenerationError(str(exc)) from exc

    # --- Step 4: check -> refine loop ----------------------------------------
    max_total_iterations = settings.max_refine_iterations + 1
    history: list[IterationRecord] = []
    evaluation_md = ""
    score: Optional[int] = None
    quality_level: Optional[str] = None
    iteration = 0

    while True:
        iteration += 1
        try:
            raw_evaluation = await ainvoke_with_retry(checker(), {"report": report_md})
        except Exception as exc:  # noqa: BLE001
            logger.exception("[%s] checker failed on iteration %d", report_id, iteration)
            raise ReportEvaluationError(str(exc)) from exc

        score, quality_level, evaluation_md = parse_evaluation(raw_evaluation)
        history.append(IterationRecord(iteration=iteration, score=score, quality_level=quality_level))
        logger.info(
            "[%s] iteration %d/%d score=%s quality=%s",
            report_id,
            iteration,
            max_total_iterations,
            score,
            quality_level,
        )

        meets_threshold = score is not None and score >= settings.quality_score_threshold
        if meets_threshold or iteration >= max_total_iterations or score is None:
            break

        try:
            report_md = await ainvoke_with_retry(
                refine_writer(),
                {
                    "topic": topic,
                    "research": research_material,
                    "previous_report": report_md,
                    "feedback": evaluation_md,
                },
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("[%s] refine writer failed on iteration %d", report_id, iteration)
            raise ReportGenerationError(str(exc)) from exc

    meets_threshold = score is not None and score >= settings.quality_score_threshold

    # --- Step 5: PDF (best-effort - a PDF failure shouldn't fail the request) --
    pdf_path: Optional[str] = None
    try:
        path = generate_report_pdf(
            report_id=report_id,
            topic=topic,
            report_md=report_md,
            evaluation_md=evaluation_md,
            score=score,
            quality_level=quality_level,
        )
        pdf_path = str(path)
    except PDFGenerationError:
        logger.exception("[%s] PDF generation failed, returning result without a PDF", report_id)

    logger.info(
        "[%s] pipeline finished: iterations=%d score=%s meets_threshold=%s pdf=%s",
        report_id,
        iteration,
        score,
        meets_threshold,
        bool(pdf_path),
    )

    return PipelineResult(
        report_id=report_id,
        topic=topic,
        report=report_md,
        evaluation=evaluation_md,
        score=score,
        quality_level=quality_level,
        meets_quality_threshold=meets_threshold,
        iterations=iteration,
        iteration_history=history,
        pdf_path=pdf_path,
    )
