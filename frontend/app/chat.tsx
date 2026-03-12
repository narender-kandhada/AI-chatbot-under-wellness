import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, Linking,
  KeyboardAvoidingView, Platform, TouchableOpacity, Modal, Animated, Easing, useColorScheme, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CalmBackground } from '../components/AmbientBackground';
import { ChatBubble } from '../components/ChatBubble';
import { LiveOverlay } from '../components/LiveOverlay';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { Send, ArrowLeft, Sparkles, AlertTriangle, Bookmark, Music, Wind, Leaf, Mic, Volume2, VolumeX, X, Radio } from 'lucide-react-native';
import { sendMessageToCompanion } from '../services/companion.service';
import { checkSafety, SafetyResponse } from '../services/safety.service';
import { saveJournalEntry, saveChat, type ChatMessage } from '../services/storage.service';
import { useVoiceChat } from '../hooks/useVoiceChat';

// ─── Music Suggestions by Mood ─────────────────────────────────────
const MUSIC_SUGGESTIONS: Record<string, { title: string; artist: string; query: string }[]> = {
  sad: [
    { title: "Let Her Go", artist: "Passenger", query: "Passenger Let Her Go" },
    { title: "Someone Like You", artist: "Adele", query: "Adele Someone Like You" },
    { title: "Fix You", artist: "Coldplay", query: "Coldplay Fix You" },
  ],
  happy: [
    { title: "Happy", artist: "Pharrell", query: "Pharrell Happy" },
    { title: "Walking on Sunshine", artist: "Katrina", query: "Walking on Sunshine" },
    { title: "Good as Hell", artist: "Lizzo", query: "Lizzo Good as Hell" },
  ],
  anxious: [
    { title: "Weightless", artist: "Marconi Union", query: "Marconi Union Weightless" },
    { title: "Breathe Me", artist: "Sia", query: "Sia Breathe Me" },
    { title: "River Flows in You", artist: "Yiruma", query: "Yiruma River Flows in You" },
  ],
  tired: [
    { title: "Night Changes", artist: "One Direction", query: "One Direction Night Changes" },
    { title: "Sunset Lover", artist: "Petit Biscuit", query: "Petit Biscuit Sunset Lover" },
  ],
  calm: [
    { title: "Clair de Lune", artist: "Debussy", query: "Debussy Clair de Lune" },
    { title: "Banana Pancakes", artist: "Jack Johnson", query: "Jack Johnson Banana Pancakes" },
  ],
  lonely: [
    { title: "Lean on Me", artist: "Bill Withers", query: "Bill Withers Lean on Me" },
    { title: "You've Got a Friend", artist: "Carole King", query: "Carole King You've Got a Friend" },
  ],
  angry: [
    { title: "Smells Like Teen Spirit", artist: "Nirvana", query: "Nirvana Smells Like Teen Spirit" },
    { title: "In the End", artist: "Linkin Park", query: "Linkin Park In the End" },
  ],
};

interface Message {
  id: string; text: string; isUser: boolean; timestamp: string;
  emotion?: string; confidence?: number; actions?: string[];
}

export default function ChatScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const params = useLocalSearchParams<{ mood?: string }>();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hi there 🌿 I'm here to listen. How can I support you today?", isUser: false, timestamp: 'Just now' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [safetyAlert, setSafetyAlert] = useState<SafetyResponse | null>(null);
  const [lastEmotion, setLastEmotion] = useState<string | null>(null);
  const [showMusic, setShowMusic] = useState(false);
  const [journalSaved, setJournalSaved] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`).current;

  // ─── Voice + Live Mode ────────────────────────────────────────────
  const voice = useVoiceChat();
  const [liveCaptionText, setLiveCaptionText] = useState('');
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const liveProcessingRef = useRef(false); // guard to avoid double-send
  const [showQuickMic, setShowQuickMic] = useState(false); // explicit non-live mic modal control

  // ─── Typing dots animation ────────────────────────────────────────
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // ─── Mic pulse animation (for non-live mic button) ────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

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

  // Mic pulse animation (non-live quick mic)
  useEffect(() => {
    if (voice.isListening && !voice.isLiveMode) {
      const pulse = Animated.loop(Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.8, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        ]),
      ]));
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
      pulseOpacity.setValue(0.6);
    }
  }, [voice.isListening, voice.isLiveMode]);

  // ─── Non-live STT → auto-send (close quick mic when done) ─────────
  useEffect(() => {
    if (!voice.isLiveMode && !voice.isListening && voice.transcript.trim()) {
      setShowQuickMic(false);
      setInputText(voice.transcript);
      const timer = setTimeout(() => handleSendWithText(voice.transcript), 300);
      return () => clearTimeout(timer);
    }
    if (!voice.isLiveMode && !voice.isListening) {
      setShowQuickMic(false);
    }
  }, [voice.isListening]);

  // ─── Live Mode: update caption during listening ───────────────────
  useEffect(() => {
    if (voice.isLiveMode && voice.liveState === 'listening') {
      setLiveCaptionText(voice.transcript || '');
    }
  }, [voice.transcript, voice.isLiveMode, voice.liveState]);

  // ─── Live Mode: process → send to backend ─────────────────────────
  useEffect(() => {
    if (
      voice.isLiveMode &&
      voice.liveState === 'processing' &&
      voice.transcript.trim() &&
      !liveProcessingRef.current
    ) {
      liveProcessingRef.current = true;
      handleLiveSend(voice.transcript.trim());
    }
  }, [voice.liveState]);

  // Auto-save chat periodically
  useEffect(() => {
    if (messages.length > 1) {
      const chatMessages: ChatMessage[] = messages.map(m => ({
        id: m.id, text: m.text, isUser: m.isUser, timestamp: m.timestamp,
        emotion: m.emotion, confidence: m.confidence, actions: m.actions,
      }));
      saveChat(sessionId, chatMessages);
    }
  }, [messages]);

  // Clear speaking state when TTS finishes
  useEffect(() => {
    if (!voice.isSpeaking) setSpeakingMsgId(null);
  }, [voice.isSpeaking]);

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleSendWithText = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: text.trim(), isUser: true, timestamp: 'Just now' };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    const history = updatedMessages
      .filter(m => m.id !== '1')
      .slice(-10)
      .map(m => ({ role: m.isUser ? 'user' as const : 'ai' as const, text: m.text }));

    try {
      const [chatRes, safetyRes] = await Promise.all([
        sendMessageToCompanion({ message: text, mood: params.mood || 'neutral', session_id: sessionId, history }),
        checkSafety({ text }).catch(() => null),
      ]);
      setIsTyping(false);
      if (safetyRes && safetyRes.riskLevel === 'high') setSafetyAlert(safetyRes);

      if (chatRes.emotion && chatRes.emotion !== 'calm') {
        setLastEmotion(chatRes.emotion);
        if (updatedMessages.filter(m => m.isUser).length >= 3) setShowMusic(true);
      }

      const aiMsgId = (Date.now() + 1).toString();
      setMessages((p) => [...p, {
        id: aiMsgId, text: chatRes.reply, isUser: false, timestamp: 'Just now',
        emotion: chatRes.emotion, confidence: chatRes.confidence, actions: chatRes.actions,
      }]);

      // Auto-TTS for AI reply
      if (voice.ttsEnabled) {
        setSpeakingMsgId(aiMsgId);
        voice.speak(chatRes.reply);
      }
    } catch {
      setIsTyping(false);
      setMessages((p) => [...p, { id: (Date.now() + 2).toString(), text: "I'm having trouble connecting. Please try again. 💚", isUser: false, timestamp: 'Just now' }]);
    }
  };

  const handleSend = () => handleSendWithText(inputText);

  const handleMicPress = () => {
    if (voice.isLiveMode) return;
    if (voice.isListening) {
      voice.stopListening();
      setShowQuickMic(false);
    } else {
      setShowQuickMic(true);
      voice.startListening();
    }
  };

  const handleBubbleSpeak = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      voice.stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(msgId);
      voice.speak(text);
    }
  };

  // ─── Live Session Handlers ────────────────────────────────────────
  const handleLiveSend = async (text: string) => {
    setLiveCaptionText('Thinking...');

    const userMsg: Message = { id: Date.now().toString(), text, isUser: true, timestamp: 'Just now' };
    setLiveMessages(prev => [...prev, userMsg]);

    try {
      const allMsgs = [...messages, ...liveMessages, userMsg];
      const history = allMsgs
        .filter(m => m.id !== '1')
        .slice(-10)
        .map(m => ({ role: m.isUser ? 'user' as const : 'ai' as const, text: m.text }));

      const chatRes = await sendMessageToCompanion({
        message: text,
        mood: params.mood || 'neutral',
        session_id: sessionId,
        history,
      });

      setLiveCaptionText(chatRes.reply);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: chatRes.reply,
        isUser: false,
        timestamp: 'Just now',
        emotion: chatRes.emotion,
        confidence: chatRes.confidence,
        actions: chatRes.actions,
      };
      setLiveMessages(prev => [...prev, aiMsg]);

      if (chatRes.emotion && chatRes.emotion !== 'calm') setLastEmotion(chatRes.emotion);

      liveProcessingRef.current = false;
      // speak() will auto-restart listening via hook
      voice.speak(chatRes.reply);
    } catch {
      setLiveCaptionText("Having trouble connecting... Let's try again.");
      liveProcessingRef.current = false;
      setTimeout(() => {
        if (voice.isLiveMode) voice.startListening();
      }, 2000);
    }
  };

  const handleStartLive = () => {
    setLiveMessages([]);
    setLiveCaptionText('');
    liveProcessingRef.current = false;
    voice.startLiveSession();
  };

  const handleEndLive = () => {
    voice.endLiveSession();
    // Sync all live messages to chat
    if (liveMessages.length > 0) {
      setMessages(prev => [...prev, ...liveMessages]);
    }
    setLiveMessages([]);
    setLiveCaptionText('');
    liveProcessingRef.current = false;
  };

  const handleSaveJournal = async () => {
    const chatMessages: ChatMessage[] = messages.map(m => ({
      id: m.id, text: m.text, isUser: m.isUser, timestamp: m.timestamp,
      emotion: m.emotion, confidence: m.confidence, actions: m.actions,
    }));
    await saveJournalEntry(params.mood || lastEmotion || 'calm', chatMessages);
    setJournalSaved(true);
    Alert.alert('Saved! 📖', 'This conversation has been saved to your journal.');
  };

  const openMusic = (query: string) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  };

  const musicSuggestions = MUSIC_SUGGESTIONS[lastEmotion || 'calm'] || MUSIC_SUGGESTIONS.calm;
  const showSendBtn = inputText.trim().length > 0;

  return (
    <CalmBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* ─── Safety Alert Modal ─── */}
        <Modal visible={!!safetyAlert} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.safetyModal, { backgroundColor: theme.surface }]}>
              <View style={[styles.safetyHeader, { backgroundColor: theme.warmAccent + '20' }]}>
                <AlertTriangle size={22} color={theme.warning} />
                <Text style={[styles.safetyTitle, { color: theme.text }]}>Just checking in 💛</Text>
              </View>
              <Text style={[styles.safetyText, { color: theme.textSecondary }]}>
                {safetyAlert?.recommendation || "It sounds like you might be going through a tough time."}
              </Text>
              {safetyAlert?.recommendation && (
                <TouchableOpacity style={[styles.safetyAction, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={{ color: theme.primary, fontWeight: '700', fontSize: typography.sizes.sm }}>
                    💚 {safetyAlert.recommendation}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setSafetyAlert(null)}>
                <Text style={[styles.dismiss, { color: theme.textLight }]}>Continue chatting</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ─── Gemini-Live Style Overlay ─── */}
        <LiveOverlay
          visible={voice.isLiveMode}
          liveState={voice.liveState}
          captionText={liveCaptionText}
          onEnd={handleEndLive}
        />

        {/* ─── Non-live quick mic modal ─── */}
        <Modal visible={showQuickMic && !voice.isLiveMode} transparent animationType="fade">
          <View style={styles.voiceOverlay}>
            <View style={[styles.voiceModal, { backgroundColor: theme.surface }]}>
              <TouchableOpacity onPress={() => { voice.stopListening(); setShowQuickMic(false); }} style={[styles.voiceCloseBtn, { backgroundColor: theme.surfaceTint }]}>
                <X size={20} color={theme.textLight} />
              </TouchableOpacity>
              <View style={styles.voiceMicContainer}>
                <Animated.View style={[
                  styles.voicePulseRing,
                  { borderColor: theme.primary, transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
                ]} />
                <View style={[styles.voiceMicCircle, { backgroundColor: theme.primary }]}>
                  <Mic size={32} color="#FFFFFF" />
                </View>
              </View>
              <Text style={[styles.voiceListeningText, { color: theme.primary }]}>Listening...</Text>
              <View style={[styles.voiceTranscriptBox, { backgroundColor: theme.surfaceTint, borderColor: theme.border }]}>
                <Text style={[styles.voiceTranscript, { color: theme.text }]}>
                  {voice.transcript || 'Say something...'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { voice.stopListening(); setShowQuickMic(false); }} style={[styles.voiceStopBtn, { backgroundColor: theme.primary }]} activeOpacity={0.8}>
                <Text style={styles.voiceStopText}>Stop & Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ─── Header ─── */}
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
          <View style={styles.headerActions}>
            {/* TTS Toggle */}
            <TouchableOpacity
              onPress={voice.toggleTTS}
              style={[styles.iconBtn, { borderColor: voice.ttsEnabled ? theme.primary : theme.border }]}
            >
              {voice.ttsEnabled ? (
                <Volume2 size={16} color={theme.primary} />
              ) : (
                <VolumeX size={16} color={theme.textLight} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveJournal}
              disabled={journalSaved || messages.length <= 1}
              style={[styles.iconBtn, { borderColor: journalSaved ? theme.primary : theme.border }]}
            >
              <Bookmark size={16} color={journalSaved ? theme.primary : theme.textLight} fill={journalSaved ? theme.primary : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push({ pathname: 'reflection' } as any)}
              style={[styles.reflectBtn, { borderColor: theme.border }]}
            >
              <Sparkles size={14} color={theme.primary} />
              <Text style={{ color: theme.primary, fontSize: typography.sizes.xs, fontWeight: '700' }}>Reflect</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* ─── Messages ─── */}
        <ScrollView ref={scrollViewRef} style={styles.messages} contentContainerStyle={styles.messagesContent}>
          {messages.map((m) => (
            <View key={m.id}>
              <ChatBubble
                message={m.text}
                isUser={m.isUser}
                timestamp={m.timestamp}
                onSpeak={!m.isUser ? (text) => handleBubbleSpeak(m.id, text) : undefined}
                isSpeaking={speakingMsgId === m.id}
              />
            </View>
          ))}

          {/* Music Suggestion Card */}
          {showMusic && musicSuggestions && (
            <View style={[styles.musicCard, { backgroundColor: theme.surface, borderColor: theme.primary + '30' }]}>
              <View style={styles.musicHeader}>
                <Music size={16} color={theme.primary} />
                <Text style={[styles.musicTitle, { color: theme.text }]}>Music for your mood</Text>
                <TouchableOpacity onPress={() => setShowMusic(false)}>
                  <Text style={[styles.musicDismiss, { color: theme.textLight }]}>×</Text>
                </TouchableOpacity>
              </View>
              {musicSuggestions.slice(0, 2).map((song, i) => (
                <TouchableOpacity key={i} onPress={() => openMusic(song.query)} style={styles.songRow}>
                  <Text style={styles.songIcon}>🎵</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.songTitle, { color: theme.text }]}>{song.title}</Text>
                    <Text style={[styles.songArtist, { color: theme.textLight }]}>{song.artist}</Text>
                  </View>
                  <Text style={[styles.playIcon, { color: theme.primary }]}>▶</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quick Action Chips */}
          {messages.length > 4 && (
            <View style={styles.actionChips}>
              <TouchableOpacity
                onPress={() => router.push('breathing' as any)}
                style={[styles.chip, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}
              >
                <Wind size={14} color={theme.primary} />
                <Text style={[styles.chipText, { color: theme.primary }]}>Breathe</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('meditation' as any)}
                style={[styles.chip, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}
              >
                <Leaf size={14} color={theme.primary} />
                <Text style={[styles.chipText, { color: theme.primary }]}>Meditate</Text>
              </TouchableOpacity>
            </View>
          )}

          {isTyping && (
            <View style={[styles.typingBubble, { backgroundColor: theme.surface, borderColor: theme.primary + '25' }]}>
              <Animated.View style={[styles.dot, { backgroundColor: theme.primary, transform: [{ translateY: dot1 }] }]} />
              <Animated.View style={[styles.dot, { backgroundColor: theme.primaryLight, transform: [{ translateY: dot2 }] }]} />
              <Animated.View style={[styles.dot, { backgroundColor: theme.emotionCalm, transform: [{ translateY: dot3 }] }]} />
            </View>
          )}
        </ScrollView>

        {/* ─── Input Area ─── */}
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
            {showSendBtn ? (
              <TouchableOpacity onPress={handleSend} activeOpacity={0.7}
                style={[styles.sendBtn, { backgroundColor: theme.primary }]}
              >
                <Send size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.btnGroup}>
                {/* Quick mic (non-live) */}
                <TouchableOpacity onPress={() => {
                  if (!voice.isSpeechAvailable) {
                    Alert.alert('Dev Build Required', 'Voice input needs a development build with expo-speech-recognition. Run "npx expo run:android" to create one.');
                    return;
                  }
                  handleMicPress();
                }} activeOpacity={0.7}
                  style={[styles.sendBtn, { backgroundColor: voice.isListening ? theme.primary : theme.surfaceTint }]}
                >
                  <Mic size={20} color={voice.isListening ? '#FFFFFF' : theme.primary} />
                </TouchableOpacity>
                {/* Live mode button */}
                <TouchableOpacity onPress={() => {
                  if (!voice.isSpeechAvailable) {
                    Alert.alert('Dev Build Required', 'Live mode needs a development build with expo-speech-recognition. Run "npx expo run:android" to create one.');
                    return;
                  }
                  handleStartLive();
                }} activeOpacity={0.7}
                  style={[styles.liveBtn, { borderColor: theme.primary }]}
                >
                  <Radio size={18} color={theme.primary} />
                </TouchableOpacity>
              </View>
            )}
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
  headerActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  reflectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1,
  },
  divider: { height: 1 },
  messages: { flex: 1 },
  messagesContent: { padding: spacing.lg },
  typingBubble: {
    flexDirection: 'row', alignSelf: 'flex-start', gap: 7,
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    borderRadius: borderRadius.xl, borderWidth: 1, marginVertical: spacing.sm,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  // Music Card
  musicCard: {
    borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.md,
    marginVertical: spacing.md, alignSelf: 'flex-start', maxWidth: '90%',
  },
  musicHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  musicTitle: { flex: 1, fontSize: typography.sizes.sm, fontWeight: '700' },
  musicDismiss: { fontSize: 20, paddingHorizontal: spacing.xs },
  songRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  songIcon: { fontSize: 14 },
  songTitle: { fontSize: typography.sizes.sm, fontWeight: '600' },
  songArtist: { fontSize: typography.sizes.xs },
  playIcon: { fontSize: 12 },
  // Action Chips
  actionChips: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1,
  },
  chipText: { fontSize: typography.sizes.xs, fontWeight: '700' },
  // Input
  inputArea: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg, borderTopWidth: 1 },
  privacy: { fontSize: typography.sizes.xs, textAlign: 'center', marginBottom: spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  inputWrap: { flex: 1, borderWidth: 1, borderRadius: borderRadius.xl, marginRight: spacing.sm },
  input: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: typography.sizes.base, maxHeight: 100 },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(107,142,110,0.25)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  btnGroup: { flexDirection: 'row', gap: 8 },
  liveBtn: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  // Safety Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: spacing.lg },
  safetyModal: { width: '100%', borderRadius: borderRadius.xl, overflow: 'hidden' },
  safetyHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  safetyTitle: { fontSize: typography.sizes.lg, fontWeight: '800', flex: 1 },
  safetyText: { fontSize: typography.sizes.base, lineHeight: typography.sizes.base * 1.6, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  safetyAction: { marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.md },
  dismiss: { fontSize: typography.sizes.sm, textAlign: 'center', paddingBottom: spacing.lg },
  // Non-live Voice Modal
  voiceOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  voiceModal: {
    width: '85%', borderRadius: borderRadius.xl, padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  voiceCloseBtn: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  voiceMicContainer: {
    width: 120, height: 120,
    justifyContent: 'center', alignItems: 'center',
    marginTop: spacing.lg, marginBottom: spacing.lg,
  },
  voicePulseRing: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    borderWidth: 3,
  },
  voiceMicCircle: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: 'rgba(107,142,110,0.4)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 5,
  },
  voiceListeningText: {
    fontSize: typography.sizes.lg, fontWeight: '700',
    marginBottom: spacing.md,
  },
  voiceTranscriptBox: {
    width: '100%', minHeight: 60, padding: spacing.md,
    borderRadius: borderRadius.lg, borderWidth: 1,
    marginBottom: spacing.lg,
  },
  voiceTranscript: {
    fontSize: typography.sizes.base, lineHeight: typography.sizes.base * 1.5,
    textAlign: 'center', fontStyle: 'italic',
  },
  voiceStopBtn: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    shadowColor: 'rgba(107,142,110,0.3)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  voiceStopText: {
    color: '#FFFFFF', fontSize: typography.sizes.base, fontWeight: '700',
  },
});
