"""
Chat API Endpoint — Groq-powered AI Chat.

Routes messages through:
    1. Groq (primary hosted AI engine for chat responses)
    2. OpenRouter (cloud LLM fallback when Groq is rate-limited)
    3. Ollama (local LLM fallback for development)
    4. Empathetic Templates (offline safety net)

Training Data Collection:
    Every LLM response is silently saved to SQLite for future fine-tuning.
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
from app.ml.groq_service import generate_reply as groq_reply, is_available as groq_available
from app.ml.openrouter_service import generate_reply as openrouter_reply, is_available as openrouter_available
from app.ml.ollama_service import generate_reply as ollama_reply, is_available as ollama_available
from app.ml.training_collector import save_response
from app.core.config import settings

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

    # ─── Tier 1: Template fallback (always ready) ──────────────────
    # Gets a fallback reply in case Groq is unavailable
    reply, actions, _ = decide_response(
        emotion=emotion,
        situation=situation,
        user_message=raw_message,
        history=history,
    )
    source = "smart_templates"

    # ─── Tier 2: Groq (primary chat engine) ───────────────────────
    if groq_available():
        groq_response = groq_reply(
            history=history,
            user_message=raw_message,
            emotion=emotion,
            confidence=confidence,
            situation=situation,
        )
        if groq_response:
            reply = groq_response
            source = "groq"

    # ─── Tier 3: OpenRouter (cloud fallback) ──────────────────────
    if source == "smart_templates" and openrouter_available():
        openrouter_response = openrouter_reply(
            history=history,
            user_message=raw_message,
            emotion=emotion,
            confidence=confidence,
            situation=situation,
        )
        if openrouter_response:
            reply = openrouter_response
            source = "openrouter"

    # ─── Tier 4: Ollama (local dev fallback) ─────────────────────
    if source == "smart_templates" and ollama_available():
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

    # ─── Save training data (LLM responses only) ────────────────
    if source in ("groq", "openrouter", "ollama"):
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
    tier_icon = {"groq": "⚡", "openrouter": "🌐", "ollama": "🦙", "smart_templates": "📝"}.get(source, "❓")
    reply_preview = reply[:100] + ("..." if len(reply) > 100 else "")
    logger.info("=" * 60)
    logger.info("📩 USER:       %s", raw_message)
    logger.info("💭 SENTIMENT:  %s (%.2f)", sentiment, sent_conf)
    logger.info("🎭 EMOTION:    %s (%.2f)", emotion, confidence)
    logger.info("📍 SITUATION:  %s", situation)
    logger.info("🤖 REPLY:      %s", reply_preview)
    logger.info("%s SOURCE:     %s", tier_icon, source)
    logger.info("📝 SESSION:    %s... (%s msgs)", session_id[:8], conv_len)
    logger.info("⚡ ACTIONS:    %s", actions)
    logger.info("=" * 60)

    return ChatResponse(
        reply=reply,
        emotion=emotion,
        confidence=confidence,
        actions=actions,
        source=source,
    )
