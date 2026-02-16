"""Vertex AI Gemini via LangChain. LangSmith tracing is enabled via env LANGCHAIN_TRACING_V2=true."""
import os

from google.oauth2 import service_account
from langchain_google_vertexai import ChatVertexAI

from app.config.settings import settings


def get_llm() -> ChatVertexAI:
    kwargs = dict(
        model="gemini-2.5-flash",
        project=settings.google_cloud_project or None,
        location=settings.google_cloud_location,
        temperature=0,
        max_output_tokens=2048,
    )
    creds_path = (settings.google_application_credentials or "").strip()
    if creds_path:
        path = os.path.abspath(os.path.expanduser(creds_path))
        if os.path.isfile(path):
            kwargs["credentials"] = service_account.Credentials.from_service_account_file(path)
    return ChatVertexAI(**kwargs)
