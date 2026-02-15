"""Reputation / Google Maps agent: uses SerpAPI and optional web_scan to list businesses with criteria."""
from typing import Any

from app.skills.google_search import google_search


def run_reputation_search(
    query: str,
    region: str | None = None,
    max_results: int = 20,
) -> list[dict[str, Any]]:
    """
    Use Google search (SerpAPI) to find businesses. Returns a list of business-like dicts
    with name, link, snippet, and optional local/maps fields for the agent/orchestrator to process.
    """
    q = query
    if region:
        q = f"{query} {region}"
    data = google_search(q, num=max_results)
    if "error" in data:
        return []
    results = []
    organic = data.get("organic_results") or []
    for r in organic[:max_results]:
        results.append({
            "title": r.get("title", ""),
            "link": r.get("link", ""),
            "snippet": r.get("snippet", ""),
        })
    # SerpAPI local results (e.g. maps) if present
    local = data.get("local_results") or data.get("places", [])
    for r in local[:max_results]:
        results.append({
            "title": r.get("title", ""),
            "link": r.get("link", ""),
            "snippet": r.get("snippet") or r.get("address", ""),
            "source": "local",
        })
    return results
