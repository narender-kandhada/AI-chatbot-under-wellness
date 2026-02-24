from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, emotion, safety
from app.core.config import settings

app = FastAPI(
    title="InnerCircle Backend",
    version="1.0.0"
)

# ─── CORS Middleware ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(emotion.router, prefix="/emotion", tags=["Emotion"])
app.include_router(safety.router, prefix="/safety", tags=["Safety"])

@app.get("/")
def health_check():
    return {
        "status": "running",
        "app": "InnerCircle",
        "environment": settings.ENV
    }
