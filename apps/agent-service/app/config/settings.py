from pathlib import Path

from pydantic_settings import BaseSettings

# .env siempre en el directorio del agent-service (no depende del cwd)
_env_file = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    google_cloud_project: str = ""
    google_cloud_location: str = "us-central1"
    google_application_credentials: str = ""
    langchain_tracing_v2: str = "false"
    langchain_project: str = "gtme-agents"
    langchain_api_key: str = ""
    serpapi_api_key: str = ""

    class Config:
        env_file = _env_file
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
