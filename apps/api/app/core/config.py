from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Golestan Water DSS API"
    env: str = "dev"
    debug: bool = True

    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/golestan"
    redis_url: str = "redis://redis:6379/0"

    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60
    refresh_token_expire_minutes: int = 60 * 24 * 7

    cors_origins: List[str] = Field(default_factory=lambda: ["*"])

    rate_limit_per_minute: int = 120
    demo_auto_seed: bool = True

    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o-mini"
    openrouter_site_url: str = "http://localhost:3000"
    openrouter_app_name: str = "Golestan Water DSS Demo"

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local", "/app/.env", "/app/.env.docker"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
