import React, { useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Animated, Easing,
    Dimensions, Modal, StatusBar,
} from 'react-native';
import { X, Radio } from 'lucide-react-native';
import type { LiveState } from '../hooks/useVoiceChat';

const { width: SW } = Dimensions.get('window');
const BLOB_SIZE = SW * 0.7;

/* ─── Animation Configs Per State ──────────────────────────────── */
const ANIM_CONFIG: Record<LiveState, { scale: [number, number]; dur: number; glow: [number, number] }> = {
    idle: { scale: [0.98, 1.02], dur: 3000, glow: [0.10, 0.25] },
    listening: { scale: [0.92, 1.08], dur: 2200, glow: [0.20, 0.45] },
    processing: { scale: [0.88, 1.12], dur: 1400, glow: [0.30, 0.60] },
    speaking: { scale: [0.78, 1.28], dur: 700, glow: [0.40, 0.85] },
};

interface Props {
    visible: boolean;
    liveState: LiveState;
    captionText: string;
    onEnd: () => void;
}

export function LiveOverlay({ visible, liveState, captionText, onEnd }: Props) {
    // ─── Animated values ─────────────────────────────────────────────
    const b1S = useRef(new Animated.Value(1)).current;
    const b1Y = useRef(new Animated.Value(0)).current;
    const b2S = useRef(new Animated.Value(1)).current;
    const b2X = useRef(new Animated.Value(0)).current;
    const b3S = useRef(new Animated.Value(1)).current;
    const b3Y = useRef(new Animated.Value(0)).current;
    const glow = useRef(new Animated.Value(0.2)).current;

    useEffect(() => {
        if (!visible) return;
        const c = ANIM_CONFIG[liveState];

        const wave = (v: Animated.Value, lo: number, hi: number, ms: number, delay = 0) =>
            Animated.loop(Animated.sequence([
                Animated.delay(delay),
                Animated.timing(v, { toValue: hi, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(v, { toValue: lo, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ]));

        const anim = Animated.parallel([
            wave(b1S, c.scale[0], c.scale[1], c.dur),
            wave(b1Y, -12, 12, c.dur * 1.3, 80),
            wave(b2S, c.scale[0] - 0.04, c.scale[1] + 0.06, c.dur * 0.85, 200),
            wave(b2X, -18, 18, c.dur * 1.1, 300),
            wave(b3S, c.scale[0] - 0.02, c.scale[1] + 0.09, c.dur * 0.7, 120),
            wave(b3Y, -10, 14, c.dur * 1.4, 60),
            wave(glow, c.glow[0], c.glow[1], c.dur * 1.6),
        ]);
        anim.start();
        return () => anim.stop();
    }, [visible, liveState]);

    const label = { idle: '', listening: 'Listening...', processing: 'Thinking...', speaking: '' }[liveState];

    return (
        <Modal visible={visible} animationType="slide" statusBarTranslucent>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <View style={s.container}>

                {/* ── Header ── */}
                <View style={s.header}>
                    <View style={s.livePill}>
                        <Radio size={14} color="#fff" />
                        <Text style={s.liveText}>Live</Text>
                    </View>
                </View>

                {/* ── State label ── */}
                <Text style={s.stateLabel}>{label}</Text>

                {/* ── Waveform ── */}
                <View style={s.waveArea}>
                    {/* outer glow */}
                    <Animated.View style={[s.blobOuter, { opacity: glow, transform: [{ scale: b1S }] }]} />
                    {/* blob 1 — blue */}
                    <Animated.View style={[s.blob, s.blob1, { transform: [{ scale: b1S }, { translateY: b1Y }] }]} />
                    {/* blob 2 — teal */}
                    <Animated.View style={[s.blob, s.blob2, { transform: [{ scale: b2S }, { translateX: b2X }] }]} />
                    {/* blob 3 — cyan accent */}
                    <Animated.View style={[s.blob, s.blob3, { transform: [{ scale: b3S }, { translateY: b3Y }] }]} />
                    {/* bright core */}
                    <View style={s.core} />
                </View>

                {/* ── Captions ── */}
                <View style={s.captionBox}>
                    <Text style={s.caption} numberOfLines={5}>
                        {captionText || (liveState === 'listening' ? 'Say something...' : '')}
                    </Text>
                </View>

                {/* ── Controls ── */}
                <View style={s.controls}>
                    <TouchableOpacity onPress={onEnd} style={s.endBtn} activeOpacity={0.7}>
                        <X size={26} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#060612',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    // Header
    header: {
        width: '100%',
        paddingTop: 56,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    livePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    liveText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },

    // State label
    stateLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.3,
        marginTop: 20,
    },

    // Waveform
    waveArea: {
        width: BLOB_SIZE,
        height: BLOB_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blobOuter: {
        position: 'absolute',
        width: BLOB_SIZE * 1.2,
        height: BLOB_SIZE * 0.6,
        borderRadius: BLOB_SIZE * 0.3,
        backgroundColor: '#0A3D91',
    },
    blob: {
        position: 'absolute',
        borderRadius: BLOB_SIZE * 0.3,
    },
    blob1: {
        width: BLOB_SIZE * 0.9,
        height: BLOB_SIZE * 0.45,
        backgroundColor: 'rgba(25, 118, 210, 0.55)',
    },
    blob2: {
        width: BLOB_SIZE * 0.75,
        height: BLOB_SIZE * 0.38,
        backgroundColor: 'rgba(0, 172, 193, 0.45)',
    },
    blob3: {
        width: BLOB_SIZE * 0.55,
        height: BLOB_SIZE * 0.3,
        backgroundColor: 'rgba(38, 198, 218, 0.40)',
    },
    core: {
        width: BLOB_SIZE * 0.35,
        height: BLOB_SIZE * 0.2,
        borderRadius: BLOB_SIZE * 0.1,
        backgroundColor: 'rgba(100, 181, 246, 0.35)',
    },

    // Captions
    captionBox: {
        paddingHorizontal: 32,
        minHeight: 80,
        justifyContent: 'center',
    },
    caption: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        fontWeight: '500',
    },

    // Controls
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
    },
    endBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#D32F2F',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#D32F2F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
});
