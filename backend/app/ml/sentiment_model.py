"""
Sentiment Model Module.

This module loads and performs predictions using
the trained sentiment analysis model.
"""
from pathlib import Path
import joblib


# Absolute-safe path to model
MODEL_PATH = Path(__file__).resolve().parent / "models" / "sentiment.pkl"

# Load model once (on server start)
model = joblib.load(MODEL_PATH)

def predict_sentiment(text: str):
    """
    Returns:
        label (str): positive / negative
        confidence (float): pseudo-confidence
    """
    probs = model.predict_proba([text])[0]
    label_index = probs.argmax()

    label = model.classes_[label_index]
    confidence = float(probs[label_index])

    return label, confidence
