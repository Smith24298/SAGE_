def check_equity_concerns(insight: str, text: str) -> bool:
    concerns = ["fair", "unfair", "pay", "salary", "bonus", "recognition", "imbalance", "inequality", "favoritism"]
    insight_lower = insight.lower()
    text_lower = text.lower()
    for word in concerns:
        if word in insight_lower or word in text_lower:
            return True
    return False
