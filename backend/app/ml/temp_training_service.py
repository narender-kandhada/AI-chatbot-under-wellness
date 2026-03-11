"""
Temporary Ollama training workspace.

This module generates synthetic human-like question/answer pairs with Ollama,
stores them in a separate temp dataset, builds a lightweight retrieval model,
and provides a fast local response path for evaluation.

This is not full LLM fine-tuning. It is a fast temporary training path meant
for local iteration and response checking.
"""

from __future__ import annotations

import json
import time
import uuid
from pathlib import Path

import joblib
import urllib.error
import urllib.request
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.ml.ollama_service import MODEL_PRIMARY as OLLAMA_PRIMARY_MODEL
from app.ml.ollama_service import MODEL_FALLBACK as OLLAMA_FALLBACK_MODEL
from app.ml.ollama_service import OLLAMA_BASE_URL, is_available
from app.ml.preprocessing import clean_text


TEMP_DIR = Path(__file__).resolve().parents[2] / "temp_training"
DATASET_PATH = TEMP_DIR / "synthetic_qa.jsonl"
MODEL_PATH = TEMP_DIR / "retriever.joblib"
GENERATION_TIMEOUT_SECONDS = 180

SYSTEM_PROMPT = """You create synthetic wellness conversation training pairs.

Return only valid JSON.
Create natural, human-sounding user questions and warm, empathetic assistant
answers for a wellness companion app.

Rules:
- Questions must sound like real people texting.
- Answers must be 2 to 4 sentences.
- No lists.
- No clinical or medical advice.
- Keep tone warm, direct, and supportive.
- Vary situations such as relationship stress, loneliness, work stress,
  academic stress, family tension, grief, burnout, and hopeful moments.
"""


def _ensure_temp_dir() -> None:
    TEMP_DIR.mkdir(parents=True, exist_ok=True)


def _call_ollama_json(model: str, messages: list[dict[str, str]]) -> str:
    payload = json.dumps(
        {
            "model": model,
            "messages": messages,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.9,
                "num_predict": 1600,
                "top_p": 0.95,
            },
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        f"{OLLAMA_BASE_URL}/api/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=GENERATION_TIMEOUT_SECONDS) as response:
        result = json.loads(response.read().decode("utf-8"))
        content = result.get("message", {}).get("content", "")
        if not isinstance(content, str) or not content.strip():
            raise RuntimeError("Ollama returned an empty synthetic dataset batch")
        return content.strip()


def _extract_records(raw_text: str) -> list[dict]:
    candidate = raw_text.strip()
    if not candidate.startswith("{") and "{" in candidate:
        candidate = candidate[candidate.find("{") :]
    if not candidate.endswith("}") and "}" in candidate:
        candidate = candidate[: candidate.rfind("}") + 1]

    payload = json.loads(candidate)
    records = payload.get("pairs", [])
    if not isinstance(records, list):
        return []

    cleaned_records = []
    for item in records:
        if not isinstance(item, dict):
            continue
        question = str(item.get("question", "")).strip()
        answer = str(item.get("answer", "")).strip()
        emotion = str(item.get("emotion", "calm")).strip() or "calm"
        situation = str(item.get("situation", "general")).strip() or "general"
        if not question or not answer:
            continue
        cleaned_records.append(
            {
                "id": str(uuid.uuid4()),
                "question": question,
                "answer": answer,
                "emotion": emotion,
                "situation": situation,
                "created_at": time.time(),
            }
        )
    return cleaned_records


def _load_existing_pairs() -> list[dict]:
    if not DATASET_PATH.exists():
        return []

    pairs: list[dict] = []
    with DATASET_PATH.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            pairs.append(json.loads(line))
    return pairs


def _write_pairs(pairs: list[dict]) -> None:
    _ensure_temp_dir()
    with DATASET_PATH.open("w", encoding="utf-8") as handle:
        for pair in pairs:
            handle.write(json.dumps(pair, ensure_ascii=False) + "\n")


def _request_batch(batch_size: int) -> tuple[list[dict], str]:
    prompt = f"""Generate {batch_size} unique wellness conversation pairs.

Return JSON with this exact shape:
{{
  "pairs": [
    {{
      "question": "...",
      "answer": "...",
      "emotion": "sad|anxious|calm|angry|lonely|hopeful|tired|happy",
      "situation": "general|relationship_issues|work_stress|academic_stress|family_conflict|grief|loneliness|health_anxiety"
    }}
  ]
}}

No markdown. No explanation. JSON only.
"""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]

    for model in (OLLAMA_PRIMARY_MODEL, OLLAMA_FALLBACK_MODEL):
        try:
            raw = _call_ollama_json(model, messages)
            return _extract_records(raw), model
        except (json.JSONDecodeError, RuntimeError, urllib.error.URLError):
            continue

    raise RuntimeError("Failed to generate a valid synthetic batch from Ollama")


def generate_temp_dataset(total_pairs: int = 1000, batch_size: int = 20, overwrite: bool = True) -> dict:
    if not is_available():
        raise RuntimeError("Ollama is not running")

    existing_pairs = [] if overwrite else _load_existing_pairs()
    pairs = existing_pairs[:]
    seen_questions = {clean_text(pair["question"]) for pair in pairs}
    model_used = OLLAMA_PRIMARY_MODEL

    while len(pairs) < total_pairs:
        needed = min(batch_size, total_pairs - len(pairs))
        batch_pairs, model_used = _request_batch(needed)
        for pair in batch_pairs:
            normalized_question = clean_text(pair["question"])
            if not normalized_question or normalized_question in seen_questions:
                continue
            seen_questions.add(normalized_question)
            pairs.append(pair)
            if len(pairs) >= total_pairs:
                break

    _write_pairs(pairs)
    return {
        "status": "generated",
        "generated_pairs": len(pairs),
        "requested_pairs": total_pairs,
        "dataset_path": str(DATASET_PATH),
        "model_used": model_used,
    }


def build_temp_model() -> dict:
    pairs = _load_existing_pairs()
    if len(pairs) < 10:
        raise RuntimeError("Not enough synthetic pairs. Generate at least 10 first.")

    _ensure_temp_dir()
    questions = [clean_text(pair["question"]) for pair in pairs]
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), min_df=1)
    matrix = vectorizer.fit_transform(questions)

    joblib.dump(
        {
            "vectorizer": vectorizer,
            "matrix": matrix,
            "pairs": pairs,
            "built_at": time.time(),
        },
        MODEL_PATH,
    )

    return {
        "status": "built",
        "pair_count": len(pairs),
        "model_path": str(MODEL_PATH),
    }


def get_temp_status() -> dict:
    pairs = _load_existing_pairs()
    return {
        "pair_count": len(pairs),
        "dataset_path": str(DATASET_PATH),
        "model_path": str(MODEL_PATH),
        "model_ready": MODEL_PATH.exists(),
    }


def get_temp_reply(message: str, top_k: int = 3) -> dict:
    if not MODEL_PATH.exists():
        raise RuntimeError("Temporary model not built yet")

    model_bundle = joblib.load(MODEL_PATH)
    vectorizer: TfidfVectorizer = model_bundle["vectorizer"]
    matrix = model_bundle["matrix"]
    pairs = model_bundle["pairs"]

    query = clean_text(message)
    if not query:
        raise RuntimeError("Message is empty after preprocessing")

    query_vector = vectorizer.transform([query])
    similarities = cosine_similarity(query_vector, matrix).ravel()
    ranked_indices = similarities.argsort()[::-1][:top_k]
    best_index = int(ranked_indices[0])
    best_pair = pairs[best_index]
    best_score = float(similarities[best_index])

    return {
        "reply": best_pair["answer"],
        "source": "temp_training_retriever",
        "similarity": round(best_score, 4),
        "matched_question": best_pair["question"],
    }
