"""
Chat API Endpoint — Hybrid Router.

Routes messages through:
1. Smart Template Engine (offline, instant) — handles ~80%
2. Gemini Booster (online, rate-limited) — handles ~20% complex cases

The decision engine signals when a message is too complex for templates.
"""
import uuid
import logging
from fastapi import APIRouter
from app.schemas.chat import ChatRequest, ChatResponse
from app.ml.preprocessing import clean_text
from app.ml.sentiment_model import predict_sentiment
from app.ml.emotion_model import predict_emotion
from app.ml.situation_model import detect_situation
from app.ml.decision_engine import decide_response
from app.ml import conversation_memory as memory
from app.ml.gemini_service import generate_reply as gemini_reply, is_available as gemini_available

logger = logging.getLogger("uvicorn.error")

router = APIRouter()


@router.post("/", response_model=ChatResponse)
def chat(payload: ChatRequest):
    raw_message = payload.message
    text = clean_text(raw_message)
    session_id = payload.session_id or str(uuid.uuid4())

    # ─── ML Pipeline ──────────────────────────────────────────────
    sentiment, sent_conf = predict_sentiment(text)
    emotion, confidence = predict_emotion(text)
    situation = detect_situation(text)

    # ─── Build history from memory + payload ──────────────────────
    # Use server-side memory if available, else use client history
    history = memory.get_history(session_id)
    if not history and payload.history:
        history = [{"role": msg.role, "text": msg.text} for msg in payload.history]

    # Store user message in memory
    memory.add_message(session_id, "user", raw_message, emotion)

    # ─── Smart Template Engine (try first) ────────────────────────
    reply, actions, needs_gemini = decide_response(
        emotion=emotion,
        situation=situation,
        user_message=raw_message,
        history=history,
    )
    source = "smart_templates"

    # ─── Gemini Booster (only for complex messages) ──────────────
    if needs_gemini and gemini_available():
        gemini_response = gemini_reply(
            history=history,
            user_message=raw_message,
            emotion=emotion,
            confidence=confidence,
            situation=situation,
        )
        if gemini_response:
            reply = gemini_response
            source = "gemini"

    # Store AI response in memory
    memory.add_message(session_id, "ai", reply, emotion)

    # ─── Terminal Logging ─────────────────────────────────────────
    conv_len = memory.get_conversation_length(session_id)
    logger.info("=" * 60)
    logger.info(f"📩 USER:       {raw_message}")
    logger.info(f"🧹 CLEANED:    {text}")
    logger.info(f"💭 SENTIMENT:  {sentiment} ({sent_conf:.2f})")
    logger.info(f"🎭 EMOTION:    {emotion} ({confidence:.2f})")
    logger.info(f"📍 SITUATION:  {situation}")
    logger.info(f"🤖 REPLY:      {reply[:100]}{'...' if len(reply) > 100 else ''}")
    logger.info(f"🧠 SOURCE:     {source}")
    logger.info(f"📝 SESSION:    {session_id[:8]}... ({conv_len} msgs)")
    logger.info(f"⚡ ACTIONS:    {actions}")
    logger.info("=" * 60)

    return ChatResponse(
        reply=reply,
        emotion=emotion,
        confidence=confidence,
        actions=actions,
        source=source,
    )
