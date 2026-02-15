from fastapi import APIRouter
from pydantic import BaseModel
from langsmith import traceable

from app.agents.orchestrator import run_orchestrator

router = APIRouter()


class RunRequest(BaseModel):
    conversation_id: str
    message_id: str
    agent_run_id: str
    content: str
    recent_messages: list[dict] | None = None


class RunResponse(BaseModel):
    status: str
    message: str
    result_snapshot: dict | None = None
    assistant_message: str | None = None
    businesses: list[dict] | None = None
    business_collected_data: list[dict] | None = None


@traceable(name="agent_run", tags=["gtme"])
def _run_agent(content: str, recent_messages: list[dict] | None) -> tuple[str, list[dict], list[dict]]:
    """Run LangGraph orchestrator with short-term memory (recent_messages)."""
    return run_orchestrator(content, recent_messages)


@router.post("", response_model=RunResponse)
async def run_agent(req: RunRequest) -> RunResponse:
    """Receives run request, runs orchestrator (LangGraph) with short-term memory, returns response."""
    try:
        assistant_text, businesses, business_collected_data = _run_agent(
            req.content, req.recent_messages
        )
        return RunResponse(
            status="completed",
            message="ok",
            result_snapshot={"orchestrator": "langgraph"},
            assistant_message=assistant_text,
            businesses=businesses,
            business_collected_data=business_collected_data,
        )
    except Exception as e:
        return RunResponse(
            status="failed",
            message=str(e),
            result_snapshot={"error": str(e)},
            assistant_message=f"Error: {e}",
            businesses=[],
            business_collected_data=[],
        )

