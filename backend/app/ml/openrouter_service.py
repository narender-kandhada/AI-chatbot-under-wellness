"""
OpenRouter Service — Cloud LLM fallback when Groq is unavailable.

Replaces local Ollama for production deployment.
Uses OpenRouter's OpenAI-compatible chat completions endpoint.
Free tier: Llama 3.3 70B available at zero cost, no payment required.
Sign up at https://openrouter.ai/ and get a key from https://openrouter.ai/keys
"""
import logging
import time

import requests

from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
# Models tried in order: best quality first, then reliable fallbacks
MODEL_CHAIN = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "google/gemma-3-27b-it:free",
    "nvidia/nemotron-nano-9b-v2:free",
]
TIMEOUT_SECONDS = 30

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


def is_available() -> bool:
    """Check if OpenRouter is configured."""
    return bool(settings.OPENROUTER_API_KEY)


def _call_openrouter(model: str, messages: list[dict[str, str]]) -> str | None:
    response = requests.post(
        OPENROUTER_API_URL,
        headers={
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": messages,
            "temperature": 0.8,
            "max_tokens": 300,
            "top_p": 0.92,
        },
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    data = response.json()
    choices = data.get("choices", [])
    if not choices:
        return None
    content = choices[0].get("message", {}).get("content")
    if not isinstance(content, str):
        return None
    return content.strip() or None


def generate_reply(
    history: list[dict],
    user_message: str,
    emotion: str,
    confidence: float,
    situation: str,
) -> str | None:
    """Generate a reply using OpenRouter. Tries primary model, then fallback."""
    if not is_available():
        return None

    # Build messages
    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]

    for msg in history[-10:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        text = msg.get("text", "")
        emotion_tag = msg.get("emotion", "")
        if role == "user" and emotion_tag:
            text = f"[feeling: {emotion_tag}] {text}"
        messages.append({"role": role, "content": text})

    context = f"[Context: emotion={emotion} ({confidence:.0%}), situation={situation}]"
    messages.append({"role": "user", "content": f"{context}\n{user_message}"})

    for model in MODEL_CHAIN:
        try:
            start = time.time()
            reply = _call_openrouter(model, messages)
            elapsed = time.time() - start

            if reply:
                if len(reply) > 500:
                    reply = reply[:497] + "..."
                logger.info("🌐 OpenRouter [%s] replied in %.1fs", model, elapsed)
                return reply

        except requests.HTTPError as exc:
            status_code = exc.response.status_code if exc.response is not None else None
            if status_code == 429:
                logger.info("⏳ OpenRouter [%s] rate limited — trying next model", model)
                continue
            logger.warning("⚠️ OpenRouter [%s] HTTP error: %s", model, exc)
            continue
        except requests.RequestException as exc:
            logger.warning("⚠️ OpenRouter [%s] request failed: %s", model, exc)
            return None

    return None
