import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated, Easing, useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Leaf, Play, Pause, RotateCcw } from 'lucide-react-native';
import { CalmBackground } from '../components/AmbientBackground';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const DURATIONS = [
    { label: '3 min', seconds: 180 },
    { label: '5 min', seconds: 300 },
    { label: '10 min', seconds: 600 },
];

export default function MeditationScreen() {
    const scheme = useColorScheme() ?? 'light';
    const theme = colors[scheme];
    const [selectedDuration, setSelectedDuration] = useState(1); // default 5 min
    const [timeLeft, setTimeLeft] = useState(DURATIONS[1].seconds);
    const [isRunning, setIsRunning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Subtle pulse animation while meditating
    useEffect(() => {
        if (isRunning) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.08, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRunning]);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        setIsRunning(false);
                        setIsComplete(true);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning]);

    const selectDuration = (index: number) => {
        if (isRunning) return;
        setSelectedDuration(index);
        setTimeLeft(DURATIONS[index].seconds);
        setIsComplete(false);
    };

    const toggleTimer = () => {
        if (isComplete) {
            reset();
            return;
        }
        setIsRunning(r => !r);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const reset = () => {
        setIsRunning(false);
        setIsComplete(false);
        setTimeLeft(DURATIONS[selectedDuration].seconds);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = 1 - timeLeft / DURATIONS[selectedDuration].seconds;

    return (
        <CalmBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { reset(); router.back(); }} style={styles.backBtn}>
                        <ArrowLeft size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Leaf size={20} color={theme.primary} />
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Meditation</Text>
                </View>

                {/* Duration Picker */}
                <View style={styles.durationRow}>
                    {DURATIONS.map((d, i) => (
                        <TouchableOpacity
                            key={d.label}
                            onPress={() => selectDuration(i)}
                            style={[
                                styles.durationBtn,
                                {
                                    backgroundColor: i === selectedDuration ? theme.primary + '20' : theme.surface,
                                    borderColor: i === selectedDuration ? theme.primary : theme.border,
                                },
                            ]}
                        >
                            <Text style={[
                                styles.durationLabel,
                                { color: i === selectedDuration ? theme.primary : theme.textSecondary },
                            ]}>
                                {d.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Timer Circle */}
                <View style={styles.center}>
                    <Animated.View style={[styles.timerCircle, {
                        borderColor: theme.primary + '30',
                        transform: [{ scale: pulseAnim }],
                    }]}>
                        <View style={[styles.progressRing, {
                            borderColor: theme.primary,
                            borderTopColor: 'transparent',
                            borderRightColor: progress > 0.25 ? theme.primary : 'transparent',
                            borderBottomColor: progress > 0.5 ? theme.primary : 'transparent',
                            borderLeftColor: progress > 0.75 ? theme.primary : 'transparent',
                        }]} />
                        <Text style={[styles.timerText, { color: theme.text }]}>
                            {isComplete ? '✨' : formatTime(timeLeft)}
                        </Text>
                        {isComplete && (
                            <Text style={[styles.completeText, { color: theme.primary }]}>
                                Well done 💚
                            </Text>
                        )}
                    </Animated.View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        onPress={toggleTimer}
                        style={[styles.playBtn, { backgroundColor: theme.primary }]}
                    >
                        {isComplete ? (
                            <RotateCcw size={28} color="#fff" />
                        ) : isRunning ? (
                            <Pause size={28} color="#fff" />
                        ) : (
                            <Play size={28} color="#fff" style={{ marginLeft: 3 }} />
                        )}
                    </TouchableOpacity>

                    {(isRunning || timeLeft !== DURATIONS[selectedDuration].seconds) && !isComplete && (
                        <TouchableOpacity onPress={reset} style={styles.resetBtn}>
                            <RotateCcw size={18} color={theme.textLight} />
                            <Text style={[styles.resetText, { color: theme.textLight }]}>Reset</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={[styles.tip, { color: theme.textSecondary }]}>
                    {isRunning ? 'Close your eyes. Focus on your breath. 🌿' : 'Find a quiet spot and get comfortable.'}
                </Text>
            </View>
        </CalmBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, gap: spacing.sm },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: typography.sizes.xl, fontWeight: '700' },
    durationRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.xl },
    durationBtn: {
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
        borderRadius: borderRadius.full, borderWidth: 1.5,
    },
    durationLabel: { fontSize: typography.sizes.sm, fontWeight: '700' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    timerCircle: {
        width: 220, height: 220, borderRadius: 110, borderWidth: 3,
        justifyContent: 'center', alignItems: 'center',
    },
    progressRing: {
        position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 3,
    },
    timerText: { fontSize: 48, fontWeight: '200', letterSpacing: 2 },
    completeText: { fontSize: typography.sizes.lg, fontWeight: '700', marginTop: spacing.sm },
    controls: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
    playBtn: {
        width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    resetBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    resetText: { fontSize: typography.sizes.sm },
    tip: { textAlign: 'center', fontSize: typography.sizes.sm, paddingBottom: spacing.xxl, paddingHorizontal: spacing.xl },
});
