# InnerCircle — AI Wellness Companion

A mental wellness companion app with an Expo (React Native) mobile frontend and a FastAPI + ML backend.  
Chat uses local ML analysis with Groq as the primary hosted model and Ollama as a local fallback.

> **Disclaimer:** InnerCircle is not medical advice or therapy. If someone is in crisis, direct them to local emergency services and licensed professionals.

## Features

- Emotion-aware chat with contextual AI responses
- Sentiment & emotion analysis (ML pipeline)
- Safety risk detection with actionable recommendations
- Voice UX — speech-to-text input + text-to-speech replies
- Live voice mode (full-screen continuous conversation)
- Breathing exercises, guided meditation, journaling
- Dataset generation & LoRA export for fine-tuning

## Architecture

```
Frontend (Expo / React Native)
    ↓ HTTP
Backend (FastAPI)
    → ML pipeline (TF-IDF sentiment + keyword emotion/situation)
    → Decision engine
        ├── Simple messages → Smart templates (instant)
        └── Complex messages → Groq LLM (contextual)
    → Ollama fallback (local)
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Expo 54, React Native, TypeScript |
| Backend | Python 3.12, FastAPI, Uvicorn |
| ML | scikit-learn, TF-IDF + LinearSVC |
| Hosted AI | Groq (`llama-3.3-70b-versatile`) |
| Local AI | Ollama (fallback) |

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS / Linux
pip install -r requirements.txt

# Create .env
echo GROQ_API_KEY=your_key_here > .env

python -m uvicorn app.main:app --reload
# → http://127.0.0.1:8000/docs
```

### Frontend

```bash
cd frontend
npm install

# Create .env pointing to backend
echo EXPO_PUBLIC_API_URL=http://localhost:8000 > .env

# Build dev client (required for native modules)
npx expo run:android

# Subsequent launches
npx expo start -c --dev-client
```

> Use a **dev build**, not Expo Go — native modules like `expo-speech-recognition` require compilation.

### Tunnel (physical device testing)

```bash
ngrok http 8000
# Then set EXPO_PUBLIC_API_URL to the ngrok URL
```

## Deployment

### Backend → Railway

```bash
cd backend
# Install Railway CLI, then:
railway login
railway init
railway up
# Set env vars: GROQ_API_KEY, ENV=production
```

Config: [backend/railway.json](backend/railway.json) + [backend/Dockerfile](backend/Dockerfile)

### Backend → Fly.io (alternative)

```bash
cd backend
fly launch
fly deploy
fly secrets set GROQ_API_KEY=your_key
```

Config: [backend/fly.toml](backend/fly.toml)

### Frontend → EAS Build (mobile)

```bash
cd frontend
npx eas login
npx eas build --platform android --profile preview
```

### Frontend → Web (Vercel / Netlify)

```bash
cd frontend
npx expo export --platform web
# Deploy the dist/ folder
```

## Environment Variables

| Variable | Where | Required | Description |
|----------|-------|----------|-------------|
| `GROQ_API_KEY` | Backend | Yes | Groq API key |
| `OPENROUTER_API_KEY` | Backend | No | OpenRouter API key |
| `ENV` | Backend | No | `development` or `production` |
| `PORT` | Backend | No | Server port (default: 8000) |
| `EXPO_PUBLIC_API_URL` | Frontend | Yes | Backend URL |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| POST | `/chat/` | Send message, get AI reply |
| POST | `/emotion/analyze` | Analyze text emotion/sentiment |
| POST | `/safety/check` | Check text for safety risks |
| GET | `/training/temp/status` | Temp training status |
| POST | `/training/temp/generate` | Generate synthetic QA pairs |
| POST | `/training/temp/build` | Build temp retrieval model |
| POST | `/training/temp/respond` | Query temp model |
| GET | `/training/production/status` | Production dataset status |
| POST | `/training/production/generate` | Generate production dataset |
| POST | `/training/production/clean` | Clean dataset |
| POST | `/training/production/evaluate` | Evaluate dataset quality |
| POST | `/training/production/export-lora` | Export LoRA training files |

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── core/         # Config & logging
│   │   ├── ml/           # ML models, services, training
│   │   ├── schemas/      # Pydantic request/response models
│   │   └── storage/      # Database layer
│   ├── production_training/  # LoRA export & datasets
│   ├── temp_training/        # Quick local training loop
│   ├── Dockerfile
│   ├── railway.json
│   ├── fly.toml
│   └── requirements.txt
├── frontend/
│   ├── app/              # Expo Router screens
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom hooks (voice, etc.)
│   ├── services/         # API service layer
│   ├── constants/        # Theme & design tokens
│   └── package.json
└── README.md
```

## License

Educational project.
