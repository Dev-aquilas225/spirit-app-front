import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, RotateCcw, Save } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useAIPromptsStore, AIPrompt } from '../../../src/store/ai-prompts.store';
import { useTheme } from '../../../src/theme';

export default function AISettings() {
  const { colors } = useTheme();
  const { prompts, init, saveToBackend, isSaving } = useAIPromptsStore();
  const [selected, setSelected] = useState<AIPrompt | null>(null);
  const [draft, setDraft]       = useState('');
  const [saveOk, setSaveOk]     = useState(false);
  const [saveErr, setSaveErr]   = useState('');

  useEffect(() => { init(); }, []);

  // Sélectionner le premier prompt par défaut
  useEffect(() => {
    if (prompts.length > 0 && !selected) {
      setSelected(prompts[0]);
      setDraft(prompts[0].systemPrompt);
    }
  }, [prompts]);

  const select = (p: AIPrompt) => {
    setSelected(p);
    setDraft(p.systemPrompt);
    setSaveOk(false);
    setSaveErr('');
  };

  const save = async () => {
    if (!selected || !draft.trim()) return;
    setSaveOk(false);
    setSaveErr('');
    try {
      await saveToBackend({ ...selected, systemPrompt: draft.trim() });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch {
      setSaveErr('Erreur lors de la sauvegarde. Vérifiez votre connexion.');
    }
  };

  const reset = () => {
    if (!selected) return;
    const { useAIPromptsStore: s } = require('../../../src/store/ai-prompts.store');
    // Recharger depuis le store (valeur par défaut)
    const current = s.getState().prompts.find((p: AIPrompt) => p.id === selected.id);
    if (current) setDraft(current.systemPrompt);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.back}>
          <AppIcon icon={ChevronLeft} size={22} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[st.title, { color: colors.text }]}>Prompts IA</Text>
        {isSaving && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Sidebar — liste des sections */}
        <ScrollView style={[st.sidebar, { backgroundColor: colors.surfaceSecondary, borderRightColor: colors.border }]}>
          {prompts.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[st.sideItem, { borderBottomColor: colors.border }, selected?.id === p.id && { backgroundColor: colors.primaryPale }]}
              onPress={() => select(p)}
            >
              <Text style={[st.sideLabel, { color: selected?.id === p.id ? colors.primary : colors.text }]} numberOfLines={2}>
                {p.label}
              </Text>
              <Text style={{ fontSize: 9, color: colors.textTertiary, marginTop: 2 }}>{p.id}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Éditeur */}
        {selected ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>{selected.label}</Text>
            <Text style={{ fontSize: 12, color: colors.textTertiary }}>{selected.description}</Text>
            <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'monospace' }}>Section : {selected.id}</Text>

            <Text style={[st.lbl, { color: colors.textSecondary }]}>Prompt système</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              multiline
              style={[st.textarea, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              placeholder="Entrez le prompt système..."
              placeholderTextColor={colors.textTertiary}
              textAlignVertical="top"
            />

            {/* Feedback */}
            {saveOk && (
              <View style={[st.feedback, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: '#10B981' }]}>
                <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 13 }}>✓ Sauvegardé avec succès</Text>
              </View>
            )}
            {saveErr !== '' && (
              <View style={[st.feedback, { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: '#EF4444' }]}>
                <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 13 }}>{saveErr}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[st.btn, { backgroundColor: colors.primary, flex: 1, opacity: isSaving ? 0.6 : 1 }]}
                onPress={save}
                disabled={isSaving}
              >
                {isSaving
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <><AppIcon icon={Save} size={15} color="#FFFFFF" strokeWidth={2.5} /><Text style={st.btnTxt}>Sauvegarder</Text></>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.btn, { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }]}
                onPress={reset}
              >
                <AppIcon icon={RotateCcw} size={15} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[st.btnTxt, { color: colors.textSecondary }]}>Reset</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.textTertiary }}>Sélectionnez un prompt</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  header:   { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 52 : 16, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, gap: 12 },
  back:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 18, fontWeight: '800', flex: 1 },
  sidebar:  { width: 140, borderRightWidth: 1 },
  sideItem: { padding: 12, borderBottomWidth: 1 },
  sideLabel:{ fontSize: 12, fontWeight: '700', lineHeight: 16 },
  lbl:      { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  textarea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 20, minHeight: 280 },
  btn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  btnTxt:   { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  feedback: { borderWidth: 1, borderRadius: 8, padding: 10 },
});
