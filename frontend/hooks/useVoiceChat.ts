import { useState, useCallback, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';

// ─── Safe imports for native-only modules ───────────────────────────────────
// expo-speech-recognition requires a custom dev build (native module).
// In Expo Go this module doesn't exist, so we fall back to no-op stubs
// so the rest of the app can still load and run.

let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: (event: string, cb: (e?: any) => void) => void =
    () => { };

try {
    const mod = require('expo-speech-recognition');
    ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch {
    console.warn(
        '[useVoiceChat] expo-speech-recognition native module not available. ' +
        'Voice input requires a development build. Falling back to text-only mode.'
    );
}

const isSpeechAvailable = !!ExpoSpeechRecognitionModule;

export type LiveState = 'idle' | 'listening' | 'processing' | 'speaking';

export function useVoiceChat() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(true);

    // ─── Live Mode ──────────────────────────────────────────────────────
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [liveState, setLiveState] = useState<LiveState>('idle');

    // Refs to avoid stale closures in callbacks
    const isLiveModeRef = useRef(false);
    const liveStateRef = useRef<LiveState>('idle');
    const transcriptRef = useRef('');

    useEffect(() => { isLiveModeRef.current = isLiveMode; }, [isLiveMode]);
    useEffect(() => { liveStateRef.current = liveState; }, [liveState]);
    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

    // ─── STT Events ─────────────────────────────────────────────────────
    useSpeechRecognitionEvent('start', () => {
        setIsListening(true);
        setTranscript('');
        if (isLiveModeRef.current) setLiveState('listening');
    });

    useSpeechRecognitionEvent('end', () => {
        setIsListening(false);
        if (isLiveModeRef.current && liveStateRef.current === 'listening') {
            if (transcriptRef.current.trim()) {
                setLiveState('processing');
            } else {
                setTimeout(() => {
                    if (isLiveModeRef.current) startListeningLive();
                }, 400);
            }
        }
    });

    useSpeechRecognitionEvent('result', (event: any) => {
        const text = event?.results?.[0]?.transcript || '';
        setTranscript(text);

        if (isLiveModeRef.current && liveStateRef.current === 'listening') {
            const isFinal = event?.isFinal ?? event?.results?.[0]?.isFinal;
            if (isFinal && text.trim()) {
                try { ExpoSpeechRecognitionModule?.stop(); } catch { }
                setLiveState('processing');
            }
        }
    });

    useSpeechRecognitionEvent('error', (event: any) => {
        console.warn('STT error:', event?.error);
        setIsListening(false);
        if (isLiveModeRef.current) {
            setTimeout(() => {
                if (isLiveModeRef.current) startListeningLive();
            }, 1000);
        }
    });

    // ─── Core Audio Functions ───────────────────────────────────────────

    const startListeningInternal = useCallback(async () => {
        if (!isSpeechAvailable) {
            console.warn('[useVoiceChat] Speech recognition not available (Expo Go). Use a dev build.');
            return;
        }
        const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!granted) return;
        try {
            ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: true,
                continuous: false,
            });
        } catch (e) {
            console.warn('Start listening error:', e);
        }
    }, []);

    const startListeningLive = useCallback(async () => {
        if (!isSpeechAvailable) return;
        const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!granted) return;
        try {
            ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: true,
                continuous: true,
            });
        } catch (e) {
            console.warn('Start listening (live) error:', e);
        }
    }, []);

    const startListening = useCallback(async () => {
        await startListeningInternal();
    }, [startListeningInternal]);

    const stopListening = useCallback(() => {
        try { ExpoSpeechRecognitionModule?.stop(); } catch { }
        setIsListening(false);
    }, []);

    const stripEmoji = (text: string) =>
        text.replace(
            /[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu,
            ''
        ).trim();

    const speak = useCallback((text: string) => {
        const clean = stripEmoji(text);
        if (!clean) { console.log('TTS: empty after emoji strip'); return; }

        console.log('TTS: speaking →', clean.substring(0, 60));
        try { Speech.stop(); } catch { }
        setIsSpeaking(true);
        if (isLiveModeRef.current) setLiveState('speaking');

        try {
            Speech.speak(clean, {
                language: 'en-US',
                pitch: 1.0,
                rate: 0.95,
                onStart: () => console.log('TTS: playback started'),
                onDone: () => {
                    console.log('TTS: done');
                    setIsSpeaking(false);
                    if (isLiveModeRef.current) {
                        setTimeout(() => {
                            if (isLiveModeRef.current) startListeningLive();
                        }, 600);
                    }
                },
                onStopped: () => { console.log('TTS: stopped'); setIsSpeaking(false); },
            });
        } catch (e) {
            console.warn('TTS: Speech.speak failed', e);
            setIsSpeaking(false);
        }
    }, [startListeningLive]);

    const stopSpeaking = useCallback(() => {
        Speech.stop();
        setIsSpeaking(false);
    }, []);

    const toggleTTS = useCallback(() => setTtsEnabled((p) => !p), []);

    // ─── Live Session ───────────────────────────────────────────────────
    const startLiveSession = useCallback(async () => {
        if (!isSpeechAvailable) {
            console.warn('[useVoiceChat] Live session requires a dev build with expo-speech-recognition.');
            return;
        }
        Speech.stop();
        setIsLiveMode(true);
        isLiveModeRef.current = true;
        setLiveState('listening');
        liveStateRef.current = 'listening';
        setTranscript('');
        transcriptRef.current = '';
        await startListeningLive();
    }, [startListeningLive]);

    const endLiveSession = useCallback(() => {
        setIsLiveMode(false);
        isLiveModeRef.current = false;
        setLiveState('idle');
        liveStateRef.current = 'idle';
        stopListening();
        stopSpeaking();
        setTranscript('');
        transcriptRef.current = '';
    }, [stopListening, stopSpeaking]);

    // ─── Cleanup ────────────────────────────────────────────────────────
    useEffect(() => () => {
        try { ExpoSpeechRecognitionModule?.stop(); } catch { }
        Speech.stop();
    }, []);

    return {
        isListening, transcript, isSpeaking, ttsEnabled,
        isLiveMode, liveState,
        // Expose availability so the UI can show/hide mic buttons gracefully
        isSpeechAvailable,
        startListening, stopListening, speak, stopSpeaking, toggleTTS,
        startLiveSession, endLiveSession,
    };
}
