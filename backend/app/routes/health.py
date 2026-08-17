from __future__ import annotations
from fastapi import APIRouter
from config import get_settings
from schema import HealthResponse

router = APIRouter(tags=["health"])

@router.get("/", response_model=HealthResponse, summary="Root/liveness check")
def root() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(status="ok", app_name=settings.app_name, version=settings.app_version)

@router.get("/health", response_model=HealthResponse, summary="Health check")
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(status="ok", app_name=settings.app_name, version=settings.app_version)
