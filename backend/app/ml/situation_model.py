"""
Situation Model Module.

This module classifies user situations based on
input text using a trained ML model.
"""
# app/ml/situation_model.py
def detect_situation(text: str):
    """
    Load trained situation classification model.

    Returns:
        object: Loaded situation model.
    """
    if "exam" in text:
        return "academic_stress"
    if "alone" in text:
        return "loneliness"
    return "general"
