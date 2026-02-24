import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  accentColor?: string;
  noPadding?: boolean;
}

export function Card({ title, subtitle, children, accentColor, noPadding }: CardProps) {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderLight, shadowColor: theme.shadow }]}>
      {accentColor && <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />}
      <View style={noPadding ? undefined : styles.content}>
        {title && (
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
          </View>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 12, elevation: 3,
  },
  accentStrip: { height: 3, width: '100%' },
  content: { padding: spacing.lg },
  header: { marginBottom: spacing.md },
  title: { fontSize: typography.sizes.lg, fontWeight: '700' },
  subtitle: { fontSize: typography.sizes.sm, marginTop: spacing.xs },
});
