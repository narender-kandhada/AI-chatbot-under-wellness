import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { CalmBackground } from '../../components/AmbientBackground';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { Heart, Phone } from 'lucide-react-native';

const resources = [
  { 
    id: '1', 
    name: 'KIRAN Mental Health Helpline', 
    desc: '24/7 Government of India mental health support', 
    number: '1800-599-0019', 
    color: '#E8B86D' 
  },
  { 
    id: '2', 
    name: 'iCall Psychosocial Helpline', 
    desc: 'Professional counseling support (Mon–Sat, 8am–10pm)', 
    number: '9152987821', 
    color: '#6B8E6E' 
  },
  { 
    id: '3', 
    name: 'AASRA Suicide Prevention Helpline', 
    desc: '24/7 crisis and emotional support', 
    number: '91-9820466726', 
    color: '#7DB8A6' 
  },
];

export default function CrisisScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];

  return (
    <CalmBackground warm>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: theme.surface }]}>
          <View style={[styles.heroIcon, { backgroundColor: theme.warmAccent + '30' }]}>
              <Heart size={32} color={theme.warmAccentDark} fill={theme.warmAccent + '40'} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>You don&apos;t have to{'\n'}go through this alone</Text>
          <Text style={[styles.heroText, { color: theme.textSecondary }]}>
            If you&apos;re going through a difficult time, reaching out is a sign of strength. Help is always available. 💚
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <Button title="Reach out to someone I trust" onPress={() => { }} fullWidth />
          <View style={{ height: spacing.md }} />
          <Button title="View support resources" onPress={() => { }} fullWidth variant="secondary" />
        </View>

        <Card title="Support Resources" accentColor={theme.warmAccentDark}>
          <Text style={[styles.resourcesIntro, { color: theme.textSecondary }]}>
            These are placeholder numbers. In a real app, these would connect to actual crisis helplines.
          </Text>
        </Card>

        {resources.map((r) => (
          <TouchableOpacity key={r.id} activeOpacity={0.7}>
            <View style={[styles.resourceCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
              <View style={[styles.accentBar, { backgroundColor: r.color }]} />
              <View style={[styles.resourceIcon, { backgroundColor: r.color + '15' }]}>
                <Phone size={18} color={r.color} />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={[styles.resourceName, { color: theme.text }]}>{r.name}</Text>
                <Text style={[styles.resourceDesc, { color: theme.textSecondary }]}>{r.desc}</Text>
                <Text style={[styles.resourceNumber, { color: r.color }]}>{r.number}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.reminderBox, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <Text style={[styles.reminderTitle, { color: theme.text }]}>💚 Remember</Text>
          <Text style={[styles.reminderText, { color: theme.textSecondary }]}>• You deserve support and care</Text>
          <Text style={[styles.reminderText, { color: theme.textSecondary }]}>• It&apos;s okay to ask for help</Text>
          <Text style={[styles.reminderText, { color: theme.textSecondary }]}>• This feeling won&apos;t last forever</Text>
          <Text style={[styles.reminderText, { color: theme.textSecondary }]}>• You are not a burden</Text>
        </View>

        <View style={[styles.emergencyBox, { backgroundColor: theme.warmAccent + '15', borderColor: theme.warmAccentDark + '20' }]}>
          <Text style={[styles.emergencyTitle, { color: theme.text }]}>⚠️ In case of emergency</Text>
          <Text style={[styles.emergencyText, { color: theme.textSecondary }]}>
            If you or someone is in immediate danger, please call emergency services (911) or go to your nearest emergency room.
          </Text>
        </View>
      </ScrollView>
    </CalmBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingTop: spacing.xxl + spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  hero: {
    padding: spacing.xl, borderRadius: borderRadius.xl, alignItems: 'center', marginBottom: spacing.xl,
    shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 2,
  },
  heroIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  heroTitle: { fontSize: typography.sizes.xxl, fontWeight: '800', textAlign: 'center', marginBottom: spacing.md, lineHeight: typography.sizes.xxl * 1.3 },
  heroText: { fontSize: typography.sizes.base, textAlign: 'center', lineHeight: typography.sizes.base * 1.65 },
  actionsRow: { marginBottom: spacing.xl },
  resourcesIntro: { fontSize: typography.sizes.sm, lineHeight: typography.sizes.sm * 1.5 },
  resourceCard: {
    flexDirection: 'row', padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 1,
    marginBottom: spacing.md, gap: spacing.md, alignItems: 'center', overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 1,
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  resourceIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  resourceInfo: { flex: 1 },
  resourceName: { fontSize: typography.sizes.base, fontWeight: '700', marginBottom: 2 },
  resourceDesc: { fontSize: typography.sizes.sm, marginBottom: spacing.xs },
  resourceNumber: { fontSize: typography.sizes.base, fontWeight: '700' },
  reminderBox: { padding: spacing.lg, borderRadius: borderRadius.xl, marginTop: spacing.xl, borderWidth: 1 },
  reminderTitle: { fontSize: typography.sizes.lg, fontWeight: '800', marginBottom: spacing.md },
  reminderText: { fontSize: typography.sizes.base, lineHeight: typography.sizes.base * 1.7, marginBottom: spacing.xs },
  emergencyBox: { padding: spacing.lg, borderRadius: borderRadius.xl, marginTop: spacing.lg, borderWidth: 1 },
  emergencyTitle: { fontSize: typography.sizes.lg, fontWeight: '800', marginBottom: spacing.sm },
  emergencyText: { fontSize: typography.sizes.base, lineHeight: typography.sizes.base * 1.65 },
});
