"""
Gemini Booster — Used ONLY for complex/deep emotional messages (~20%).

Rate-limited to stay within free tier. Falls back to template engine
if rate limit is hit or API fails.
"""
import time
import logging
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

# Lazy import — don't crash if google-generativeai isn't installed
genai = None


# ─── Rate Limiter ────────────────────────────────────────────────────
_call_timestamps: list[float] = []
MAX_CALLS_PER_MINUTE = 12   # Free tier allows 15, we stay under
MAX_CALLS_PER_DAY = 1000    # Free tier allows 1500
_daily_count = 0
_daily_reset = time.time()

# ─── Gemini Model ────────────────────────────────────────────────────
_model = None
_initialized = False


SYSTEM_PROMPT = """You are InnerCircle, a warm and supportive wellness companion.

RULES:
- Speak like a kind friend, NOT a therapist
- Keep responses SHORT (2-3 sentences max)
- Reference what the user ACTUALLY said — no generic replies
- Ask natural follow-up questions
- Use gentle emojis sparingly (💚, 🌿, 😊)
- NEVER provide medical diagnosis
- Be warm, genuine, and human-like
- If they share something happy, celebrate WITH them
- If they're sad, acknowledge and sit with them — don't rush to fix

The user's emotional state: {emotion} ({confidence:.0%} confidence)
Situation: {situation}"""


def _init_model():
    """Initialize Gemini model (lazy, once)."""
    global _model, _initialized, genai
    if _initialized:
        return _model

    _initialized = True

    # Try to import google-generativeai
    if genai is None:
        try:
            import google.generativeai as _genai
            genai = _genai
        except ImportError:
            logger.info("ℹ️ google-generativeai not installed — using templates only")
            logger.info("   To enable Gemini: pip install google-generativeai")
            return None

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        logger.info("ℹ️ No Gemini API key configured — using templates only")
        return None

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _model = genai.GenerativeModel(
            "gemini-2.0-flash",
            generation_config=genai.GenerationConfig(
                temperature=0.85,
                max_output_tokens=150,
                top_p=0.9,
            ),
        )
        logger.info("✅ Gemini booster initialized (will handle ~20% of messages)")
    except Exception as e:
        logger.warning(f"⚠️ Gemini init failed: {e}")
        _model = None

    return _model



def _check_rate_limit() -> bool:
    """Check if we're within rate limits."""
    global _daily_count, _daily_reset

    now = time.time()

    # Reset daily counter
    if now - _daily_reset > 86400:
        _daily_count = 0
        _daily_reset = now

    if _daily_count >= MAX_CALLS_PER_DAY:
        return False

    # Per-minute limiting
    _call_timestamps[:] = [t for t in _call_timestamps if now - t < 60]
    if len(_call_timestamps) >= MAX_CALLS_PER_MINUTE:
        return False

    return True


def is_available() -> bool:
    """Check if Gemini is configured and within rate limits."""
    model = _init_model()
    return model is not None and _check_rate_limit()


def generate_reply(
    history: list[dict],
    user_message: str,
    emotion: str,
    confidence: float,
    situation: str,
) -> str | None:
    """
    Generate a contextual reply using Gemini.

    Returns None if unavailable or fails (caller should use template fallback).
    """
    global _daily_count

    model = _init_model()
    if model is None or not _check_rate_limit():
        return None

    try:
        # Build system prompt
        system = SYSTEM_PROMPT.format(
            emotion=emotion, confidence=confidence, situation=situation
        )

        # Build conversation for Gemini
        gemini_history = []
        for msg in history[-8:]:
            role = "user" if msg.get("role") == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg.get("text", "")]})

        chat = model.start_chat(history=gemini_history)

        # First message includes system prompt context
        if not gemini_history:
            prompt = f"{system}\n\nUser: {user_message}"
        else:
            prompt = user_message

        response = chat.send_message(prompt)
        reply = response.text.strip()

        # Safety: cap length
        if len(reply) > 400:
            reply = reply[:397] + "..."

        # Track rate
        _call_timestamps.append(time.time())
        _daily_count += 1

        logger.info(f"🧠 Gemini used ({_daily_count} today, {len(_call_timestamps)}/min)")
        return reply

    except Exception as e:
        logger.warning(f"⚠️ Gemini failed: {e}")
        return None
