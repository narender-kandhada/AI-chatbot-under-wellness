import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Switch,
} from 'react-native';
import { Card } from '../../components/Card';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { Shield, Trash2, EyeOff, Lock } from 'lucide-react-native';

export default function PrivacyScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const [saveHistory, setSaveHistory] = useState(true);
  const [incognitoMode, setIncognitoMode] = useState(false);

  const privacyPrinciples = [
    {
      id: '1',
      icon: Lock,
      title: 'Your data belongs to you',
      description:
        'Everything you share stays on your device. We never sell or share your personal information.',
    },
    {
      id: '2',
      icon: Trash2,
      title: 'Delete conversations anytime',
      description:
        'You have full control. Delete individual messages or entire conversations whenever you want.',
    },
    {
      id: '3',
      icon: Shield,
      title: 'No sharing without consent',
      description:
        'Your conversations are private. We will never share them with third parties without your explicit permission.',
    },
    {
      id: '4',
      icon: EyeOff,
      title: 'Anonymous by design',
      description:
        'Use the app without creating an account. No email, no phone number, no tracking.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Privacy & Trust
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Your safety and privacy matter to us
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.principlesSection}>
          {privacyPrinciples.map((principle) => (
            <View
              key={principle.id}
              style={[
                styles.principleCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.principleIcon,
                  { backgroundColor: theme.primary + '20' },
                ]}
              >
                <principle.icon size={24} color={theme.primary} />
              </View>
              <View style={styles.principleContent}>
                <Text style={[styles.principleTitle, { color: theme.text }]}>
                  {principle.title}
                </Text>
                <Text
                  style={[
                    styles.principleDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {principle.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Card title="Privacy Settings">
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Save conversation history
              </Text>
              <Text
                style={[styles.settingDescription, { color: theme.textSecondary }]}
              >
                Keep your conversations for reflection
              </Text>
            </View>
            <Switch
              value={saveHistory}
              onValueChange={setSaveHistory}
              trackColor={{
                false: theme.border,
                true: theme.primary + '80',
              }}
              thumbColor={saveHistory ? theme.primary : theme.textLight}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Incognito mode
              </Text>
              <Text
                style={[styles.settingDescription, { color: theme.textSecondary }]}
              >
                No data saved, complete privacy
              </Text>
            </View>
            <Switch
              value={incognitoMode}
              onValueChange={setIncognitoMode}
              trackColor={{
                false: theme.border,
                true: theme.primary + '80',
              }}
              thumbColor={incognitoMode ? theme.primary : theme.textLight}
            />
          </View>
        </Card>

        <View
          style={[
            styles.disclaimerBox,
            {
              backgroundColor: theme.surfaceSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
            InnerCircle is designed with your privacy as a priority. While we
            take every precaution to protect your data, please remember that
            this app is not a substitute for professional mental health care.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.sizes.xxxl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * typography.lineHeights.normal,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  principlesSection: {
    marginBottom: spacing.xl,
  },
  principleCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  principleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  principleContent: {
    flex: 1,
  },
  principleTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  principleDescription: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  disclaimerBox: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  disclaimerText: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    textAlign: 'center',
  },
});
