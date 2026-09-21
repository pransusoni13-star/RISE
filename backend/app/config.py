from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="RISE_", extra="ignore")

    env: str = "development"
    database_url: str = "sqlite:///./rise.db"
    jwt_secret: str = "development-only-change-before-deploy-123456"
    allowed_origins: str = "http://localhost:4173,http://localhost:8081"
    access_token_minutes: int = Field(default=15, ge=5, le=60)
    refresh_token_days: int = Field(default=30, ge=1, le=90)
    founding_member_days: int = Field(default=365, ge=1, le=730)
    founding_redemption_enabled: bool = False
    admin_api_key: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    def validate_for_startup(self) -> None:
        if self.env.lower() == "production" and len(self.jwt_secret) < 32:
            raise RuntimeError("RISE_JWT_SECRET must contain at least 32 characters in production")
        if self.env.lower() == "production" and self.jwt_secret.startswith("development-only"):
            raise RuntimeError("Replace the development JWT secret before production")
        if self.env.lower() == "production" and not self.database_url.startswith("postgresql+psycopg://"):
            raise RuntimeError("Production requires a PostgreSQL RISE_DATABASE_URL")
        if self.env.lower() == "production" and (not self.cors_origins or any(not origin.startswith("https://") for origin in self.cors_origins)):
            raise RuntimeError("Production RISE_ALLOWED_ORIGINS must contain HTTPS origins")
        if self.env.lower() == "production" and len(self.admin_api_key) < 32:
            raise RuntimeError("Production RISE_ADMIN_API_KEY must contain at least 32 characters")


@lru_cache
def get_settings() -> Settings:
    return Settings()
