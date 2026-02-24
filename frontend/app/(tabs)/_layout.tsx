import { Tabs } from 'expo-router';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Home, Shield, AlertCircle } from 'lucide-react-native';
import { colors } from '../../constants/theme';

function TabIcon({ focused, color, Icon, size }: {
  focused: boolean; color: string; Icon: typeof Home; size: number;
}) {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  return (
    <View style={styles.iconWrap}>
      <Icon size={size} color={color} strokeWidth={focused ? 2.2 : 1.6} />
      {focused && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
    </View>
  );
}

export default function TabLayout() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textLight,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopWidth: 1,
            borderTopColor: theme.borderLight,
            height: 56 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            elevation: 0,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        }}
        screenListeners={{
          tabPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Check-In',
            tabBarIcon: ({ size, color, focused }) => <TabIcon Icon={Home} size={size} color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="privacy"
          options={{
            title: 'Privacy',
            tabBarIcon: ({ size, color, focused }) => <TabIcon Icon={Shield} size={size} color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="crisis"
          options={{
            title: 'Support',
            tabBarIcon: ({ size, color, focused }) => <TabIcon Icon={AlertCircle} size={size} color={color} focused={focused} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center' },
  activeDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 4 },
});
