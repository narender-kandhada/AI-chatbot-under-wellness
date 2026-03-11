# 🐍 InnerCircle Backend

FastAPI backend with ML-powered emotion detection, Groq chat responses, and contextual response generation.

## 🚀 Setup

```bash
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux

pip install -r requirements.txt

# Create .env with your Groq API key
echo GROQ_API_KEY=your_key_here > .env

# Start server
python -m uvicorn app.main:app --reload
# → http://127.0.0.1:8000
# → Docs: http://127.0.0.1:8000/docs
```

## 📂 Structure

```
app/
├── api/
│   ├── chat.py             # POST /chat — hybrid router (templates + Groq)
│   ├── emotion.py          # POST /emotion/analyze
│   └── safety.py           # POST /safety/check
├── ml/
│   ├── preprocessing.py    # Text cleaning
│   ├── sentiment_model.py  # TF-IDF + LinearSVC classifier
│   ├── emotion_model.py    # Keyword scoring (8 emotions)
│   ├── situation_model.py  # Keyword scoring (8 situations)
│   ├── decision_engine.py  # Smart router → hosted AI or templates
│   ├── groq_service.py     # Groq chat integration
│   ├── conversation_memory.py # Session-based history tracking
│   ├── keyword_extractor.py   # Topic extraction
│   └── models/
│       └── sentiment.pkl   # Trained sentiment model
├── schemas/
│   ├── chat.py             # ChatRequest / ChatResponse
│   └── emotion.py          # EmotionRequest / EmotionResponse
├── core/
│   └── config.py           # Settings (GROQ_API_KEY, etc.)
└── main.py                 # FastAPI app + CORS
```

## 🤖 Hybrid Response System

### Flow
```
User message → ML Pipeline → Decision Engine
                                 ├── Simple (greetings, yes/no) → Templates
                                 └── Complex (>3 words, ongoing chat) → Groq
```

### Decision Engine Routing
| Condition | Route |
|-----------|-------|
| Greetings ("hi", "hey") | Templates (instant) |
| Short affirmations ("yes", "ok") | Templates (instant) |
| Messages >3 words | **Groq** (contextual) |
| Conversation 4+ messages | **Groq** (context-aware) |
| Negative emotion detected | **Groq** (empathetic) |

### Hosted AI
- **Primary:** Groq `llama-3.3-70b-versatile`
- **Fallback model:** Groq `llama-3.1-8b-instant`
- **Backup path:** Ollama local model if Groq is unavailable
- **System prompt:** Warm wellness companion personality

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

## 🔧 Environment

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq API key | Yes |

- Python 3.11+
- CORS enabled for all origins
- Auto-reload with `--reload` flag

## 🧪 Temporary Training Path

The backend now includes a separate temporary training workspace under `backend/temp_training`.

Purpose:
- Generate up to 1000 synthetic question/answer pairs with Ollama.
- Build a fast local retrieval model from those pairs.
- Test responses without touching the main chat pipeline.

Routes:
- `POST /training/temp/generate` to generate synthetic pairs.
- `POST /training/temp/build` to build the temporary retrieval model.
- `POST /training/temp/respond` to query the temporary trained model.
- `GET /training/temp/status` to inspect dataset and model status.

Note:
- This path is a fast local training loop for iteration.
- It is not full LLM fine-tuning.

## 🏭 Production Training Path

The backend now includes a production-oriented dataset workflow under `backend/production_training`.

Purpose:
- Generate higher-quality synthetic examples with richer metadata.
- Evaluate dataset quality before any fine-tuning attempt.
- Export LoRA-ready train/validation files and scaffold configs for Colab or GPU training.

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
