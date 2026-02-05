import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { ArrowLeft, Wind, BookOpen, Hand } from 'lucide-react-native';

const suggestions = [
  {
    id: '1',
    icon: Wind,
    title: 'Breathing Exercise',
    description: 'A 3-minute guided breathing to help you feel centered',
  },
  {
    id: '2',
    icon: BookOpen,
    title: 'Journal Prompt',
    description: 'Write about something that brought you peace today',
  },
  {
    id: '3',
    icon: Hand,
    title: 'Grounding Technique',
    description: 'The 5-4-3-2-1 method to reconnect with the present',
  },
];

export default function ReflectionScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Reflection
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Card title="What I heard you say">
            <Text style={[styles.reflectionText, { color: theme.textSecondary }]}>
            You&apos;re feeling a mix of emotions right now, and that&apos;s completely
            okay. It sounds like there&apos;s a lot on your mind, and you&apos;re working
            through some difficult feelings.
          </Text>
          <Text style={[styles.reflectionText, { color: theme.textSecondary }]}>
            Remember that acknowledging how you feel is a brave and important
            step.
          </Text>
        </Card>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Gentle suggestions
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            You might find these helpful, but there&apos;s no pressure
          </Text>
        </View>

        {suggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion.id}
            style={[
              styles.suggestionCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.primary + '20' },
              ]}
            >
              <suggestion.icon size={24} color={theme.primary} />
            </View>
            <View style={styles.suggestionContent}>
              <Text style={[styles.suggestionTitle, { color: theme.text }]}>
                {suggestion.title}
              </Text>
              <Text
                style={[
                  styles.suggestionDescription,
                  { color: theme.textSecondary },
                ]}
              >
                {suggestion.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.noteContainer}>
          <Text style={[styles.note, { color: theme.textLight }]}>
            These are just ideas. Do what feels right for you right now. Taking
            care of yourself looks different for everyone.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Continue Chatting"
            onPress={() => router.back()}
            fullWidth
          />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  reflectionText: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
  section: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },
  suggestionCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  suggestionDescription: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },
  noteContainer: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  note: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
});
