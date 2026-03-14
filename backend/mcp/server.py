"""MCP server exposing SAGE routing and HR intelligence tools."""

from __future__ import annotations

from typing import Any

from backend.database import db
from backend.mcp.intent_router import classify_intent, route_user_message
from backend.ob_engine.intelligence_storage import get_employee_behavioral_summary

try:
    from mcp.server.fastmcp import FastMCP
except Exception as exc:  # pragma: no cover
    FastMCP = None
    MCP_IMPORT_ERROR = exc
else:
    MCP_IMPORT_ERROR = None


def _latest_meeting_summary() -> dict[str, Any]:
    if db is None:
        return {"status": "error", "message": "Database connection not available"}

    doc = db["meeting_summaries"].find_one(sort=[("created_at", -1)])
    if not doc:
        return {"status": "success", "summary": None}

    doc["_id"] = str(doc["_id"])
    return {"status": "success", "summary": doc}


def build_mcp_server():
    if FastMCP is None:
        raise RuntimeError(
            "MCP dependency not available. Install with `pip install mcp`. "
            f"Import error: {MCP_IMPORT_ERROR}"
        )

    server = FastMCP("sage-intelligence")

    @server.tool()
    def classify_message(message: str) -> dict[str, Any]:
        """Classify message intent as navigation, casual_general, or meeting_hr."""
        return classify_intent(message).to_dict()

    @server.tool()
    def route_message(message: str) -> dict[str, Any]:
        """Route message using intelligent intent routing and return response."""
        return route_user_message(message, concise=True)

    @server.tool()
    def get_employee_summary(employee_name: str) -> dict[str, Any]:
        """Fetch latest employee behavioral and engagement summary."""
        summary = get_employee_behavioral_summary(employee_name)
        return {
            "status": "success" if summary else "not_found",
            "employee": employee_name,
            "summary": summary,
        }

    @server.tool()
    def get_latest_meeting_summary() -> dict[str, Any]:
        """Fetch the newest stored meeting summary."""
        return _latest_meeting_summary()

    return server


def main():
    server = build_mcp_server()
    server.run()


if __name__ == "__main__":
    main()
