import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getNotificationSettings, NotificationSettings, saveNotificationSettings, AFFIRMATIONS } from './storage.service';

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Helper to get a random affirmation and format it for Android notifications
function getRandomAffirmation(): string {
    const quote = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];

    // Add dynamic emojis based on the quote's tone/keywords
    let emoji = '🤍';
    const lowerQuote = quote.toLowerCase();

    if (lowerQuote.includes('grow') || lowerQuote.includes('progress') || lowerQuote.includes('forward')) {
        emoji = '🌱';
    } else if (lowerQuote.includes('rest') || lowerQuote.includes('slow') || lowerQuote.includes('breathe') || lowerQuote.includes('peace')) {
        emoji = '🧘‍♀️';
    } else if (lowerQuote.includes('strength') || lowerQuote.includes('proud') || lowerQuote.includes('brave')) {
        emoji = '🌟';
    } else if (lowerQuote.includes('gentle') || lowerQuote.includes('kind') || lowerQuote.includes('heart') || lowerQuote.includes('feel')) {
        emoji = '💕';
    } else if (lowerQuote.includes('new ') || lowerQuote.includes('start') || lowerQuote.includes('fresh')) {
        emoji = '🌅';
    }

    // Just return the raw string with the emoji. It will be bolded natively by being the Title.
    return `${quote} ${emoji}`;
}

export async function requestNotificationPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return false;
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6B8E6E',
        });
    }

    return true;
}

export async function scheduleAllNotifications() {
    // 1. Cancel all existing notifications first to ensure we don't duplicate
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 2. Fetch current settings
    const settings = await getNotificationSettings();

    // 3. Skip if permissions denied
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;

    // 4. Schedule Daily Check-In Reminder
    if (settings.checkInEnabled) {
        const [hour, minute] = settings.checkInTime.split(':').map(Number);
        const quote = getRandomAffirmation();

        await Notifications.scheduleNotificationAsync({
            content: {
                title: quote, // The title is naturally bold on Android
                body: `Daily Check-In 🌿\nHow are you feeling today? Take a moment to check in.`,
                data: { type: 'checkin' },
            },
            trigger: {
                hour,
                minute,
                repeats: true,
                type: 'daily'
            } as any,
        });
    }

    // 5. Schedule Mindfulness Nudges (every N hours)
    if (settings.mindfulnessEnabled) {
        // Schedule as a repeating time interval
        // interval is in hours, so convert to seconds
        const seconds = settings.mindfulnessIntervalHours * 60 * 60;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Mindful Moment 🧘',
                body: 'Take a breath. A mindful moment is waiting for you.',
                data: { type: 'mindfulness' },
            },
            trigger: {
                seconds,
                repeats: true,
                type: 'timeInterval'
            } as any,
        });
    }

    // 6. Schedule Streak Encouragement (8 PM)
    if (settings.streakEnabled) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Keep your streak alive! 🔥',
                body: "Don't break your streak! You've been consistent — keep it up.",
                data: { type: 'streak' },
            },
            trigger: {
                hour: 20, // 8 PM
                minute: 0,
                repeats: true,
                type: 'daily'
            } as any,
        });
    }
}

export async function toggleNotificationSetting<K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
): Promise<NotificationSettings> {
    const settings = await getNotificationSettings();
    settings[key] = value;
    await saveNotificationSettings(settings);

    // Reschedule everything with the new settings
    await scheduleAllNotifications();
    return settings;
}
