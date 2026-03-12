# InnerCircle Backend

FastAPI backend with ML-powered emotion detection, Groq-based chat, and contextual response generation.

## Setup

```bash
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS / Linux

pip install -r requirements.txt

# Create .env
echo GROQ_API_KEY=your_key_here > .env

# Start server
python -m uvicorn app.main:app --reload
# → http://127.0.0.1:8000
# → Docs: http://127.0.0.1:8000/docs
```

## Structure

```
app/
├── api/
│   ├── chat.py             # POST /chat — hybrid router (templates + Groq)
│   ├── emotion.py          # POST /emotion/analyze
│   ├── safety.py           # POST /safety/check
│   └── training.py         # Training endpoints (temp + production)
├── ml/
│   ├── preprocessing.py    # Text cleaning
│   ├── sentiment_model.py  # TF-IDF + LinearSVC classifier
│   ├── emotion_model.py    # Keyword scoring (8 emotions)
│   ├── situation_model.py  # Keyword scoring (8 situations)
│   ├── decision_engine.py  # Smart router → hosted AI or templates
│   ├── groq_service.py     # Groq chat integration
│   ├── openrouter_service.py   # OpenRouter fallback
│   ├── ollama_service.py       # Ollama local fallback
│   ├── conversation_memory.py  # Session-based history
│   ├── keyword_extractor.py    # Topic extraction
│   ├── training_collector.py   # Auto-save quality responses
│   ├── temp_training_service.py        # Quick local training loop
│   ├── production_training_service.py  # Production dataset pipeline
│   ├── train/
│   │   └── train_sentiment.py  # Trains sentiment model from CSV
│   ├── models/
│   │   └── sentiment.pkl       # Trained model (generated)
│   └── data/
│       └── *.csv               # Training datasets
├── schemas/
│   ├── chat.py             # ChatRequest / ChatResponse
│   ├── emotion.py          # EmotionRequest / EmotionResponse
│   └── training.py         # Training schemas
├── core/
│   ├── config.py           # Settings (env vars)
│   └── logging.py          # Logging setup
├── storage/
│   └── database.py         # Database layer
└── main.py                 # FastAPI app + CORS + routers
```

## Hybrid Response System

```
User message → ML Pipeline → Decision Engine
                                 ├── Simple → Templates (instant)
                                 └── Complex → Groq LLM (contextual)
```

| Condition | Route |
|-----------|-------|
| Greetings ("hi", "hey") | Templates (instant) |
| Short affirmations ("yes", "ok") | Templates (instant) |
| Messages >3 words | Groq (contextual) |
| Conversation 4+ messages | Groq (context-aware) |
| Negative emotion detected | Groq (empathetic) |

### AI Models

- **Primary:** Groq `llama-3.3-70b-versatile`
- **Fallback:** Groq `llama-3.1-8b-instant`
- **Local backup:** Ollama (if Groq unavailable)

## API Reference

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
  "source": "groq"
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

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | Yes | — | Groq API key |
| `OPENROUTER_API_KEY` | No | — | OpenRouter API key |
| `ENV` | No | `development` | `development` or `production` |
| `PORT` | No | `8000` | Server port |

## Deployment

### Railway

```bash
railway login
railway init
railway up
# Set env vars in Railway dashboard
```

Uses [railway.json](railway.json) + [Dockerfile](Dockerfile).

### Fly.io

```bash
fly launch
fly deploy
fly secrets set GROQ_API_KEY=your_key ENV=production
```

Uses [fly.toml](fly.toml) + Dockerfile.

## Training Workflows

### Temporary Training

Quick local loop — generates synthetic QA pairs with Ollama and builds a retrieval model.

| Endpoint | Description |
|----------|-------------|
| `GET /training/temp/status` | Dataset & model status |
| `POST /training/temp/generate` | Generate synthetic pairs |
| `POST /training/temp/build` | Build retrieval model |
| `POST /training/temp/respond` | Query temp model |

### Production Training

Higher-quality dataset pipeline with evaluation and LoRA export.

| Endpoint | Description |
|----------|-------------|
| `GET /training/production/status` | Dataset status |
| `POST /training/production/generate` | Generate examples |
| `POST /training/production/clean` | Clean dataset |
| `POST /training/production/evaluate` | Evaluate quality |
| `POST /training/production/export-lora` | Export LoRA files |

Artifacts are written to `production_training/`.

Routes:
- `GET /training/production/status`
- `POST /training/production/generate`
- `POST /training/production/evaluate`
- `POST /training/production/clean`
- `POST /training/production/export-lora`

Current workflow:
1. Generate (`/training/production/generate`)
2. Clean (`/training/production/clean`)
3. Evaluate (`/training/production/evaluate`)
4. Export LoRA scaffold (`/training/production/export-lora`)

Label policy:
- Generation is constrained to canonical emotion/situation labels.
- Cleanup normalizes legacy rows and keeps accepted rows production-ready.

Artifacts:
- `backend/production_training/dataset.jsonl`
- `backend/production_training/evaluation_report.json`
- `backend/production_training/lora_export/train.jsonl`
- `backend/production_training/lora_export/valid.jsonl`
- `backend/production_training/lora_export/axolotl_config.yml`
- `backend/production_training/lora_export/unsloth_train_stub.py`
