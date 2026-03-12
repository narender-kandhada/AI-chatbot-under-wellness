"""
Training Data Collector — Phase 2 of the AI Improvement Roadmap.

Silently saves high-quality AI responses (from Groq or Ollama) to SQLite.
These become the training dataset for Phase 3 (fine-tuning with LoRA on Colab).

Only saves responses from "groq" or "ollama" sources — NOT templates.
Templates are rule-based and shouldn't be used to train a neural model.

Database location: backend/training_data.db
"""
import sqlite3
import time
import logging
import os

logger = logging.getLogger("uvicorn.error")

# ─── Database path ────────────────────────────────────────────────────
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "training_data.db")
DB_PATH = os.path.normpath(DB_PATH)

# ─── Only collect from these sources (not templates) ─────────────────
COLLECTABLE_SOURCES = {"groq", "ollama"}

_collector_state = {"db_initialized": False}


def _init_db():
    """Create the SQLite database and table if they don't exist."""
    if _collector_state["db_initialized"]:
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS training_pairs (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp       REAL    NOT NULL,
                session_id      TEXT    NOT NULL,
                user_message    TEXT    NOT NULL,
                ai_response     TEXT    NOT NULL,
                emotion         TEXT    NOT NULL,
                situation       TEXT    NOT NULL,
                source          TEXT    NOT NULL,
                confidence      REAL    NOT NULL,
                msg_length      INTEGER NOT NULL
            )
        """)
        # Index for fast queries during fine-tuning export
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_source ON training_pairs(source)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_emotion ON training_pairs(emotion)
        """)
        conn.commit()
        conn.close()
        _collector_state["db_initialized"] = True
        logger.info("📚 Training collector ready: %s", DB_PATH)
    except (sqlite3.Error, OSError) as exc:
        logger.warning("⚠️ Training collector init failed: %s", exc)


def save_response(
    session_id: str,
    user_message: str,
    ai_response: str,
    emotion: str,
    situation: str,
    source: str,
    confidence: float,
):
    """
    Save a high-quality AI response for future fine-tuning.

    Only saves if source is 'groq' or 'ollama'.
    Silently ignores template responses.
    """
    if source not in COLLECTABLE_SOURCES:
        return  # Only collect LLM responses

    if not user_message.strip() or not ai_response.strip():
        return  # Skip empty

    _init_db()

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO training_pairs
                (timestamp, session_id, user_message, ai_response, emotion, situation, source, confidence, msg_length)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            time.time(),
            session_id,
            user_message.strip(),
            ai_response.strip(),
            emotion,
            situation,
            source,
            confidence,
            len(user_message.split()),
        ))
        conn.commit()
        conn.close()
        logger.info(
            "📚 Training pair saved [%s] emotion=%s (%s total)",
            source,
            emotion,
            cursor.lastrowid,
        )
    except (sqlite3.Error, OSError) as exc:
        logger.warning("⚠️ Training collector save failed: %s", exc)


def get_stats() -> dict:
    """Get collection statistics — useful for monitoring progress."""
    _init_db()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM training_pairs")
        total = cursor.fetchone()[0]

        cursor.execute("SELECT source, COUNT(*) FROM training_pairs GROUP BY source")
        by_source = dict(cursor.fetchall())

        cursor.execute("SELECT emotion, COUNT(*) FROM training_pairs GROUP BY emotion ORDER BY COUNT(*) DESC")
        by_emotion = dict(cursor.fetchall())

        conn.close()
        return {"total": total, "by_source": by_source, "by_emotion": by_emotion}
    except sqlite3.Error:
        return {"total": 0, "by_source": {}, "by_emotion": {}}


def export_jsonl(output_path: str = "training_data.jsonl"):
    """
    Export training pairs as JSONL for fine-tuning.

    Format compatible with LoRA fine-tuning (Alpaca/ChatML style):
    {"messages": [{"role": "system", "content": "..."}, {"role": "user", ...}, {"role": "assistant", ...}]}
    """
    import json

    SYSTEM = """You are InnerCircle, a warm and empathetic wellness companion. Respond like a supportive friend."""

    _init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT user_message, ai_response FROM training_pairs ORDER BY timestamp")
    rows = cursor.fetchall()
    conn.close()

    with open(output_path, "w", encoding="utf-8") as f:
        for user_msg, ai_resp in rows:
            record = {
                "messages": [
                    {"role": "system", "content": SYSTEM},
                    {"role": "user", "content": user_msg},
                    {"role": "assistant", "content": ai_resp},
                ]
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    logger.info("📤 Exported %s training pairs to %s", len(rows), output_path)
    return len(rows)
