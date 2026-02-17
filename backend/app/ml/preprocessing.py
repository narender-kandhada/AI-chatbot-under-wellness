"""
Preprocessing Module.

This module handles text cleaning and preprocessing
before passing input to ML models.
"""
# app/ml/preprocessing.py
import re

def clean_text(text: str) -> str:
    """
    Clean and normalize input text.

    Args:
        text (str): Raw user input.

    Returns:
        str: Cleaned text.
    """
    text = text.lower()
    text = re.sub(r"[^a-zA-Z\s]", "", text)
    return text.strip()
