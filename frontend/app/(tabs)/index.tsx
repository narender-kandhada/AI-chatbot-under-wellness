import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, useColorScheme, Image,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CalmBackground } from '../../components/AmbientBackground';
import { MoodSelector, MoodType } from '../../components/MoodSelector';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { saveMoodEntry, updateStreak, getStreak, getDailyAffirmation, type StreakData } from '../../services/storage.service';

const COLLEGE_LOGO = require('../../assets/images/college_logo.png');
const DEPARTMENT_LOGO = require('../../assets/images/department_logo.png');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '🌅' };
  if (h < 17) return { text: 'Good afternoon', emoji: '☀️' };
  if (h < 21) return { text: 'Good evening', emoji: '🌇' };
  return { text: 'Good night', emoji: '🌙' };
}

function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const isDark = scheme === 'dark';
  const greeting = getGreeting();
  const affirmation = getDailyAffirmation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, lastCheckInDate: '', totalCheckIns: 0 });
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
    loadStreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={[styles.container, { paddingTop: insets.top || spacing.xxl + spacing.md, paddingBottom: tabBarHeight + spacing.lg }]}> 
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.headerRow}>
              <View style={styles.brandLeft}>
                <View style={[styles.logoWrap, isDark && styles.logoWrapDark]}>
                  <Image source={DEPARTMENT_LOGO} style={styles.logo} resizeMode="contain" />
                </View>
                <Text style={[styles.brandText, { color: theme.text }]}>Wellness for MRCE</Text>
              </View>

              <View style={styles.logoRowRight}>
                <View style={[styles.logoWrap, isDark && styles.logoWrapDark]}>
                  <Image source={COLLEGE_LOGO} style={styles.logo} resizeMode="contain" />
                </View>
              </View>
            </View>
            <Text style={styles.emoji}>{greeting.emoji}</Text>
            <Text style={[styles.greeting, { color: theme.primary }]}>{greeting.text}</Text>
            <Text style={[styles.title, { color: theme.text }]}>How are you feeling?</Text>

            {/* Daily Affirmation */}
            <View style={[styles.affirmationCard, { backgroundColor: theme.surfaceTint + 'CC' }]}> 
              <Text style={[styles.affirmationText, { color: theme.textSecondary }]}> 
                <Text style={{fontSize: 18, marginRight: 4}}>“</Text>{affirmation}<Text style={{fontSize: 18, marginLeft: 4}}>”</Text>
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
      </SafeAreaView>
    </CalmBackground>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, paddingTop: spacing.xxl + spacing.lg, justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  brandText: { fontSize: typography.sizes.base, fontWeight: '800', letterSpacing: 0.2, flexShrink: 1 },
  logoRowRight: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginLeft: spacing.md },
  logoWrap: { borderRadius: 10, overflow: 'hidden' },
  logoWrapDark: { backgroundColor: 'rgba(255,255,255,0.92)', padding: 4 },
  logo: { width: 36, height: 36 },
  emoji: { fontSize: 40, marginBottom: spacing.sm },
  greeting: { fontSize: typography.sizes.base, fontWeight: '600', marginBottom: spacing.xs },
  title: { fontSize: typography.sizes.xxxl, fontWeight: '800', marginBottom: spacing.lg, lineHeight: typography.sizes.xxxl * 1.15 },
  affirmationCard: {
    paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    // No border, softer background
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.03)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 1,
  },
  affirmationText: { fontSize: typography.sizes.base, fontStyle: 'italic', lineHeight: typography.sizes.base * 1.6, textAlign: 'center', opacity: 0.95 },
  moodSection: { marginBottom: spacing.lg },
  moodLabel: { fontSize: typography.sizes.sm, fontWeight: '600', marginBottom: spacing.md, textAlign: 'center' },
  footer: { alignItems: 'center', gap: spacing.sm },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1,
  },
  streakEmoji: { fontSize: 16 },
  streakText: { fontSize: typography.sizes.sm, fontWeight: '700' },
  footerText: { fontSize: typography.sizes.sm, fontStyle: 'italic' },
});
