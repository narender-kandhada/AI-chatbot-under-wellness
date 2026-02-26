"""
Ollama Service — Local LLM fallback when Gemini quota is exhausted.

Uses llama3:latest as primary, mistral:latest as fallback.
Runs against local Ollama instance at http://localhost:11434.
Zero cost, zero quota, unlimited requests.
"""
import json
import time
import logging
import urllib.request
import urllib.error

logger = logging.getLogger("uvicorn.error")

# ─── Config ──────────────────────────────────────────────────────────
OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_PRIMARY = "llama3:latest"
MODEL_FALLBACK = "mistral:latest"
TIMEOUT_SECONDS = 30  # Local models can be slow on first load

# ─── System Prompt ───────────────────────────────────────────────────
SYSTEM_PROMPT = """You are InnerCircle, a warm, emotionally intelligent wellness companion.

PERSONALITY:
- You are like a supportive best friend — empathetic, genuine, non-judgmental
- You remember what the user said earlier and reference it naturally
- You match the user's energy — excited when they're happy, gentle when they're hurting
- You use casual, warm language — contractions, natural phrasing, occasional emojis (like a heart or a plant)

RESPONSE GUIDELINES:
- Keep responses 2-4 sentences — short enough to feel like texting, enough to be meaningful
- ALWAYS acknowledge what the user actually said before asking follow-ups
- Ask ONE thoughtful follow-up question max — never interrogate
- When someone is sad, sit with them first — do not rush to fix or advise
- When someone is happy, celebrate WITH them genuinely
- Never give medical or clinical advice

THINGS TO AVOID:
- Never say "as an AI" or "I'm a language model"
- No bullet-point lists in responses
- No clinical language like "coping mechanisms" or "practice self-care"
- Never say "That's lovely!" or "How wonderful!" when the user is expressing pain
- Do not repeat exactly what the user said — paraphrase naturally"""


def _is_ollama_running() -> bool:
    """Quick health check — is Ollama server up?"""
    try:
        req = urllib.request.Request(f"{OLLAMA_BASE_URL}/api/tags")
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status == 200
    except Exception:
        return False


def _call_ollama(model: str, messages: list[dict]) -> str | None:
    """Make an API call to Ollama. Returns reply text or None on failure."""
    payload = json.dumps({
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.8,
            "num_predict": 300,
            "top_p": 0.92,
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{OLLAMA_BASE_URL}/api/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            reply = result.get("message", {}).get("content", "").strip()
            return reply if reply else None
    except urllib.error.URLError as e:
        raise ConnectionError(f"Ollama not reachable: {e}")
    except Exception as e:
        raise RuntimeError(f"Ollama error: {e}")


def is_available() -> bool:
    """Check if Ollama is running and reachable."""
    return _is_ollama_running()


def generate_reply(
    history: list[dict],
    user_message: str,
    emotion: str,
    confidence: float,
    situation: str,
) -> str | None:
    """
    Generate a contextual reply using local Ollama LLM.

    Tries llama3 first, falls back to mistral if llama3 fails.
    Returns None if both fail.
    """
    if not _is_ollama_running():
        logger.info("ℹ️ Ollama not running — skipping local LLM")
        return None

    # Build message history for Ollama
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add conversation history (last 10 messages)
    for msg in history[-10:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        text = msg.get("text", "")
        emotion_tag = msg.get("emotion", "")
        if role == "user" and emotion_tag:
            text = f"[feeling: {emotion_tag}] {text}"
        messages.append({"role": role, "content": text})

    # Add current message with emotion context
    context = f"[Context: emotion={emotion} ({confidence:.0%}), situation={situation}]"
    messages.append({"role": "user", "content": f"{context}\n{user_message}"})

    # Try primary then fallback
    for model in [MODEL_PRIMARY, MODEL_FALLBACK]:
        try:
            start = time.time()
            reply = _call_ollama(model, messages)
            elapsed = time.time() - start

            if reply:
                # Safety: cap length
                if len(reply) > 500:
                    reply = reply[:497] + "..."
                logger.info(f"🦙 Ollama [{model}] replied in {elapsed:.1f}s")
                return reply

        except ConnectionError:
            logger.info("ℹ️ Ollama server not reachable")
            return None
        except Exception as e:
            logger.warning(f"⚠️ Ollama [{model}] failed: {e}")
            if model == MODEL_PRIMARY:
                logger.info(f"⚡ Trying {MODEL_FALLBACK}...")
                continue
            return None

    return None
