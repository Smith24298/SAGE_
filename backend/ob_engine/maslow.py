def classify_maslow(insight):

    if "salary" in insight or "job security" in insight:
        return "Safety"

    if "team" in insight:
        return "Belonging"

    if "recognition" in insight:
        return "Esteem"

    if "career" in insight or "learning" in insight:
        return "Self-Actualization"

    return "Unknown"