import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];

  const getButtonStyle = () => {
    if (disabled || loading) {
      return [
        styles.button,
        { backgroundColor: theme.border },
        fullWidth && styles.fullWidth,
      ];
    }

    switch (variant) {
      case 'primary':
        return [
          styles.button,
          { backgroundColor: theme.primary },
          fullWidth && styles.fullWidth,
        ];
      case 'secondary':
        return [
          styles.button,
          { backgroundColor: theme.secondary },
          fullWidth && styles.fullWidth,
        ];
      case 'ghost':
        return [
          styles.button,
          styles.ghostButton,
          { borderColor: theme.border },
          fullWidth && styles.fullWidth,
        ];
      default:
        return [
          styles.button,
          { backgroundColor: theme.primary },
          fullWidth && styles.fullWidth,
        ];
    }
  };

  const getTextStyle = () => {
    if (disabled || loading) {
      return [styles.buttonText, { color: theme.textLight }];
    }

    switch (variant) {
      case 'ghost':
        return [styles.buttonText, { color: theme.text }];
      default:
        return [styles.buttonText, { color: '#FFFFFF' }];
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  fullWidth: {
    width: '100%',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
  },
});
