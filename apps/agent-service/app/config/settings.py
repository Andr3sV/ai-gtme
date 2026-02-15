from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    google_cloud_project: str = ""
    google_cloud_location: str = "us-central1"
    langchain_tracing_v2: str = "false"
    langchain_project: str = "gtme-agents"
    langchain_api_key: str = ""
    serpapi_api_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
