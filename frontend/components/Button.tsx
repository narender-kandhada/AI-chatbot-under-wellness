import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, useColorScheme, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, gradients, spacing, typography, borderRadius } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  progress?: number;
}

export function Button({
  title, onPress, variant = 'primary', disabled = false, loading = false, fullWidth = false, progress,
}: ButtonProps) {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const grad = gradients[scheme];
  const scale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const nextProgress = Math.max(0, Math.min(progress ?? 0, 100));
    Animated.timing(progressAnim, {
      toValue: nextProgress,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const handlePressIn = () => {
    Animated.timing(scale, { toValue: 0.97, duration: 120, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (variant === 'ghost') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.fullWidth]}>
        <TouchableOpacity
          onPress={handlePress} disabled={disabled || loading}
          onPressIn={handlePressIn} onPressOut={handlePressOut}
          style={[styles.ghost, { borderColor: theme.primary + '30' }, disabled && styles.disabled]}
          activeOpacity={0.7}
        >
          <Text style={[styles.ghostText, { color: theme.primary }]}>{title}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'secondary') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.fullWidth]}>
        <TouchableOpacity
          onPress={handlePress} disabled={disabled || loading}
          onPressIn={handlePressIn} onPressOut={handlePressOut}
          style={[styles.secondaryBtn, { backgroundColor: theme.surfaceTint, borderColor: theme.border }, disabled && styles.disabled]}
          activeOpacity={0.7}
        >
          <Text style={[styles.secondaryText, { color: theme.primary }]}>{title}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      { transform: [{ scale }] }, fullWidth && styles.fullWidth,
      { shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
    ]}>
      <TouchableOpacity
        onPress={handlePress} disabled={disabled || loading}
        onPressIn={handlePressIn} onPressOut={handlePressOut}
        style={[styles.base, disabled && styles.disabled]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={disabled ? ['#888', '#888'] : [...grad.buttonPrimary] as [string, string]}
          style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          {typeof progress === 'number' && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.surfaceTint,
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          )}
          <View style={styles.content}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.text}>{title}</Text>}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: borderRadius.full, overflow: 'hidden' },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  gradient: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: borderRadius.full,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#FFFFFF', fontSize: typography.sizes.lg, fontWeight: '700' },
  ghost: {
    borderWidth: 1, borderRadius: borderRadius.full,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: 'center',
  },
  ghostText: { fontSize: typography.sizes.lg, fontWeight: '600' },
  secondaryBtn: {
    borderWidth: 1, borderRadius: borderRadius.full,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: 'center',
  },
  secondaryText: { fontSize: typography.sizes.lg, fontWeight: '600' },
});
