"""
Sentiment Training Script.

Trains multiple ML classifiers using TF-IDF
and saves the best performing model.
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
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import MultinomialNB

# ✅ Import preprocessing
# IMPORTANT: Run script using:
# python -m app.ml.train.train_sentiment
from app.ml.preprocessing import clean_text


# ============================================================
# 📁 PATH CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "mental_health_dataset.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "sentiment.pkl"
CONF_MATRIX_PATH = MODEL_DIR / "sentiment_confusion_matrix.png"

os.makedirs(MODEL_DIR, exist_ok=True)


# ============================================================
# 📊 LOAD DATA
# ============================================================

if not DATA_PATH.exists():
    raise FileNotFoundError(f"Dataset not found at: {DATA_PATH}")

df = pd.read_csv(DATA_PATH, encoding="latin1")

# Rename Kaggle columns if needed
if "statement" in df.columns and "status" in df.columns:
    df = df.rename(columns={
        "statement": "text",
        "status": "label"
    })

if "text" not in df.columns or "label" not in df.columns:
    raise ValueError("Dataset must contain 'text' and 'label' columns")

print(f"\n📊 Dataset Loaded: {len(df)} samples")


# ============================================================
# 🧹 CLEAN DATA
# ============================================================

print("\n🧹 Cleaning text...")

df["text"] = df["text"].astype(str).apply(clean_text)

df = df[df["text"].str.strip() != ""]
df = df.drop_duplicates()

print(f"✅ Dataset after cleaning: {len(df)} samples")
print("\nClass Distribution:")
print(df["label"].value_counts())


# ============================================================
# 🔀 TRAIN / TEST SPLIT
# ============================================================

X = df["text"]
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.3,
    random_state=42,
    stratify=y
)


# ============================================================
# 🤖 MODEL COMPARISON
# ============================================================

print("\n🏋️ Training multiple models...")

models_dict = {
    "Logistic Regression": LogisticRegression(max_iter=3000, class_weight="balanced"),
    "Linear SVM": LinearSVC(class_weight="balanced"),
    "Naive Bayes": MultinomialNB()
}

vectorizer = TfidfVectorizer(
    stop_words="english",
    ngram_range=(1, 3),
    min_df=3,
    max_df=0.9,
    sublinear_tf=True
)

best_accuracy = 0.0
best_model = None
best_name = ""

for name, clf in models_dict.items():
    print(f"\n🔍 Training {name}...")

    pipeline = Pipeline([
        ("tfidf", vectorizer),
        ("clf", clf)
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    acc = accuracy_score(y_test, y_pred)

    print(f"{name} Accuracy:", acc)
    print(classification_report(y_test, y_pred, zero_division=0))

    if acc > best_accuracy:
        best_accuracy = acc
        best_model = pipeline
        best_name = name


# Safety check (prevents None errors)
if best_model is None:
    raise RuntimeError("Model training failed. No model selected.")


print(f"\n🏆 Best Model: {best_name} (Accuracy: {best_accuracy})")


# ============================================================
# 🔬 FINAL EVALUATION
# ============================================================

print(f"\n🔬 Evaluating Best Model: {best_name}")

y_pred = best_model.predict(X_test)

print("\n🔎 Final Evaluation Results")
print("Accuracy:", accuracy_score(y_test, y_pred))

print("\nClassification Report:\n")
print(classification_report(y_test, y_pred, zero_division=0))


# ============================================================
# 📉 CONFUSION MATRIX
# ============================================================

cm = confusion_matrix(y_test, y_pred, labels=best_model.classes_)

plt.figure(figsize=(7, 7))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    xticklabels=list(best_model.classes_),
    yticklabels=list(best_model.classes_),
    cmap="Blues"
)

plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title(f"{best_name} Confusion Matrix")
plt.tight_layout()
plt.savefig(CONF_MATRIX_PATH)
plt.close()

print(f"\n🖼 Confusion matrix saved at: {CONF_MATRIX_PATH}")


# ============================================================
# 💾 SAVE BEST MODEL
# ============================================================

joblib.dump(best_model, MODEL_PATH)

print(f"\n✅ Best Model ({best_name}) saved at: {MODEL_PATH}")
print("Model Classes:", best_model.classes_)
