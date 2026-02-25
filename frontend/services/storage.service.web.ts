/**
 * Storage Service — Web fallback (no-op).
 *
 * expo-sqlite does not support web bundling (WASM resolution fails).
 * This file provides stub implementations so the web bundler doesn't crash.
 * On native (iOS/Android) the real storage.service.ts is used instead.
 *
 * Metro/Expo automatically resolves `.web.ts` for the web platform.
 */

// ═══════════════════════════════════════════════════════════════
// TYPES  (must match the real service)
// ═══════════════════════════════════════════════════════════════

export interface MoodEntry {
    mood: string;
    emotion?: string;
    timestamp: string;
    date: string;
}

export interface ChatMessage {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: string;
    emotion?: string;
    confidence?: number;
    actions?: string[];
}

export interface JournalEntry {
    id: string;
    date: string;
    mood: string;
    preview: string;
    messages: ChatMessage[];
}

export interface StreakData {
    currentStreak: number;
    lastCheckInDate: string;
    totalCheckIns: number;
}

// ═══════════════════════════════════════════════════════════════
// MOOD HISTORY
// ═══════════════════════════════════════════════════════════════

export async function saveMoodEntry(_mood: string, _emotion?: string): Promise<void> {
    console.warn('[web] saveMoodEntry is a no-op on web');
}

export async function getMoodHistory(_days: number = 90): Promise<MoodEntry[]> {
    return [];
}

export async function getWeeklyMoodSummary(): Promise<{
    moodCounts: Record<string, number>;
    totalDays: number;
    dominantMood: string;
    entries: MoodEntry[];
}> {
    return { moodCounts: {}, totalDays: 0, dominantMood: 'calm', entries: [] };
}

// ═══════════════════════════════════════════════════════════════
// CHAT PERSISTENCE
// ═══════════════════════════════════════════════════════════════

export async function saveChat(_sessionId: string, _messages: ChatMessage[]): Promise<void> {
    console.warn('[web] saveChat is a no-op on web');
}

export async function loadChat(_sessionId: string): Promise<ChatMessage[]> {
    return [];
}

// ═══════════════════════════════════════════════════════════════
// JOURNAL
// ═══════════════════════════════════════════════════════════════

export async function saveJournalEntry(_mood: string, _messages: ChatMessage[]): Promise<void> {
    console.warn('[web] saveJournalEntry is a no-op on web');
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
    return [];
}

// ═══════════════════════════════════════════════════════════════
// STREAKS
// ═══════════════════════════════════════════════════════════════

export async function updateStreak(): Promise<StreakData> {
    return { currentStreak: 0, lastCheckInDate: '', totalCheckIns: 0 };
}

export async function getStreak(): Promise<StreakData> {
    return { currentStreak: 0, lastCheckInDate: '', totalCheckIns: 0 };
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export async function exportAllData(): Promise<string> {
    return JSON.stringify({ exportedAt: new Date().toISOString(), app: 'InnerCircle Wellness (web stub)', note: 'No data stored on web' }, null, 2);
}

// ═══════════════════════════════════════════════════════════════
// AFFIRMATIONS  (works on every platform — no native deps)
// ═══════════════════════════════════════════════════════════════

const AFFIRMATIONS = [
    "You're doing better than you think. 🌿",
    "It's okay to have a slow day. 💚",
    "Your feelings are valid, always.",
    "Small steps still move you forward. 🌱",
    "You deserve kindness — especially from yourself.",
    "Breathe. You're exactly where you need to be.",
    "Progress isn't always visible. Trust the process. ✨",
    "You don't have to be perfect to be worthy.",
    "Today is a new page. Write it gently. 📖",
    "Rest is not laziness. It's recovery. 😴",
    "You've survived 100% of your hard days. 💪",
    "It's okay to ask for help. That's strength.",
    "You matter more than you know. 💜",
    "One moment at a time. That's enough.",
    "You're not behind. You're on your own timeline. 🌟",
    "Healing isn't linear. Be patient with yourself.",
    "You are enough, exactly as you are.",
    "The storm will pass. Hold on. 🌈",
    "Your peace matters. Protect it. 🛡️",
    "You showed up today. That counts. 💚",
    "Gentle with yourself. Gentle with others. 🤗",
    "Tomorrow is a fresh start. Always.",
    "You carry more strength than you realize.",
    "Sometimes the bravest thing is just getting through the day.",
    "You're not alone in this. I'm here. 🌿",
    "It's okay to feel everything. That makes you human.",
    "You've come so far. Don't forget that.",
    "Your heart knows the way. Trust it. 💚",
    "Even on hard days, you're growing.",
    "Be proud of who you're becoming. ✨",
];

export function getDailyAffirmation(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
    return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
}
