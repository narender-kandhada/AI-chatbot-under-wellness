# 🐍 InnerCircle Backend

FastAPI backend with ML-powered emotion detection, sentiment analysis, and contextual response generation.

## 🚀 Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn app.main:app --reload
# → http://127.0.0.1:8000
# → Docs: http://127.0.0.1:8000/docs
```

## 📂 Structure

```
app/
├── api/
│   ├── chat.py             # POST /chat — main conversation endpoint
│   ├── emotion.py          # POST /emotion/analyze — emotion analysis
│   └── safety.py           # POST /safety/check — crisis detection
├── ml/
│   ├── preprocessing.py    # Text cleaning (lowercase, remove URLs/punct)
│   ├── sentiment_model.py  # TF-IDF + LinearSVC sentiment classifier
│   ├── emotion_model.py    # Keyword scoring engine (8 emotions)
│   ├── situation_model.py  # Keyword scoring engine (8 situations)
│   ├── decision_engine.py  # Contextual response generator
│   ├── models/
│   │   └── sentiment.pkl   # Trained sentiment model
│   ├── data/
│   │   ├── mental_health_dataset.csv  # 31MB training dataset
│   │   └── sentiment_dataset.csv      # Small sentiment samples
│   └── train/
│       └── train_sentiment.py         # Model training script
├── schemas/
│   ├── chat.py             # ChatRequest / ChatResponse
│   └── emotion.py          # EmotionRequest / EmotionResponse
├── core/
│   └── config.py           # App settings
└── main.py                 # FastAPI app + CORS middleware
```

## 🤖 ML Models

### Sentiment Analysis
- **Type:** TF-IDF vectorizer + LinearSVC classifier
- **Training data:** `mental_health_dataset.csv` (31MB, labeled mental health statements)
- **Output:** `positive` / `negative` + confidence score
- **Training:** `python -m app.ml.train.train_sentiment`

### Emotion Detection
- **Type:** Keyword + pattern scoring engine
- **Emotions:** `happy`, `sad`, `anxious`, `angry`, `tired`, `lonely`, `calm`, `hopeful`
- **Method:** 30+ weighted keywords per emotion, multi-word phrases score 2x
- **Fallback:** Returns `calm` (0.35 confidence) when no keywords match

### Situation Detection
- **Type:** Keyword scoring engine
- **Situations:** `academic_stress`, `work_stress`, `relationship_issues`, `loneliness`, `grief`, `financial_stress`, `health_anxiety`, `general`
- **Method:** 25+ keywords per situation, highest score wins

### Decision Engine
- **5 response variants** per emotion (randomly selected for variety)
- **Situation follow-ups** appended 60% of the time
- **Action suggestions** per emotion (breathing, journaling, grounding, etc.)

### Safety Check
- **5 flag categories:** `self_harm`, `hopelessness`, `isolation`, `substance`, `crisis`
- **Risk levels:** `low` → `medium` → `high`
- **Escalation:** Any self-harm or crisis flag → high risk; 2+ flags → high risk

## 📡 API Reference

### `POST /chat`
```json
// Request
{ "message": "I feel anxious about my exam", "mood": "anxious" }

// Response
{
  "reply": "I can understand why that would make you feel anxious...",
  "emotion": "anxious",
  "confidence": 0.45,
  "actions": ["breathing", "grounding", "meditation"]
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

## 📊 Terminal Logging

All endpoints log to the terminal for easy debugging:

```
============================================================
📩 USER:       I feel anxious about my exam
🧹 CLEANED:    i feel anxious about my exam
💭 SENTIMENT:  negative (0.82)
🎭 EMOTION:    anxious (0.45)
📍 SITUATION:  academic_stress
🤖 REPLY:      I can understand why that would make you feel...
⚡ ACTIONS:    ['breathing', 'grounding', 'meditation']
============================================================
🛡️ SAFETY CHECK: 'I feel anxious about my exam' → risk=low, flags=[]
```

## 🔧 Environment

- Python 3.11+
- CORS enabled for all origins (configure for production)
- Auto-reload on file changes with `--reload` flag
