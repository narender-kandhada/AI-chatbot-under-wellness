import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, useColorScheme } from 'react-native';
import { CalmBackground } from '../../components/AmbientBackground';
import { Card } from '../../components/Card';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { Shield, Trash2, EyeOff, Lock } from 'lucide-react-native';

export default function PrivacyScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const [saveHistory, setSaveHistory] = useState(true);
  const [incognitoMode, setIncognitoMode] = useState(false);

  const principles = [
    { id: '1', icon: Lock, title: 'Your data belongs to you', desc: 'Everything you share stays on your device. We never sell or share your personal information.', color: theme.primary },
    { id: '2', icon: Trash2, title: 'Delete anytime', desc: 'Full control. Delete individual messages or entire conversations whenever you want.', color: theme.primaryLight },
    { id: '3', icon: Shield, title: 'No sharing without consent', desc: 'Your conversations are private. Never shared with third parties.', color: theme.emotionCalm },
    { id: '4', icon: EyeOff, title: 'Anonymous by design', desc: 'No email, no phone number, no tracking. Complete anonymity.', color: theme.emotionAnxious },
  ];

  return (
    <CalmBackground>
      <View style={[styles.headerWrap, { backgroundColor: theme.headerBg }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>🛡️ Privacy & Trust</Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Your safety and privacy matter to us</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {principles.map((p) => (
          <View key={p.id} style={[styles.principleCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
            <View style={[styles.iconCircle, { backgroundColor: p.color + '15' }]}>
              <p.icon size={20} color={p.color} />
            </View>
            <View style={styles.principleContent}>
              <Text style={[styles.principleTitle, { color: theme.text }]}>{p.title}</Text>
              <Text style={[styles.principleDesc, { color: theme.textSecondary }]}>{p.desc}</Text>
            </View>
          </View>
        ))}

        <Card title="Privacy Settings" accentColor={theme.primary}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Save conversation history</Text>
              <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>Keep conversations for reflection</Text>
            </View>
            <Switch value={saveHistory} onValueChange={setSaveHistory}
              trackColor={{ false: scheme === 'dark' ? '#333' : '#E0E0E0', true: theme.primary + '50' }}
              thumbColor={saveHistory ? theme.primary : scheme === 'dark' ? '#666' : '#C8C8C8'}
            />
          </View>
          <View style={[styles.settingDivider, { backgroundColor: theme.border }]} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Incognito mode</Text>
              <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>No data saved, complete privacy</Text>
            </View>
            <Switch value={incognitoMode} onValueChange={setIncognitoMode}
              trackColor={{ false: scheme === 'dark' ? '#333' : '#E0E0E0', true: theme.emotionAnxious + '50' }}
              thumbColor={incognitoMode ? theme.emotionAnxious : scheme === 'dark' ? '#666' : '#C8C8C8'}
            />
          </View>
        </Card>

        <View style={[styles.disclaimerBox, { backgroundColor: theme.surfaceTint }]}>
          <Text style={[styles.disclaimerText, { color: theme.textLight }]}>
            InnerCircle is designed with your privacy as a priority. This app is not a substitute for professional mental health care. 💚
          </Text>
        </View>
      </ScrollView>
    </CalmBackground>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingTop: spacing.xxl + spacing.lg, paddingBottom: spacing.md, paddingHorizontal: spacing.lg },
  headerTitle: { fontSize: typography.sizes.xxxl, fontWeight: '800', marginBottom: spacing.xs },
  headerSub: { fontSize: typography.sizes.base },
  divider: { height: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  principleCard: {
    flexDirection: 'row', padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 1,
    marginBottom: spacing.md, gap: spacing.md, alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 1,
  },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  principleContent: { flex: 1 },
  principleTitle: { fontSize: typography.sizes.base, fontWeight: '700', marginBottom: spacing.xs },
  principleDesc: { fontSize: typography.sizes.sm, lineHeight: typography.sizes.sm * 1.5 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  settingTitle: { fontSize: typography.sizes.base, fontWeight: '600', marginBottom: 2 },
  settingDesc: { fontSize: typography.sizes.sm },
  settingDivider: { height: 1, marginVertical: spacing.md },
  disclaimerBox: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.xl },
  disclaimerText: { fontSize: typography.sizes.sm, lineHeight: typography.sizes.sm * 1.7, textAlign: 'center' },
});
