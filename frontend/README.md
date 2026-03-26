# InnerCircle Frontend

React Native (Expo) mobile app with chat, voice input/output, live voice sessions, and backend integration.

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

> Use a dev build (not Expo Go). `expo-speech-recognition` requires native compilation.

## Voice Behavior

- **STT (mic/live mode):** `expo-speech-recognition`
- **TTS (AI reply playback):** on-device `expo-speech`
- Header speaker toggle enables/disables auto-read of AI replies
- AI message bubbles include a replay speaker icon

## Key UX Notes

- **Insights → Export My Data** now generates a **PDF** and opens share/print flow
- **Crisis → Reach out to someone I trust** opens SMS composer flow

## Structure

```text
app/
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── insights.tsx
│   ├── crisis.tsx
│   ├── privacy.tsx
│   └── notifications.tsx
├── _layout.tsx
├── chat.tsx
├── journal.tsx
├── breathing.tsx
├── meditation.tsx
└── reflection.tsx

components/
├── ChatBubble.tsx
├── LiveOverlay.tsx
├── AmbientBackground.tsx
├── Button.tsx
└── Card.tsx

hooks/
└── useVoiceChat.ts

services/
├── companion.service.ts
├── emotion.service.ts
├── safety.service.ts
├── storage.service.ts
└── storage.service.web.ts
```

## Environment

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Yes | Backend base URL |
| `EXPO_PUBLIC_TTS_STRATEGY` | No | `full` (default) or `fast` |
| `EXPO_PUBLIC_TTS_MAX_CHARS` | No | Max chars per spoken chunk (used by `full` chunking and `fast` truncation) |

## Key Dependencies

- `expo-router`
- `expo-speech`
- `expo-speech-recognition`
- `expo-sqlite`
- `expo-print`
- `expo-sharing`
- `lucide-react-native`
