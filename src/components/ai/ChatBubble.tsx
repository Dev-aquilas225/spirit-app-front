import { MessageCircle } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { AIMessage } from '../../types/content.types';
import { formatTime } from '../../utils/helpers';
import { AppIcon } from '../common/AppIcon';
import { useTypingText } from '../../hooks/useTypingText';

interface ChatBubbleProps {
  message: AIMessage;
  /** Activer le typing effect uniquement sur le dernier message assistant */
  isLatest?: boolean;
}

export function ChatBubble({ message, isLatest = false }: ChatBubbleProps) {
  const { colors, spacing, borderRadius: br } = useTheme();
  const isUser = message.role === 'user';

  const rawContent = message.content as unknown;
  const safeContent =
    typeof rawContent === 'string'
      ? rawContent
      : rawContent &&
          typeof rawContent === 'object' &&
          'content' in rawContent &&
          typeof (rawContent as any).content === 'string'
        ? (rawContent as any).content
        : '';

  const { displayed, isDone, skip } = useTypingText(safeContent, 16, !isUser && isLatest);
  const textToShow = (!isUser && isLatest) ? displayed : safeContent;

  return (
    <Pressable
      onPress={!isDone ? skip : undefined}
      style={[st.row, isUser ? st.rowRight : st.rowLeft]}
    >
      {!isUser && (
        <View style={st.avatarWrap}>
          <AppIcon icon={MessageCircle} size={18} color={colors.primary} strokeWidth={2.2} />
        </View>
      )}
      <View style={[
        st.bubble,
        { maxWidth: '80%', padding: spacing.md, borderRadius: br.lg },
        isUser
          ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
          : { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
      ]}>
        <Text style={[st.text, { color: isUser ? '#fff' : colors.text, lineHeight: 22 }]}>
          {textToShow}
          {!isUser && isLatest && !isDone && (
            <Text style={{ color: colors.primary, fontWeight: '900' }}>▌</Text>
          )}
        </Text>
        {isDone && (
          <Text style={[st.time, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
            {formatTime(message.timestamp)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 4, paddingHorizontal: 8 },
  rowLeft:    { justifyContent: 'flex-start' },
  rowRight:   { justifyContent: 'flex-end' },
  avatarWrap: { marginRight: 6, marginBottom: 4 },
  bubble:     {},
  text:       { fontSize: 15 },
  time:       { fontSize: 11, marginTop: 4, textAlign: 'right' },
});
