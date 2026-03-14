from backend.ingestion.transcript_parser import parse_transcript
from backend.ai.insight_extractor import extract_behavior
from backend.ob_engine.maslow import classify_maslow
from backend.ob_engine.herzberg import herzberg_analysis
from backend.ob_engine.theory_xy import detect_management_style
from backend.ob_engine.equity import check_equity_concerns
from backend.twin_engine.twin_updater import update_digital_twin
from backend.ob_engine.behavioral_analyzer import analyze_behavioral_intelligence, analyze_engagement_intelligence
from backend.ob_engine.intelligence_storage import update_digital_twin_with_intelligence

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
    for conv in conversations:
        speaker = conv["speaker"]
        msg = conv["message"]
        if speaker not in speaker_statements:
            speaker_statements[speaker] = []
        speaker_statements[speaker].append(msg)
        
    # 3. Analyze each employee
    results = {}
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
        
        # Update Digital Twin
        twin_data = update_digital_twin(speaker, insights, ob_results, combined_text)
        
        # Optionally perform detailed behavioral and engagement analysis
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
            except Exception as e:
                print(f"Warning: Could not perform behavioral analysis for {speaker}: {e}")
        
        results[speaker] = twin_data
    
    return results
