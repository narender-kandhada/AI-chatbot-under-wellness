/**
 * Storage Service — SQLite-backed on-device database.
 *
 * All data stays on the user's device. Tables:
 *  - moods: daily mood check-ins
 *  - chats: persisted chat messages
 *  - journal: saved conversation entries
 *  - streaks: daily check-in streak tracking
 *
 * Uses expo-sqlite for efficient, queryable local storage.
 */
import * as SQLite from 'expo-sqlite';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface MoodEntry {
    mood: string;
    emotion?: string;
    timestamp: string;    // ISO string
    date: string;         // YYYY-MM-DD
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
    date: string;         // ISO string
    mood: string;
    preview: string;      // first user message text
    messages: ChatMessage[];
}

export interface StreakData {
    currentStreak: number;
    lastCheckInDate: string;  // YYYY-MM-DD
    totalCheckIns: number;
}

// ═══════════════════════════════════════════════════════════════
// DATABASE INIT
// ═══════════════════════════════════════════════════════════════

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
    if (!db) {
        db = SQLite.openDatabaseSync('innercircle.db');
        initTables();
    }
    return db;
}

function initTables(): void {
    const database = db!;

    database.execSync(`
    CREATE TABLE IF NOT EXISTS moods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mood TEXT NOT NULL,
      emotion TEXT,
      timestamp TEXT NOT NULL,
      date TEXT NOT NULL
    );
  `);

    database.execSync(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      msg_id TEXT NOT NULL,
      text TEXT NOT NULL,
      is_user INTEGER NOT NULL,
      timestamp TEXT,
      emotion TEXT,
      confidence REAL,
      actions TEXT
    );
  `);

    database.execSync(`
    CREATE TABLE IF NOT EXISTS journal (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      mood TEXT NOT NULL,
      preview TEXT NOT NULL,
      messages TEXT NOT NULL
    );
  `);

    database.execSync(`
    CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_streak INTEGER NOT NULL DEFAULT 0,
      last_checkin_date TEXT NOT NULL DEFAULT '',
      total_checkins INTEGER NOT NULL DEFAULT 0
    );
  `);

    // Ensure streaks row exists
    const row = database.getFirstSync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM streaks');
    if (!row || row.cnt === 0) {
        database.runSync('INSERT INTO streaks (id, current_streak, last_checkin_date, total_checkins) VALUES (1, 0, "", 0)');
    }
}

// ═══════════════════════════════════════════════════════════════
// MOOD HISTORY
// ═══════════════════════════════════════════════════════════════

export async function saveMoodEntry(mood: string, emotion?: string): Promise<void> {
    try {
        const database = getDb();
        const now = new Date();
        database.runSync(
            'INSERT INTO moods (mood, emotion, timestamp, date) VALUES (?, ?, ?, ?)',
            mood, emotion || null, now.toISOString(), now.toISOString().split('T')[0]
        );

        // Clean up entries older than 90 days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        database.runSync('DELETE FROM moods WHERE timestamp < ?', cutoff.toISOString());
    } catch (e) {
        console.error('Failed to save mood entry:', e);
    }
}

export async function getMoodHistory(days: number = 90): Promise<MoodEntry[]> {
    try {
        const database = getDb();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const rows = database.getAllSync<{ mood: string; emotion: string | null; timestamp: string; date: string }>(
            'SELECT mood, emotion, timestamp, date FROM moods WHERE timestamp >= ? ORDER BY timestamp ASC',
            cutoff.toISOString()
        );
        return rows.map(r => ({
            mood: r.mood,
            emotion: r.emotion || undefined,
            timestamp: r.timestamp,
            date: r.date,
        }));
    } catch {
        return [];
    }
}

export async function getWeeklyMoodSummary(): Promise<{
    moodCounts: Record<string, number>;
    totalDays: number;
    dominantMood: string;
    entries: MoodEntry[];
}> {
    const entries = await getMoodHistory(7);
    const moodCounts: Record<string, number> = {};

    for (const entry of entries) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }

    const dominantMood = Object.entries(moodCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'calm';

    const uniqueDays = new Set(entries.map(e => e.date));

    return { moodCounts, totalDays: uniqueDays.size, dominantMood, entries };
}

// ═══════════════════════════════════════════════════════════════
// CHAT PERSISTENCE
// ═══════════════════════════════════════════════════════════════

export async function saveChat(sessionId: string, messages: ChatMessage[]): Promise<void> {
    try {
        const database = getDb();
        // Clear old messages for this session and insert fresh
        database.runSync('DELETE FROM chats WHERE session_id = ?', sessionId);
        for (const m of messages) {
            database.runSync(
                'INSERT INTO chats (session_id, msg_id, text, is_user, timestamp, emotion, confidence, actions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                sessionId, m.id, m.text, m.isUser ? 1 : 0, m.timestamp,
                m.emotion || null, m.confidence || null, m.actions ? JSON.stringify(m.actions) : null
            );
        }
    } catch (e) {
        console.error('Failed to save chat:', e);
    }
}

export async function loadChat(sessionId: string): Promise<ChatMessage[]> {
    try {
        const database = getDb();
        const rows = database.getAllSync<{
            msg_id: string; text: string; is_user: number; timestamp: string;
            emotion: string | null; confidence: number | null; actions: string | null;
        }>(
            'SELECT msg_id, text, is_user, timestamp, emotion, confidence, actions FROM chats WHERE session_id = ? ORDER BY id ASC',
            sessionId
        );
        return rows.map(r => ({
            id: r.msg_id,
            text: r.text,
            isUser: r.is_user === 1,
            timestamp: r.timestamp,
            emotion: r.emotion || undefined,
            confidence: r.confidence || undefined,
            actions: r.actions ? JSON.parse(r.actions) : undefined,
        }));
    } catch {
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════
// JOURNAL
// ═══════════════════════════════════════════════════════════════

export async function saveJournalEntry(
    mood: string,
    messages: ChatMessage[]
): Promise<void> {
    try {
        const database = getDb();
        const userMessages = messages.filter(m => m.isUser);
        const entry: JournalEntry = {
            id: `journal_${Date.now()}`,
            date: new Date().toISOString(),
            mood,
            preview: userMessages[0]?.text || 'Chat session',
            messages,
        };
        database.runSync(
            'INSERT INTO journal (id, date, mood, preview, messages) VALUES (?, ?, ?, ?, ?)',
            entry.id, entry.date, entry.mood, entry.preview, JSON.stringify(entry.messages)
        );

        // Keep last 100 entries
        database.runSync(`
      DELETE FROM journal WHERE id NOT IN (
        SELECT id FROM journal ORDER BY date DESC LIMIT 100
      )
    `);
    } catch (e) {
        console.error('Failed to save journal:', e);
    }
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
    try {
        const database = getDb();
        const rows = database.getAllSync<{
            id: string; date: string; mood: string; preview: string; messages: string;
        }>('SELECT * FROM journal ORDER BY date DESC');

        return rows.map(r => ({
            id: r.id,
            date: r.date,
            mood: r.mood,
            preview: r.preview,
            messages: JSON.parse(r.messages),
        }));
    } catch {
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════
// STREAKS
// ═══════════════════════════════════════════════════════════════

export async function updateStreak(): Promise<StreakData> {
    try {
        const database = getDb();
        const today = new Date().toISOString().split('T')[0];
        const row = database.getFirstSync<{
            current_streak: number; last_checkin_date: string; total_checkins: number;
        }>('SELECT * FROM streaks WHERE id = 1');

        if (!row) return { currentStreak: 1, lastCheckInDate: today, totalCheckIns: 1 };

        if (row.last_checkin_date === today) {
            return { currentStreak: row.current_streak, lastCheckInDate: row.last_checkin_date, totalCheckIns: row.total_checkins };
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak: number;
        if (row.last_checkin_date === yesterdayStr) {
            newStreak = row.current_streak + 1;
        } else {
            newStreak = 1;
        }

        const newTotal = row.total_checkins + 1;
        database.runSync(
            'UPDATE streaks SET current_streak = ?, last_checkin_date = ?, total_checkins = ? WHERE id = 1',
            newStreak, today, newTotal
        );

        return { currentStreak: newStreak, lastCheckInDate: today, totalCheckIns: newTotal };
    } catch {
        return { currentStreak: 1, lastCheckInDate: '', totalCheckIns: 1 };
    }
}

export async function getStreak(): Promise<StreakData> {
    try {
        const database = getDb();
        const row = database.getFirstSync<{
            current_streak: number; last_checkin_date: string; total_checkins: number;
        }>('SELECT * FROM streaks WHERE id = 1');

        return row
            ? { currentStreak: row.current_streak, lastCheckInDate: row.last_checkin_date, totalCheckIns: row.total_checkins }
            : { currentStreak: 0, lastCheckInDate: '', totalCheckIns: 0 };
    } catch {
        return { currentStreak: 0, lastCheckInDate: '', totalCheckIns: 0 };
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export async function exportAllData(): Promise<string> {
    const moods = await getMoodHistory(90);
    const journal = await getJournalEntries();
    const streak = await getStreak();

    const exportData = {
        exportedAt: new Date().toISOString(),
        app: 'InnerCircle Wellness',
        streak,
        moodHistory: moods,
        journalEntries: journal.map(j => ({
            date: j.date,
            mood: j.mood,
            messages: j.messages.map(m => ({
                role: m.isUser ? 'user' : 'ai',
                text: m.text,
            })),
        })),
    };

    return JSON.stringify(exportData, null, 2);
}

// ═══════════════════════════════════════════════════════════════
// AFFIRMATIONS
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
