# InnerCircle - Wellness Companion App

A modern, calm, and emotionally supportive wellness companion mobile app built with React Native (Expo).

## Overview

InnerCircle is a personal emotional companion (not a therapist) that listens, responds with empathy, and helps users feel understood, safe, and supported. It acts as a caring friend while clearly respecting emotional and ethical boundaries.

## Features

### Screens

1. **Welcome/Onboarding Screen**
   - App introduction with name and tagline
   - Clear disclaimer about the app's purpose
   - Get started call-to-action

2. **Daily Check-In Screen** (Home Tab)
   - Mood selector with emoji-based options (calm, sad, anxious, tired, okay, happy)
   - Optional text input for additional thoughts
   - Emotionally supportive messaging

3. **Companion Chat Screen**
   - Chat-style interface for conversations
   - Empathetic, warm, and non-judgmental AI responses (mocked)
   - Privacy reminder
   - Access to reflection screen

4. **Reflection & Suggestions Screen**
   - Summary of what was heard
   - Gentle suggestions for self-care activities
   - No commands or medical advice
   - Optional language throughout

5. **Privacy & Trust Screen** (Privacy Tab)
   - Clear privacy principles
   - Data ownership statements
   - Settings toggles for conversation history and incognito mode
   - No sharing without consent promise

6. **Crisis Support Screen** (Support Tab)
   - Calm, supportive messaging
   - Quick action buttons to reach out
   - Placeholder support resources
   - Important reminders and emergency information

## Design Principles

- **Minimal & Soothing**: Clean, human-centered design
- **Soft Color Palette**: Pastel blues, lavender, and warm neutrals
- **Rounded Corners**: Gentle shadows and soft edges
- **Friendly Typography**: Large, readable text
- **Dark Mode Support**: Full theme support for light and dark modes
- **Emotionally Safe**: All microcopy is supportive and non-judgmental

## Tech Stack

- React Native (Expo SDK 52)
- TypeScript
- Expo Router (file-based routing)
- Functional components
- Lucide React Native (icons)

## Project Structure

```
├── app/
│   ├── (tabs)/           # Tab navigation group
│   │   ├── _layout.tsx   # Tab bar configuration
│   │   ├── index.tsx     # Check-In screen (Home)
│   │   ├── privacy.tsx   # Privacy & Trust screen
│   │   └── crisis.tsx    # Crisis Support screen
│   ├── _layout.tsx       # Root layout
│   ├── index.tsx         # Initial redirect
│   ├── welcome.tsx       # Onboarding screen
│   ├── chat.tsx          # Companion Chat screen
│   └── reflection.tsx    # Reflection & Suggestions screen
├── components/
│   ├── Button.tsx        # Reusable button component
│   ├── Card.tsx          # Reusable card component
│   ├── ChatBubble.tsx    # Chat message bubble
│   └── MoodSelector.tsx  # Mood selection component
├── constants/
│   └── theme.ts          # Color themes and design tokens
└── hooks/
    └── useFrameworkReady.ts  # Framework initialization hook
```

## Color Palette

### Light Mode
- Background: `#F8F9FB`
- Surface: `#FFFFFF`
- Primary: `#9DB4CE` (Soft blue)
- Secondary: `#C8B6D9` (Lavender)
- Accent: `#E8D5C4` (Warm neutral)

### Dark Mode
- Background: `#1A1F2E`
- Surface: `#252B3B`
- Primary: `#9DB4CE` (Soft blue)
- Secondary: `#B8A5C7` (Lavender)
- Accent: `#D4BCA8` (Warm neutral)

## Running the App

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Type check
npm run typecheck

# Build for web
npm run build:web
```

## Important Notes

- **No Backend**: This is a frontend-only app with mocked data
- **Not Therapy**: Clear disclaimers that this is not a replacement for professional help
- **Privacy-First**: All conversations are local, no data sharing
- **Placeholder Data**: Crisis resources use placeholder numbers

## Ethical Considerations

This app is designed with emotional safety as a priority:
- Clear boundaries about what the app can and cannot do
- No medical advice or therapy claims
- Prominent crisis support resources
- Respectful, non-judgmental language
- User privacy and data control
