import { useState, useCallback, useRef, useEffect } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import * as Speech from 'expo-speech';

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
        // Non-live mode: 'end' fires normally after user stops speaking
        // Live mode with continuous: 'end' only fires if recognizer is
        //   stopped manually or errors out — restart if still in session
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

    useSpeechRecognitionEvent('result', (event) => {
        const text = event.results[0]?.transcript || '';
        setTranscript(text);

        // In live continuous mode: use isFinal to trigger processing
        // This avoids stopping/restarting the recognizer (no beep sounds)
        if (isLiveModeRef.current && liveStateRef.current === 'listening') {
            const isFinal = event.isFinal ?? (event as any).results?.[0]?.isFinal;
            if (isFinal && text.trim()) {
                // Stop the recognizer silently before processing/TTS
                try { ExpoSpeechRecognitionModule.stop(); } catch { }
                setLiveState('processing');
            }
        }
    });

    useSpeechRecognitionEvent('error', (event) => {
        console.warn('STT error:', event.error);
        setIsListening(false);
        if (isLiveModeRef.current) {
            setTimeout(() => {
                if (isLiveModeRef.current) startListeningLive();
            }, 1000);
        }
    });

    // ─── Core Audio Functions ───────────────────────────────────────────

    // Non-live: short, auto-stops after silence
    const startListeningInternal = useCallback(async () => {
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

    // Live: continuous mode — stays active, no repeated start/stop beeps
    const startListeningLive = useCallback(async () => {
        const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!granted) return;
        try {
            ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: true,
                continuous: true,  // stays active — fewer beep sounds
            });
        } catch (e) {
            console.warn('Start listening (live) error:', e);
        }
    }, []);

    const startListening = useCallback(async () => {
        await startListeningInternal();
    }, [startListeningInternal]);

    const stopListening = useCallback(() => {
        try { ExpoSpeechRecognitionModule.stop(); } catch { }
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
                    // In live mode → restart listening (live continuous mode)
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
        Speech.stop();
        setIsLiveMode(true);
        isLiveModeRef.current = true;
        setLiveState('listening');
        liveStateRef.current = 'listening';
        setTranscript('');
        transcriptRef.current = '';
        await startListeningLive();  // continuous mode — one beep only
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
        try { ExpoSpeechRecognitionModule.stop(); } catch { }
        Speech.stop();
    }, []);

    return {
        isListening, transcript, isSpeaking, ttsEnabled,
        isLiveMode, liveState,
        startListening, stopListening, speak, stopSpeaking, toggleTTS,
        startLiveSession, endLiveSession,
    };
}
