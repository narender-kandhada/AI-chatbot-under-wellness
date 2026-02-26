"""
Chat API Endpoint — 3-Tier AI Router.

Routes messages through:
  1. Gemini (online, best quality) — handles messages when quota is available
  2. Ollama (local LLM, free, unlimited) — handles messages when Gemini is exhausted
  3. Empathetic Templates (offline, instant) — always-on safety net

Training Data Collection (Phase 2):
  Every Gemini/Ollama response is silently saved to SQLite for future fine-tuning.
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
from app.ml.ollama_service import generate_reply as ollama_reply, is_available as ollama_available
from app.ml.training_collector import save_response

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
    history = memory.get_history(session_id)
    if not history and payload.history:
        history = [{"role": msg.role, "text": msg.text} for msg in payload.history]

    # Store user message in memory
    memory.add_message(session_id, "user", raw_message, emotion)

    # ─── Tier 1: Smart Template Engine (fast, always offline) ─────
    # Gets a fallback reply + knows whether this needs an LLM
    reply, actions, needs_llm = decide_response(
        emotion=emotion,
        situation=situation,
        user_message=raw_message,
        history=history,
    )
    source = "smart_templates"

    # ─── Tier 2: Gemini (best quality, rate-limited) ──────────────
    if needs_llm and gemini_available():
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

    # ─── Tier 3: Ollama (local LLM, free, unlimited) ─────────────
    if needs_llm and source == "smart_templates" and ollama_available():
        ollama_response = ollama_reply(
            history=history,
            user_message=raw_message,
            emotion=emotion,
            confidence=confidence,
            situation=situation,
        )
        if ollama_response:
            reply = ollama_response
            source = "ollama"

    # ─── Phase 2: Save training data (Gemini + Ollama only) ───────
    if source in ("gemini", "ollama"):
        save_response(
            session_id=session_id,
            user_message=raw_message,
            ai_response=reply,
            emotion=emotion,
            situation=situation,
            source=source,
            confidence=confidence,
        )

    # Store AI response in memory
    memory.add_message(session_id, "ai", reply, emotion)

    # ─── Terminal Logging ─────────────────────────────────────────
    conv_len = memory.get_conversation_length(session_id)
    tier_icon = {"gemini": "🌐", "ollama": "🦙", "smart_templates": "📝"}.get(source, "❓")
    logger.info("=" * 60)
    logger.info(f"📩 USER:       {raw_message}")
    logger.info(f"💭 SENTIMENT:  {sentiment} ({sent_conf:.2f})")
    logger.info(f"🎭 EMOTION:    {emotion} ({confidence:.2f})")
    logger.info(f"📍 SITUATION:  {situation}")
    logger.info(f"🤖 REPLY:      {reply[:100]}{'...' if len(reply) > 100 else ''}")
    logger.info(f"{tier_icon} SOURCE:     {source}")
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
