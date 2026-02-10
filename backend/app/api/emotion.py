from fastapi import APIRouter
from app.schemas.emotion import EmotionRequest, EmotionResponse
from app.ml.preprocessing import clean_text
from app.ml.sentiment_model import predict_sentiment
from app.ml.emotion_model import predict_emotion

router = APIRouter()

@router.post("/analyze", response_model=EmotionResponse)
def analyze(payload: EmotionRequest):
    text = clean_text(payload.text)
    sentiment, _ = predict_sentiment(text)
    emotion, confidence = predict_emotion(text)

    return EmotionResponse(
        sentiment=sentiment,
        emotion=emotion,
        confidence=confidence
    )
