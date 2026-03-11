# 🧠 InnerCircle — AI Wellness Companion

A modern, emotionally-intelligent wellness companion app with ML-powered emotion detection, Gemini AI-powered responses, voice input/output, and an immersive Gemini Live-style voice experience.

> **⚠️ Disclaimer:** InnerCircle is not a therapist or medical tool. It is a supportive companion that listens with empathy. If you need professional help, please reach out to a licensed mental health professional.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Mood Check-In** | Emoji-based mood selector with 6 emotions |
| **AI Companion Chat** | Empathetic, context-aware responses (Gemini + ML hybrid) |
| **🎙️ Voice Input (STT)** | Tap mic to speak — auto-sends as text |
| **🔊 Voice Output (TTS)** | AI reads replies aloud (toggle on/off) |
| **📡 Live Mode** | Full-screen Gemini Live-style voice experience with animated waveform |
| **Emotion Detection** | Real-time sentiment + emotion analysis (8 categories) |
| **Safety Monitoring** | Crisis language detection with support resources |
| **Journal & Reflection** | Save conversations, get personalized insights |
| **🔔 Local Notifications** | Privacy-preserving daily check-ins, mindful nudges, and streak reminders |
| **SQLite Storage** | On-device database for moods, chats, journal entries |
| **Privacy-First** | Local data, no tracking, no cloud storage |

## 🏗️ Architecture

```
┌──────────────────────────────┐
│      Frontend (Expo/RN)      │
│  React Native + TypeScript   │
│  Expo Router · expo-speech   │
│  expo-speech-recognition     │
│  Live Mode · Animated Waves  │
└──────────┬───────────────────┘
           │ REST API (HTTP via ngrok)
           │ /chat  /emotion/analyze  /safety/check
┌──────────▼───────────────────┐
│      Backend (FastAPI)       │
│  Sentiment Model (TF-IDF)   │
│  Emotion Engine (8 emotions) │
│  Decision Engine → Gemini    │
│  Gemini Booster (contextual) │
│  Safety Check (crisis flags) │
└──────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native (Expo SDK 54), TypeScript, Expo Router |
| **UI** | LinearGradient, Animated API, Glassmorphism, Lucide Icons |
| **Voice** | `expo-speech-recognition` (STT), `expo-speech` (TTS) |
| **Notifications** | `expo-notifications` (Local Push Notifications) |
| **Storage** | `expo-sqlite` (on-device database) |
| **Backend** | Python 3.11+, FastAPI, Uvicorn |
| **ML** | scikit-learn (TF-IDF + LinearSVC), keyword scoring engines |
| **AI** | Gemini 2.0 Flash (contextual responses, rate-limited) |
| **Tunnel** | ngrok (for mobile ↔ local backend) |

## 📂 Project Structure

```
AI-chatbot-under-wellness/
├── frontend/               # React Native (Expo) mobile app
│   ├── app/                # Screens (Expo Router)
│   │   ├── chat.tsx        # AI Chat + Live mode integration
│   │   └── ...
│   ├── components/
│   │   ├── LiveOverlay.tsx  # Full-screen Gemini Live-style UI
│   │   ├── ChatBubble.tsx   # Message bubbles with TTS
│   │   └── ...
│   ├── hooks/
│   │   └── useVoiceChat.ts  # STT/TTS + Live session state machine
│   ├── services/           # API service layer
│   └── .env                # EXPO_PUBLIC_API_URL
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/            # REST endpoints (chat, emotion, safety)
│   │   ├── ml/             # ML models + Gemini service + decision engine
│   │   ├── schemas/        # Pydantic models
│   │   └── core/           # Config
│   ├── .env                # GEMINI_API_KEY
│   └── requirements.txt
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Android device/emulator (dev build, not Expo Go)
- ngrok (for mobile ↔ backend tunnel)
- Gemini API key ([get one free](https://aistudio.google.com/apikey))

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Create .env
echo GEMINI_API_KEY=your_key_here > .env

# Start server
python -m uvicorn app.main:app --reload
# → http://127.0.0.1:8000
```

### 2. Tunnel (for mobile)

```bash
.\ngrok.exe http 8000
# Copy the https://xxxxx.ngrok-free.dev URL
```

### 3. Frontend

```bash
cd frontend
npm install

# Create .env with your ngrok URL
echo EXPO_PUBLIC_API_URL=https://xxxxx.ngrok-free.dev > .env

# First time: build native dev client (required for STT/TT

# Subsequent runs: just start Metro
npx expo start -c --dev-client
```

> **Note:** You MUST use a dev build (`npx expo run:android`), not Expo Go, because `expo-speech-recognition` and `expo-notifications` require native modules.

## 🔔 Notification Features

### Daily Check-In
A subtle reminder containing a daily wellness quote. It schedules dynamically based on user-set times. 

### Mindful Moments
Periodic nudges occurring every N hours (e.g. 2h, 4h, 8h) reminding users to breathe.

### Streak Saver
An evening lifeline nudge at 8:00 PM ensuring users don’t lose their check-in streak.

## 🎙️ Voice Features

### Quick Mic (STT → Text)
Tap the 🎤 mic button when text input is empty → speak → transcript auto-sends as text message.

### Live Mode (Gemini Live-style)
Tap the 📡 Live button → full-screen dark overlay with animated waveform:
- **Listening** → gentle blue glow, live transcript
- **Processing** → "Thinking..." caption  
- **Speaking** → energetic pulsing waveform, AI reply as caption
- **Auto-loop** → after AI speaks, auto-restarts listening
- **End** → tap red ✕, all messages sync to chat history

### TTS Toggle
Tap 🔊 speaker icon in header to enable/disable auto-read of AI replies.

## 🤖 ML + AI Pipeline

1. **Preprocessing** — Lowercase, remove URLs/numbers/punctuation
2. **Sentiment Analysis** — TF-IDF + LinearSVC (multi-class)
3. **Emotion Detection** — Keyword scoring: 8 emotions
4. **Situation Detection** — Keyword scoring: 8 situations
5. **Decision Engine** — Routes to Gemini for contextual responses, templates for greetings
6. **Gemini Booster** — Gemini 2.0 Flash for natural, context-aware replies
7. **Safety Check** — Crisis flags with helpline resources

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat/` | Send message → reply + emotion + actions |
| `POST` | `/emotion/analyze` | Analyze text → sentiment + emotion |
| `POST` | `/safety/check` | Check text → risk level + flags |
| `GET` | `/` | Health check |

## ⚖️ Ethical Considerations

- Clear boundaries — not therapy, not medical advice
- Crisis resources prominently displayed
- No data collection or sharing
- Respectful, non-judgmental language throughout
- User controls all data (local SQLite, delete anytime)

## 📄 License

This project is for educational purposes.
