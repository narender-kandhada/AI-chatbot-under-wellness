import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, useColorScheme } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  /** Called when the user taps the speaker icon on an AI bubble */
  onSpeak?: (text: string) => void;
  /** Whether this bubble's text is currently being spoken */
  isSpeaking?: boolean;
}

export function ChatBubble({ message, isUser, timestamp, onSpeak, isSpeaking }: ChatBubbleProps) {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.wrapper, isUser ? styles.userWrapper : styles.aiWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[
        styles.bubble,
        isUser
          ? [styles.userBubble, { backgroundColor: theme.primary }]
          : [styles.aiBubble, { backgroundColor: theme.surface, borderColor: theme.primary + '25' }],
      ]}>
        <Text style={[styles.text, isUser ? styles.userText : { color: theme.text }]}>{message}</Text>
        {/* Speaker icon on AI bubbles */}
        {!isUser && onSpeak && (
          <TouchableOpacity
            onPress={() => onSpeak(message)}
            style={[styles.speakerBtn, { backgroundColor: isSpeaking ? theme.primary + '20' : 'transparent' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.6}
          >
            <Volume2 size={14} color={isSpeaking ? theme.primary : theme.textLight} />
          </TouchableOpacity>
        )}
      </View>
      {timestamp && <Text style={[styles.timestamp, isUser && styles.userTimestamp, { color: theme.textLight }]}>{timestamp}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  userWrapper: { alignItems: 'flex-end' },
  aiWrapper: { alignItems: 'flex-start' },
  bubble: { maxWidth: '82%', padding: spacing.md },
  userBubble: {
    borderRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.sm,
    shadowColor: 'rgba(107,142,110,0.25)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  aiBubble: {
    borderRadius: borderRadius.xl, borderBottomLeftRadius: borderRadius.sm, borderWidth: 1,
    shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  text: { fontSize: typography.sizes.base, lineHeight: typography.sizes.base * 1.55 },
  userText: { color: '#FFFFFF' },
  speakerBtn: {
    alignSelf: 'flex-end', marginTop: spacing.xs,
    padding: 4, borderRadius: borderRadius.sm,
  },
  timestamp: { fontSize: typography.sizes.xs, marginTop: spacing.xs, marginHorizontal: spacing.sm },
  userTimestamp: { textAlign: 'right' },
});
