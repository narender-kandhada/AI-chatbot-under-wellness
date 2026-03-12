# InnerCircle Frontend

React Native (Expo) mobile app with voice input/output, live voice sessions, and full backend integration.

## Setup

```bash
npm install

# Configure backend URL
echo EXPO_PUBLIC_API_URL=http://localhost:8000 > .env

# First time: build dev client (native modules require compilation)
npx expo run:android

# Subsequent launches
npx expo start -c --dev-client
```

> **Important:** Use a dev build, NOT Expo Go. Native modules (`expo-speech-recognition`) require compilation.

## Structure

```
app/
├── (tabs)/
│   ├── _layout.tsx         # Glass tab bar with dot indicators
│   ├── index.tsx           # Check-In (mood selector + emotion API)
│   ├── privacy.tsx         # Privacy & Trust
│   └── crisis.tsx          # Crisis Support + helplines
├── _layout.tsx             # Root Stack navigator
├── welcome.tsx             # Onboarding (animated)
├── chat.tsx                # AI Chat + Voice + Live Mode
├── journal.tsx             # Saved conversations
├── breathing.tsx           # Breathing exercises
└── meditation.tsx          # Guided meditation

components/
├── LiveOverlay.tsx          # Full-screen live voice overlay
├── ChatBubble.tsx           # Message bubbles with TTS speaker button
├── AmbientBackground.tsx    # Animated calm background
├── MoodSelector.tsx         # Mood grid with bounce animation
├── Button.tsx               # Gradient button + glossy overlay
└── Card.tsx                 # Glossy card with accent strip

hooks/
└── useVoiceChat.ts          # STT/TTS + Live session state machine

services/
├── companion.service.ts     # POST /chat
├── emotion.service.ts       # POST /emotion/analyze
├── safety.service.ts        # POST /safety/check
└── storage.service.ts       # SQLite database (moods, chats, journal)

constants/
└── theme.ts                 # Design system (colors, spacing, typography)
```

## Voice Features

### Quick Mic (STT)
- Tap mic button → white modal → speak → auto-sends as text
- Uses `expo-speech-recognition` (on-device STT)

### Live Mode
- Tap live button → full-screen dark overlay with animated waveform
- **States:** listening → processing → speaking → listening (auto-loop)
- Continuous STT — messages sync to chat history when session ends

### TTS
- Toggle in header (enabled by default)
- AI replies auto-read aloud via `expo-speech`
- Tap speaker on any AI bubble to re-hear

## Design System

| | Light | Dark |
|---|---|---|
| **Primary** | `#6B8E6E` (sage green) | `#8FB996` |
| **Background** | `#F7F5F0` (warm cream) | `#1A1A1A` |
| **Surface** | `#FFFFFF` | `#2A2A2A` |

### Live Overlay
- Background: `#060612` (near-black blue)
- Waveform: Blue → Teal → Cyan animated blobs
- End button: Red (`#D32F2F`)

## Backend Integration

| Screen | API Calls |
|--------|-----------|
| Chat | `POST /chat/` + `POST /safety/check` (parallel) |
| Chat (Live) | Same endpoints via HTTP |
| Check-In | `POST /emotion/analyze` |

## Deployment

### EAS Build (Android/iOS)

```bash
npx eas login
npx eas build --platform android --profile preview
```

### Web Export (Vercel / Netlify)

```bash
npx expo export --platform web
# Deploy dist/ folder to your static host
```

Set `EXPO_PUBLIC_API_URL` to your deployed backend URL before building.
| **Check-In** | `POST /emotion/analyze` |
| **Reflection** | `POST /emotion/analyze` |

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL (via ngrok) | `https://xxx.ngrok-free.dev` |

## 📋 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo-speech-recognition` | On-device Speech-to-Text |
| `expo-speech` | Text-to-Speech playback |
| `expo-sqlite` | Local SQLite database |
| `expo-camera` | Camera access |
| `lucide-react-native` | Icon library |
| `react-native-reanimated` | Smooth animations |
