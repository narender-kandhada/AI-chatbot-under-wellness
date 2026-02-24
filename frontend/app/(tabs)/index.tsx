import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { CalmBackground } from '../../components/AmbientBackground';
import { MoodSelector, MoodType } from '../../components/MoodSelector';
import { colors, spacing, typography } from '../../constants/theme';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '🌅' };
  if (h < 17) return { text: 'Good afternoon', emoji: '☀️' };
  if (h < 21) return { text: 'Good evening', emoji: '🌇' };
  return { text: 'Good night', emoji: '🌙' };
}

export default function CheckInScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const greeting = getGreeting();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleMoodSelect = (mood: MoodType) => {
    // Navigate to chat immediately with selected mood
    router.push({ pathname: 'chat', params: { mood } } as any);
  };

  return (
    <CalmBackground>
      <View style={styles.container}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.emoji}>{greeting.emoji}</Text>
          <Text style={[styles.greeting, { color: theme.primary }]}>{greeting.text}</Text>
          <Text style={[styles.title, { color: theme.text }]}>How are you feeling?</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Tap your mood to start chatting 🌿
          </Text>
        </Animated.View>

        <View style={styles.moodSection}>
          <MoodSelector selectedMood={null} onSelectMood={handleMoodSelect} />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textLight }]}>
            Your space. Your pace. No pressure. 💚
          </Text>
        </View>
      </View>
    </CalmBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, paddingTop: spacing.xxl + spacing.lg, justifyContent: 'space-between' },
  emoji: { fontSize: 40, marginBottom: spacing.sm },
  greeting: { fontSize: typography.sizes.base, fontWeight: '600', marginBottom: spacing.xs },
  title: { fontSize: typography.sizes.xxxl, fontWeight: '800', marginBottom: spacing.md, lineHeight: typography.sizes.xxxl * 1.15 },
  subtitle: { fontSize: typography.sizes.base, lineHeight: typography.sizes.base * 1.7, marginBottom: spacing.xl },
  moodSection: { marginBottom: spacing.xl },
  footer: { alignItems: 'center', paddingBottom: spacing.lg },
  footerText: { fontSize: typography.sizes.sm, fontStyle: 'italic' },
});
