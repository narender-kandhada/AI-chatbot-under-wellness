def predict_emotion(text: str):
    if "anxious" in text or "worried" in text:
        return "anxious", 0.78
    if "sad" in text:
        return "sad", 0.8
    return "calm", 0.7
