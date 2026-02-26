"""
Gemini Booster — Uses the new google.genai SDK.

Rate-limited to stay within free tier. Falls back to template engine
if rate limit is hit or API fails.
"""
import time
import logging
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")


# ─── Rate Limiter ────────────────────────────────────────────────────
_call_timestamps: list[float] = []
MAX_CALLS_PER_MINUTE = 12   # Free tier allows 15, we stay under
MAX_CALLS_PER_DAY = 1000    # Free tier limit
_daily_count = 0
_daily_reset = time.time()

# ─── Gemini Models ───────────────────────────────────────────────────
_client = None
_initialized = False
MODEL_PRIMARY = "gemini-2.0-flash"
MODEL_FALLBACK = "gemini-2.0-flash-lite"

# ─── System Prompt ───────────────────────────────────────────────────

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

CONVERSATION FLOW:
- First message: warm, acknowledge their feeling, ask what's going on
- Follow-ups: reference what they said, go deeper, show you're listening
- If they share something big: pause, validate, don't rush past it
- Short replies ("yeah", "ok"): gently invite them to share more without pressure

THINGS TO AVOID:
- Never say "That's lovely!" or "How wonderful!" in response to pain
- Never use phrases like "as an AI" or "I'm a chatbot"
- No bullet-point lists — this is a text conversation
- No clinical language (e.g., "coping mechanisms", "practice self-care")
- Don't over-emoji — max 1-2 per message
- Don't repeat back exactly what the user said — paraphrase naturally
- Never say "I understand how you feel" — instead show understanding through your response"""


def _init_client():
    """Initialize Gemini client (lazy, once)."""
    global _client, _initialized

    if _initialized:
        return _client

    _initialized = True

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        logger.info("ℹ️ No Gemini API key configured — using templates only")
        return None

    try:
        from google import genai
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
        logger.info(f"✅ Gemini client initialized ({MODEL_PRIMARY} + {MODEL_FALLBACK} fallback)")
    except ImportError:
        logger.info("ℹ️ google-genai not installed — using templates only")
        logger.info("   To enable Gemini: pip install google-genai")
        _client = None
    except Exception as e:
        logger.warning(f"⚠️ Gemini init failed: {e}")
        _client = None

    return _client


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
    client = _init_client()
    return client is not None and _check_rate_limit()


def _build_contents(history: list[dict], user_message: str, emotion: str, confidence: float, situation: str) -> list:
    """Build the contents list for the Gemini API call."""
    from google.genai import types

    contents = []

    # Add conversation history (last 12 messages)
    for msg in history[-12:]:
        role = "user" if msg.get("role") == "user" else "model"
        text = msg.get("text", "")
        # Tag user messages with emotion for context tracking
        emotion_tag = msg.get("emotion", "")
        if role == "user" and emotion_tag:
            text = f"[feeling: {emotion_tag}] {text}"
        contents.append(types.Content(role=role, parts=[types.Part(text=text)]))

    # Add current message with emotion context
    context = f"[Context: emotion = {emotion} ({confidence:.0%}), situation = {situation}]"
    prompt = f"{context}\n{user_message}"
    contents.append(types.Content(role="user", parts=[types.Part(text=prompt)]))

    return contents


def generate_reply(
    history: list[dict],
    user_message: str,
    emotion: str,
    confidence: float,
    situation: str,
) -> str | None:
    """
    Generate a contextual reply using Gemini.

    Tries primary model first, falls back to lite on quota errors.
    Returns None if both fail — caller should use template fallback.
    """
    global _daily_count

    client = _init_client()
    if client is None or not _check_rate_limit():
        return None

    try:
        from google.genai import types
    except ImportError:
        return None

    contents = _build_contents(history, user_message, emotion, confidence, situation)

    config = types.GenerateContentConfig(
        system_instruction=BASE_SYSTEM_PROMPT,
        temperature=0.8,
        max_output_tokens=300,
        top_p=0.92,
    )

    models_to_try = [MODEL_PRIMARY, MODEL_FALLBACK]

    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config,
            )
            reply = response.text.strip() if response.text else None

            if not reply:
                continue

            # Safety: cap length
            if len(reply) > 500:
                reply = reply[:497] + "..."

            # Track rate
            _call_timestamps.append(time.time())
            _daily_count += 1

            logger.info(f"🧠 Gemini [{model_name}] used ({_daily_count} today, {len(_call_timestamps)}/min)")
            return reply

        except Exception as e:
            error_str = str(e)
            is_quota = "429" in error_str or "ResourceExhausted" in error_str or "quota" in error_str.lower()

            if is_quota and model_name == MODEL_PRIMARY:
                logger.info(f"⚡ {MODEL_PRIMARY} quota hit — trying {MODEL_FALLBACK}...")
                continue

            logger.warning(f"⚠️ Gemini [{model_name}] failed: {e}")
            return None

    logger.warning("⚠️ All Gemini models quota exhausted — using templates")
    return None
