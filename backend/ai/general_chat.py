"""General-purpose chat responder for non-HR/casual questions."""

from __future__ import annotations

import re

from backend.ai.llm import llm


def _strip_code_fence(text: str) -> str:
    content = (text or "").strip()
    if content.startswith("```"):
        lines = content.splitlines()
        if len(lines) >= 2:
            content = "\n".join(lines[1:])
        if content.endswith("```"):
            content = content[:-3]
    return content.strip()


def _normalize_answer(text: str, max_chars: int) -> str:
    answer = _strip_code_fence(text)
    answer = answer.replace("**", "")
    answer = re.sub(r"^\s*#+\s*", "", answer, flags=re.MULTILINE)
    answer = re.sub(r"\n{3,}", "\n\n", answer).strip()

    if len(answer) > max_chars:
        answer = answer[: max_chars - 3].rstrip() + "..."

    return answer or "I could not generate a response. Please try again."


def general_chat(question: str, concise: bool = True) -> str:
    """Answer general-purpose questions without HR database context."""
    if not question or not question.strip():
        return "Please share a question, and I will help."

    brevity_instruction = (
        "Keep the answer concise (about 2-5 sentences) and directly useful."
        if concise
        else "Provide a clear and complete explanation."
    )

    prompt = f"""
You are a helpful, factual assistant.

User question:
{question.strip()}

Instructions:
- Answer naturally and accurately.
- If the question is ambiguous, ask one short clarifying question.
- Do not mention internal system details.
- {brevity_instruction}
"""

    try:
        response = llm.invoke(prompt)
        content = getattr(response, "content", str(response))
        max_chars = 450 if concise else 1200
        return _normalize_answer(str(content), max_chars=max_chars)
    except Exception as exc:
        print(f"Error in general_chat: {exc}")
        return "I could not process that right now. Please try again in a moment."
