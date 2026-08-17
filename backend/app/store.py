from __future__ import annotations
import threading
from typing import Optional
from schema import ResearchResponse


class ReportStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._reports: dict[str, ResearchResponse] = {}
        self._pdf_paths: dict[str, str] = {}

    def save(self, result: ResearchResponse) -> None:
        with self._lock:
            self._reports[result.report_id] = result

    def get(self, report_id: str) -> Optional[ResearchResponse]:
        with self._lock:
            return self._reports.get(report_id)

    def set_pdf_path(self, report_id: str, path: str) -> None:
        with self._lock:
            self._pdf_paths[report_id] = path

    def get_pdf_path(self, report_id: str) -> Optional[str]:
        with self._lock:
            return self._pdf_paths.get(report_id)


# Module-level singleton - imported by routes.
report_store = ReportStore()
