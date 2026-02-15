"""Web scan / content fetch using Vertex AI Gemini with optional grounding."""
from typing import Any

from app.llm.vertex import get_llm
from langchain_core.messages import HumanMessage


def web_scan(url_or_query: str, question: str | None = None) -> str:
    """Use Gemini to summarize or answer a question about web content. For now, uses LLM without live fetch."""
    llm = get_llm()
    prompt = (
        f"Context or URL/query: {url_or_query}. "
        + (f"Question: {question}. " if question else "")
        + "Provide a brief summary or answer based on general knowledge. If you cannot access the URL, say so."
    )
    msg = llm.invoke([HumanMessage(content=prompt)])
    return msg.content if hasattr(msg, "content") else str(msg)
