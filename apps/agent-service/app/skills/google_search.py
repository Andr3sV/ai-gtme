"""Google search via SerpAPI. Returns raw API response for the agent to parse."""
import os
from typing import Any

import httpx

SERPAPI_API_KEY = os.environ.get("SERPAPI_API_KEY", "")


def google_search(query: str, num: int = 10) -> dict[str, Any]:
    """Run a Google search via SerpAPI. Returns organic results and optional local/maps data."""
    if not SERPAPI_API_KEY:
        return {"error": "SERPAPI_API_KEY not set", "organic_results": []}
    url = "https://serpapi.com/search"
    params = {
        "q": query,
        "api_key": SERPAPI_API_KEY,
        "num": min(num, 20),
    }
    with httpx.Client(timeout=30) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()
