import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Switch } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Save, RotateCcw } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useAIPromptsStore, AIPrompt, DEFAULT_PROMPTS } from '../../../src/store/ai-prompts.store';
import { useTheme } from '../../../src/theme';

export default function AISettings() {
  const { colors } = useTheme();
  const { prompts, init, updatePrompt, saveToBackend, isSaving } = useAIPromptsStore();
  const [selected, setSelected] = useState<AIPrompt | null>(null);
  const [draft, setDraft] = useState('');
  const [draftTemp, setDraftTemp] = useState('0.7');
  const [draftTokens, setDraftTokens] = useState('500');

  useEffect(() => { init(); }, []);

  const select = (p: AIPrompt) => {
    setSelected(p);
    setDraft(p.systemPrompt);
    setDraftTemp(String(p.temperature));
    setDraftTokens(String(p.maxTokens));
  };

  const save = async () => {
    if (!selected) return;
    const updated: AIPrompt = { ...selected, systemPrompt: draft, temperature: parseFloat(draftTemp) || 0.7, maxTokens: parseInt(draftTokens) || 500 };
    await saveToBackend(updated);
    setSelected(updated);
  };

  const reset = () => {
    if (!selected) return;
    const def = DEFAULT_PROMPTS.find(p => p.id === selected.id);
    if (def) { setDraft(def.systemPrompt); setDraftTemp(String(def.temperature)); setDraftTokens(String(def.maxTokens)); }
  };

  return (
    <View style={{ flex:1, backgroundColor: colors.background }}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.back}><AppIcon icon={ChevronLeft} size={22} color={colors.text} strokeWidth={2.5} /></TouchableOpacity>
        <Text style={[st.title, { color: colors.text }]}>Prompts IA</Text>
        {isSaving && <ActivityIndicator size="small" color="#C9A84C" />}
      </View>

      <View style={{ flex:1, flexDirection:'row' }}>
        <ScrollView style={[st.sidebar, { borderRightColor: colors.border }]}>
          {prompts.map(p => (
            <TouchableOpacity key={p.id} style={[st.sideItem, selected?.id === p.id && st.sideItemActive, { borderBottomColor: colors.border }]} onPress={() => select(p)}>
              <Text style={[st.sideLabel, { color: selected?.id === p.id ? '#C9A84C' : colors.text }]} numberOfLines={2}>{p.label}</Text>
              <View style={[st.dot, { backgroundColor: p.enabled ? '#34D399' : '#EF4444' }]} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selected ? (
          <ScrollView style={{ flex:1, padding:16 }} contentContainerStyle={{ gap:14 }}>
            <View style={st.row}>
              <Text style={[st.lbl, { color: colors.textSecondary }]}>Activé</Text>
              <Switch value={selected.enabled} onValueChange={v => { updatePrompt(selected.id, { enabled: v }); setSelected({ ...selected, enabled: v }); }} trackColor={{ true: '#34D399' }} />
            </View>
            <View>
              <Text style={[st.lbl, { color: colors.textSecondary }]}>Prompt système</Text>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                multiline
                style={[st.textarea, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={st.row}>
              <View style={{ flex:1 }}>
                <Text style={[st.lbl, { color: colors.textSecondary }]}>Température (0-1)</Text>
                <TextInput value={draftTemp} onChangeText={setDraftTemp} keyboardType="decimal-pad" style={[st.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]} />
              </View>
              <View style={{ flex:1, marginLeft:12 }}>
                <Text style={[st.lbl, { color: colors.textSecondary }]}>Max tokens</Text>
                <TextInput value={draftTokens} onChangeText={setDraftTokens} keyboardType="number-pad" style={[st.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]} />
              </View>
            </View>
            <View style={st.btnRow}>
              <TouchableOpacity style={st.resetBtn} onPress={reset}><AppIcon icon={RotateCcw} size={16} color="#9CA3AF" strokeWidth={2} /><Text style={st.resetTxt}>Réinitialiser</Text></TouchableOpacity>
              <TouchableOpacity style={st.saveBtn} onPress={save} disabled={isSaving}><AppIcon icon={Save} size={16} color="#fff" strokeWidth={2} /><Text style={st.saveTxt}>Sauvegarder</Text></TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
            <Text style={{ color: colors.textSecondary }}>Sélectionnez un prompt</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  header:{ flexDirection:'row', alignItems:'center', gap:12, padding:16, borderBottomWidth:1 },
  back:{ width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
  title:{ flex:1, fontSize:18, fontWeight:'800' },
  sidebar:{ width:140, borderRightWidth:1 },
  sideItem:{ padding:12, borderBottomWidth:1, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  sideItemActive:{ backgroundColor:'rgba(201,168,76,0.08)' },
  sideLabel:{ fontSize:12, fontWeight:'600', flex:1 },
  dot:{ width:8, height:8, borderRadius:4, marginLeft:6 },
  lbl:{ fontSize:12, fontWeight:'600', marginBottom:6 },
  textarea:{ borderWidth:1, borderRadius:12, padding:12, fontSize:13, lineHeight:20, minHeight:200, textAlignVertical:'top' },
  input:{ borderWidth:1, borderRadius:10, padding:10, fontSize:14 },
  row:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:12 },
  btnRow:{ flexDirection:'row', gap:12 },
  resetBtn:{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, padding:12, borderRadius:12, backgroundColor:'rgba(156,163,175,0.12)', borderWidth:1, borderColor:'rgba(156,163,175,0.2)' },
  resetTxt:{ color:'#9CA3AF', fontWeight:'700', fontSize:14 },
  saveBtn:{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, padding:12, borderRadius:12, backgroundColor:'#C9A84C' },
  saveTxt:{ color:'#fff', fontWeight:'800', fontSize:14 },
});
