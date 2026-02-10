import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/Button';
import { MoodSelector, MoodType } from '../../components/MoodSelector';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

export default function CheckInScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [additionalThoughts, setAdditionalThoughts] = useState('');

  const handleContinue = () => {
    if (selectedMood) {
      router.push({ pathname: 'chat' } as any);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            How are you feeling right now?
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your emotions are valid, whatever they may be
          </Text>
        </View>

        <View style={styles.moodSection}>
          <MoodSelector
            selectedMood={selectedMood}
            onSelectMood={setSelectedMood}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Want to share more? (Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Take your time, there's no rush..."
            placeholderTextColor={theme.textLight}
            value={additionalThoughts}
            onChangeText={setAdditionalThoughts}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedMood}
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: '700',
    marginBottom: spacing.md,
    lineHeight: typography.sizes.xxxl * typography.lineHeights.tight,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * typography.lineHeights.normal,
  },
  moodSection: {
    marginBottom: spacing.xl,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: typography.sizes.base,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    minHeight: 120,
  },
  buttonContainer: {
    marginTop: 'auto',
  },
});
