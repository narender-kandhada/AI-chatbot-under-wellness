import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, colors } from '../constants/theme';

interface CalmBackgroundProps {
    children: React.ReactNode;
    warm?: boolean;
}

export function CalmBackground({ children, warm }: CalmBackgroundProps) {
    const scheme = useColorScheme() ?? 'light';
    const grad = gradients[scheme];
    const theme = colors[scheme];
    const isDark = scheme === 'dark';

    const bgColors = warm
        ? [...grad.warmHero] as [string, string]
        : [...grad.background] as [string, string];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={bgColors}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />
            {/* Subtle radial light — only in light mode */}
            {!isDark && <View style={styles.radialLight} />}
            {children}
        </View>
    );
}

export { CalmBackground as AmbientBackground };

const styles = StyleSheet.create({
    container: { flex: 1 },
    radialLight: {
        position: 'absolute', top: -80, right: -80,
        width: 250, height: 250, borderRadius: 125,
        backgroundColor: 'rgba(107,142,110,0.06)',
    },
});
