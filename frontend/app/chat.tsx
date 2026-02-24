import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Modal, Animated, Easing, useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { CalmBackground } from '../components/AmbientBackground';
import { ChatBubble } from '../components/ChatBubble';
import { EmotionChip } from '../components/EmotionChip';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { Send, ArrowLeft, Sparkles, AlertTriangle, X } from 'lucide-react-native';
import { sendMessageToCompanion } from '../services/companion.service';
import { checkSafety, SafetyResponse } from '../services/safety.service';

interface Message {
  id: string; text: string; isUser: boolean; timestamp: string;
  emotion?: string; confidence?: number; actions?: string[];
}

export default function ChatScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hi there 🌿 I'm here to listen. How can I support you today?", isUser: false, timestamp: 'Just now' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [safetyAlert, setSafetyAlert] = useState<SafetyResponse | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`).current;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => { scrollViewRef.current?.scrollToEnd({ animated: true }); }, [messages]);

  useEffect(() => {
    if (isTyping) {
      const animDot = (d: Animated.Value, delay: number) =>
        Animated.loop(Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: -5, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]));
      animDot(dot1, 0).start(); animDot(dot2, 200).start(); animDot(dot3, 400).start();
    } else { dot1.setValue(0); dot2.setValue(0); dot3.setValue(0); }
  }, [isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: inputText, isUser: true, timestamp: 'Just now' };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    const msg = inputText;
    setInputText('');
    setIsTyping(true);

    // Build conversation history (last 10, skip initial greeting)
    const history = updatedMessages
      .filter(m => m.id !== '1')
      .slice(-10)
      .map(m => ({ role: m.isUser ? 'user' as const : 'ai' as const, text: m.text }));

    try {
      const [chatRes, safetyRes] = await Promise.all([
        sendMessageToCompanion({ message: msg, mood: 'neutral', session_id: sessionId, history }),
        checkSafety({ text: msg }).catch(() => null),
      ]);
      setIsTyping(false);
      if (safetyRes && safetyRes.riskLevel === 'high') setSafetyAlert(safetyRes);
      setMessages((p) => [...p, {
        id: (Date.now() + 1).toString(), text: chatRes.reply, isUser: false, timestamp: 'Just now',
        emotion: chatRes.emotion, confidence: chatRes.confidence, actions: chatRes.actions,
      }]);
    } catch {
      setIsTyping(false);
      setMessages((p) => [...p, { id: (Date.now() + 2).toString(), text: "I'm having trouble connecting. Please try again. 💚", isUser: false, timestamp: 'Just now' }]);
    }
  };


  return (
    <CalmBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Modal visible={!!safetyAlert} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.safetyModal, { backgroundColor: theme.surface }]}>
              <View style={[styles.safetyHeader, { backgroundColor: theme.warmAccent + '20' }]}>
                <AlertTriangle size={22} color={theme.warning} />
                <Text style={[styles.safetyTitle, { color: theme.text }]}>We're here for you 💚</Text>
                <TouchableOpacity onPress={() => setSafetyAlert(null)}><X size={18} color={theme.textLight} /></TouchableOpacity>
              </View>
              <Text style={[styles.safetyText, { color: theme.textSecondary }]}>{safetyAlert?.recommendation}</Text>
              <Text style={[styles.safetyText, { color: theme.textSecondary }]}>If you need support, the Support tab has helpful resources.</Text>
              <TouchableOpacity style={[styles.safetyAction, { backgroundColor: theme.primary + '15' }]} onPress={() => { setSafetyAlert(null); router.push({ pathname: '(tabs)/crisis' } as any); }}>
                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: typography.sizes.base }}>Go to Support →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSafetyAlert(null)}>
                <Text style={[styles.dismiss, { color: theme.textLight }]}>Continue chatting</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={styles.headerEmoji}>🌿</Text>
              <Text style={[styles.headerTitle, { color: theme.text }]}>InnerCircle</Text>
              <View style={[styles.onlineDot, { backgroundColor: theme.primary }]} />
            </View>
            <Text style={[styles.headerSub, { color: theme.textLight }]}>Always here to listen</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push({ pathname: 'reflection' } as any)}
            style={[styles.reflectBtn, { borderColor: theme.border }]}
          >
            <Sparkles size={14} color={theme.primary} />
            <Text style={{ color: theme.primary, fontSize: typography.sizes.xs, fontWeight: '700' }}>Reflect</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <ScrollView ref={scrollViewRef} style={styles.messages} contentContainerStyle={styles.messagesContent}>
          {messages.map((m) => (
            <View key={m.id}>
              <ChatBubble message={m.text} isUser={m.isUser} timestamp={m.timestamp} />
            </View>
          ))}
          {isTyping && (
            <View style={[styles.typingBubble, { backgroundColor: theme.surface, borderColor: theme.primary + '25' }]}>
              <Animated.View style={[styles.dot, { backgroundColor: theme.primary, transform: [{ translateY: dot1 }] }]} />
              <Animated.View style={[styles.dot, { backgroundColor: theme.primaryLight, transform: [{ translateY: dot2 }] }]} />
              <Animated.View style={[styles.dot, { backgroundColor: theme.emotionCalm, transform: [{ translateY: dot3 }] }]} />
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputArea, { backgroundColor: theme.inputBg, borderTopColor: theme.border }]}>
          <Text style={[styles.privacy, { color: theme.textLight }]}>🔒 Your thoughts stay private</Text>
          <View style={styles.inputRow}>
            <View style={[styles.inputWrap, { backgroundColor: theme.inputFieldBg, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Share what's on your mind..."
                placeholderTextColor={theme.textLight}
                value={inputText} onChangeText={setInputText}
                multiline maxLength={500}
              />
            </View>
            <TouchableOpacity onPress={handleSend} disabled={!inputText.trim()} activeOpacity={0.7}
              style={[styles.sendBtn, { backgroundColor: inputText.trim() ? theme.primary : theme.surfaceTint }]}
            >
              <Send size={18} color={inputText.trim() ? '#FFFFFF' : theme.textLight} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </CalmBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingTop: spacing.xxl + spacing.sm, paddingBottom: spacing.md, paddingHorizontal: spacing.lg,
  },
  backBtn: { padding: spacing.xs },
  headerContent: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerEmoji: { fontSize: 20 },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: '800' },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  headerSub: { fontSize: typography.sizes.xs, marginTop: 1, marginLeft: 28 },
  reflectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1,
  },
  divider: { height: 1 },
  messages: { flex: 1 },
  messagesContent: { padding: spacing.lg },
  chipWrap: { marginTop: -spacing.xs, marginBottom: spacing.sm, marginLeft: spacing.sm },
  typingBubble: {
    flexDirection: 'row', alignSelf: 'flex-start', gap: 7,
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    borderRadius: borderRadius.xl, borderWidth: 1, marginVertical: spacing.sm,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  inputArea: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg, borderTopWidth: 1 },
  privacy: { fontSize: typography.sizes.xs, textAlign: 'center', marginBottom: spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  inputWrap: { flex: 1, borderWidth: 1, borderRadius: borderRadius.xl, marginRight: spacing.sm },
  input: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: typography.sizes.base, maxHeight: 100 },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(107,142,110,0.25)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: spacing.lg },
  safetyModal: { width: '100%', borderRadius: borderRadius.xl, overflow: 'hidden' },
  safetyHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  safetyTitle: { fontSize: typography.sizes.lg, fontWeight: '800', flex: 1 },
  safetyText: { fontSize: typography.sizes.base, lineHeight: typography.sizes.base * 1.6, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  safetyAction: { marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.md },
  dismiss: { fontSize: typography.sizes.sm, textAlign: 'center', paddingBottom: spacing.lg },
});
