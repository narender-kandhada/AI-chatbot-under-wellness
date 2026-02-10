from pydantic import BaseModel

class EmotionRequest(BaseModel):
    text: str

class EmotionResponse(BaseModel):
    sentiment: str
    emotion: str
    confidence: float
