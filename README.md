# 🧠 InnerCircle — AI Wellness Companion

InnerCircle is a wellness companion app with an Expo mobile frontend and a FastAPI backend.
The chat stack uses local ML analysis, Groq as the primary hosted model, and Ollama as fallback.

> ⚠️ Disclaimer: InnerCircle is not medical advice or therapy. If someone is in crisis, direct them to local emergency services and licensed professionals.

## ✨ Core Features

- Emotion-aware chat (`/chat`) with contextual responses
- Emotion and sentiment analysis (`/emotion/analyze`)
- Safety risk checks (`/safety/check`)
- Voice UX in frontend (STT/TTS + live overlay)
- Temporary and production dataset training workflows in backend

## 🏗️ Architecture

```
Frontend (Expo/React Native)
    -> HTTP API (ngrok/local)
Backend (FastAPI)
    -> ML pipeline (sentiment + emotion + situation)
    -> Decision engine
    -> Groq primary model
    -> Ollama fallback model
```

## 🛠️ Tech Stack

- Frontend: Expo + React Native + TypeScript
- Backend: Python 3.11+, FastAPI, Uvicorn
- ML: scikit-learn + keyword-based emotion/situation scoring
- Hosted AI: Groq (OpenAI-compatible API)
- Local fallback: Ollama

## 🚀 Quick Start

### 1) Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# backend/.env
GROQ_API_KEY=your_new_key_here

python -m uvicorn app.main:app --reload
```

### 2) Tunnel (if testing on physical device)

```bash
ngrok http 8000
```

### 3) Frontend

```bash
cd frontend
npm install

# frontend/.env
EXPO_PUBLIC_API_URL=https://<your-ngrok-url>

npx expo run:android
npx expo start -c --dev-client
```

## 🧪 Training APIs

### Temporary training
- `GET /training/temp/status`
- `POST /training/temp/generate`
- `POST /training/temp/build`
- `POST /training/temp/respond`

### Production training
- `GET /training/production/status`
- `POST /training/production/generate`
- `POST /training/production/clean`
- `POST /training/production/evaluate`
- `POST /training/production/export-lora`

Main artifacts are written under `backend/production_training/`.

## 📄 License

Educational project.
