"""
Application configuration using Pydantic Settings.
All environment variables are centralized here.
"""

from functools import lru_cache
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "CP Path Builder"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development | staging | production

    # ── Server ───────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = (
        "postgresql+asyncpg://user:pass@ep-xxx.us-east-2.aws.neon.tech/cppath"
    )
    DATABASE_ECHO: bool = False
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_SSL: bool = True  # Required for Neon DB

    # ── Redis ────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 3600  # 1 hour default

    # ── Authentication ───────────────────────────────────────────
    SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION-use-openssl-rand-hex-32"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── Codeforces API ───────────────────────────────────────────
    CF_API_BASE_URL: str = "https://codeforces.com/api"
    CF_API_KEY: Optional[str] = None
    CF_API_SECRET: Optional[str] = None
    CF_SYNC_INTERVAL_HOURS: int = 6
    CF_REQUEST_DELAY_SECONDS: float = 2.0  # Rate limiting

    # ── AI / LLM ─────────────────────────────────────────────────
    GEMINI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini-2.5-flash"
    LLM_MAX_TOKENS: int = 1024
    LLM_TEMPERATURE: float = 0.3
    COACHING_ENABLED: bool = True

    # ── Background Tasks ─────────────────────────────────────────
    SYNC_ON_STARTUP: bool = True
    TASK_CONCURRENCY: int = 4

    # ── Path Generation ──────────────────────────────────────────
    DEFAULT_PATH_SIZE: int = 30
    MAX_PATH_SIZE: int = 100
    RATING_STEP: int = 100  # Difficulty increment step
    MIN_PROBLEM_RATING: int = 800
    MAX_PROBLEM_RATING: int = 3500

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
