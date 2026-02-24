import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AICoreOrbProps {
    size?: number;
}

export function AICoreOrb({ size = 120 }: AICoreOrbProps) {
    const scale = useRef(new Animated.Value(1)).current;
    const rotation = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.08, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(scale, { toValue: 0.95, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
        Animated.loop(
            Animated.timing(rotation, { toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: true })
        ).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowOpacity, { toValue: 0.7, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(glowOpacity, { toValue: 0.3, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const outerSize = size * 1.6;
    const innerSize = size * 0.6;

    return (
        <View style={[styles.container, { width: outerSize, height: outerSize }]}>
            <Animated.View style={[styles.outerGlow, { width: outerSize, height: outerSize, borderRadius: outerSize / 2, opacity: glowOpacity }]} />
            <Animated.View style={[styles.orbWrap, { width: size, height: size, borderRadius: size / 2, transform: [{ scale }, { rotate: spin }] }]}>
                <LinearGradient
                    colors={['#9B7FFF', '#FF4ECD', '#5CE1E6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.orb, { width: size, height: size, borderRadius: size / 2 }]}
                >
                    <View style={[styles.innerHighlight, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]} />
                    <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']} style={[styles.topShine, { borderRadius: size / 2 }]} />
                </LinearGradient>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    outerGlow: { position: 'absolute', backgroundColor: 'rgba(155, 127, 255, 0.15)' },
    orbWrap: { shadowColor: '#9B7FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 20 },
    orb: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    innerHighlight: { backgroundColor: 'rgba(255, 255, 255, 0.15)', position: 'absolute' },
    topShine: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
});
