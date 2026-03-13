def detect_management_style(text):

    if "control" in text or "monitor" in text:
        return "Theory X"

    if "empower" in text or "trust" in text:
        return "Theory Y"

    return "Neutral"