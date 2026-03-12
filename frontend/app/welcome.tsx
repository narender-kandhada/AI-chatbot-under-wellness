import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, View, Text, StyleSheet, Animated, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { CalmBackground } from '../components/AmbientBackground';
import { Button } from '../components/Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { checkBackendConnection } from '../services/companion.service';

export default function WelcomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const fadeContent = useRef(new Animated.Value(0)).current;
  const fadeBtn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  const pingBackend = useCallback(async () => {
    setIsCheckingBackend(true);
    const connected = await checkBackendConnection();
    setIsBackendConnected(connected);
    setIsCheckingBackend(false);
  }, []);

  useEffect(() => {
    Animated.stagger(300, [
      Animated.parallel([
        Animated.timing(fadeTitle, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(fadeContent, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeBtn, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeBtn, fadeContent, fadeTitle, slideUp]);

  useEffect(() => {
    pingBackend();

    const interval = setInterval(() => {
      pingBackend();
    }, 5000);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        pingBackend();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [pingBackend]);

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
            InnerCircle is a supportive companion — not a therapist or doctor. If you&apos;re in crisis, please reach out to a professional. 💚
          </Text>
          <View style={styles.backendStatusRow}>
            <View
              style={[
                styles.backendDot,
                { backgroundColor: isBackendConnected ? theme.success : theme.emotionAngry },
              ]}
            />
            <Text style={[styles.backendStatusText, { color: theme.textSecondary }]}>
              {isBackendConnected
                ? 'Backend connected'
                : (isCheckingBackend ? 'Waking backend...' : 'Backend not connected')}
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, { opacity: fadeBtn }]}>
          <Button
            title={isBackendConnected ? "Let's begin" : 'Waiting for backend...'}
            onPress={() => router.replace('(tabs)' as any)}
            disabled={!isBackendConnected}
            loading={!isBackendConnected && isCheckingBackend}
            fullWidth
          />
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
  backendStatusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  backendDot: { width: 10, height: 10, borderRadius: 5 },
  backendStatusText: { fontSize: typography.sizes.xs, fontWeight: '600' },
  buttonContainer: { width: '100%' },
});
