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

export interface NotificationSettings {
    checkInEnabled: boolean;
    checkInTime: string; // "HH:MM" e.g. "09:00"
    mindfulnessEnabled: boolean;
    mindfulnessIntervalHours: number; // 2-8
    streakEnabled: boolean;
}

export interface PrivacySettings {
    saveHistory: boolean;
    incognitoMode: boolean;
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

    database.execSync(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      check_in_enabled INTEGER NOT NULL DEFAULT 0,
      check_in_time TEXT NOT NULL DEFAULT "09:00",
      mindfulness_enabled INTEGER NOT NULL DEFAULT 0,
      mindfulness_interval_hours INTEGER NOT NULL DEFAULT 3,
      streak_enabled INTEGER NOT NULL DEFAULT 0
    );
  `);

    // Ensure notification_settings row exists
    const notifRow = database.getFirstSync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM notification_settings');
    if (!notifRow || notifRow.cnt === 0) {
        database.runSync(
            'INSERT INTO notification_settings (id, check_in_enabled, check_in_time, mindfulness_enabled, mindfulness_interval_hours, streak_enabled) VALUES (1, 0, "09:00", 0, 3, 0)'
        );
    }

        database.execSync(`
        CREATE TABLE IF NOT EXISTS privacy_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            save_history INTEGER NOT NULL DEFAULT 1,
            incognito_mode INTEGER NOT NULL DEFAULT 0
        );
    `);

        const privacyRow = database.getFirstSync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM privacy_settings');
        if (!privacyRow || privacyRow.cnt === 0) {
                database.runSync(
                        'INSERT INTO privacy_settings (id, save_history, incognito_mode) VALUES (1, 1, 0)'
                );
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
// NOTIFICATION SETTINGS
// ═══════════════════════════════════════════════════════════════

export async function getNotificationSettings(): Promise<NotificationSettings> {
    try {
        const database = getDb();
        const row = database.getFirstSync<{
            check_in_enabled: number; check_in_time: string;
            mindfulness_enabled: number; mindfulness_interval_hours: number;
            streak_enabled: number;
        }>('SELECT * FROM notification_settings WHERE id = 1');

        if (row) {
            return {
                checkInEnabled: row.check_in_enabled === 1,
                checkInTime: row.check_in_time,
                mindfulnessEnabled: row.mindfulness_enabled === 1,
                mindfulnessIntervalHours: row.mindfulness_interval_hours,
                streakEnabled: row.streak_enabled === 1,
            };
        }
    } catch (e) {
        console.error('Failed to get notification settings', e);
    }
    return {
        checkInEnabled: false, checkInTime: "09:00",
        mindfulnessEnabled: false, mindfulnessIntervalHours: 3,
        streakEnabled: false
    };
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
        const database = getDb();
        database.runSync(
            `UPDATE notification_settings SET 
              check_in_enabled = ?, check_in_time = ?, 
              mindfulness_enabled = ?, mindfulness_interval_hours = ?, 
              streak_enabled = ?
             WHERE id = 1`,
            settings.checkInEnabled ? 1 : 0, settings.checkInTime,
            settings.mindfulnessEnabled ? 1 : 0, settings.mindfulnessIntervalHours,
            settings.streakEnabled ? 1 : 0
        );
    } catch (e) {
        console.error('Failed to save notification settings', e);
    }
}

export async function getPrivacySettings(): Promise<PrivacySettings> {
    try {
        const database = getDb();
        const row = database.getFirstSync<{
            save_history: number;
            incognito_mode: number;
        }>('SELECT save_history, incognito_mode FROM privacy_settings WHERE id = 1');

        if (row) {
            return {
                saveHistory: row.save_history === 1,
                incognitoMode: row.incognito_mode === 1,
            };
        }
    } catch (e) {
        console.error('Failed to get privacy settings', e);
    }

    return {
        saveHistory: true,
        incognitoMode: false,
    };
}

export async function savePrivacySettings(settings: PrivacySettings): Promise<void> {
    try {
        const database = getDb();
        database.runSync(
            'UPDATE privacy_settings SET save_history = ?, incognito_mode = ? WHERE id = 1',
            settings.saveHistory ? 1 : 0,
            settings.incognitoMode ? 1 : 0
        );
    } catch (e) {
        console.error('Failed to save privacy settings', e);
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

export const AFFIRMATIONS = [
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

    // Additional wellness affirmations
    "Your effort today matters.",
    "You are learning and evolving every day.",
    "Peace begins with a single deep breath.",
    "Your story is still unfolding.",
    "Kindness to yourself changes everything.",
    "You are allowed to take up space.",
    "Your mind deserves calm and care.",
    "Small progress is still progress.",
    "Every day is a chance to reset.",
    "You are stronger than yesterday.",
    "Let today be gentle with you.",
    "You are worthy of rest.",
    "Your growth is happening quietly.",
    "It's okay to pause and breathe.",
    "Hope is always within reach.",
    "Your journey is unique and valuable.",
    "You deserve moments of joy.",
    "The present moment is enough.",
    "You are capable of healing.",
    "Your courage matters more than perfection.",
    "Even tiny wins deserve celebration.",
    "Be patient with your progress.",
    "You are building a brighter future.",
    "Your heart is resilient.",
    "Each day holds a new opportunity.",
    "You deserve inner peace.",
    "Growth takes time — trust it.",
    "You are allowed to start again.",
    "Your presence makes a difference.",
    "You are becoming your best self."
];

export function getDailyAffirmation(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
    return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
}
