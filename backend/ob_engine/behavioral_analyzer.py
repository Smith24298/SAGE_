"""
Behavioral Intelligence & Engagement Intelligence Analyzer

Analyzes employee personality/assessment data combined with workplace transcripts
to generate comprehensive behavioral and engagement intelligence.
"""

from backend.ai.llm import llm
import json


def analyze_behavioral_intelligence(personality_data: dict, transcript: str) -> dict:
    """
    Analyze behavioral intelligence from personality data and transcript.
    
    Returns:
    {
        "communication_style": "",
        "personality_summary": "",
        "motivation_drivers": [],
        "feedback_preference": "",
        "collaboration_style": ""
    }
    """
    
    prompt = f"""
    You are an Organizational Behavior expert analyzing an employee's behavioral patterns.
    
    PERSONALITY/ASSESSMENT DATA:
    {json.dumps(personality_data, indent=2)}
    
    WORKPLACE TRANSCRIPT:
    {transcript}
    
    Analyze and infer the employee's behavioral characteristics. Return a valid JSON object:
    {{
        "communication_style": "brief description of how they communicate (e.g., direct, collaborative, formal, informal)",
        "personality_summary": "brief summary of key personality traits observed",
        "motivation_drivers": ["listed", "key", "motivators"],
        "feedback_preference": "how they prefer to receive feedback (e.g., direct, constructive, collaborative)",
        "collaboration_style": "how they work with others (e.g., team-focused, independent, leader-oriented)"
    }}
    
    Base your analysis on both the personality data and the actual behavior observed in the transcript.
    Return ONLY valid JSON without markdown formatting.
    """
    
    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        
        # Remove markdown formatting if present
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
        
        return json.loads(content)
    except Exception as e:
        print(f"Error analyzing behavioral intelligence: {e}")
        return {
            "communication_style": "neutral",
            "personality_summary": "Unable to extract",
            "motivation_drivers": [],
            "feedback_preference": "standard",
            "collaboration_style": "balanced"
        }


def analyze_engagement_intelligence(transcript: str, personality_data: dict = None) -> dict:
    """
    Analyze engagement intelligence from workplace transcript.
    
    Returns:
    {
        "engagement_level": 0.0-1.0,
        "participation": 0.0-1.0,
        "responsiveness": 0.0-1.0,
        "initiative": 0.0-1.0,
        "key_signals": [],
        "reasoning": ""
    }
    """
    
    personality_context = f"\n\nPersonality Context:\n{json.dumps(personality_data, indent=2)}" if personality_data else ""
    
    prompt = f"""
    You are an Organizational Behavior expert measuring employee engagement and participation.
    
    WORKPLACE TRANSCRIPT:
    {transcript}
    {personality_context}
    
    Analyze the engagement signals in this transcript. Return a valid JSON object:
    {{
        "engagement_level": <0.0-1.0>,
        "participation": <0.0-1.0>,
        "responsiveness": <0.0-1.0>,
        "initiative": <0.0-1.0>,
        "key_signals": ["observed", "signals", "in", "transcript"],
        "reasoning": "brief explanation of your scoring"
    }}
    
    Scoring guidance:
    - engagement_level: How emotionally/cognitively invested is the employee? (0=disengaged, 1=highly invested)
    - participation: Does the employee actively contribute ideas, opinions, feedback? (0=silent, 1=highly active)
    - responsiveness: Does the employee react constructively and promptly to discussion/direction? (0=unresponsive, 1=very responsive)
    - initiative: Does the employee proactively propose actions, growth, or problem-solving? (0=passive, 1=highly proactive)
    
    Return ONLY valid JSON without markdown formatting.
    """
    
    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        
        # Remove markdown formatting if present
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
        
        result = json.loads(content)
        
        # Ensure values are floats between 0 and 1
        result["engagement_level"] = max(0, min(1, float(result.get("engagement_level", 0.5))))
        result["participation"] = max(0, min(1, float(result.get("participation", 0.5))))
        result["responsiveness"] = max(0, min(1, float(result.get("responsiveness", 0.5))))
        result["initiative"] = max(0, min(1, float(result.get("initiative", 0.5))))
        
        return result
    except Exception as e:
        print(f"Error analyzing engagement intelligence: {e}")
        return {
            "engagement_level": 0.5,
            "participation": 0.5,
            "responsiveness": 0.5,
            "initiative": 0.5,
            "key_signals": [],
            "reasoning": "Unable to analyze"
        }


def generate_employee_intelligence_report(
    employee_name: str,
    personality_data: dict,
    transcript: str
) -> dict:
    """
    Generate comprehensive behavioral and engagement intelligence report.
    
    Args:
        employee_name: Employee identifier
        personality_data: Personality/assessment data dict
        transcript: Workplace conversation transcript
        
    Returns:
        Complete intelligence report with both behavioral and engagement analysis
    """
    
    behavioral = analyze_behavioral_intelligence(personality_data, transcript)
    engagement = analyze_engagement_intelligence(transcript, personality_data)
    
    report = {
        "employee": employee_name,
        "behavioral_intelligence": behavioral,
        "engagement_intelligence": engagement,
        "timestamp": None  # Will be set by caller if needed
    }
    
    return report
