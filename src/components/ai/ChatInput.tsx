import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Send } from 'lucide-react-native';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme';
import { AppIcon } from '../common/AppIcon';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  loading = false,
  disabled = false,
  placeholder,
}: ChatInputProps) {
  const { colors, spacing, borderRadius: br } = useTheme();
  const { t } = useI18n();
  const [text, setText] = useState('');
  const resolvedPlaceholder = placeholder ?? t.ai.inputPlaceholder;

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || loading || disabled) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
    >
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surfaceSecondary,
            borderRadius: br.full,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={text}
          onChangeText={setText}
          placeholder={resolvedPlaceholder}
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={500}
          editable={!disabled}
          onSubmitEditing={handleSend}
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || loading || disabled}
          style={[
            styles.sendBtn,
            {
              backgroundColor: text.trim() && !disabled ? colors.primary : colors.border,
              borderRadius: br.full,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <AppIcon icon={Send} size={18} color="#fff" strokeWidth={2.6} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
