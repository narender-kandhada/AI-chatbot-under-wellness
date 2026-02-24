# 📱 InnerCircle Frontend

React Native (Expo) mobile app with glossy UI, gradient effects, animations, and full backend API integration.

## 🚀 Setup

```bash
npm install

# Configure backend URL
# Edit .env:
# EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.dev

npx expo start -c
# Scan QR with Expo Go (Android/iOS)
```

## 📂 Structure

```
app/
├── (tabs)/
│   ├── _layout.tsx         # Glossy glass tab bar with dot indicators
│   ├── index.tsx           # Check-In screen (mood selector + emotion API)
│   ├── privacy.tsx         # Privacy & Trust screen
│   └── crisis.tsx          # Crisis Support screen
├── _layout.tsx             # Root Stack navigator
├── welcome.tsx             # Onboarding (animated, gradient bg)
├── chat.tsx                # AI Chat (safety check + emotion tags)
└── reflection.tsx          # Reflection (emotion analysis banner)

components/
├── Button.tsx              # Gradient button + glossy overlay + scale animation
├── Card.tsx                # Glossy card with accent strip + sheen
├── ChatBubble.tsx          # Gradient bubbles + shine overlay + slide-in
└── MoodSelector.tsx        # Mood grid with unique colors + bounce

constants/
└── theme.ts                # Design system (colors, gradients, glass tokens)

services/
├── companion.service.ts    # POST /chat — main conversation
├── emotion.service.ts      # POST /emotion/analyze — emotion detection
└── safety.service.ts       # POST /safety/check — crisis detection
```

## 🎨 Design System

### Colors

| | Light | Dark |
|---|---|---|
| **Primary** | `#7C5CFC` (vivid purple) | `#9B7FFF` (bright lavender) |
| **Secondary** | `#E85D9C` (hot pink) | `#FF6BA6` (neon pink) |
| **Background** | `#F5F0FF` (soft purple) | `#0E0A1E` (deep indigo) |
| **Surface** | `#FFFFFF` | `#1A1434` (dark purple) |

### Glossy Effects
Every interactive surface has a semi-transparent white gradient overlay (top 40-50%) creating a polished glass-like shine.

### Animations
- Pulsing heart icon (Welcome)
- Bounce + scale on mood selection
- Fade + slide-in on chat messages
- Glowing send button pulse
- Typing indicator (3 bouncing dots)

## 📡 Backend Integration

| Screen | API Calls |
|--------|-----------|
| **Chat** | `POST /chat` + `POST /safety/check` (parallel) |
| **Check-In** | `POST /emotion/analyze` (on additional thoughts) |
| **Reflection** | `POST /emotion/analyze` (on load) |

### Safety Alert
When `/safety/check` returns `riskLevel: "high"`, a modal appears with:
- Crisis warning message
- Link to Support tab
- "Continue chatting" dismiss option

### Emotion Tags
AI chat responses show a small tag below the bubble:
- 🌊 Feeling anxious
- 😊 Feeling happy
- 💙 Feeling sad
- etc.

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `https://xxx.ngrok-free.dev` |

## 📋 Screens Overview

| Screen | Key Features |
|--------|-------------|
| **Welcome** | Full gradient bg, pulsing heart, staggered fade-in, glass disclaimer |
| **Check-In** | Time-of-day greeting, mood selector, glossy input, emotion API |
| **Chat** | Gradient header, glossy send button, typing dots, safety modal |
| **Reflection** | Emotion banner, colored suggestion cards, gradient icons |
| **Privacy** | Glossy principle cards, colored switch tracks, glass disclaimer |
| **Crisis** | Warm gradient hero, accent resource cards, gradient reminder |
| **Tab Bar** | Translucent glass, active dot indicators, purple shadow |
