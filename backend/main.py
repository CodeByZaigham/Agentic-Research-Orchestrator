from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from config import get_settings
from exceptions import OrchestratorError, PDFGenerationError, ReportNotFoundError
from logger import configure_logging
from routes import health, research

configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    settings.reports_dir.mkdir(parents=True, exist_ok=True)
    logger.info("%s v%s starting up", settings.app_name, settings.app_version)
    logger.info(
        "Pipeline config: quality_threshold=%d max_refine_iterations=%d model=%s",
        settings.quality_score_threshold,
        settings.max_refine_iterations,
        settings.mistral_model,
    )
    yield
    logger.info("%s shutting down", settings.app_name)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "Give it a topic, get back a researched, self-critiqued Markdown "
            "report plus a downloadable PDF."
        ),
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(research.router)

    @app.exception_handler(ReportNotFoundError)
    async def _not_found_handler(request: Request, exc: ReportNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"error": "report_not_found", "detail": str(exc)})

    @app.exception_handler(PDFGenerationError)
    async def _pdf_error_handler(request: Request, exc: PDFGenerationError) -> JSONResponse:
        logger.error("PDF generation error: %s", exc)
        return JSONResponse(status_code=500, content={"error": "pdf_generation_failed", "detail": str(exc)})

    # Catches SearchAgentError, ScrapeAgentError, ReportGenerationError, and
    # ReportEvaluationError - anything else derived from OrchestratorError.
    @app.exception_handler(OrchestratorError)
    async def _orchestrator_error_handler(request: Request, exc: OrchestratorError) -> JSONResponse:
        logger.error("Pipeline error: %s", exc)
        return JSONResponse(status_code=502, content={"error": "pipeline_failed", "detail": str(exc)})

    return app


app = create_app()
