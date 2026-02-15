"""Orchestrator: LangGraph graph that routes to specialized agents and uses short-term memory."""
from typing import Annotated, Literal, TypedDict

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage

from app.llm.vertex import get_llm
from app.skills.tools import skill_google_search, skill_web_scan
from app.agents.reputation_agent import run_reputation_search


class OrchestratorState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    next_step: str
    businesses: list[dict]
    business_collected_data: list[dict]


def _parse_recent_messages(recent: list[dict] | None) -> list[BaseMessage]:
    out: list[BaseMessage] = []
    if not recent:
        return out
    for m in recent[-10:]:
        role = (m.get("role") or "user").lower()
        content = m.get("content") or ""
        if role == "user":
            out.append(HumanMessage(content=content))
        elif role == "assistant":
            out.append(AIMessage(content=content))
    return out


def orchestrator_node(state: OrchestratorState) -> OrchestratorState:
    """Decide next step: call reputation agent (list businesses) or respond directly."""
    messages = state["messages"]
    last = messages[-1] if messages else None
    content = last.content if hasattr(last, "content") else str(last)
    content_lower = content.lower()

    if any(
        k in content_lower
        for k in (
            "negocios",
            "business",
            "listar",
            "busca",
            "buscar",
            "reviews",
            "catalunya",
            "cataluña",
        )
    ):
        return {**state, "next_step": "reputation"}
    return {**state, "next_step": "synthesis"}


def reputation_node(state: OrchestratorState) -> OrchestratorState:
    """Run reputation agent: SerpAPI search and return business-like list."""
    messages = state["messages"]
    last = messages[-1] if messages else None
    content = last.content if hasattr(last, "content") else str(last)

    results = run_reputation_search(content, max_results=15)
    businesses = [
        {"name": r.get("title", "Unknown"), "external_id": None, "payload": r}
        for r in results
    ]
    return {
        **state,
        "businesses": businesses,
        "next_step": "synthesis",
    }


def synthesis_node(state: OrchestratorState) -> OrchestratorState:
    """Generate final assistant message from state."""
    llm = get_llm()
    messages = state["messages"]
    bs = state.get("businesses") or []

    if bs:
        summary = "\n".join(
            f"- {b.get('name', '')}" for b in bs[:20]
        )
        prompt = (
            "El usuario pidió listar negocios. Aquí están los resultados de búsqueda. "
            "Responde en 1-2 frases confirmando y listando los nombres encontrados:\n\n"
            + summary
        )
    else:
        prompt = "Responde brevemente al último mensaje del usuario."

    reply = llm.invoke(
        messages + [HumanMessage(content=prompt)]
    )
    text = reply.content if hasattr(reply, "content") else str(reply)
    return {
        **state,
        "messages": [AIMessage(content=text)],
        "next_step": "end",
    }


def route_after_orchestrator(state: OrchestratorState) -> Literal["reputation", "synthesis"]:
    return state["next_step"] if state["next_step"] in ("reputation", "synthesis") else "synthesis"


def build_graph():
    graph = StateGraph(OrchestratorState)

    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("reputation", reputation_node)
    graph.add_node("synthesis", synthesis_node)

    graph.add_edge(START, "orchestrator")
    graph.add_conditional_edges("orchestrator", route_after_orchestrator)
    graph.add_edge("reputation", "synthesis")
    graph.add_edge("synthesis", END)

    return graph.compile()


def run_orchestrator(
    content: str,
    recent_messages: list[dict] | None = None,
) -> tuple[str, list[dict], list[dict]]:
    """
    Run the orchestrator graph. Returns (assistant_message, businesses, business_collected_data).
    """
    initial: OrchestratorState = {
        "messages": _parse_recent_messages(recent_messages)
        + [HumanMessage(content=content)],
        "next_step": "",
        "businesses": [],
        "business_collected_data": [],
    }
    app = build_graph()
    final = app.invoke(initial)
    last_msg = (final.get("messages") or [])[-1]
    text = last_msg.content if hasattr(last_msg, "content") else str(last_msg)
    return (
        text,
        final.get("businesses") or [],
        final.get("business_collected_data") or [],
    )
