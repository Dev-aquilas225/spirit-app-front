import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { Button } from '../../../src/components/common/Button';
import { BackButton } from '../../../src/components/common/BackButton';
import { useAIStore } from '../../../src/store/ai.store';
import { useAuth } from '../../../src/hooks/useAuth';
import { useI18n } from '../../../src/i18n';
import { AIService } from '../../../src/services/ai.service';

export default function ConsultationFormScreen() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const { t } = useI18n();
  const [topic, setTopic] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const topics = [...t.consultation.topics];

  const startNewConversation = useAIStore((s) => s.startNewConversation);
  const sendMessage = useAIStore((s) => s.sendMessage);

  async function handleSubmit() {
    if (!topic || !message.trim()) {
      Alert.alert(t.consultation.requiredTitle, t.consultation.requiredMsg);
      return;
    }

    setLoading(true);

    // Préparer le premier message avec toutes les infos
    const parts = [`Sujet : ${topic}`];
    if (name.trim()) parts.push(`Mon nom : ${name.trim()}`);
    if (birthDate.trim()) parts.push(`Ma date de naissance : ${birthDate.trim()}`);
    parts.push(`Ma situation : ${message.trim()}`);
    const firstMessage = parts.join('\n');

    // Démarrer une nouvelle conversation puis envoyer avec le bon chatType
    await startNewConversation();
    await sendMessage(firstMessage, 'consultation');

    setLoading(false);
    // Naviguer vers l'écran de consultation (Prophète Georges — chatType: 'consultation')
    // PAS vers le guide /(app)/(tabs)/ai qui utilise un prompt différent
    router.replace('/(app)/consultation/chat');
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} keyboardShouldPersistTaps="handled">
      <View style={{ padding: spacing.base }}>
        <BackButton style={{ marginBottom: 24, marginTop: 56 }} fallback="/(app)/(tabs)/home"/>

        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 }}>
          {t.consultation.formTitle}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 32 }}>
          {t.consultation.formSubtitle}
        </Text>

        {/* Topic */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.consultation.topicLabel}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {topics.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setTopic(item)}
                style={[
                  styles.chip,
                  { backgroundColor: topic === item ? colors.primary : colors.surface, borderColor: topic === item ? colors.primary : colors.border },
                ]}
              >
                <Text style={{ color: topic === item ? '#fff' : colors.text, fontSize: 13 }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.consultation.needLabel}</Text>
          <View style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
              style={[{ color: colors.text, fontSize: 14, minHeight: 100 }]}
              value={message}
              onChangeText={setMessage}
              placeholder={t.consultation.needPh}
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <Button
          label={t.consultation.submit}
          variant="gold"
          fullWidth
          size="lg"
          loading={loading}
          onPress={handleSubmit}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '500' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  textArea: { borderWidth: 1.5, borderRadius: 12, padding: 12, marginTop: 8 },
});
