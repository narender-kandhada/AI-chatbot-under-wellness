import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, moodColors, spacing, typography, borderRadius } from '../constants/theme';

export type MoodType = 'happy' | 'okay' | 'calm' | 'tired' | 'anxious' | 'sad';

const MOODS: { type: MoodType; emoji: string; label: string }[] = [
  { type: 'happy', emoji: '😊', label: 'Happy' },
  { type: 'okay', emoji: '😐', label: 'Okay' },
  { type: 'calm', emoji: '😌', label: 'Calm' },
  { type: 'tired', emoji: '😴', label: 'Tired' },
  { type: 'anxious', emoji: '😰', label: 'Anxious' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
];

interface MoodSelectorProps {
  selectedMood: MoodType | null;
  onSelectMood: (mood: MoodType) => void;
}

function MoodButton({ mood, isSelected, onPress }: {
  mood: typeof MOODS[0]; isSelected: boolean; onPress: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const mc = moodColors[scheme][mood.type];
  const theme = colors[scheme];
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={[styles.moodButtonWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={handlePress} activeOpacity={0.7}
        style={[
          styles.moodButton,
          {
            backgroundColor: isSelected ? mc.bg : theme.surface,
            borderColor: isSelected ? mc.accent : theme.border,
          },
        ]}
      >
        <Text style={styles.emoji}>{mood.emoji}</Text>
        <Text style={[styles.label, { color: isSelected ? mc.accent : theme.textSecondary }]}>{mood.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function MoodSelector({ selectedMood, onSelectMood }: MoodSelectorProps) {
  return (
    <View style={styles.grid}>
      {MOODS.map((mood) => (
        <MoodButton key={mood.type} mood={mood} isSelected={selectedMood === mood.type} onPress={() => onSelectMood(mood.type)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: -6, // negative margin to offset item padding
  },
  moodButtonWrap: {
    width: '33.33%', // 3 columns
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  moodButton: {
    paddingVertical: spacing.md, borderRadius: borderRadius.xl,
    borderWidth: 1.5, alignItems: 'center', gap: spacing.xs,
    shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  emoji: { fontSize: 28 },
  label: { fontSize: typography.sizes.sm, fontWeight: '600' },
});
