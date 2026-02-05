import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../constants/theme';
import { Heart } from 'lucide-react-native';

export default function WelcomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];

  const handleGetStarted = () => {
    router.push({ pathname: '(tabs)' } as any);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.primary + '20' },
          ]}
        >
          <Heart size={48} color={theme.primary} strokeWidth={2} />
        </View>

        <Text style={[styles.appName, { color: theme.text }]}>
          InnerCircle
        </Text>

        <Text style={[styles.tagline, { color: theme.textSecondary }]}>
          A safe place to talk.{'\n'}A companion that listens.
        </Text>
      </View>

      <View style={styles.disclaimerContainer}>
        <View
          style={[
            styles.disclaimerBox,
            {
              backgroundColor: theme.surfaceSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.disclaimerTitle, { color: theme.text }]}>
            Welcome to your space
          </Text>
          <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
            This app offers emotional support and self-reflection. It is not a
            replacement for professional mental health care.
          </Text>
          <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
            If you&apos;re experiencing a crisis or need immediate help, please reach
            out to a mental health professional or crisis helpline.
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Get Started" onPress={handleGetStarted} fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  appName: {
    fontSize: typography.sizes.huge,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  tagline: {
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    lineHeight: typography.sizes.lg * typography.lineHeights.relaxed,
  },
  disclaimerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  disclaimerBox: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
  },
  disclaimerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  disclaimerText: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
  buttonContainer: {
    marginTop: spacing.xl,
  },
});
