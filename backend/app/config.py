"""
Centralised application configuration.
All environment-driven configuration lives here so the rest of the codebase
never touches os.environ directly. Values are validated once (fail fast on
a missing API key, an out-of-range threshold, etc.) and cached via
get_settings(), which is safe to call as often as needed.
"""
from __future__ import annotations
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv
from pydantic import Field, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Required API keys -------------------------------------------------
    tavily_api_key: str = Field(..., alias="TAVILY_API_KEY")
    mistral_api_key: str = Field(..., alias="MISTRAL_API_KEY")

    # --- LLM -----------------------------------------------------------------
    mistral_model: str = Field("mistral-medium-latest", alias="MISTRAL_MODEL")
    llm_timeout: int = Field(60, alias="LLM_TIMEOUT_SECONDS", ge=1)
    llm_max_retries: int = Field(2, alias="LLM_MAX_RETRIES", ge=0)

    # --- Pipeline behaviour ----------------------------------------------------
    quality_score_threshold: int = Field(75, alias="QUALITY_SCORE_THRESHOLD", ge=0, le=100)
    max_refine_iterations: int = Field(2, alias="MAX_REFINE_ITERATIONS", ge=0, le=5)
    search_max_results: int = Field(4, alias="SEARCH_MAX_RESULTS", ge=1, le=10)
    # Caps how many ReAct tool-call turns the search/scrape agents can take.
    # Each turn re-sends the growing conversation history to the LLM, so an
    # unbounded loop is the main driver of rate-limit errors on busy topics.
    agent_recursion_limit: int = Field(14, alias="AGENT_RECURSION_LIMIT", ge=2, le=50)

    # --- Rate-limit / transient-error retry ------------------------------------
    # langchain-mistralai's own retry only covers network-level failures, not
    # HTTP 429/5xx responses - see resilience.py for the layer that does.
    rate_limit_max_attempts: int = Field(5, alias="RATE_LIMIT_MAX_ATTEMPTS", ge=1, le=10)
    rate_limit_max_wait_seconds: float = Field(60.0, alias="RATE_LIMIT_MAX_WAIT_SECONDS", ge=1.0)

    # --- App / server ----------------------------------------------------------
    app_name: str = Field("Agentic Research Orchestrator", alias="APP_NAME")
    app_version: str = Field("1.0.0", alias="APP_VERSION")
    cors_origins: str = Field("*", alias="CORS_ORIGINS")
    log_level: str = Field("INFO", alias="LOG_LEVEL")

    # --- Storage -----------------------------------------------------------------
    reports_dir: Path = Field(Path("reports"), alias="REPORTS_DIR")

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS_ORIGINS as a list; '*' or a comma-separated string both work."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Load and cache the application settings.

    Raises a `RuntimeError` with a clear, actionable message (instead of a
    raw pydantic traceback) when required environment variables are missing.
    """
    try:
        return Settings()
    except ValidationError as exc:
        missing = [str(err["loc"][0]) for err in exc.errors() if err["type"] == "missing"]
        if missing:
            hint = (
                "Missing required environment variable(s): "
                f"{', '.join(missing)}. Create a `.env` file in the project root "
                "(see `.env.example`) or export them before starting the server."
            )
        else:
            hint = str(exc)
        raise RuntimeError(hint) from exc
