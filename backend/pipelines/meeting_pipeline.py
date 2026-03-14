from backend.ingestion.transcript_parser import parse_transcript
from backend.ai.insight_extractor import extract_behavior
from backend.ob_engine.maslow import classify_maslow
from backend.ob_engine.herzberg import herzberg_analysis
from backend.ob_engine.theory_xy import detect_management_style
from backend.ob_engine.equity import check_equity_concerns
from backend.twin_engine.twin_updater import update_digital_twin
from backend.ob_engine.ml_metrics import (
    build_speaker_ml_metrics,
    estimate_meeting_duration_minutes,
)
from backend.ob_engine.behavioral_analyzer import analyze_behavioral_intelligence, analyze_engagement_intelligence
from backend.ob_engine.intelligence_storage import update_digital_twin_with_intelligence

from backend.database import db
from datetime import datetime
from backend.ai.llm import llm
import json

def generate_global_meeting_insight(text: str) -> dict:
    """
    Generate a high-level summary and key insights for the entire meeting.
    """
    prompt = f"""
    Analyze the meeting transcript below.
    Generate a summary and key insights as a JSON object with the following structure:
    {{
        "summary": "A concise overview of the meeting (2-3 sentences)",
        "key_insights": ["Insight 1", "Insight 2", ...],
        "action_items": ["Action item 1", "Action item 2", ...],
        "overall_sentiment": "positive/negative/neutral"
    }}

    Transcript:
    {text}

    Ensure the output is ONLY valid JSON.
    """
    
    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
        return json.loads(content)
    except Exception as e:
        print(f"Failed to generate global meeting insight: {e}")
        return {
            "summary": "Meeting transcript processed, but detailed insights could not be generated.",
            "key_insights": [],
            "action_items": [],
            "overall_sentiment": "neutral"
        }

def process_meeting(text: str, include_behavioral_analysis: bool = True):
    """
    Process a meeting transcript and extract insights from all participants.
    
    Args:
        text: Meeting transcript text
        include_behavioral_analysis: Whether to perform detailed behavioral/engagement analysis
        
    Returns:
        Dictionary with analysis results for each speaker
    """
    # 1. Parse transcript
    conversations = parse_transcript(text)
    
    # 2. Group statements by speaker
    speaker_statements = {}
    all_messages = []
    for conv in conversations:
        speaker = conv["speaker"]
        msg = conv["message"]
        all_messages.append(msg)
        if speaker not in speaker_statements:
            speaker_statements[speaker] = []
        speaker_statements[speaker].append(msg)

    meeting_duration_minutes = estimate_meeting_duration_minutes(all_messages)
        
    # 3. Analyze each employee
    results = {}
    total_sentiment = 0
    num_speakers = len(speaker_statements)
    topics = set()
    
    for speaker, messages in speaker_statements.items():
        # AI Insight Extraction
        insights = extract_behavior(messages)
        
        combined_text = " ".join(messages)
        
        # OB Theory Classification
        maslow_level = classify_maslow(str(insights) + combined_text)
        h_motivators, h_hygiene = herzberg_analysis(str(insights) + combined_text)
        theory_xy = detect_management_style(str(insights) + combined_text)
        equity = check_equity_concerns(str(insights), combined_text)
        
        ob_results = {
            "maslow": maslow_level,
            "herzberg_motivators": h_motivators,
            "herzberg_hygiene": h_hygiene,
            "theory_xy": theory_xy,
            "equity": equity
        }

        ml_metrics = build_speaker_ml_metrics(
            speaker_messages=messages,
            participant_count=max(1, num_speakers),
            meeting_duration_minutes=meeting_duration_minutes,
            full_meeting_text=text,
        )
        
        # Update Digital Twin
        twin_data = update_digital_twin(
            speaker,
            insights,
            ob_results,
            combined_text,
            ml_metrics=ml_metrics,
        )
        
        # Optionally perform detailed behavioral and engagement analysis
        engagement_level = 0.5
        if include_behavioral_analysis:
            try:
                # Get personality data from existing twin if available
                personality_data = twin_data.get("behavioral_profile", {})
                
                # Analyze behavioral intelligence from transcript
                behavioral_intel = analyze_behavioral_intelligence(personality_data, combined_text)
                engagement_intel = analyze_engagement_intelligence(combined_text, personality_data)
                
                # Store intelligence report and update twin
                intelligence_report = {
                    "employee": speaker,
                    "behavioral_intelligence": behavioral_intel,
                    "engagement_intelligence": engagement_intel
                }
                
                update_digital_twin_with_intelligence(speaker, intelligence_report)
                
                # Add to results
                twin_data["behavioral_intelligence"] = behavioral_intel
                twin_data["engagement_intelligence"] = engagement_intel
                twin_data["ml_metrics"] = ml_metrics
                
                engagement_level = engagement_intel.get("engagement_level", 0.5)
            except Exception as e:
                print(f"Warning: Could not perform behavioral analysis for {speaker}: {e}")
                twin_data["ml_metrics"] = ml_metrics
        
        total_sentiment += engagement_level
        results[speaker] = twin_data
        
        # Extract some topics (simple heuristic)
        words = combined_text.split()
        if len(words) > 5:
            topics.add(words[0] + " " + words[1])

    # 4. Store Meeting Summary in MongoDB
    if db is not None:
        try:
            avg_sentiment = (total_sentiment / num_speakers * 100) if num_speakers > 0 else 75
            
            # Generate Global Insight
            global_insight = generate_global_meeting_insight(text)
            
            meeting_summary = {
                "date": datetime.utcnow().strftime("%B %d, %Y"),
                "attendees": num_speakers,
                "avgSentiment": round(avg_sentiment, 1),
                "topics": list(topics)[:3] or ["General Catch-up", "Strategy"],
                "summary": global_insight.get("summary", ""),
                "key_insights": global_insight.get("key_insights", []),
                "action_items": global_insight.get("action_items", []),
                "overall_sentiment": global_insight.get("overall_sentiment", "neutral"),
                "transcript": text,  # Store the original script
                "created_at": datetime.utcnow()
            }
            
            db["meeting_summaries"].insert_one(meeting_summary)
            print(f"✓ Stored detailed meeting summary in MongoDB: {meeting_summary['date']}")
        except Exception as e:
            print(f"✗ Failed to store meeting summary: {e}")
    
    return results
