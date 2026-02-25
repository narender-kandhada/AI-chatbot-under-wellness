import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { CalmBackground } from '../../components/AmbientBackground';
import { MoodSelector, MoodType } from '../../components/MoodSelector';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { saveMoodEntry, updateStreak, getStreak, getDailyAffirmation, type StreakData } from '../../services/storage.service';

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
  const affirmation = getDailyAffirmation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, lastCheckInDate: '', totalCheckIns: 0 });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
    loadStreak();
  }, []);

  const loadStreak = async () => {
    const data = await getStreak();
    setStreak(data);
  };

  const handleMoodSelect = async (mood: MoodType) => {
    // Save mood + update streak
    await saveMoodEntry(mood);
    await updateStreak();
    // Navigate to chat with mood
    router.push({ pathname: 'chat', params: { mood } } as any);
  };

  return (
    <CalmBackground>
      <View style={styles.container}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.emoji}>{greeting.emoji}</Text>
          <Text style={[styles.greeting, { color: theme.primary }]}>{greeting.text}</Text>
          <Text style={[styles.title, { color: theme.text }]}>How are you feeling?</Text>

          {/* Daily Affirmation */}
          <View style={[styles.affirmationCard, { backgroundColor: theme.surfaceTint, borderColor: theme.primary + '20' }]}>
            <Text style={[styles.affirmationText, { color: theme.textSecondary }]}>
              {affirmation}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.moodSection}>
          <Text style={[styles.moodLabel, { color: theme.textSecondary }]}>Tap your mood to start chatting 🌿</Text>
          <MoodSelector selectedMood={null} onSelectMood={handleMoodSelect} />
        </View>

        <View style={styles.footer}>
          {streak.currentStreak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={[styles.streakText, { color: theme.text }]}>
                {streak.currentStreak} day{streak.currentStreak !== 1 ? 's' : ''} streak
              </Text>
            </View>
          )}
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
  title: { fontSize: typography.sizes.xxxl, fontWeight: '800', marginBottom: spacing.lg, lineHeight: typography.sizes.xxxl * 1.15 },
  affirmationCard: {
    padding: spacing.md, borderRadius: borderRadius.xl, borderWidth: 1,
    marginBottom: spacing.md,
  },
  affirmationText: { fontSize: typography.sizes.base, fontStyle: 'italic', lineHeight: typography.sizes.base * 1.6, textAlign: 'center' },
  moodSection: { marginBottom: spacing.lg },
  moodLabel: { fontSize: typography.sizes.sm, fontWeight: '600', marginBottom: spacing.md, textAlign: 'center' },
  footer: { alignItems: 'center', paddingBottom: spacing.sm, gap: spacing.sm },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1,
  },
  streakEmoji: { fontSize: 16 },
  streakText: { fontSize: typography.sizes.sm, fontWeight: '700' },
  footerText: { fontSize: typography.sizes.sm, fontStyle: 'italic' },
});
