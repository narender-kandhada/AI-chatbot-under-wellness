import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { CalmBackground } from '../components/AmbientBackground';
import { Button } from '../components/Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function WelcomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const fadeContent = useRef(new Animated.Value(0)).current;
  const fadeBtn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.stagger(300, [
      Animated.parallel([
        Animated.timing(fadeTitle, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(fadeContent, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeBtn, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <CalmBackground>
      <View style={styles.container}>
        <Animated.View style={[styles.header, { opacity: fadeTitle, transform: [{ translateY: slideUp }] }]}>
          <Text style={styles.leaf}>🌿</Text>
          <Text style={[styles.welcome, { color: theme.textSecondary }]}>Welcome to</Text>
          <Text style={[styles.title, { color: theme.text }]}>InnerCircle</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            A quiet, supportive place where you can{'\n'}breathe, reflect, and feel heard.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.disclaimerBox, { opacity: fadeContent, backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <Text style={[styles.disclaimerTitle, { color: theme.textSecondary }]}>Before we begin</Text>
          <Text style={[styles.disclaimerText, { color: theme.textLight }]}>
            InnerCircle is a supportive companion — not a therapist or doctor. If you're in crisis, please reach out to a professional. 💚
          </Text>
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, { opacity: fadeBtn }]}>
          <Button title="Let's begin" onPress={() => router.replace('(tabs)' as any)} fullWidth />
        </Animated.View>
      </View>
    </CalmBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  leaf: { fontSize: 52, marginBottom: spacing.md },
  welcome: { fontSize: typography.sizes.lg, fontWeight: '500', marginBottom: spacing.xs },
  title: { fontSize: typography.sizes.huge, fontWeight: '800', letterSpacing: -0.5, marginBottom: spacing.lg },
  tagline: { fontSize: typography.sizes.base, textAlign: 'center', lineHeight: typography.sizes.base * 1.7 },
  disclaimerBox: {
    borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.xl, width: '100%',
    borderWidth: 1, shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2,
  },
  disclaimerTitle: { fontSize: typography.sizes.sm, fontWeight: '700', marginBottom: spacing.sm },
  disclaimerText: { fontSize: typography.sizes.sm, lineHeight: typography.sizes.sm * 1.7 },
  buttonContainer: { width: '100%' },
});
