import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
}

export function ChatBubble({ message, isUser, timestamp }: ChatBubbleProps) {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];

  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      <View
        style={[
          styles.bubble,
          isUser
            ? {
                backgroundColor: theme.primary,
                borderBottomRightRadius: borderRadius.sm,
              }
            : {
                backgroundColor: theme.surfaceSecondary,
                borderBottomLeftRadius: borderRadius.sm,
              },
        ]}
      >
        <Text
          style={[
            styles.message,
            { color: isUser ? '#FFFFFF' : theme.text },
          ]}
        >
          {message}
        </Text>
      </View>
      {timestamp && (
        <Text style={[styles.timestamp, { color: theme.textLight }]}>
          {timestamp}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  message: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },
  timestamp: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
    marginHorizontal: spacing.sm,
  },
});
