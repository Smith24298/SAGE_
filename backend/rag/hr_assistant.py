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


def _normalize_text(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


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
        return "Please share what you need help with. I can prepare meetings, summarize employee insights, or flag engagement risks."
    if intent == "ack":
        return "Noted. Tell me the next action, like meeting prep, employee summary, or engagement review."
    if intent == "thanks":
        return "You are welcome. I can also help you prep your next 1:1 or summarize any employee profile."
    if intent == "greeting":
        return "Hi. I can help with meeting prep, engagement analysis, and employee insights. Who should we focus on?"
    if intent == "exit":
        return "Sure. Reach out anytime you need HR support."
    if intent == "out_of_scope":
        return "I am focused on HR and people topics. Ask me about meeting prep, employee insights, engagement, or burnout risk."
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
        
        context = ""
        
        if twins:
            # Format employee data with behavioral insights
            for t in twins:
                emp_name = t.get("name", "Unknown")
                context += f"\n**{emp_name}**:\n"
                
                # Add behavioral intelligence if available
                if "behavioral_profile" in t:
                    profile = t["behavioral_profile"]
                    context += f"  Communication: {profile.get('communication_style', 'N/A')}\n"
                    context += f"  Drivers: {', '.join(profile.get('motivation_drivers', []))}\n"
                
                # Add engagement metrics if available
                if "engagement_profile" in t:
                    eng = t["engagement_profile"]
                    context += f"  Engagement: {eng.get('engagement_level', 0):.1f}/1.0\n"
                    context += f"  Participation: {eng.get('participation', 0):.1f}/1.0\n"
                
                # Add other relevant data
                context += f"  Maslow Level: {t.get('maslow_level', 'N/A')}\n"
                context += f"  Burnout Risk: {t.get('burnout_risk', 0):.1f}\n"
        else:
            context = "No employee digital twins found in the system."
        
        # Build concise or detailed prompt
        length_instruction = (
            "Keep your response very concise (2-3 sentences max), focused, and actionable. "
            "Use bullet points if listing multiple items."
        ) if concise else ""
        
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