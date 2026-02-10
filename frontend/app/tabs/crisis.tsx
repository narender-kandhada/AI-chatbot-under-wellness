import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { Heart, Phone } from 'lucide-react-native';

const resources = [
  {
    id: '1',
    name: 'National Crisis Helpline',
    description: 'Available 24/7 for immediate support',
    number: 'XXX-XXX-XXXX',
  },
  {
    id: '2',
    name: 'Mental Health Support Line',
    description: 'Trained counselors ready to help',
    number: 'XXX-XXX-XXXX',
  },
  {
    id: '3',
    name: 'Text Support Service',
    description: 'Text-based crisis support',
    number: 'Text SUPPORT to XXXXX',
  },
];

export default function CrisisScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View
          style={[
            styles.heroSection,
            { backgroundColor: theme.primary + '15' },
          ]}
        >
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: theme.primary + '30' },
            ]}
          >
            <Heart size={40} color={theme.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            You don&apos;t have to go through this alone
          </Text>
          <Text style={[styles.heroText, { color: theme.textSecondary }]}>
            If you&apos;re in crisis or need immediate support, reaching out is a
            sign of strength. Help is available, and people care about you.
          </Text>
        </View>

        <View style={styles.actionsSection}>
          <Button
            title="Reach out to someone I trust"
            onPress={() => {}}
            fullWidth
            variant="primary"
          />
          <View style={{ height: spacing.md }} />
          <Button
            title="View support resources"
            onPress={() => {}}
            fullWidth
            variant="secondary"
          />
        </View>

        <Card title="Support Resources">
          <Text
            style={[
              styles.resourcesIntro,
              { color: theme.textSecondary },
            ]}
          >
            These are placeholder numbers. In a real app, these would be actual
            crisis helplines in your region.
          </Text>
        </Card>

        <View style={styles.resourcesList}>
          {resources.map((resource) => (
            <TouchableOpacity
              key={resource.id}
              style={[
                styles.resourceCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.resourceIcon,
                  { backgroundColor: theme.success + '30' },
                ]}
              >
                <Phone size={20} color={theme.success} />
              </View>
              <View style={styles.resourceContent}>
                <Text style={[styles.resourceName, { color: theme.text }]}>
                  {resource.name}
                </Text>
                <Text
                  style={[
                    styles.resourceDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {resource.description}
                </Text>
                <Text
                  style={[styles.resourceNumber, { color: theme.primary }]}
                >
                  {resource.number}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={[
            styles.reminderBox,
            {
              backgroundColor: theme.calm + '20',
              borderColor: theme.calm,
            },
          ]}
        >
          <Text style={[styles.reminderTitle, { color: theme.text }]}>
            Remember
          </Text>
          <Text style={[styles.reminderText, { color: theme.textSecondary }]}>
            • You deserve support and care
          </Text>
            <Text style={[styles.reminderText, { color: theme.textSecondary }]}>
            • It&apos;s okay to ask for help
          </Text>
          <Text style={[styles.reminderText, { color: theme.textSecondary }]}>
            • This feeling won&apos;t last forever
          </Text>
          <Text style={[styles.reminderText, { color: theme.textSecondary }]}>
            • You are not a burden
          </Text>
        </View>

        <View
          style={[
            styles.emergencyBox,
            {
              backgroundColor: theme.warning + '20',
              borderColor: theme.warning,
            },
          ]}
        >
          <Text style={[styles.emergencyTitle, { color: theme.text }]}>
            In case of emergency
          </Text>
          <Text
            style={[styles.emergencyText, { color: theme.textSecondary }]}
          >
            If you or someone you know is in immediate danger, please call
            emergency services (911 in the US) or go to your nearest emergency
            room.
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heroSection: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.sizes.xxl * typography.lineHeights.tight,
  },
  heroText: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  actionsSection: {
    marginBottom: spacing.xl,
  },
  resourcesIntro: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
    marginBottom: spacing.md,
  },
  resourcesList: {
    marginTop: spacing.lg,
  },
  resourceCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  resourceContent: {
    flex: 1,
  },
  resourceName: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  resourceDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  resourceNumber: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  reminderBox: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    marginTop: spacing.xl,
  },
  reminderTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  reminderText: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    marginBottom: spacing.xs,
  },
  emergencyBox: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    marginTop: spacing.lg,
  },
  emergencyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emergencyText: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
});
