"""
Text Preprocessing Utilities
"""

import re
import string

def clean_text(text: str) -> str:
    """
    Cleans raw input text.

    Steps:
    1. Lowercase
    2. Remove URLs
    3. Remove numbers
    4. Remove punctuation
    5. Remove extra spaces
    """

    # 1️⃣ Lowercase
    text = text.lower()

    # 2️⃣ Remove URLs
    text = re.sub(r"http\S+|www\S+", "", text)

    # 3️⃣ Remove numbers
    text = re.sub(r"\d+", "", text)

    # 4️⃣ Remove punctuation
    text = text.translate(str.maketrans("", "", string.punctuation))

    # 5️⃣ Remove extra spaces
    text = re.sub(r"\s+", " ", text).strip()

    return text
