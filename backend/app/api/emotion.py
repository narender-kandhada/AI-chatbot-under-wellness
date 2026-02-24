import logging
from fastapi import APIRouter
from app.schemas.emotion import EmotionRequest, EmotionResponse
from app.ml.preprocessing import clean_text
from app.ml.sentiment_model import predict_sentiment
from app.ml.emotion_model import predict_emotion

logger = logging.getLogger("uvicorn.error")

router = APIRouter()

@router.post("/analyze", response_model=EmotionResponse)
def analyze(payload: EmotionRequest):
    text = clean_text(payload.text)
    sentiment, _ = predict_sentiment(text)
    emotion, confidence = predict_emotion(text)

    logger.info(f"🔬 EMOTION ANALYZE: '{payload.text[:80]}' → {emotion} ({confidence:.2f}), sentiment={sentiment}")

    return EmotionResponse(
        sentiment=sentiment,
        emotion=emotion,
        confidence=confidence
    )
