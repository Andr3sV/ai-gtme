"""Vertex AI Gemini via LangChain. LangSmith tracing is enabled via env LANGCHAIN_TRACING_V2=true."""
from langchain_google_vertexai import ChatVertexAI
from app.config.settings import settings


def get_llm() -> ChatVertexAI:
    return ChatVertexAI(
        model="gemini-1.5-flash",
        project=settings.google_cloud_project or None,
        location=settings.google_cloud_location,
        temperature=0,
        max_output_tokens=2048,
    )
