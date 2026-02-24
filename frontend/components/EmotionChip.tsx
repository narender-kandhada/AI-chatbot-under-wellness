import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { typography, borderRadius, spacing } from '../constants/theme';

interface EmotionChipProps {
    emotion: string;
    confidence?: number;
}

const EMOTION_MAP: Record<string, { bg: string; dot: string; label: string }> = {
    happy: { bg: '#EAF7EE', dot: '#6B8E6E', label: 'Happy' },
    sad: { bg: '#EAF0F7', dot: '#6C9BCF', label: 'Sad' },
    anxious: { bg: '#F3EAF7', dot: '#9C7EBF', label: 'Anxious' },
    angry: { bg: '#FBEAEA', dot: '#C97C7C', label: 'Upset' },
    tired: { bg: '#EEF1F5', dot: '#8E9EAE', label: 'Tired' },
    lonely: { bg: '#F5EAF3', dot: '#B088A8', label: 'Lonely' },
    calm: { bg: '#EEF7F3', dot: '#7DB8A6', label: 'Calm' },
    hopeful: { bg: '#F7F3EA', dot: '#C4A84D', label: 'Hopeful' },
};

export function EmotionChip({ emotion, confidence }: EmotionChipProps) {
    const info = EMOTION_MAP[emotion] || { bg: '#EEF2EC', dot: '#6B8E6E', label: emotion };
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    }, []);

    return (
        <Animated.View style={[styles.chip, { backgroundColor: info.bg, opacity: fadeAnim }]}>
            <View style={[styles.dot, { backgroundColor: info.dot }]} />
            <Text style={[styles.label, { color: info.dot }]}>{info.label}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: borderRadius.full, gap: spacing.sm,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    label: { fontSize: typography.sizes.sm, fontWeight: '600' },
});
