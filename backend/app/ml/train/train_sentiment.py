"""
Sentiment Training Script.

This script trains the sentiment classification model
and saves the trained model to disk.
"""
from pathlib import Path
import os
import joblib
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

# 📁 Paths
BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "sentiment_dataset.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "sentiment.pkl"

os.makedirs(MODEL_DIR, exist_ok=True)

# 📊 Load dataset
df = pd.read_csv(DATA_PATH)

X = df["text"]
y = df["label"]

# 🔀 Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.3,
    random_state=42,
    stratify=y
)

# 🤖 ML Pipeline
model = Pipeline([
    ("tfidf", TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=1
    )),
    ("clf", LogisticRegression(
        max_iter=2000,
        class_weight="balanced"
    ))
])

# 🏋️ Train
model.fit(X_train, y_train)

# 🧪 Evaluate
y_pred = model.predict(X_test)

print("\n🔎 Evaluation Results")
print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))
# Confusion Matrix
cm = confusion_matrix(y_test, y_pred, labels=model.classes_)

print("\nConfusion Matrix:")
print(cm)

plt.figure(figsize=(4,4))
sns.heatmap(cm, annot=True, fmt="d",
            xticklabels=list(model.classes_),
            yticklabels=list(model.classes_))
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix")
plt.show()

# 💾 Save Model
joblib.dump(model, MODEL_PATH)

print(f"\n✅ Model saved at: {MODEL_PATH}")
