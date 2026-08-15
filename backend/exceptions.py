from __future__ import annotations


class OrchestratorError(Exception):
    """Base class for all pipeline / orchestration failures."""


class SearchAgentError(OrchestratorError):
    """Raised when the web-search agent step fails."""


class ScrapeAgentError(OrchestratorError):
    """Raised when the web-scraping agent step fails."""


class ReportGenerationError(OrchestratorError):
    """Raised when the writer (or refine-writer) chain fails."""


class ReportEvaluationError(OrchestratorError):
    """Raised when the checker/critic chain fails."""


class PDFGenerationError(OrchestratorError):
    """Raised when rendering the Markdown report to PDF fails."""


class ReportNotFoundError(Exception):
    """Raised when a `report_id` does not exist in the report store."""

    def __init__(self, report_id: str) -> None:
        self.report_id = report_id
        super().__init__(f"No report found with id '{report_id}'.")
