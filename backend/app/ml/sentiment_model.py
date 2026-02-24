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
    # Try predict_proba first (Logistic Regression, Naive Bayes)
    if hasattr(model, 'predict_proba'):
        try:
            probs = model.predict_proba([text])[0]
            label_index = probs.argmax()
            label = model.classes_[label_index]
            confidence = float(probs[label_index])
            return label, confidence
        except AttributeError:
            pass

    # Fallback for LinearSVC — use decision_function
    if hasattr(model, 'decision_function'):
        try:
            decision = model.decision_function([text])[0]
            # For binary classification, positive = class 1, negative = class 0
            if isinstance(decision, float) or decision.ndim == 0:
                label_index = 1 if float(decision) > 0 else 0
                # Convert distance to pseudo-confidence (sigmoid-like)
                import math
                confidence = 1 / (1 + math.exp(-abs(float(decision))))
            else:
                label_index = decision.argmax()
                confidence = 0.7
            label = model.classes_[label_index]
            return label, confidence
        except Exception:
            pass

    # Last resort — just predict
    label = model.predict([text])[0]
    return label, 0.6
