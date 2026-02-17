import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { ChatBubble } from '../components/ChatBubble';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { Send, ArrowLeft } from 'lucide-react-native';
import { sendMessageToCompanion } from '../services/companion.service';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const companionResponses = [
  "I'm really glad you shared that with me.",
  "That sounds heavy. Want to talk more about it?",
  "I hear you. Your feelings make sense.",
  "Thank you for trusting me with this.",
  "It's okay to feel this way. I'm here to listen.",
  "That must be difficult. How are you holding up?",
  "You're not alone in this. I'm here with you.",
];

export default function ChatScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = colors[scheme];
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there. I'm here to listen. How can I support you today?",
      isUser: false,
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

const handleSend = async () => {
  if (!inputText.trim()) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    text: inputText,
    isUser: true,
    timestamp: 'Just now',
  };

  setMessages((prev) => [...prev, userMessage]);

  const messageToSend = inputText;
  setInputText('');

  try {
    const response = await sendMessageToCompanion({
      message: messageToSend,
      mood: "neutral",
    });

    const companionMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: response.reply,
      isUser: false,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, companionMessage]);
  } catch (error) {
    console.error('Backend connection failed:', error);

    const errorMessage: Message = {
      id: (Date.now() + 2).toString(),
      text: "I'm having trouble connecting right now.",
      isUser: false,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, errorMessage]);
  }
};

  const handleReflection = () => {
    router.push({ pathname: 'reflection' } as any);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            InnerCircle
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Always here to listen
          </Text>
        </View>
        <TouchableOpacity onPress={handleReflection}>
          <Text style={[styles.reflectionButton, { color: theme.primary }]}>
            Reflect
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message.text}
            isUser={message.isUser}
            timestamp={message.timestamp}
          />
        ))}
      </ScrollView>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.privacyNote, { color: theme.textLight }]}>
          🔒 Your thoughts stay private
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Share what's on your mind..."
            placeholderTextColor={theme.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim()
                  ? theme.primary
                  : theme.border,
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
  },
  reflectionButton: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    padding: spacing.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
  },
  inputContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
  },
  privacyNote: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
