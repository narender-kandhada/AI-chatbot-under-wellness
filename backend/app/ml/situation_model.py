def detect_situation(text: str):
    if "exam" in text:
        return "academic_stress"
    if "alone" in text:
        return "loneliness"
    return "general"
