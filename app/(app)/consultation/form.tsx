import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { Button } from '../../../src/components/common/Button';
import { BackButton } from '../../../src/components/common/BackButton';
import { simulateApiDelay, generateId } from '../../../src/utils/helpers';
import { StorageService } from '../../../src/services/storage.service';
import { useAuth } from '../../../src/hooks/useAuth';
import { Consultation } from '../../../src/types/content.types';

const TOPICS = ['Prière', 'Guérison', 'Finance', 'Famille', 'Mariage', 'Travail', 'Délivrance', 'Prophétie'];

export default function ConsultationFormScreen() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!topic || !message.trim()) {
      Alert.alert('Champs requis', 'Veuillez sélectionner un sujet et décrire votre besoin.');
      return;
    }

    setLoading(true);
    await simulateApiDelay(1500);

    const consultation: Consultation = {
      id: generateId(),
      userId: user?.id ?? '',
      topic,
      message: message.trim(),
      preferredDate: new Date().toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const existing = await StorageService.get<Consultation[]>('consultations') ?? [];
    await StorageService.set('consultations', [...existing, consultation]);

    setLoading(false);
    Alert.alert(
      'Demande envoyée',
      'Votre demande de consultation a été reçue. Notre équipe vous contactera dans les 24h.',
      [{ text: 'OK', onPress: () => router.replace('/(app)/consultation/my-consultations') }],
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} keyboardShouldPersistTaps="handled">
      <View style={{ padding: spacing.base }}>
        <BackButton style={{ marginBottom: 24, marginTop: 56 }} />

        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 }}>
          Demande de consultation
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 32 }}>
          Remplissez ce formulaire et nous vous recontactons dans les 24h
        </Text>

        {/* Topic */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Sujet de consultation *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {TOPICS.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTopic(t)}
                style={[
                  styles.chip,
                  { backgroundColor: topic === t ? colors.primary : colors.surface, borderColor: topic === t ? colors.primary : colors.border },
                ]}
              >
                <Text style={{ color: topic === t ? '#fff' : colors.text, fontSize: 13 }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Décrivez votre besoin *</Text>
          <View style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
              style={[{ color: colors.text, fontSize: 14, minHeight: 100 }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Décrivez votre situation en détail..."
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <Button
          label="Soumettre la demande"
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
