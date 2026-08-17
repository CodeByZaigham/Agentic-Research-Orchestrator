from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class ResearchRequest(BaseModel):
    topic: str = Field(
        ...,
        min_length=3,
        max_length=300,
        description="The research topic/question to investigate.",
        examples=["The impact of quantum computing on modern cryptography"],
    )

    @field_validator("topic")
    @classmethod
    def _strip_topic(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("topic must not be empty")
        return v

class IterationLog(BaseModel):
    iteration: int
    score: Optional[int] = None
    quality_level: Optional[str] = None

class ResearchResponse(BaseModel):
    report_id: str
    topic: str
    report: str
    evaluation: str
    score: Optional[int] = Field(None, description="Checker's overall score out of 100.")
    quality_level: Optional[str] = None
    meets_quality_threshold: bool = False
    iterations: int = Field(1, description="Number of writer <-> checker passes performed.")
    iteration_history: list[IterationLog] = Field(default_factory=list)
    pdf_available: bool = False
    pdf_download_url: Optional[str] = None
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PDFGenerateResponse(BaseModel):
    report_id: str
    pdf_download_url: str


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
