from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    message: str
    mood: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    emotion: str
    confidence: float
    actions: List[str] = []
