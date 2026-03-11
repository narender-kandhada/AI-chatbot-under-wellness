import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Image
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, BookOpen, MessageSquare } from 'lucide-react-native';
import { CalmBackground } from '../components/AmbientBackground';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { getJournalEntries, type JournalEntry } from '../services/storage.service';

const MOOD_EMOJIS: Record<string, string> = {
    happy: '😊', okay: '😐', calm: '😌', tired: '😴', anxious: '😰', sad: '😢',
};

export default function JournalScreen() {
    const scheme = useColorScheme() ?? 'light';
    const theme = colors[scheme];
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadEntries();
        }, [])
    );

    const loadEntries = async () => {
        const data = await getJournalEntries();
        setEntries(data);
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <CalmBackground>
            <View style={styles.container}>

                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={22} color={theme.text} />
                    </TouchableOpacity>

                    <BookOpen size={20} color={theme.primary} />

                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        Journal
                    </Text>

                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/images/college_logo.png.png')}
                            style={styles.logo}
                        />
                        <Image
                            source={require('../assets/images/department_logo.png.png')}
                            style={styles.logo}
                        />
                    </View>
                </View>

                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    {entries.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MessageSquare size={48} color={theme.border} />
                            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
                                No entries yet
                            </Text>
                            <Text style={[styles.emptyText, { color: theme.textLight }]}>
                                Save a conversation from chat to see it here! Tap the bookmark icon in chat.
                            </Text>
                        </View>
                    ) : (
                        entries.map((entry) => {
                            const isExpanded = expandedId === entry.id;

                            return (
                                <TouchableOpacity
                                    key={entry.id}
                                    onPress={() => setExpandedId(isExpanded ? null : entry.id)}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.entryCard,
                                        { backgroundColor: theme.surface, borderColor: theme.border }
                                    ]}
                                >
                                    <View style={styles.entryHeader}>
                                        <Text style={styles.entryEmoji}>
                                            {MOOD_EMOJIS[entry.mood] || '😐'}
                                        </Text>

                                        <View style={styles.entryMeta}>
                                            <Text style={[styles.entryDate, { color: theme.text }]}>
                                                {formatDate(entry.date)}
                                            </Text>

                                            <Text style={[styles.entryTime, { color: theme.textLight }]}>
                                                {formatTime(entry.date)}
                                            </Text>
                                        </View>

                                        <Text style={[styles.entryMsgCount, { color: theme.textLight }]}>
                                            {entry.messages.length} msgs
                                        </Text>
                                    </View>

                                    <Text
                                        style={[styles.entryPreview, { color: theme.textSecondary }]}
                                        numberOfLines={isExpanded ? undefined : 2}
                                    >
                                        {entry.preview}
                                    </Text>

                                    {isExpanded && (
                                        <View style={[
                                            styles.messagesWrap,
                                            { borderTopColor: theme.border }
                                        ]}>

                                            {entry.messages
                                                .filter(m => m.id !== '1')
                                                .map((msg, i) => (
                                                    <View
                                                        key={i}
                                                        style={[
                                                            styles.msgBubble,
                                                            msg.isUser ? styles.msgUser : styles.msgAi,
                                                            {
                                                                backgroundColor: msg.isUser
                                                                    ? theme.primary + '15'
                                                                    : theme.surfaceTint
                                                            }
                                                        ]}
                                                    >
                                                        <Text style={[styles.msgRole, { color: theme.textLight }]}>
                                                            {msg.isUser ? 'You' : 'InnerCircle'}
                                                        </Text>

                                                        <Text style={[styles.msgText, { color: theme.text }]}>
                                                            {msg.text}
                                                        </Text>
                                                    </View>
                                                ))}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            </View>
        </CalmBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xxl,
        gap: spacing.sm
    },

    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },

    headerTitle: {
        fontSize: typography.sizes.xl,
        fontWeight: '700'
    },

    logoContainer: {
        flexDirection: 'row',
        marginLeft: 'auto',
        gap: 6
    },

    logo: {
        width: 28,
        height: 28,
        resizeMode: 'contain'
    },

    scroll: { flex: 1 },

    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl
    },

    emptyState: {
        alignItems: 'center',
        paddingTop: spacing.xxl * 2,
        gap: spacing.md
    },

    emptyTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: '700'
    },

    emptyText: {
        fontSize: typography.sizes.base,
        textAlign: 'center',
        lineHeight: typography.sizes.base * 1.6,
        paddingHorizontal: spacing.xl
    },

    entryCard: {
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        padding: spacing.lg,
        marginBottom: spacing.md,
        shadowColor: 'rgba(0,0,0,0.04)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 1
    },

    entryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm
    },

    entryEmoji: { fontSize: 24 },

    entryMeta: { flex: 1 },

    entryDate: {
        fontSize: typography.sizes.base,
        fontWeight: '700'
    },

    entryTime: { fontSize: typography.sizes.xs },

    entryMsgCount: { fontSize: typography.sizes.xs },

    entryPreview: {
        fontSize: typography.sizes.sm,
        lineHeight: typography.sizes.sm * 1.5
    },

    messagesWrap: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        gap: spacing.sm
    },

    msgBubble: {
        padding: spacing.sm,
        borderRadius: borderRadius.md
    },

    msgUser: { marginLeft: spacing.xl },

    msgAi: { marginRight: spacing.xl },

    msgRole: {
        fontSize: typography.sizes.xs,
        fontWeight: '700',
        marginBottom: 2
    },

    msgText: {
        fontSize: typography.sizes.sm,
        lineHeight: typography.sizes.sm * 1.5
    },
});