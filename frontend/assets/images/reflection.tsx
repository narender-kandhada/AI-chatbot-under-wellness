import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { CalmBackground } from '../components/AmbientBackground';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { EmotionChip } from '../components/EmotionChip';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { ArrowLeft, Wind, BookOpen, Hand } from 'lucide-react-native';
import { analyzeEmotion, EmotionResponse } from '../services/emotion.service';

const suggestions = [
  { id: '1', icon: Wind, title: 'Breathing Exercise', desc: 'A 3-minute guided breathing to help you feel centered', color: '#7DB8A6' },
  { id: '2', icon: BookOpen, title: 'Journal Prompt', desc: 'Write about something that brought you peace today', color: '#6B8E6E' },
  { id: '3', icon: Hand, title: 'Grounding Technique', desc: 'The 5-4-3-2-1 method to reconnect with the present', color: '#A4BE7B' },
];

export default function ReflectionScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const [emotionData, setEmotionData] = useState<EmotionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await analyzeEmotion({ text: "I've been sharing how I feel and working through my emotions." });
        setEmotionData(r);
      } catch { } finally { setLoading(false); }
    })();
  }, []);

  return (
    <CalmBackground>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>🌿 Reflection</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Taking a moment to reflect...</Text>
          </View>
        ) : emotionData ? (
          <View style={[styles.emotionBanner, { backgroundColor: theme.surface }]}>
            <View style={[styles.bannerAccent, { backgroundColor: theme.primary }]} />
            <View style={styles.bannerContent}>
              <Text style={{ color: theme.textSecondary, fontSize: typography.sizes.sm, marginBottom: spacing.sm }}>I sense you're feeling...</Text>
              <EmotionChip emotion={emotionData.emotion} confidence={emotionData.confidence} />
              <Text style={{ color: theme.textLight, fontSize: typography.sizes.xs, marginTop: spacing.sm }}>
                {emotionData.sentiment} · {Math.round(emotionData.confidence * 100)}% confidence
              </Text>
            </View>
          </View>
        ) : null}

        <Card title="What I heard you say" accentColor={theme.primary}>
          <Text style={[styles.reflectionText, { color: theme.textSecondary }]}>
            You're working through some big feelings, and that takes real courage. Whatever you're experiencing is valid. 💚
          </Text>
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Gentle suggestions</Text>
        <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>No pressure — try what feels right 🌿</Text>

        {suggestions.map((s) => (
          <TouchableOpacity key={s.id} activeOpacity={0.7}>
            <View style={[styles.suggestionCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
              <View style={[styles.iconCircle, { backgroundColor: s.color + '15' }]}>
                <s.icon size={20} color={s.color} />
              </View>
              <View style={styles.suggestionContent}>
                <Text style={[styles.suggestionTitle, { color: theme.text }]}>{s.title}</Text>
                <Text style={[styles.suggestionDesc, { color: theme.textSecondary }]}>{s.desc}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.noteBox, { backgroundColor: theme.surfaceTint }]}>
          <Text style={[styles.noteText, { color: theme.textLight }]}>
            These are just ideas. Taking care of yourself looks different for everyone. 🌸
          </Text>
        </View>

        <Button title="Continue Chatting" onPress={() => router.back()} fullWidth />
      </ScrollView>
    </CalmBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: spacing.xxl + spacing.sm, paddingBottom: spacing.md, paddingHorizontal: spacing.lg,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.sizes.xl, fontWeight: '800' },
  divider: { height: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  loadingText: { fontSize: typography.sizes.sm },
  emotionBanner: {
    flexDirection: 'row', borderRadius: borderRadius.xl, marginBottom: spacing.lg, overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2,
  },
  bannerAccent: { width: 4 },
  bannerContent: { padding: spacing.lg, flex: 1 },
  reflectionText: { fontSize: typography.sizes.base, lineHeight: typography.sizes.base * 1.7 },
  sectionTitle: { fontSize: typography.sizes.xxl, fontWeight: '800', marginTop: spacing.md, marginBottom: spacing.xs },
  sectionSub: { fontSize: typography.sizes.base, marginBottom: spacing.lg },
  suggestionCard: {
    flexDirection: 'row', padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 1,
    marginBottom: spacing.md, gap: spacing.md, alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 1,
  },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  suggestionContent: { flex: 1 },
  suggestionTitle: { fontSize: typography.sizes.base, fontWeight: '700', marginBottom: spacing.xs },
  suggestionDesc: { fontSize: typography.sizes.sm, lineHeight: typography.sizes.sm * 1.5 },
  noteBox: { padding: spacing.lg, borderRadius: borderRadius.xl, marginVertical: spacing.lg },
  noteText: { fontSize: typography.sizes.sm, textAlign: 'center', fontStyle: 'italic', lineHeight: typography.sizes.sm * 1.6 },
});
