import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

export type MoodType = 'calm' | 'sad' | 'anxious' | 'tired' | 'okay' | 'happy';

interface MoodOption {
  id: MoodType;
  emoji: string;
  label: string;
}

const moods: MoodOption[] = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'okay', emoji: '😌', label: 'Okay' },
  { id: 'calm', emoji: '😇', label: 'Calm' },
  { id: 'tired', emoji: '😴', label: 'Tired' },
  { id: 'anxious', emoji: '😰', label: 'Anxious' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
];

interface MoodSelectorProps {
  selectedMood: MoodType | null;
  onSelectMood: (mood: MoodType) => void;
}

export function MoodSelector({
  selectedMood,
  onSelectMood,
}: MoodSelectorProps) {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];

  return (
    <View style={styles.container}>
      {moods.map((mood) => (
        <TouchableOpacity
          key={mood.id}
          style={[
            styles.moodButton,
            {
              backgroundColor:
                selectedMood === mood.id ? theme.primary : theme.surface,
              borderColor:
                selectedMood === mood.id ? theme.primaryDark : theme.border,
            },
          ]}
          onPress={() => onSelectMood(mood.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.emoji}>{mood.emoji}</Text>
          <Text
            style={[
              styles.label,
              {
                color:
                  selectedMood === mood.id ? '#FFFFFF' : theme.textSecondary,
              },
            ]}
          >
            {mood.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  moodButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  emoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
});
