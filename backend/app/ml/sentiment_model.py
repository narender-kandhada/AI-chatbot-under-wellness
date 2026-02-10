def predict_sentiment(text: str):
    # Dummy logic (replace with ML later)
    if "sad" in text or "bad" in text:
        return "negative", 0.75
    return "neutral", 0.65
