# 🐍 InnerCircle Backend

FastAPI backend with ML-powered emotion detection, Gemini AI booster, and contextual response generation.

## 🚀 Setup

```bash
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux

pip install -r requirements.txt

# Create .env with your Gemini API key
echo GEMINI_API_KEY=your_key_here > .env

# Start server
python -m uvicorn app.main:app --reload
# → http://127.0.0.1:8000
# → Docs: http://127.0.0.1:8000/docs
```

## 📂 Structure

```
app/
├── api/
│   ├── chat.py             # POST /chat — hybrid router (templates + Gemini)
│   ├── emotion.py          # POST /emotion/analyze
│   └── safety.py           # POST /safety/check
├── ml/
│   ├── preprocessing.py    # Text cleaning
│   ├── sentiment_model.py  # TF-IDF + LinearSVC classifier
│   ├── emotion_model.py    # Keyword scoring (8 emotions)
│   ├── situation_model.py  # Keyword scoring (8 situations)
│   ├── decision_engine.py  # Smart router → Gemini or templates
│   ├── gemini_service.py   # Gemini 2.0 Flash integration
│   ├── conversation_memory.py # Session-based history tracking
│   ├── keyword_extractor.py   # Topic extraction
│   └── models/
│       └── sentiment.pkl   # Trained sentiment model
├── schemas/
│   ├── chat.py             # ChatRequest / ChatResponse
│   └── emotion.py          # EmotionRequest / EmotionResponse
├── core/
│   └── config.py           # Settings (GEMINI_API_KEY, etc.)
└── main.py                 # FastAPI app + CORS
```

## 🤖 Hybrid Response System

### Flow
```
User message → ML Pipeline → Decision Engine
                                 ├── Simple (greetings, yes/no) → Templates
                                 └── Complex (>3 words, ongoing chat) → Gemini
```

### Decision Engine Routing
| Condition | Route |
|-----------|-------|
| Greetings ("hi", "hey") | Templates (instant) |
| Short affirmations ("yes", "ok") | Templates (instant) |
| Messages >3 words | **Gemini** (contextual) |
| Conversation 4+ messages | **Gemini** (context-aware) |
| Negative emotion detected | **Gemini** (empathetic) |

### Gemini Booster
- **Model:** Gemini 2.0 Flash
- **Rate limit:** 12 calls/min, 1000/day (within free tier)
- **System prompt:** Warm wellness companion personality
- **Fallback:** Templates used if Gemini fails/rate-limited

## 📡 API Reference

### `POST /chat/`
```json
// Request
{ "message": "I feel anxious about my exam", "mood": "anxious", "session_id": "abc123" }

// Response
{
  "reply": "I can understand why that would make you feel anxious...",
  "emotion": "anxious",
  "confidence": 0.45,
  "actions": ["breathing", "grounding", "meditation"],
  "source": "gemini"
}
```

### `POST /emotion/analyze`
```json
// Request
{ "text": "I'm really happy today" }

// Response
{ "sentiment": "positive", "emotion": "happy", "confidence": 0.45 }
```

### `POST /safety/check`
```json
// Request
{ "text": "I feel hopeless and alone" }

// Response
{
  "riskLevel": "high",
  "flags": ["hopelessness", "isolation"],
  "recommendation": "You seem to be going through something..."
}
```

## 🔧 Environment

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google AI Studio API key | Yes |

- Python 3.11+
- CORS enabled for all origins
- Auto-reload with `--reload` flag
