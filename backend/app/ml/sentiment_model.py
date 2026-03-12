"""
Sentiment Model Module.

This module loads and performs predictions using
the trained sentiment analysis model.
"""
from pathlib import Path
import joblib

# Absolute-safe path to model
MODEL_PATH = Path(__file__).resolve().parent / "models" / "sentiment.pkl"

# Lazy-load model (avoids crash when .pkl doesn't exist yet, e.g. during Docker build)
_model = None

def _get_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model

def predict_sentiment(text: str):
    """
    Returns:
        label (str): positive / negative
        confidence (float): pseudo-confidence
    """
    model = _get_model()
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
