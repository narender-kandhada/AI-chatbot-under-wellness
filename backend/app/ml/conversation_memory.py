"""
Conversation Memory — Session-based in-memory chat history.

Stores the last N messages per session so the response engine
can reference what was said earlier in the conversation.
"""
import time
from typing import Optional
from collections import defaultdict

# In-memory storage: session_id → list of messages
_sessions: dict[str, list[dict]] = defaultdict(list)
_session_timestamps: dict[str, float] = {}

MAX_HISTORY = 20          # Keep last 20 messages per session
SESSION_TTL = 3600 * 2    # 2 hours before session expires


def add_message(session_id: str, role: str, text: str, emotion: str = "", **extra):
    """Store a message in the session history."""
    _sessions[session_id].append({
        "role": role,       # "user" or "ai"
        "text": text,
        "emotion": emotion,
        "timestamp": time.time(),
        **extra,
    })
    # Trim to max history
    if len(_sessions[session_id]) > MAX_HISTORY:
        _sessions[session_id] = _sessions[session_id][-MAX_HISTORY:]
    _session_timestamps[session_id] = time.time()


def get_history(session_id: str) -> list[dict]:
    """Get all messages in a session."""
    _cleanup_expired()
    return list(_sessions.get(session_id, []))


def get_last_n(session_id: str, n: int = 6) -> list[dict]:
    """Get last N messages for context window."""
    return get_history(session_id)[-n:]


def get_last_user_messages(session_id: str, n: int = 3) -> list[str]:
    """Get text of last N user messages."""
    history = get_history(session_id)
    return [m["text"] for m in history if m["role"] == "user"][-n:]


def get_last_ai_message(session_id: str) -> Optional[str]:
    """Get the most recent AI response."""
    history = get_history(session_id)
    for msg in reversed(history):
        if msg["role"] == "ai":
            return msg["text"]
    return None


def get_conversation_length(session_id: str) -> int:
    """How many messages in this session."""
    return len(_sessions.get(session_id, []))


def _cleanup_expired():
    """Remove sessions older than TTL."""
    now = time.time()
    expired = [sid for sid, ts in _session_timestamps.items() if now - ts > SESSION_TTL]
    for sid in expired:
        _sessions.pop(sid, None)
        _session_timestamps.pop(sid, None)
