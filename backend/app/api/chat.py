from fastapi import APIRouter
from app.schemas.chat import ChatRequest, ChatResponse
from app.ml.preprocessing import clean_text
from app.ml.sentiment_model import predict_sentiment
from app.ml.emotion_model import predict_emotion
from app.ml.situation_model import detect_situation
from app.ml.decision_engine import decide_response

router = APIRouter()

@router.post("/", response_model=ChatResponse)
def chat(payload: ChatRequest):
    text = clean_text(payload.message)

    sentiment, _ = predict_sentiment(text)
    emotion, confidence = predict_emotion(text)
    situation = detect_situation(text)

    reply, actions = decide_response(emotion, situation)

    return ChatResponse(
        reply=reply,
        emotion=emotion,
        confidence=confidence,
        actions=actions
    )
