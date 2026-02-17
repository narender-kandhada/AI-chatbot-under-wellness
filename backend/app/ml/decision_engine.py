"""
Decision Engine Module.

This module contains logic to generate appropriate system responses
based on detected sentiment, emotion, and situation.
"""
# app/ml/decision_engine.py
def decide_response(emotion: str, situation: str):
    """
    Generate a response based on emotion and sentiment.

    Args:
        emotion (str): Detected emotion label.
        situation (str): Detected situation label.

    Returns:
        Dict[str, str]: Dictionary containing response message.
    """
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
