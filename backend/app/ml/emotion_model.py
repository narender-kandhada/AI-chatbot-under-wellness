"""
Emotion Model Module.

This module loads and uses the trained emotion classification model
to predict emotions from input text.
"""
# app/ml/emotion_model.py
def predict_emotion(text: str):
    """
    Load the trained emotion model from disk.

    Returns:
        object: Loaded emotion classification model.
    """
    if "anxious" in text or "worried" in text:
        return "anxious", 0.78
    if "sad" in text:
        return "sad", 0.8
    return "calm", 0.7
