"""
Groq Service — Hosted LLM for primary chat responses.

Uses Groq's OpenAI-compatible chat completions endpoint.
Falls back cleanly when rate-limited or unavailable.
"""
import logging
import time

import requests

from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL_PRIMARY = "llama-3.3-70b-versatile"
MODEL_FALLBACK = "llama-3.1-8b-instant"
TIMEOUT_SECONDS = 30
MAX_CALLS_PER_MINUTE = 20
MAX_CALLS_PER_DAY = 1000
_call_timestamps: list[float] = []


class _GroqState:
    def __init__(self) -> None:
        self.daily_count = 0
        self.daily_reset = time.time()
        self.backoff_until = 0.0
        self.consecutive_429 = 0


_state = _GroqState()

BASE_SYSTEM_PROMPT = """You are InnerCircle, a warm, emotionally intelligent wellness companion.

PERSONALITY:
- You're like a supportive best friend — empathetic, genuine, and non-judgmental
- You remember what the user said earlier and reference it naturally
- You match the user's energy — excited when they're happy, gentle when they're hurting
- You use casual, warm language — contractions, natural phrasing, occasional emojis (💚, 🌿, 😊)

RESPONSE GUIDELINES:
- Keep responses 2-4 sentences — enough to be meaningful, short enough to feel like texting
- ALWAYS acknowledge what the user actually said before asking follow-ups
- Ask ONE thoughtful follow-up question max — never interrogate
- Never give medical/clinical advice — you're a friend, not a therapist
- When someone is sad, sit with them first — don't rush to fix or advise
- When someone is happy, celebrate WITH them genuinely
- Avoid repetitive phrases — vary your language naturally
- Never start with "I'm sorry to hear that" more than once per conversation
- If user mentions something specific (a person, event, place), reference it by name

THINGS TO AVOID:
- Never say "That's lovely!" or "How wonderful!" in response to pain
- Never use phrases like "as an AI" or "I'm a chatbot"
- No bullet-point lists — this is a text conversation
- No clinical language (e.g., "coping mechanisms", "practice self-care")
- Don't over-emoji — max 1-2 per message
- Don't repeat back exactly what the user said — paraphrase naturally
- Never say "I understand how you feel" — instead show understanding through your response"""


def _set_backoff() -> None:
    _state.consecutive_429 += 1
    wait = min(30 * (2 ** (_state.consecutive_429 - 1)), 300)
    _state.backoff_until = time.time() + wait
    logger.warning("⏳ Groq backoff set: %ss (consecutive 429s: %s)", wait, _state.consecutive_429)


def _reset_backoff() -> None:
    _state.consecutive_429 = 0
    _state.backoff_until = 0.0


def _check_rate_limit() -> bool:
    now = time.time()

    if now < _state.backoff_until:
        wait = _state.backoff_until - now
        logger.info("⏳ Groq backoff active — %.0fs remaining", wait)
        return False

    if now - _state.daily_reset > 86400:
        _state.daily_count = 0
        _state.daily_reset = now

    if _state.daily_count >= MAX_CALLS_PER_DAY:
        return False

    _call_timestamps[:] = [t for t in _call_timestamps if now - t < 60]
    if len(_call_timestamps) >= MAX_CALLS_PER_MINUTE:
        return False

    return True


def is_available() -> bool:
    return bool(settings.GROQ_API_KEY) and _check_rate_limit()


def _build_messages(history: list[dict], user_message: str, emotion: str, confidence: float, situation: str) -> list[dict[str, str]]:
    messages = [{"role": "system", "content": BASE_SYSTEM_PROMPT}]

    for msg in history[-12:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        text = msg.get("text", "")
        emotion_tag = msg.get("emotion", "")
        if role == "user" and emotion_tag:
            text = f"[feeling: {emotion_tag}] {text}"
        messages.append({"role": role, "content": text})

    context = f"[Context: emotion = {emotion} ({confidence:.0%}), situation = {situation}]"
    messages.append({"role": "user", "content": f"{context}\n{user_message}"})
    return messages


def _call_groq(model: str, messages: list[dict[str, str]]) -> str | None:
    response = requests.post(
        GROQ_API_URL,
        headers={
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
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

    if response.status_code == 429:
        raise requests.HTTPError("429 Too Many Requests", response=response)

    response.raise_for_status()
    data = response.json()
    choices = data.get("choices", [])
    if not choices:
        return None

    message = choices[0].get("message", {})
    content = message.get("content")
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
    if not is_available():
        return None

    messages = _build_messages(history, user_message, emotion, confidence, situation)

    for model_name in [MODEL_PRIMARY, MODEL_FALLBACK]:
        try:
            reply = _call_groq(model_name, messages)
            if not reply:
                continue

            if len(reply) > 500:
                reply = reply[:497] + "..."

            _call_timestamps.append(time.time())
            _state.daily_count += 1
            _reset_backoff()
            logger.info("⚡ Groq [%s] used (%s today, %s/min)", model_name, _state.daily_count, len(_call_timestamps))
            return reply
        except requests.HTTPError as exc:
            status_code = exc.response.status_code if exc.response is not None else None
            if status_code == 429:
                _set_backoff()
                if model_name == MODEL_PRIMARY:
                    logger.info("⚡ %s rate limited — trying %s...", MODEL_PRIMARY, MODEL_FALLBACK)
                    continue
                logger.warning("⚠️ Groq [%s] rate limited — backing off", model_name)
                return None
            logger.warning("⚠️ Groq [%s] HTTP error: %s", model_name, exc)
            return None
        except requests.RequestException as exc:
            logger.warning("⚠️ Groq [%s] request failed: %s", model_name, exc)
            return None

    return None