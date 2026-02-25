import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Alert, Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { BarChart3, TrendingUp, Download, BookOpen, Flame, Wind, Leaf } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { CalmBackground } from '../../components/AmbientBackground';
import { colors, moodColors, spacing, typography, borderRadius } from '../../constants/theme';
import {
    getMoodHistory, getWeeklyMoodSummary, getStreak, getJournalEntries,
    exportAllData, type MoodEntry, type StreakData,
} from '../../services/storage.service';

const MOOD_EMOJIS: Record<string, string> = {
    happy: '😊', okay: '😐', calm: '😌', tired: '😴', anxious: '😰', sad: '😢',
};

export default function InsightsScreen() {
    const scheme = useColorScheme() ?? 'light';
    const theme = colors[scheme];
    const mc = moodColors[scheme];
    const [weeklyData, setWeeklyData] = useState<{ moodCounts: Record<string, number>; totalDays: number; dominantMood: string; entries: MoodEntry[] }>({
        moodCounts: {}, totalDays: 0, dominantMood: 'calm', entries: [],
    });
    const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, lastCheckInDate: '', totalCheckIns: 0 });
    const [journalCount, setJournalCount] = useState(0);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        const [weekly, streakData, journal] = await Promise.all([
            getWeeklyMoodSummary(),
            getStreak(),
            getJournalEntries(),
        ]);
        setWeeklyData(weekly);
        setStreak(streakData);
        setJournalCount(journal.length);
    };

    const handleExport = async () => {
        try {
            const data = await exportAllData();
            const FS = require('expo-file-system');
            const fileUri = (FS.documentDirectory || '') + 'innercircle_export.json';
            await FS.writeAsStringAsync(fileUri, data);
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Export Ready', 'Your data has been saved.');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to export data.');
        }
    };

    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push({
                label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 3),
                date: d.toISOString().split('T')[0],
            });
        }
        return days;
    };

    const last7 = getLast7Days();
    const maxBarHeight = 100;

    // Get mood for each day
    const dayMoods = last7.map(day => {
        const entry = weeklyData.entries.find(e => e.date === day.date);
        return { ...day, mood: entry?.mood || null };
    });

    return (
        <CalmBackground>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>Insights</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Track your wellness journey 📊
                </Text>

                {/* ─── Streak Card ─────────────────────────── */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                        <Flame size={20} color="#FF8C42" />
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Check-In Streak</Text>
                    </View>
                    <View style={styles.streakRow}>
                        <Text style={[styles.streakNumber, { color: theme.primary }]}>{streak.currentStreak}</Text>
                        <View>
                            <Text style={[styles.streakLabel, { color: theme.text }]}>
                                {streak.currentStreak === 1 ? 'day' : 'days'} in a row
                            </Text>
                            <Text style={[styles.streakSub, { color: theme.textLight }]}>
                                {streak.totalCheckIns} total check-ins
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ─── Mood Graph ─────────────────────────── */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                        <BarChart3 size={20} color={theme.primary} />
                        <Text style={[styles.cardTitle, { color: theme.text }]}>This Week</Text>
                    </View>
                    <View style={styles.graphRow}>
                        {dayMoods.map((day, i) => {
                            const moodKey = (day.mood || 'calm') as keyof typeof mc;
                            const moodColor = mc[moodKey]?.accent || theme.primary;
                            const hasEntry = !!day.mood;
                            return (
                                <View key={i} style={styles.graphCol}>
                                    <View style={styles.barWrap}>
                                        <View style={[
                                            styles.bar,
                                            {
                                                height: hasEntry ? maxBarHeight * 0.7 : 8,
                                                backgroundColor: hasEntry ? moodColor : theme.border,
                                                borderRadius: borderRadius.sm,
                                            }
                                        ]} />
                                        {hasEntry && (
                                            <Text style={styles.barEmoji}>{MOOD_EMOJIS[day.mood!] || '😐'}</Text>
                                        )}
                                    </View>
                                    <Text style={[styles.dayLabel, { color: theme.textLight }]}>{day.label}</Text>
                                </View>
                            );
                        })}
                    </View>
                    {weeklyData.totalDays === 0 && (
                        <Text style={[styles.emptyText, { color: theme.textLight }]}>
                            Check in daily to see your mood trends appear here! 🌱
                        </Text>
                    )}
                </View>

                {/* ─── Weekly Summary ─────────────────────── */}
                {weeklyData.totalDays > 0 && (
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.cardHeader}>
                            <TrendingUp size={20} color={theme.primary} />
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Weekly Summary</Text>
                        </View>
                        <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                            You checked in {weeklyData.totalDays} {weeklyData.totalDays === 1 ? 'day' : 'days'} this week.
                            {' '}Your most common mood was{' '}
                            <Text style={{ fontWeight: '700', color: theme.text }}>
                                {MOOD_EMOJIS[weeklyData.dominantMood]} {weeklyData.dominantMood}
                            </Text>.
                        </Text>
                        <View style={styles.moodBreakdown}>
                            {Object.entries(weeklyData.moodCounts).map(([mood, count]) => (
                                <View key={mood} style={[styles.moodPill, {
                                    backgroundColor: mc[mood as keyof typeof mc]?.bg || theme.surfaceTint,
                                    borderColor: mc[mood as keyof typeof mc]?.border || theme.border,
                                }]}>
                                    <Text style={styles.moodPillEmoji}>{MOOD_EMOJIS[mood]}</Text>
                                    <Text style={[styles.moodPillText, {
                                        color: mc[mood as keyof typeof mc]?.accent || theme.text,
                                    }]}>{count}x</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* ─── Quick Actions ─────────────────────── */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => router.push('breathing' as any)}
                    >
                        <Wind size={24} color={theme.primary} />
                        <Text style={[styles.actionLabel, { color: theme.text }]}>Breathe</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => router.push('meditation' as any)}
                    >
                        <Leaf size={24} color={theme.primary} />
                        <Text style={[styles.actionLabel, { color: theme.text }]}>Meditate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => router.push('journal' as any)}
                    >
                        <BookOpen size={24} color={theme.primary} />
                        <Text style={[styles.actionLabel, { color: theme.text }]}>Journal</Text>
                        {journalCount > 0 && (
                            <Text style={[styles.actionBadge, { color: theme.textLight }]}>{journalCount}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ─── Export ─────────────────────── */}
                <TouchableOpacity
                    onPress={handleExport}
                    style={[styles.exportBtn, { borderColor: theme.border }]}
                >
                    <Download size={18} color={theme.textSecondary} />
                    <Text style={[styles.exportText, { color: theme.textSecondary }]}>Export My Data</Text>
                </TouchableOpacity>
            </ScrollView>
        </CalmBackground>
    );
}

const styles = StyleSheet.create({
    scroll: { flex: 1 },
    content: { padding: spacing.xl, paddingTop: spacing.xxl + spacing.md, paddingBottom: spacing.xxl },
    title: { fontSize: typography.sizes.xxxl, fontWeight: '800' },
    subtitle: { fontSize: typography.sizes.base, marginTop: spacing.xs, marginBottom: spacing.xl },
    card: {
        borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.md,
        shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 10, elevation: 1,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    cardTitle: { fontSize: typography.sizes.lg, fontWeight: '700' },
    streakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    streakNumber: { fontSize: 48, fontWeight: '800' },
    streakLabel: { fontSize: typography.sizes.lg, fontWeight: '600' },
    streakSub: { fontSize: typography.sizes.sm, marginTop: 2 },
    graphRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, paddingTop: spacing.md },
    graphCol: { alignItems: 'center', flex: 1 },
    barWrap: { alignItems: 'center', justifyContent: 'flex-end', height: 110 },
    bar: { width: 28, minHeight: 8 },
    barEmoji: { fontSize: 16, marginTop: 4 },
    dayLabel: { fontSize: typography.sizes.xs, marginTop: spacing.xs, fontWeight: '600' },
    emptyText: { textAlign: 'center', fontSize: typography.sizes.sm, marginTop: spacing.md, fontStyle: 'italic' },
    summaryText: { fontSize: typography.sizes.base, lineHeight: typography.sizes.base * 1.6 },
    moodBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
    moodPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
        borderRadius: borderRadius.full, borderWidth: 1,
    },
    moodPillEmoji: { fontSize: 14 },
    moodPillText: { fontSize: typography.sizes.sm, fontWeight: '700' },
    actionsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    actionCard: {
        flex: 1, alignItems: 'center', padding: spacing.md,
        borderRadius: borderRadius.xl, borderWidth: 1, gap: spacing.sm,
    },
    actionLabel: { fontSize: typography.sizes.sm, fontWeight: '700' },
    actionBadge: { fontSize: typography.sizes.xs },
    exportBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: spacing.sm, paddingVertical: spacing.md,
        borderRadius: borderRadius.xl, borderWidth: 1, borderStyle: 'dashed',
    },
    exportText: { fontSize: typography.sizes.sm, fontWeight: '600' },
});
