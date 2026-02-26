import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Switch, Platform, Modal
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Bell, Clock, Leaf, Flame, AlertCircle } from 'lucide-react-native';
import { CalmBackground } from '../../components/AmbientBackground';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { getNotificationSettings, NotificationSettings } from '../../services/storage.service';
import { toggleNotificationSetting, requestNotificationPermissions, scheduleAllNotifications } from '../../services/notification.service';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function NotificationsScreen() {
    const scheme = useColorScheme() ?? 'light';
    const theme = colors[scheme];
    const [settings, setSettings] = useState<NotificationSettings>({
        checkInEnabled: false, checkInTime: "09:00",
        mindfulnessEnabled: false, mindfulnessIntervalHours: 3,
        streakEnabled: false
    });
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
    const [showTimePicker, setShowTimePicker] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadSettings();
            checkPermissions();
        }, [])
    );

    const checkPermissions = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionGranted(status === 'granted');
    };

    const loadSettings = async () => {
        const data = await getNotificationSettings();
        setSettings(data);
    };

    const handleRequestPermission = async () => {
        const granted = await requestNotificationPermissions();
        setPermissionGranted(granted);
        if (granted) {
            // Re-schedule everything now that we have permission
            await scheduleAllNotifications();
        }
    };

    const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
        if (value && !permissionGranted) {
            const granted = await requestNotificationPermissions();
            setPermissionGranted(granted);
            if (!granted) return; // Cannot enable if permission denied
        }

        const newSettings = await toggleNotificationSetting(key, value);
        setSettings(newSettings);
    };

    const handleTimeChange = async (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }

        if (selectedDate) {
            const h = selectedDate.getHours().toString().padStart(2, '0');
            const m = selectedDate.getMinutes().toString().padStart(2, '0');
            const newTime = `${h}:${m}`;
            const newSettings = await toggleNotificationSetting('checkInTime', newTime);
            setSettings(newSettings);
        }
    };

    // Construct a Date object from HH:mm string for the picker to consume
    const getPickerDate = () => {
        const [h, m] = settings.checkInTime.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
    };

    const INTERVALS = [2, 3, 4, 6, 8];
    const handleIntervalChange = async () => {
        const currentIndex = INTERVALS.indexOf(settings.mindfulnessIntervalHours);
        const nextInterval = INTERVALS[(currentIndex + 1) % INTERVALS.length];
        const newSettings = await toggleNotificationSetting('mindfulnessIntervalHours', nextInterval as any);
        setSettings(newSettings);
    };

    const formatTime = (time24: string) => {
        const [h, m] = time24.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
    };

    return (
        <CalmBackground>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Gentle reminders for your wellness 🔔
                </Text>

                {permissionGranted === false && (
                    <View style={[styles.permissionCard, { backgroundColor: theme.warning + '15', borderColor: theme.warning }]}>
                        <AlertCircle size={20} color={theme.warning} />
                        <View style={{ flex: 1, marginLeft: spacing.sm }}>
                            <Text style={[styles.permissionTitle, { color: theme.text }]}>Permissions Denied</Text>
                            <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
                                Please enable notifications in your device settings to receive reminders.
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleRequestPermission}
                            style={[styles.permissionBtn, { backgroundColor: theme.warning }]}
                        >
                            <Text style={styles.permissionBtnText}>Enable</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Daily Check-In */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconRow}>
                            <Bell size={20} color={theme.primary} />
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Check-In</Text>
                        </View>
                        <Switch
                            value={settings.checkInEnabled}
                            onValueChange={(v) => handleToggle('checkInEnabled', v)}
                            trackColor={{ false: theme.border, true: theme.primaryLight }}
                            thumbColor={settings.checkInEnabled ? theme.primary : '#f4f3f4'}
                        />
                    </View>
                    <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                        A friendly reminder with a daily quote to check in on how you're feeling.
                    </Text>
                    {settings.checkInEnabled && (
                        <View style={[styles.settingRow, { borderTopColor: theme.border }]}>
                            <View style={styles.iconRow}>
                                <Clock size={16} color={theme.textLight} />
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Time</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.pickerBtn, { backgroundColor: theme.surfaceTint }]}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Text style={[styles.pickerText, { color: theme.primary }]}>
                                    {formatTime(settings.checkInTime)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Show Time Picker Overlay (Android) or Inline/Modal (iOS) */}
                {showTimePicker && (
                    <DateTimePicker
                        value={getPickerDate()}
                        mode="time"
                        display="default"
                        onChange={handleTimeChange}
                        style={{ alignSelf: 'center', marginTop: 10 }}
                    />
                )}

                {/* Mindfulness Nudges */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconRow}>
                            <Leaf size={20} color={theme.primary} />
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Mindful Moments</Text>
                        </View>
                        <Switch
                            value={settings.mindfulnessEnabled}
                            onValueChange={(v) => handleToggle('mindfulnessEnabled', v)}
                            trackColor={{ false: theme.border, true: theme.primaryLight }}
                            thumbColor={settings.mindfulnessEnabled ? theme.primary : '#f4f3f4'}
                        />
                    </View>
                    <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                        Periodic nudges to take a breath and center yourself throughout the day.
                    </Text>
                    {settings.mindfulnessEnabled && (
                        <View style={[styles.settingRow, { borderTopColor: theme.border }]}>
                            <View style={styles.iconRow}>
                                <Clock size={16} color={theme.textLight} />
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Frequency</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.pickerBtn, { backgroundColor: theme.surfaceTint }]}
                                onPress={handleIntervalChange}
                            >
                                <Text style={[styles.pickerText, { color: theme.primary }]}>
                                    Every {settings.mindfulnessIntervalHours} hours
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Streak Reminder */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconRow}>
                            <Flame size={20} color={theme.primary} />
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Streak Saver</Text>
                        </View>
                        <Switch
                            value={settings.streakEnabled}
                            onValueChange={(v) => handleToggle('streakEnabled', v)}
                            trackColor={{ false: theme.border, true: theme.primaryLight }}
                            thumbColor={settings.streakEnabled ? theme.primary : '#f4f3f4'}
                        />
                    </View>
                    <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                        A lifeline reminder at 8:00 PM if you haven't checked in yet to keep your streak alive.
                    </Text>
                </View>

            </ScrollView>
        </CalmBackground>
    );
}

const styles = StyleSheet.create({
    scroll: { flex: 1 },
    content: { padding: spacing.xl, paddingTop: spacing.xxl + spacing.md, paddingBottom: spacing.xxl },
    title: { fontSize: typography.sizes.xxxl, fontWeight: '800' },
    subtitle: { fontSize: typography.sizes.base, marginTop: spacing.xs, marginBottom: spacing.xl },

    permissionCard: {
        flexDirection: 'row', alignItems: 'center',
        padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1,
        marginBottom: spacing.lg,
    },
    permissionTitle: { fontSize: typography.sizes.sm, fontWeight: '700' },
    permissionText: { fontSize: typography.sizes.xs, marginTop: 2 },
    permissionBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
    permissionBtnText: { color: '#FFF', fontSize: typography.sizes.xs, fontWeight: '700' },

    card: {
        borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.md,
        shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 10, elevation: 1,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
    iconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    cardTitle: { fontSize: typography.sizes.lg, fontWeight: '700' },
    cardDesc: { fontSize: typography.sizes.sm, lineHeight: typography.sizes.base * 1.4 },

    settingRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1
    },
    settingLabel: { fontSize: typography.sizes.base, fontWeight: '600' },
    pickerBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
    pickerText: { fontSize: typography.sizes.sm, fontWeight: '700' },
});
