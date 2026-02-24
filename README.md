# 🧠 InnerCircle — AI Wellness Companion

A modern, emotionally-intelligent wellness companion app with ML-powered emotion detection, empathetic responses, and crisis support.

> **⚠️ Disclaimer:** InnerCircle is not a therapist or medical tool. It is a supportive companion that listens with empathy. If you need professional help, please reach out to a licensed mental health professional.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Mood Check-In** | Emoji-based mood selector with 6 emotions |
| **AI Companion Chat** | Empathetic, context-aware responses powered by ML |
| **Emotion Detection** | Real-time sentiment + emotion analysis (8 categories) |
| **Safety Monitoring** | Crisis language detection with support resources |
| **Reflection & Suggestions** | Personalized self-care recommendations |
| **Privacy-First** | Local data, no tracking, incognito mode available |
| **Crisis Support** | Dedicated screen with helpline resources |

## 🏗️ Architecture

```
┌──────────────────────────────┐
│      Frontend (Expo/RN)      │
│  React Native + TypeScript   │
│  Expo Router · LinearGradient│
│  Glossy UI · Animations      │
└──────────┬───────────────────┘
           │ REST API (HTTP)
           │ /chat  /emotion/analyze  /safety/check
┌──────────▼───────────────────┐
│      Backend (FastAPI)       │
│  Sentiment Model (TF-IDF)   │
│  Emotion Engine (8 emotions) │
│  Situation Detector (8 types)│
│  Decision Engine (contextual)│
│  Safety Check (crisis flags) │
└──────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native (Expo SDK 54), TypeScript, Expo Router |
| **UI** | LinearGradient, Animated API, Glassmorphism, Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, Uvicorn |
| **ML** | scikit-learn (TF-IDF + LinearSVC), keyword scoring engines |
| **Tunnel** | ngrok (for mobile ↔ local backend) |

## 📂 Project Structure

```
AI-chatbot-under-wellness/
├── frontend/               # React Native (Expo) mobile app
│   ├── app/                # Screens (Expo Router)
│   ├── components/         # Reusable UI components
│   ├── constants/          # Theme, colors, design tokens
│   ├── services/           # API service layer
│   └── .env                # API URL configuration
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/            # REST endpoints (chat, emotion, safety)
│   │   ├── ml/             # ML models + decision engine
│   │   ├── schemas/        # Pydantic request/response models
│   │   └── core/           # Config
│   └── requirements.txt
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Expo Go app (on your phone)
- ngrok (for mobile testing)

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
# → Running on http://127.0.0.1:8000
```

### 2. Tunnel (for mobile)

```bash
ngrok http 8000
# Copy the https://xxxxx.ngrok-free.dev URL
```

### 3. Frontend

```bash
cd frontend
npm install

# Update .env with your ngrok URL
# EXPO_PUBLIC_API_URL=https://xxxxx.ngrok-free.dev

npx expo start -c
# Scan QR code with Expo Go
```

## 🎨 Design

- **Light theme:** Vivid purple (`#7C5CFC`) + pink + coral accents on soft lavender background
- **Dark theme:** Deep indigo (`#0E0A1E`) + bright lavender + neon pink
- **Glossy finish:** Semi-transparent highlight overlays on all surfaces
- **Animations:** Pulsing icons, bounce effects, fade/slide transitions, glowing buttons
- **Glass effects:** Translucent tab bar, frosted disclaimer boxes

## 🤖 ML Pipeline

1. **Preprocessing** — Lowercase, remove URLs/numbers/punctuation
2. **Sentiment Analysis** — TF-IDF + LinearSVC trained on mental health dataset (31MB, multi-class)
3. **Emotion Detection** — Keyword scoring engine: `happy`, `sad`, `anxious`, `angry`, `tired`, `lonely`, `calm`, `hopeful`
4. **Situation Detection** — Keyword scoring: `academic_stress`, `work_stress`, `relationship_issues`, `loneliness`, `grief`, `financial_stress`, `health_anxiety`, `general`
5. **Decision Engine** — 5 contextual response variants per emotion + situation follow-ups
6. **Safety Check** — Crisis flags: `self_harm`, `hopelessness`, `isolation`, `substance`, `crisis`

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Send message → get reply + emotion + actions |
| `POST` | `/emotion/analyze` | Analyze text → sentiment + emotion + confidence |
| `POST` | `/safety/check` | Check text → risk level + flags + recommendation |
| `GET` | `/` | Health check |

## ⚖️ Ethical Considerations

- Clear boundaries — not therapy, not medical advice
- Crisis resources prominently displayed
- No data collection or sharing
- Respectful, non-judgmental language throughout
- User controls all data (delete, incognito mode)

## 📄 License

This project is for educational purposes.
