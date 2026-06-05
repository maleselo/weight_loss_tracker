from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_postgres_url(url: str) -> str:
    """Railway fournit postgresql:// ; SQLAlchemy + psycopg attend postgresql+psycopg://."""
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Health Dashboard API"
    environment: str = "dev"
    database_url: str

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 jours

    # URLs frontend autorisées (séparées par des virgules)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Sync externe (Tasker, Samsung Health bridge) — laisser vide pour désactiver
    health_sync_token: str = ""
    health_sync_user_email: str = ""

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_database_url(cls, value: str) -> str:
        if isinstance(value, str):
            return normalize_postgres_url(value)
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

