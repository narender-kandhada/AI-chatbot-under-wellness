def decide_response(emotion: str, situation: str):
    if emotion == "sad":
        return (
            "I hear you. It sounds heavy, but you’re not alone here.",
            ["reflection", "breathing"]
        )

    if situation == "academic_stress":
        return (
            "Exams can be overwhelming. One step at a time — you’re doing your best.",
            ["grounding"]
        )

    return (
        "I’m here with you. You can talk freely.",
        []
    )
