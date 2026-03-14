from backend.database import employees
from groq import Groq
import os
import json
import re

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

ACK_PATTERN = re.compile(
    r"^(ok|okay|okk|okkk|k|kk|alright|sure|fine|got it|noted|cool|hmm|hmmm|yep|yeah)$",
    re.IGNORECASE,
)
THANKS_PATTERN = re.compile(
    r"^(thanks|thank you|thx|thank u|appreciate it)$",
    re.IGNORECASE,
)
GREETING_PATTERN = re.compile(
    r"^(hi|hello|hey|yo|good morning|good afternoon|good evening)$",
    re.IGNORECASE,
)
EXIT_PATTERN = re.compile(
    r"^(bye|goodbye|see you|talk later|ttyl)$",
    re.IGNORECASE,
)

HR_INTENT_HINTS = {
    "meeting",
    "employee",
    "engagement",
    "burnout",
    "motivation",
    "feedback",
    "performance",
    "team",
    "manager",
    "attrition",
    "retention",
    "promotion",
    "raise",
    "interview",
    "hiring",
}

OUT_OF_SCOPE_HINTS = {
    "weather",
    "temperature",
    "rain",
    "movie",
    "song",
    "recipe",
    "football",
    "cricket",
    "stocks",
    "crypto",
    "bitcoin",
    "joke",
    "poem",
    "programming",
    "javascript",
    "python code",
}

MEETING_SIGNAL_TERMS = {
    "deadline",
    "stress",
    "burnout",
    "workload",
    "feedback",
    "career",
    "manager",
    "team",
    "promotion",
    "attrition",
    "retention",
    "conflict",
    "support",
    "motivation",
    "engagement",
}


def _normalize_text(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


def _clean_candidate_name(candidate: str) -> str | None:
    tokens = re.findall(r"[a-z']+", _normalize_text(candidate))
    stop_words = {
        "a",
        "an",
        "the",
        "meet",
        "meeting",
        "details",
        "detail",
        "insights",
        "insight",
        "data",
        "digital",
        "twin",
        "profile",
        "on",
        "for",
        "with",
        "about",
        "regarding",
    }
    words = [word for word in tokens if word not in stop_words]
    if not words:
        return None
    return " ".join(words[:3]).strip()


def _extract_name_hint(question: str) -> str | None:
    normalized = _normalize_text(question)
    patterns = [
        r"\bnot\s+[a-z][a-z'-]+\s+([a-z][a-z'\s-]{1,30})",
        r"(?:meet(?:ing)?|talk|discussion|speak|call|1:1|one on one)\s+with\s+([a-z][a-z'\s-]{1,40})",
        r"(?:with|about|regarding|for)\s+([a-z][a-z'\s-]{1,40})",
    ]

    for pattern in patterns:
        match = re.search(pattern, normalized)
        if match:
            cleaned = _clean_candidate_name(match.group(1))
            if cleaned:
                return cleaned

    # Last fallback: detect a likely person token in short prompts.
    tokens = [
        token
        for token in re.findall(r"\b[a-z]{3,}\b", normalized)
        if token
        not in {
            "prepare",
            "meeting",
            "meet",
            "details",
            "digital",
            "twin",
            "database",
            "from",
            "with",
            "about",
            "team",
            "employee",
            "employees",
        }
    ]
    if tokens:
        return tokens[-1]
    return None


def _is_negated(name: str, question: str) -> bool:
    return bool(re.search(rf"\bnot\s+{re.escape(name)}\b", question))


def _find_relevant_twins(question: str, twins: list[dict]) -> list[dict]:
    normalized_question = _normalize_text(question)
    scored: list[tuple[int, dict]] = []

    for twin in twins:
        name = _normalize_text(str(twin.get("name", "")))
        if not name:
            continue

        if _is_negated(name, normalized_question):
            continue

        score = 0
        if name in normalized_question:
            score += 100

        for token in name.split():
            if len(token) < 3:
                continue
            if _is_negated(token, normalized_question):
                score = 0
                break
            if re.search(rf"\b{re.escape(token)}\b", normalized_question):
                score += 10

        if score > 0:
            scored.append((score, twin))

    scored.sort(key=lambda item: item[0], reverse=True)
    return [item[1] for item in scored[:3]]


def _build_twin_context(twins: list[dict]) -> str:
    if not twins:
        return "No employee digital twins found in the system."

    # Keep prompt size bounded while preserving the most relevant employees.
    source_twins = twins[:6]
    context = ""

    for t in source_twins:
        emp_name = t.get("name", "Unknown")
        context += f"\n**{emp_name}**:\n"

        profile = t.get("behavioral_profile", {}) or {}
        communication = profile.get("communication_style", "N/A")
        drivers = profile.get("motivation_drivers", [])
        driver_text = ", ".join(drivers) if isinstance(drivers, list) else str(drivers or "N/A")
        feedback_pref = profile.get("feedback_preference", "N/A")
        collaboration = profile.get("collaboration_style", "N/A")

        context += f"  Communication: {communication}\n"
        context += f"  Motivation Drivers: {driver_text}\n"
        context += f"  Feedback Preference: {feedback_pref}\n"
        context += f"  Collaboration Style: {collaboration}\n"

        engagement = t.get("engagement_profile", {}) or {}
        context += f"  Engagement: {engagement.get('engagement_level', 0):.2f}/1.0\n"
        context += f"  Participation: {engagement.get('participation', 0):.2f}/1.0\n"
        context += f"  Responsiveness: {engagement.get('responsiveness', 0):.2f}/1.0\n"
        context += f"  Initiative: {engagement.get('initiative', 0):.2f}/1.0\n"

        context += f"  Maslow Level: {t.get('maslow_level', 'N/A')}\n"
        context += f"  Management Style: {t.get('management_style', 'N/A')}\n"
        context += f"  Burnout Risk: {t.get('burnout_risk', 0):.2f}\n"
        context += f"  Equity Concerns: {'Yes' if bool(t.get('equity_concerns')) else 'No'}\n"

        career_goals = t.get("career_goals", [])
        if isinstance(career_goals, list) and career_goals:
            context += f"  Career Goals: {', '.join(str(x) for x in career_goals[:5])}\n"

        herzberg = t.get("herzberg", {}) or {}
        motivators = herzberg.get("motivators", [])
        hygiene_issues = herzberg.get("hygiene_issues", [])
        if isinstance(motivators, list) and motivators:
            context += f"  Herzberg Motivators: {', '.join(str(x) for x in motivators[:5])}\n"
        if isinstance(hygiene_issues, list) and hygiene_issues:
            context += f"  Herzberg Hygiene Issues: {', '.join(str(x) for x in hygiene_issues[:5])}\n"

        ml_metrics = t.get("ml_metrics", {}) or {}
        if isinstance(ml_metrics, dict) and ml_metrics:
            burnout_score = ml_metrics.get("burnout_score")
            risk_label = ml_metrics.get("burnout_risk_label")
            meetings_today = ml_metrics.get("meetings_today")
            deadlines = ml_metrics.get("deadline_mentions")
            if burnout_score is not None:
                context += f"  ML Burnout Score: {burnout_score}\n"
            if risk_label:
                context += f"  ML Burnout Label: {risk_label}\n"
            if meetings_today is not None:
                context += f"  Meetings Today (est): {meetings_today}\n"
            if deadlines is not None:
                context += f"  Deadline Mentions: {deadlines}\n"

        interaction_memory = t.get("interaction_memory", [])
        if isinstance(interaction_memory, list) and interaction_memory:
            context += "  Recent Meeting Notes:\n"
            latest_entries = interaction_memory[-2:]
            for idx, raw_note in enumerate(reversed(latest_entries)):
                note_text = " ".join(str(raw_note or "").split())
                if not note_text:
                    continue

                sentence_chunks = re.split(r"(?<=[.!?])\s+", note_text)
                prioritized = [
                    chunk.strip()
                    for chunk in sentence_chunks
                    if any(term in chunk.lower() for term in MEETING_SIGNAL_TERMS)
                ]
                selected = prioritized[:2] if prioritized else [chunk.strip() for chunk in sentence_chunks[:2] if chunk.strip()]

                if not selected:
                    selected = [note_text[:180]]

                label = "Latest" if idx == 0 else "Previous"
                compact = " | ".join(s[:180] for s in selected)
                context += f"    - {label}: {compact}\n"

    if len(twins) > len(source_twins):
        context += f"\n(Showing {len(source_twins)} of {len(twins)} available twins for prompt-size safety.)\n"

    return context


def _build_digital_twin_summary(twins: list[dict]) -> str:
    if not twins:
        return "No employee digital twins found in the system."

    lines = ["Here is personalized data from digital twins:"]
    for twin in twins[:5]:
        name = str(twin.get("name", "Unknown"))
        profile = twin.get("behavioral_profile", {}) or {}
        engagement = twin.get("engagement_profile", {}) or {}
        drivers = profile.get("motivation_drivers", [])
        top_driver = drivers[0] if isinstance(drivers, list) and drivers else "N/A"
        communication = profile.get("communication_style", "N/A")
        engagement_level = float(engagement.get("engagement_level", 0.0) or 0.0)
        burnout_risk = float(twin.get("burnout_risk", 0.0) or 0.0)
        lines.append(
            f"- {name}: engagement {engagement_level:.1f}/1.0, burnout {burnout_risk:.1f}, "
            f"driver {top_driver}, communication {communication}."
        )

    return "\n".join(lines)


def _detect_light_intent(question: str):
    normalized = _normalize_text(question)
    if not normalized:
        return "empty"

    if any(hint in normalized for hint in OUT_OF_SCOPE_HINTS):
        return "out_of_scope"

    has_hr_hint = any(hint in normalized for hint in HR_INTENT_HINTS)
    if ACK_PATTERN.match(normalized):
        return "ack"
    if THANKS_PATTERN.match(normalized):
        return "thanks"
    if GREETING_PATTERN.match(normalized):
        return "greeting"
    if EXIT_PATTERN.match(normalized):
        return "exit"

    words = normalized.split()
    # One-word or two-word low-signal inputs like "yes", "no", "maybe", "hmm"
    if len(words) <= 2 and not has_hr_hint:
        return "clarify"

    return "ask"


def _light_intent_reply(intent: str) -> str:
    if intent == "empty":
        return (
            "Please share an HR/people question. I can help with meeting prep, employee insights, "
            "engagement analysis, and burnout/attrition risk."
        )
    if intent == "ack":
        return "Noted. Tell me the next action, like meeting prep, employee summary, or engagement review."
    if intent == "thanks":
        return "You are welcome. I can also help you prep your next 1:1 or summarize any employee profile."
    if intent == "greeting":
        return "Hi. I can help with meeting prep, engagement analysis, and employee insights. Who should we focus on?"
    if intent == "exit":
        return "Sure. Reach out anytime you need HR support."
    if intent == "out_of_scope":
        return (
            "I am an HR/OB-focused assistant and cannot help with that topic. "
            "Ask me about meeting prep, employee behavioral insights from digital twins, "
            "engagement, burnout, or attrition risk."
        )
    if intent == "clarify":
        return "Could you share a bit more detail so I can help accurately? Example: prepare me for a meeting with Rahul."
    return ""

def hr_chat(question: str, concise: bool = True):
    """
    Chat with HR AI assistant with optional concise responses.
    
    Args:
        question: User's question
        concise: If True, keeps response brief and focused (default: True for better UX)
    """
    try:
        intent = _detect_light_intent(question)
        if intent != "ask":
            return _light_intent_reply(intent)

        if employees is None:
            raise Exception("Database connection not available")
        
        # Fetch employee data with behavioral intelligence
        twins = list(employees.find())
        normalized_question = _normalize_text(question)

        context = ""
        if twins:
            relevant_twins = _find_relevant_twins(question, twins)

            if any(
                phrase in normalized_question
                for phrase in {
                    "digital twin",
                    "digital twins",
                    "from database",
                    "from db",
                    "personalized data",
                    "personalised data",
                }
            ):
                snapshot_source = relevant_twins if relevant_twins else twins
                return _build_digital_twin_summary(snapshot_source)

            if relevant_twins:
                context = _build_twin_context(relevant_twins)
            else:
                name_hint = _extract_name_hint(question)
                if name_hint:
                    available = [str(t.get("name", "")).strip() for t in twins if str(t.get("name", "")).strip()]
                    preview = ", ".join(available[:10])
                    return (
                        f'I could not find "{name_hint}" in digital twins. '
                        f"Available employees: {preview}. Upload a fresh transcript for {name_hint} to create/update their twin."
                    )

                # If query is generic HR without a specific person, include broad context.
                context = _build_twin_context(twins)
        else:
            context = "No employee digital twins found in the system."
        
        # Build concise or detailed prompt
        length_instruction = (
            "Keep your response very concise (2-3 sentences max), focused, and actionable. "
            "Use bullet points if listing multiple items."
        ) if concise else (
            "Provide a detailed, practical answer using the available digital twin and meeting-memory evidence. "
            "Prefer this structure:\n"
            "1) Situation Summary\n"
            "2) Last Meeting Highlights (what the person discussed recently)\n"
            "3) Risk/Signal Analysis\n"
            "4) How to Deal With This Person (communication + management approach)\n"
            "5) Next 1:1 Agenda and Follow-up Actions.\n"
            "Be specific and actionable; do not be generic."
        )
        
        prompt = f"""
        You are an expert HR leadership assistant providing personalized insights.

        Employee Data & Intelligence:
        {context}

        HR Question:
        {question}

        {length_instruction}

        Response policy:
        - Only answer HR and people-management topics.
        - If the query is ambiguous, ask one specific follow-up question.
        - Do not invent employee facts not present in data.
        - Keep output practical and decision-ready.
        - For person-specific questions, explicitly reference relevant recent meeting notes from interaction memory when present.
        - When recommending actions, include what to say, what to avoid, and what to monitor.
        
        Provide insights and recommendations based on the employee data above.
        Focus on behavioral intelligence and engagement patterns.
        """

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )

        answer = response.choices[0].message.content
        
        # Further trim response if concise mode (remove extra whitespace)
        if concise:
            # Clean up markdown formatting
            answer = answer.replace("**", "").strip()
            answer = re.sub(r"^\s*#+\s*", "", answer, flags=re.MULTILINE)
            lines = [line.strip() for line in answer.split("\n") if line.strip()]
            if len(lines) > 3:
                lines = lines[:3]
            answer = "\n".join(lines)
            if len(answer) > 320:
                answer = answer[:317].rstrip() + "..."
        
        return answer
    except Exception as e:
        print(f"Error in hr_chat: {e}")
        raise