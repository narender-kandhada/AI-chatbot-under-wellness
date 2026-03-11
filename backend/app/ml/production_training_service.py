"""
Production-oriented dataset pipeline for later LoRA fine-tuning.

This module does three things:
1. Generates higher-quality synthetic examples with Ollama using a richer schema.
2. Evaluates dataset quality with deterministic heuristics.
3. Exports LoRA-ready train/validation files plus scaffold configs for Colab/GPU.
"""

from __future__ import annotations

import hashlib
import json
import time
import uuid
from collections import Counter
from pathlib import Path

import urllib.error
import urllib.request
import yaml

from app.ml.ollama_service import MODEL_FALLBACK as OLLAMA_FALLBACK_MODEL
from app.ml.ollama_service import MODEL_PRIMARY as OLLAMA_PRIMARY_MODEL
from app.ml.ollama_service import OLLAMA_BASE_URL, is_available
from app.ml.preprocessing import clean_text


PRODUCTION_DIR = Path(__file__).resolve().parents[2] / "production_training"
DATASET_PATH = PRODUCTION_DIR / "dataset.jsonl"
EVALUATION_PATH = PRODUCTION_DIR / "evaluation_report.json"
PROGRESS_PATH = PRODUCTION_DIR / "generation_progress.json"
EXPORT_DIR = PRODUCTION_DIR / "lora_export"
TRAIN_PATH = EXPORT_DIR / "train.jsonl"
VALID_PATH = EXPORT_DIR / "valid.jsonl"
CONFIG_PATH = EXPORT_DIR / "axolotl_config.yml"
MANIFEST_PATH = EXPORT_DIR / "dataset_manifest.json"
SCRIPT_PATH = EXPORT_DIR / "unsloth_train_stub.py"
GENERATION_TIMEOUT_SECONDS = 240

DATASET_VERSION = "v1"
SYSTEM_PROMPT_VERSION = "prod_v1"
BASE_SYSTEM_PROMPT = "You are InnerCircle, a warm and emotionally intelligent wellness companion. Respond like a supportive friend, not a clinician."
ALLOWED_EMOTIONS = {"sad", "anxious", "calm", "angry", "lonely", "hopeful", "tired", "happy"}
ALLOWED_SITUATIONS = {
    "general",
    "relationship_issues",
    "work_stress",
    "academic_stress",
    "family_conflict",
    "grief",
    "loneliness",
    "health_anxiety",
}
EMOTION_ALIASES = {
    "grief": "sad",
    "burnt_out": "tired",
    "burnout": "tired",
    "overwhelmed": "anxious",
    "discouraged": "sad",
    "frustrated": "angry",
    "hurt": "sad",
    "hopeless": "sad",
    "inadequate": "sad",
    "stressed": "anxious",
}
SITUATION_ALIASES = {
    "personal_growth": "general",
    "repair": "relationship_issues",
    "burnout": "work_stress",
    "low_self_estem": "general",
    "low_self_esteem": "general",
    "friendship": "relationship_issues",
    "loss": "grief",
}
EMOTION_PRIORITY = ["anxious", "sad", "angry", "lonely", "tired", "hopeful", "happy", "calm"]
SITUATION_PRIORITY = [
    "relationship_issues",
    "work_stress",
    "academic_stress",
    "family_conflict",
    "grief",
    "loneliness",
    "health_anxiety",
    "general",
]
DISALLOWED_ANSWER_PHRASES = {
    "as an ai",
    "language model",
    "coping mechanisms",
    "practice self-care",
    "seek medical advice",
    "consult a doctor immediately",
}
LOW_RISK_LEVELS = {"low", "medium"}

GENERATOR_SYSTEM_PROMPT = """You are generating supervised fine-tuning examples for a wellness companion.

Return only strict JSON.

Target style:
- emotionally intelligent
- concise but warm
- validating without sounding clinical
- one thoughtful follow-up question at most
- no lists
- no diagnosis
- no unsafe encouragement

Every user message must sound natural and human, not templated.
Every answer must be specific to the message and emotionally appropriate.
"""


def _tokenize_label(label: str) -> list[str]:
    normalized = label.lower().replace("/", "|").replace(",", "|")
    return [part.strip() for part in normalized.split("|") if part.strip()]


def _pick_by_priority(candidates: list[str], priority: list[str]) -> str | None:
    for item in priority:
        if item in candidates:
            return item
    return candidates[0] if candidates else None


def _normalize_emotion(raw_emotion: str) -> tuple[str, list[str]]:
    issues: list[str] = []
    tokens = [_tokenize_label(raw_emotion)]
    flattened = [token for group in tokens for token in group]
    mapped = [EMOTION_ALIASES.get(token, token) for token in flattened]
    allowed = [token for token in mapped if token in ALLOWED_EMOTIONS]

    if len(flattened) > 1:
        issues.append("emotion_multilabel_normalized")
    if not allowed:
        issues.append("emotion_invalid")
        return "calm", issues

    normalized = _pick_by_priority(allowed, EMOTION_PRIORITY) or "calm"
    return normalized, issues


def _normalize_situation(raw_situation: str) -> tuple[str, list[str]]:
    issues: list[str] = []
    tokens = _tokenize_label(raw_situation)
    mapped = [SITUATION_ALIASES.get(token, token) for token in tokens]
    allowed = [token for token in mapped if token in ALLOWED_SITUATIONS]

    if len(tokens) > 1:
        issues.append("situation_multilabel_normalized")
    if not allowed:
        issues.append("situation_invalid")
        return "general", issues

    normalized = _pick_by_priority(allowed, SITUATION_PRIORITY) or "general"
    return normalized, issues


def _ensure_dirs() -> None:
    PRODUCTION_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)


def _write_progress(progress: dict) -> None:
    _ensure_dirs()
    with PROGRESS_PATH.open("w", encoding="utf-8") as handle:
        json.dump(progress, handle, ensure_ascii=False, indent=2)


def _read_progress() -> dict:
    if not PROGRESS_PATH.exists():
        return {
            "run_state": "idle",
            "started_at": None,
            "last_update": None,
            "target_pairs": 0,
            "accepted_pairs_in_run": 0,
            "scanned_rows": 0,
            "batch_attempts": 0,
            "last_model_used": None,
            "last_error": None,
        }

    with PROGRESS_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _call_ollama_json(model: str, messages: list[dict[str, str]]) -> str:
    payload = json.dumps(
        {
            "model": model,
            "messages": messages,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.95,
                "num_predict": 2200,
                "top_p": 0.95,
                "repeat_penalty": 1.1,
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
            raise RuntimeError("Ollama returned an empty production batch")
        return content.strip()


def _parse_generation_response(raw_text: str) -> list[dict]:
    candidate = raw_text.strip()
    if not candidate.startswith("{") and "{" in candidate:
        candidate = candidate[candidate.find("{") :]
    if not candidate.endswith("}") and "}" in candidate:
        candidate = candidate[: candidate.rfind("}") + 1]

    payload = json.loads(candidate)
    records = payload.get("pairs", [])
    return records if isinstance(records, list) else []


def _question_word_count(text: str) -> int:
    return len(text.split())


def _sentence_count(text: str) -> int:
    normalized = text.replace("!", ".").replace("?", ".")
    return len([part.strip() for part in normalized.split(".") if part.strip()])


def _quality_issues(question: str, answer: str, emotion: str, situation: str, risk_level: str) -> list[str]:
    issues: list[str] = []
    question_words = _question_word_count(question)
    answer_words = len(answer.split())
    answer_lower = answer.lower()

    if question_words < 5:
        issues.append("question_too_short")
    if question_words > 45:
        issues.append("question_too_long")
    if answer_words < 22:
        issues.append("answer_too_short")
    if answer_words > 140:
        issues.append("answer_too_long")
    if _sentence_count(answer) < 2:
        issues.append("answer_not_multisentence")
    if _sentence_count(answer) > 4:
        issues.append("answer_too_many_sentences")
    if answer.count("?") > 1:
        issues.append("too_many_questions")
    if any(marker in answer for marker in ("\n-", "\n*", "1.", "2.")):
        issues.append("list_formatting")
    if any(phrase in answer_lower for phrase in DISALLOWED_ANSWER_PHRASES):
        issues.append("clinical_or_ai_phrase")
    if emotion not in ALLOWED_EMOTIONS:
        issues.append("emotion_not_allowed")
    if situation not in ALLOWED_SITUATIONS:
        issues.append("situation_not_allowed")
    if risk_level.lower() not in LOW_RISK_LEVELS:
        issues.append("risk_level_not_allowed")
    return issues


def _normalize_record(item: dict, model_name: str) -> dict | None:
    if not isinstance(item, dict):
        return None

    user_message = str(item.get("user_message", item.get("question", ""))).strip()
    assistant_response = str(item.get("assistant_response", item.get("answer", ""))).strip()
    raw_emotion = str(item.get("emotion", "calm")).strip() or "calm"
    raw_situation = str(item.get("situation", "general")).strip() or "general"
    risk_level = str(item.get("risk_level", "low")).strip().lower() or "low"
    tags = item.get("tags", [])
    if not isinstance(tags, list):
        tags = []
    tags = [str(tag).strip() for tag in tags if str(tag).strip()]

    if not user_message or not assistant_response:
        return None

    emotion, emotion_issues = _normalize_emotion(raw_emotion)
    situation, situation_issues = _normalize_situation(raw_situation)
    issues = emotion_issues + situation_issues + _quality_issues(user_message, assistant_response, emotion, situation, risk_level)
    accepted = not issues

    return {
        "id": str(uuid.uuid4()),
        "dataset_version": DATASET_VERSION,
        "system_prompt_version": SYSTEM_PROMPT_VERSION,
        "source": "synthetic_ollama",
        "generator_model": model_name,
        "created_at": time.time(),
        "split": "unassigned",
        "user_message": user_message,
        "assistant_response": assistant_response,
        "emotion": emotion,
        "situation": situation,
        "risk_level": risk_level,
        "tags": tags,
        "quality": {
            "accepted": accepted,
            "issues": issues,
            "question_word_count": _question_word_count(user_message),
            "answer_word_count": len(assistant_response.split()),
            "sentence_count": _sentence_count(assistant_response),
        },
    }


def _load_dataset() -> list[dict]:
    if not DATASET_PATH.exists():
        return []

    rows: list[dict] = []
    with DATASET_PATH.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def _write_dataset(rows: list[dict]) -> None:
    _ensure_dirs()
    with DATASET_PATH.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def _generation_prompt(batch_size: int) -> str:
    return f"""Generate {batch_size} unique wellness supervised training examples.

Return JSON with this exact shape:
{{
  "pairs": [
    {{
      "user_message": "realistic human message",
      "assistant_response": "warm, emotionally intelligent response",
      "emotion": "sad|anxious|calm|angry|lonely|hopeful|tired|happy",
      "situation": "general|relationship_issues|work_stress|academic_stress|family_conflict|grief|loneliness|health_anxiety",
      "risk_level": "low|medium",
      "tags": ["tag1", "tag2"]
    }}
  ]
}}

Requirements:
- User message must feel personal and specific, not generic.
- Assistant response must directly reflect the user's details.
- Emotion must be exactly one of: sad, anxious, calm, angry, lonely, hopeful, tired, happy.
- Situation must be exactly one of: general, relationship_issues, work_stress, academic_stress, family_conflict, grief, loneliness, health_anxiety.
- Never return combined labels like sad|lonely or general|relationship_issues.
- Response must be 2 to 4 sentences.
- At most one follow-up question.
- No bullet points.
- No clinical language.
- Avoid repeated phrasings across examples.
- Include variety in age, tone, relationship context, work pressure, loneliness, burnout, repair, and hopeful recovery.
- Do not produce crisis or self-harm content.

JSON only.
"""


def _request_batch(batch_size: int) -> tuple[list[dict], str]:
    messages = [
        {"role": "system", "content": GENERATOR_SYSTEM_PROMPT},
        {"role": "user", "content": _generation_prompt(batch_size)},
    ]

    for model in (OLLAMA_PRIMARY_MODEL, OLLAMA_FALLBACK_MODEL):
        try:
            raw = _call_ollama_json(model, messages)
            parsed = _parse_generation_response(raw)
            normalized = []
            for item in parsed:
                record = _normalize_record(item, model)
                if record is not None:
                    normalized.append(record)
            return normalized, model
        except (json.JSONDecodeError, RuntimeError, urllib.error.URLError):
            continue

    raise RuntimeError("Failed to generate a valid production batch from Ollama")


def generate_production_dataset(total_pairs: int = 1000, batch_size: int = 10, overwrite: bool = True) -> dict:
    if not is_available():
        raise RuntimeError("Ollama is not running")

    rows = [] if overwrite else _load_dataset()
    seen_questions = {clean_text(row["user_message"]) for row in rows if row.get("quality", {}).get("accepted")}
    last_model_used = OLLAMA_PRIMARY_MODEL

    accepted_count = sum(1 for row in rows if row.get("quality", {}).get("accepted"))
    started_at = time.time()
    batch_attempts = 0
    _write_progress(
        {
            "run_state": "running",
            "started_at": started_at,
            "last_update": started_at,
            "target_pairs": total_pairs,
            "accepted_pairs_in_run": accepted_count,
            "scanned_rows": len(rows),
            "batch_attempts": batch_attempts,
            "last_model_used": last_model_used,
            "last_error": None,
        }
    )

    try:
        while accepted_count < total_pairs:
            needed = min(batch_size, total_pairs - accepted_count)
            batch_attempts += 1
            batch_rows, last_model_used = _request_batch(needed)
            for row in batch_rows:
                normalized_question = clean_text(row["user_message"])
                if not normalized_question or normalized_question in seen_questions:
                    continue
                if not row["quality"]["accepted"]:
                    rows.append(row)
                    continue
                seen_questions.add(normalized_question)
                rows.append(row)
                accepted_count += 1
                if accepted_count >= total_pairs:
                    break

            _write_dataset(rows)
            _write_progress(
                {
                    "run_state": "running",
                    "started_at": started_at,
                    "last_update": time.time(),
                    "target_pairs": total_pairs,
                    "accepted_pairs_in_run": accepted_count,
                    "scanned_rows": len(rows),
                    "batch_attempts": batch_attempts,
                    "last_model_used": last_model_used,
                    "last_error": None,
                }
            )
    except RuntimeError as exc:
        _write_progress(
            {
                "run_state": "failed",
                "started_at": started_at,
                "last_update": time.time(),
                "target_pairs": total_pairs,
                "accepted_pairs_in_run": accepted_count,
                "scanned_rows": len(rows),
                "batch_attempts": batch_attempts,
                "last_model_used": last_model_used,
                "last_error": str(exc),
            }
        )
        raise

    _write_dataset(rows)
    _write_progress(
        {
            "run_state": "completed",
            "started_at": started_at,
            "last_update": time.time(),
            "target_pairs": total_pairs,
            "accepted_pairs_in_run": accepted_count,
            "scanned_rows": len(rows),
            "batch_attempts": batch_attempts,
            "last_model_used": last_model_used,
            "last_error": None,
        }
    )
    return {
        "status": "generated",
        "accepted_pairs": accepted_count,
        "requested_pairs": total_pairs,
        "dataset_path": str(DATASET_PATH),
        "last_model_used": last_model_used,
    }


def evaluate_production_dataset() -> dict:
    rows = _load_dataset()
    accepted_rows = [row for row in rows if row.get("quality", {}).get("accepted")]
    by_emotion = Counter(row.get("emotion", "unknown") for row in accepted_rows)
    by_situation = Counter(row.get("situation", "unknown") for row in accepted_rows)
    issue_counts = Counter()

    total_question_words = 0
    total_answer_words = 0
    for row in rows:
        quality = row.get("quality", {})
        total_question_words += int(quality.get("question_word_count", 0))
        total_answer_words += int(quality.get("answer_word_count", 0))
        for issue in quality.get("issues", []):
            issue_counts[issue] += 1

    pair_count = len(rows)
    accepted_count = len(accepted_rows)
    report = {
        "status": "evaluated",
        "pair_count": pair_count,
        "accepted_pairs": accepted_count,
        "acceptance_rate": round((accepted_count / pair_count), 4) if pair_count else 0.0,
        "avg_question_words": round((total_question_words / pair_count), 2) if pair_count else 0.0,
        "avg_answer_words": round((total_answer_words / pair_count), 2) if pair_count else 0.0,
        "by_emotion": dict(by_emotion),
        "by_situation": dict(by_situation),
        "issue_counts": dict(issue_counts),
        "report_path": str(EVALUATION_PATH),
    }

    _ensure_dirs()
    with EVALUATION_PATH.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, ensure_ascii=False, indent=2)

    return report


def clean_production_dataset() -> dict:
    rows = _load_dataset()
    if not rows:
        raise RuntimeError("Production dataset is empty")

    cleaned_rows: list[dict] = []
    accepted_count = 0
    normalized_count = 0

    for row in rows:
        normalized = _normalize_record(
            {
                "user_message": row.get("user_message", ""),
                "assistant_response": row.get("assistant_response", ""),
                "emotion": row.get("emotion", "calm"),
                "situation": row.get("situation", "general"),
                "risk_level": row.get("risk_level", "low"),
                "tags": row.get("tags", []),
            },
            row.get("generator_model", "unknown"),
        )
        if normalized is None:
            continue

        normalized["id"] = row.get("id", normalized["id"])
        normalized["created_at"] = row.get("created_at", normalized["created_at"])
        normalized["split"] = row.get("split", "unassigned")

        retained_issues = [
            issue
            for issue in normalized["quality"].get("issues", [])
            if issue not in {"emotion_multilabel_normalized", "situation_multilabel_normalized"}
        ]
        normalized["quality"]["issues"] = retained_issues
        normalized["quality"]["accepted"] = not retained_issues

        if normalized["emotion"] != row.get("emotion") or normalized["situation"] != row.get("situation"):
            normalized_count += 1

        if normalized.get("quality", {}).get("accepted"):
            accepted_count += 1
        cleaned_rows.append(normalized)

    _write_dataset(cleaned_rows)
    return {
        "status": "cleaned",
        "pair_count": len(cleaned_rows),
        "accepted_pairs": accepted_count,
        "normalized_rows": normalized_count,
        "dataset_path": str(DATASET_PATH),
    }


def get_production_status() -> dict:
    rows = _load_dataset()
    accepted_rows = [row for row in rows if row.get("quality", {}).get("accepted")]
    progress = _read_progress()
    return {
        "pair_count": len(accepted_rows),
        "dataset_path": str(DATASET_PATH),
        "evaluation_path": str(EVALUATION_PATH),
        "export_dir": str(EXPORT_DIR),
        "lora_ready": TRAIN_PATH.exists() and VALID_PATH.exists() and CONFIG_PATH.exists(),
        "run_state": progress.get("run_state", "idle"),
        "started_at": progress.get("started_at"),
        "last_update": progress.get("last_update"),
        "target_pairs": progress.get("target_pairs", 0),
        "accepted_pairs_in_run": progress.get("accepted_pairs_in_run", 0),
        "scanned_rows": progress.get("scanned_rows", 0),
        "batch_attempts": progress.get("batch_attempts", 0),
        "last_model_used": progress.get("last_model_used"),
        "last_error": progress.get("last_error"),
    }


def _deterministic_split(row_id: str, train_ratio: float) -> str:
    value = int(hashlib.sha256(row_id.encode("utf-8")).hexdigest()[:8], 16) / 0xFFFFFFFF
    return "train" if value < train_ratio else "valid"


def _chatml_record(row: dict) -> dict:
    return {
        "messages": [
            {"role": "system", "content": BASE_SYSTEM_PROMPT},
            {"role": "user", "content": row["user_message"]},
            {"role": "assistant", "content": row["assistant_response"]},
        ],
        "metadata": {
            "emotion": row["emotion"],
            "situation": row["situation"],
            "risk_level": row["risk_level"],
            "tags": row["tags"],
            "source": row["source"],
        },
    }


def export_lora_dataset(train_ratio: float = 0.9, overwrite: bool = True) -> dict:
    rows = [row for row in _load_dataset() if row.get("quality", {}).get("accepted")]
    if len(rows) < 20:
        raise RuntimeError("Need at least 20 accepted examples before LoRA export")

    _ensure_dirs()
    if not overwrite and (TRAIN_PATH.exists() or VALID_PATH.exists()):
        raise RuntimeError("LoRA export already exists. Use overwrite=True to replace it.")

    train_rows: list[dict] = []
    valid_rows: list[dict] = []
    for row in rows:
        split = _deterministic_split(row["id"], train_ratio)
        row["split"] = split
        record = _chatml_record(row)
        if split == "train":
            train_rows.append(record)
        else:
            valid_rows.append(record)

    with TRAIN_PATH.open("w", encoding="utf-8") as handle:
        for row in train_rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    with VALID_PATH.open("w", encoding="utf-8") as handle:
        for row in valid_rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    axolotl_config = {
        "base_model": "unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit",
        "load_in_4bit": True,
        "chat_template": "chatml",
        "datasets": [
            {"path": str(TRAIN_PATH), "type": "chat_template"},
        ],
        "val_set_size": 0,
        "output_dir": "./outputs/innercircle-lora",
        "adapter": "lora",
        "lora_r": 16,
        "lora_alpha": 32,
        "lora_dropout": 0.05,
        "sequence_len": 2048,
        "sample_packing": False,
        "micro_batch_size": 2,
        "gradient_accumulation_steps": 4,
        "num_epochs": 3,
        "learning_rate": 0.0002,
        "optimizer": "paged_adamw_8bit",
        "bf16": "auto",
    }
    with CONFIG_PATH.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(axolotl_config, handle, sort_keys=False)

    manifest = {
        "dataset_version": DATASET_VERSION,
        "train_examples": len(train_rows),
        "valid_examples": len(valid_rows),
        "production_readiness": "ready_for_real_finetune" if len(rows) >= 1000 else "scaffold_only_more_data_needed",
        "system_prompt": BASE_SYSTEM_PROMPT,
        "recommended_base_model": "Meta-Llama-3.1-8B-Instruct",
        "recommended_frameworks": ["Axolotl", "Unsloth"],
        "paths": {
            "train": str(TRAIN_PATH),
            "valid": str(VALID_PATH),
            "config": str(CONFIG_PATH),
            "script": str(SCRIPT_PATH),
        },
    }
    with MANIFEST_PATH.open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)

    script = f'''from datasets import load_dataset\nfrom unsloth import FastLanguageModel\n\nMODEL_NAME = "unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit"\nTRAIN_PATH = r"{TRAIN_PATH}"\nVALID_PATH = r"{VALID_PATH}"\n\nmodel, tokenizer = FastLanguageModel.from_pretrained(\n    model_name=MODEL_NAME,\n    max_seq_length=2048,\n    load_in_4bit=True,\n)\n\nmodel = FastLanguageModel.get_peft_model(\n    model,\n    r=16,\n    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],\n    lora_alpha=32,\n    lora_dropout=0.05,\n)\n\ntrain_dataset = load_dataset("json", data_files=TRAIN_PATH, split="train")\nvalid_dataset = load_dataset("json", data_files=VALID_PATH, split="train")\n\nprint("Train examples:", len(train_dataset))\nprint("Valid examples:", len(valid_dataset))\nprint("Next: plug into SFTTrainer or Unsloth trainer in Colab/GPU.")\n'''
    with SCRIPT_PATH.open("w", encoding="utf-8") as handle:
        handle.write(script)

    _write_dataset(rows)
    return {
        "status": "exported",
        "train_examples": len(train_rows),
        "valid_examples": len(valid_rows),
        "train_path": str(TRAIN_PATH),
        "valid_path": str(VALID_PATH),
        "config_path": str(CONFIG_PATH),
        "script_path": str(SCRIPT_PATH),
    }