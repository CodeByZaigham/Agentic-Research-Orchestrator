from __future__ import annotations
import logging
from fastapi import APIRouter
from fastapi.responses import FileResponse
from exceptions import ReportNotFoundError
from pipelines.generate_pdf import generate_report_pdf
from pipelines.orchestrator import run_research_pipeline
from schema import IterationLog, PDFGenerateResponse, ResearchRequest, ResearchResponse
from store import report_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/research", tags=["research"])


@router.post("", response_model=ResearchResponse, summary="Run the full research pipeline for a topic")
async def create_research(payload: ResearchRequest) -> ResearchResponse:
    result = await run_research_pipeline(payload.topic)

    response = ResearchResponse(
        report_id=result.report_id,
        topic=result.topic,
        report=result.report,
        evaluation=result.evaluation,
        score=result.score,
        quality_level=result.quality_level,
        meets_quality_threshold=result.meets_quality_threshold,
        iterations=result.iterations,
        iteration_history=[
            IterationLog(iteration=r.iteration, score=r.score, quality_level=r.quality_level)
            for r in result.iteration_history
        ],
        pdf_available=result.pdf_path is not None,
        pdf_download_url=f"/api/research/{result.report_id}/download" if result.pdf_path else None,
    )

    report_store.save(response)
    if result.pdf_path:
        report_store.set_pdf_path(result.report_id, result.pdf_path)

    return response


@router.get("/{report_id}", response_model=ResearchResponse, summary="Fetch a previously generated report")
def get_research(report_id: str) -> ResearchResponse:
    result = report_store.get(report_id)
    if result is None:
        raise ReportNotFoundError(report_id)
    return result


@router.get("/{report_id}/download", summary="Download the report as a PDF")
def download_research_pdf(report_id: str) -> FileResponse:
    pdf_path = report_store.get_pdf_path(report_id)
    if pdf_path is None:
        raise ReportNotFoundError(report_id)
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"{report_id}.pdf")


@router.post(
    "/{report_id}/pdf",
    response_model=PDFGenerateResponse,
    summary="(Re)generate the PDF for a stored report",
)
def regenerate_pdf(report_id: str) -> PDFGenerateResponse:
    result = report_store.get(report_id)
    if result is None:
        raise ReportNotFoundError(report_id)

    path = generate_report_pdf(
        report_id=result.report_id,
        topic=result.topic,
        report_md=result.report,
        evaluation_md=result.evaluation,
        score=result.score,
        quality_level=result.quality_level,
    )
    report_store.set_pdf_path(report_id, str(path))
    return PDFGenerateResponse(report_id=report_id, pdf_download_url=f"/api/research/{report_id}/download")
