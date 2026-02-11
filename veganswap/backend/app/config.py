"""Application configuration helpers."""

from __future__ import annotations

from functools import lru_cache

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    """Pydantic settings loaded from environment variables and .env files."""

    database_url: str = Field(
        default="sqlite:///./veganswap.db",
        alias="DATABASE_URL",
        description="SQLAlchemy database URL.",
    )
    anthropic_api_key: str | None = Field(
        default=None,
        alias="ANTHROPIC_API_KEY",
        description="Claude API key used for swap reasoning.",
    )
    anthropic_model: str = Field(
        default="claude-sonnet-4-20250514",
        alias="ANTHROPIC_MODEL",
        description="Claude model identifier.",
    )
    llm_timeout_seconds: int = Field(
        default=30,
        alias="LLM_TIMEOUT_SECONDS",
        description="Timeout applied to outbound LLM calls.",
    )
    max_candidates: int = Field(
        default=50,
        alias="MAX_CANDIDATES",
        description="Maximum recipe candidates to fetch before ranking.",
    )
    top_k_for_llm: int = Field(
        default=5,
        alias="TOP_K_FOR_LLM",
        description="How many top heuristic candidates to send to the LLM.",
    )
    log_level: str = Field(
        default="INFO",
        alias="LOG_LEVEL",
        description="Application log level.",
    )

    model_config = SettingsConfigDict(
        env_file=None,
        env_ignore_empty=True,
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
