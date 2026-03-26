import { useState, useCallback, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';

const TTS_STRATEGY = process.env.EXPO_PUBLIC_TTS_STRATEGY || 'full';
const TTS_MAX_CHARS = Number(process.env.EXPO_PUBLIC_TTS_MAX_CHARS || 260);

const DUPLICATE_SPEAK_WINDOW_MS = 15000;

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
    const speakRequestIdRef = useRef(0);
    const speakInProgressRef = useRef(false);
    const lastSpokenRef = useRef<{ text: string; at: number } | null>(null);
    const speakWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const pickTtsText = (text: string) => {
        if (TTS_STRATEGY === 'full') return text;

        if (text.length <= TTS_MAX_CHARS) return text;

        const firstSentence = text.match(/^[\s\S]{1,400}?[.!?](?:\s|$)/)?.[0]?.trim();
        if (firstSentence && firstSentence.length <= TTS_MAX_CHARS) {
            return firstSentence;
        }

        const cutoff = text.slice(0, TTS_MAX_CHARS);
        const lastPause = Math.max(
            cutoff.lastIndexOf('. '),
            cutoff.lastIndexOf('! '),
            cutoff.lastIndexOf('? '),
            cutoff.lastIndexOf(', ')
        );

        if (lastPause > 80) return cutoff.slice(0, lastPause + 1).trim();
        return cutoff.trim();
    };

    const splitForSpeech = (text: string, maxChars: number) => {
        const chunks: string[] = [];
        let cursor = 0;

        while (cursor < text.length) {
            const remaining = text.length - cursor;
            if (remaining <= maxChars) {
                const tail = text.slice(cursor).trim();
                if (tail) chunks.push(tail);
                break;
            }

            const windowText = text.slice(cursor, cursor + maxChars);
            const punctuationBreak = Math.max(
                windowText.lastIndexOf('. '),
                windowText.lastIndexOf('! '),
                windowText.lastIndexOf('? '),
                windowText.lastIndexOf('; '),
                windowText.lastIndexOf(': '),
                windowText.lastIndexOf(', ')
            );
            const spaceBreak = windowText.lastIndexOf(' ');

            let end = cursor + maxChars;
            if (punctuationBreak > 80) {
                end = cursor + punctuationBreak + 1;
            } else if (spaceBreak > 80) {
                end = cursor + spaceBreak;
            }

            const part = text.slice(cursor, end).trim();
            if (part) chunks.push(part);
            cursor = end;
        }

        return chunks;
    };

    const speak = useCallback((text: string) => {
        if (speakInProgressRef.current) {
            console.log('TTS: ignored (already speaking or generating)');
            return;
        }

        const clean = stripEmoji(text);
        if (!clean) { console.log('TTS: empty after emoji strip'); return; }
        const ttsTexts = TTS_STRATEGY === 'fast'
            ? [pickTtsText(clean)]
            : splitForSpeech(clean, TTS_MAX_CHARS);
        const dedupeText = ttsTexts.join(' ');

        const now = Date.now();
        if (
            lastSpokenRef.current &&
            lastSpokenRef.current.text === dedupeText &&
            now - lastSpokenRef.current.at < DUPLICATE_SPEAK_WINDOW_MS
        ) {
            console.log('TTS: ignored duplicate text window');
            return;
        }

        speakInProgressRef.current = true;
        lastSpokenRef.current = { text: dedupeText, at: now };

        console.log('TTS: speaking →', dedupeText.substring(0, 60));
        setIsSpeaking(true);
        if (isLiveModeRef.current) setLiveState('speaking');

        const requestId = ++speakRequestIdRef.current;

        const finishSpeaking = () => {
            if (requestId !== speakRequestIdRef.current) return;
            if (speakWatchdogRef.current) {
                clearTimeout(speakWatchdogRef.current);
                speakWatchdogRef.current = null;
            }
            setIsSpeaking(false);
            speakInProgressRef.current = false;
        };

        void (async () => {
            try {
                await Speech.stop();
            } catch { }

            if (requestId !== speakRequestIdRef.current) return;

            const speakChunkAt = (index: number) => {
                if (requestId !== speakRequestIdRef.current) return;

                const nextText = ttsTexts[index];
                if (!nextText) {
                    finishSpeaking();
                    if (isLiveModeRef.current) {
                        setTimeout(() => {
                            if (isLiveModeRef.current) startListeningLive();
                        }, 600);
                    }
                    return;
                }

                if (speakWatchdogRef.current) {
                    clearTimeout(speakWatchdogRef.current);
                }
                speakWatchdogRef.current = setTimeout(() => {
                    finishSpeaking();
                }, 20000);

                Speech.speak(nextText, {
                    language: 'en-US',
                    onDone: () => {
                        speakChunkAt(index + 1);
                    },
                    onStopped: () => {
                        finishSpeaking();
                    },
                    onError: (error) => {
                        console.warn('TTS: device speech failed', error);
                        finishSpeaking();
                    }
                });
            };

            speakChunkAt(0);
        })();
    }, [startListeningLive]);

    const stopSpeaking = useCallback(() => {
        speakRequestIdRef.current += 1;
        if (speakWatchdogRef.current) {
            clearTimeout(speakWatchdogRef.current);
            speakWatchdogRef.current = null;
        }
        speakInProgressRef.current = false;
        lastSpokenRef.current = null;
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
        if (speakWatchdogRef.current) {
            clearTimeout(speakWatchdogRef.current);
            speakWatchdogRef.current = null;
        }
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
