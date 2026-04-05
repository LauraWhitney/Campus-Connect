from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "Campus Connect"
    app_version: str = "1.0.0"
    debug: bool = True
    allowed_origins: str = "http://localhost:5173,http://localhost:8000"

    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/campus_connect"

    # JWT
    secret_key: str = "change-this-in-production-minimum-32-characters"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Uploads
    upload_dir: str = "uploads"
    max_file_size_mb: int = 5

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
