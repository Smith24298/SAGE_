from .llm import llm
import json

def extract_behavior(messages: list) -> dict:
    text = " ".join(messages)

    prompt = f"""
    Analyze the employee conversation below.
    Extract the following explicitly into a valid JSON object:
    {{
        "sentiment": "positive/negative/neutral",
        "burnout_signal": "high/medium/low/none",
        "career_interest": "any mentioned career interest or empty string",
        "fairness_complaints": "any fairness complaints or empty",
        "management_feedback": "any feedback regarding management or empty"
    }}

    Conversation:
    {text}
    
    Ensure the output is ONLY valid JSON without markdown formatting like ```json.
    """

    response = llm.invoke(prompt)

    try:
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
        return json.loads(content)
    except Exception as e:
        print(f"Failed to parse JSON: {e} - content: {response.content}")
        return {
            "sentiment": "neutral",
            "burnout_signal": "none",
            "career_interest": "",
            "fairness_complaints": "",
            "management_feedback": ""
        }