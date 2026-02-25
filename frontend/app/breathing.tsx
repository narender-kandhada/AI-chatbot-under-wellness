import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, Animated, Easing, TouchableOpacity, useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Wind } from 'lucide-react-native';
import { CalmBackground } from '../components/AmbientBackground';
import { colors, spacing, typography } from '../constants/theme';

const INHALE_MS = 4000;
const HOLD_MS = 2000;
const EXHALE_MS = 4000;
const CYCLE_MS = INHALE_MS + HOLD_MS + EXHALE_MS;

export default function BreathingScreen() {
    const scheme = useColorScheme() ?? 'light';
    const theme = colors[scheme];
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState<'ready' | 'inhale' | 'hold' | 'exhale'>('ready');
    const [cycles, setCycles] = useState(0);
    const circleScale = useRef(new Animated.Value(0.5)).current;
    const circleOpacity = useRef(new Animated.Value(0.3)).current;
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const runCycle = () => {
        // Inhale
        setPhase('inhale');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
            Animated.timing(circleScale, { toValue: 1, duration: INHALE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(circleOpacity, { toValue: 0.7, duration: INHALE_MS, useNativeDriver: true }),
        ]).start();

        // Hold
        setTimeout(() => {
            setPhase('hold');
        }, INHALE_MS);

        // Exhale
        setTimeout(() => {
            setPhase('exhale');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Animated.parallel([
                Animated.timing(circleScale, { toValue: 0.5, duration: EXHALE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(circleOpacity, { toValue: 0.3, duration: EXHALE_MS, useNativeDriver: true }),
            ]).start();
        }, INHALE_MS + HOLD_MS);
    };

    const startBreathing = () => {
        setIsActive(true);
        setCycles(0);
        runCycle();
        intervalRef.current = setInterval(() => {
            setCycles(c => c + 1);
            runCycle();
        }, CYCLE_MS);
    };

    const stopBreathing = () => {
        setIsActive(false);
        setPhase('ready');
        if (intervalRef.current) clearInterval(intervalRef.current);
        circleScale.setValue(0.5);
        circleOpacity.setValue(0.3);
    };

    useEffect(() => {
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const phaseText = {
        ready: 'Tap to begin',
        inhale: 'Breathe in...',
        hold: 'Hold...',
        exhale: 'Breathe out...',
    };

    return (
        <CalmBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { stopBreathing(); router.back(); }} style={styles.backBtn}>
                        <ArrowLeft size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Wind size={20} color={theme.primary} />
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Breathing</Text>
                </View>

                <View style={styles.center}>
                    <TouchableOpacity
                        onPress={isActive ? stopBreathing : startBreathing}
                        activeOpacity={0.8}
                        style={styles.circleTouch}
                    >
                        <Animated.View style={[
                            styles.outerCircle,
                            {
                                backgroundColor: theme.primary + '15',
                                borderColor: theme.primary + '30',
                                transform: [{ scale: circleScale }],
                                opacity: circleOpacity,
                            }
                        ]} />
                        <Animated.View style={[
                            styles.innerCircle,
                            {
                                backgroundColor: theme.primary + '25',
                                borderColor: theme.primary,
                                transform: [{ scale: circleScale }],
                            }
                        ]} />
                        <View style={styles.phaseTextWrap}>
                            <Text style={[styles.phaseText, { color: theme.primary }]}>{phaseText[phase]}</Text>
                            {isActive && (
                                <Text style={[styles.cycleText, { color: theme.textLight }]}>
                                    Cycle {cycles + 1}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.tip, { color: theme.textSecondary }]}>
                        {isActive ? 'Tap the circle to stop' : '4 seconds in • 2 seconds hold • 4 seconds out'}
                    </Text>
                </View>
            </View>
        </CalmBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, gap: spacing.sm },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: typography.sizes.xl, fontWeight: '700' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    circleTouch: { width: 280, height: 280, justifyContent: 'center', alignItems: 'center' },
    outerCircle: {
        position: 'absolute', width: 280, height: 280, borderRadius: 140,
        borderWidth: 2,
    },
    innerCircle: {
        position: 'absolute', width: 200, height: 200, borderRadius: 100,
        borderWidth: 2,
    },
    phaseTextWrap: { alignItems: 'center' },
    phaseText: { fontSize: typography.sizes.xl, fontWeight: '700' },
    cycleText: { fontSize: typography.sizes.sm, marginTop: spacing.xs },
    footer: { alignItems: 'center', paddingBottom: spacing.xxl },
    tip: { fontSize: typography.sizes.sm, textAlign: 'center' },
});
