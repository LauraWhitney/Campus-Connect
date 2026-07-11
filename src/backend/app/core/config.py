from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "CUEA Campus Connect"
    app_version: str = "2.0.0"
    debug: bool = True
    allowed_origins: str = "http://localhost:5173,http://localhost:5174"

    # Database — loaded from DATABASE_URL in .env
    # Supabase requires ?sslmode=require which is already embedded in the URL
    database_url: str = "postgresql://postgres:password@localhost:5432/postgres?sslmode=require"

    # JWT
    secret_key: str = "change-this-in-production-minimum-32-characters"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Uploads
    upload_dir: str = "uploads"
    max_file_size_mb: int = 5

    # ── Outgoing email (Contact Us delivery) ───────────
    # All optional — if smtp_host is blank, emails are logged instead of sent
    # so the app keeps working out of the box in dev/test environments.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    mail_from: str = "no-reply@cuea.edu"
    admin_contact_email: str = "admin@cuea.edu"

    # ── Environment (guards destructive dev-only endpoints) ─
    environment: str = "development"  # "development" | "production"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        # Ignore extra env vars so future additions don't break startup
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
