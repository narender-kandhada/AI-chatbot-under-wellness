from pydantic import BaseModel
from typing import List, Optional


class HistoryMessage(BaseModel):
    role: str       # "user" or "ai"
    text: str


class ChatRequest(BaseModel):
    message: str
    mood: Optional[str] = None
    session_id: Optional[str] = None
    history: Optional[List[HistoryMessage]] = None


class ChatResponse(BaseModel):
    reply: str
    emotion: str
    confidence: float
    actions: List[str] = []
    source: Optional[str] = None   # "smart_templates" or "gemini"
