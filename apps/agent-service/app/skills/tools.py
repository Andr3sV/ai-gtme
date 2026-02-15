"""LangChain tools for skills (used by orchestrator / agents)."""
from langchain_core.tools import tool

from app.skills.google_search import google_search
from app.skills.web_scan import web_scan as _web_scan_impl


@tool
def skill_google_search(query: str, num: int = 10) -> str:
    """Run a Google search. Use for finding businesses, reviews, or local listings. Returns JSON-like summary of results."""
    data = google_search(query, num=num)
    if data.get("error"):
        return data["error"]
    organic = data.get("organic_results") or []
    parts = [f"Found {len(organic)} results. Top: "]
    for r in organic[:5]:
        parts.append(f"- {r.get('title', '')}: {r.get('snippet', '')[:100]}...")
    return "\n".join(parts)


@tool
def skill_web_scan(url_or_query: str, question: str | None = None) -> str:
    """Get a summary or answer about web content (URL or query). Uses Gemini."""
    return _web_scan_impl(url_or_query, question)
