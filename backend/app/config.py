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
    public_app_url: str = ""
    support_email: str = "rise.app13@gmail.com"
    feedback_inbox: str = "rise.app13@gmail.com"
    email_provider: str = "auto"
    resend_api_key: str = ""
    resend_from_email: str = ""
    email_from: str = "RISE <onboarding@resend.dev>"
    smtp_host: str = ""
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def resolved_email_provider(self) -> str:
        provider = self.email_provider.strip().lower()
        if provider != "auto":
            return provider
        if self.resend_api_key:
            return "resend"
        if all((self.smtp_host, self.smtp_username, self.smtp_password)):
            return "smtp"
        return "none"

    @property
    def email_delivery_ready(self) -> bool:
        provider = self.resolved_email_provider
        if provider == "resend":
            sender = (self.resend_from_email or self.email_from).lower()
            return bool(self.resend_api_key and sender and "@resend.dev" not in sender)
        if provider == "smtp":
            return all((self.smtp_host, self.smtp_username, self.smtp_password, self.email_from))
        return False

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
        if self.env.lower() == "production" and not self.public_app_url.startswith("https://"):
            raise RuntimeError("Production RISE_PUBLIC_APP_URL must be a public HTTPS URL")
        provider = self.resolved_email_provider
        if provider not in {"resend", "smtp", "none"}:
            raise RuntimeError("RISE_EMAIL_PROVIDER must be auto, resend, or smtp")
        if self.env.lower() == "production" and provider == "none":
            raise RuntimeError("Production requires either RISE_RESEND_API_KEY or complete SMTP delivery settings")
        if self.env.lower() == "production" and provider == "resend" and not self.resend_api_key:
            raise RuntimeError("RISE_EMAIL_PROVIDER=resend requires RISE_RESEND_API_KEY")
        if self.env.lower() == "production" and provider == "resend" and not (self.resend_from_email or self.email_from):
            raise RuntimeError("RISE_EMAIL_PROVIDER=resend requires RISE_RESEND_FROM_EMAIL or RISE_EMAIL_FROM")
        if self.env.lower() == "production" and provider == "smtp" and not all((self.smtp_host, self.smtp_username, self.smtp_password)):
            raise RuntimeError("RISE_EMAIL_PROVIDER=smtp requires complete SMTP delivery settings")
        if self.env.lower() == "production" and "@resend.dev" in self.email_from.lower():
            raise RuntimeError("Production RISE_EMAIL_FROM must use an authenticated sender; onboarding@resend.dev is testing-only")


@lru_cache
def get_settings() -> Settings:
    return Settings()
