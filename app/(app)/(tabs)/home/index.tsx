/**
 * Onglet Rêves — Interprétation des rêves avec IA
 * Premier onglet principal selon le CDC Oracle Plus.
 */
import { CloudMoon, History, MessageCircle, Trash2, Zap } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Pressable, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { Button } from '../../../../src/components/common/Button';
import { Card } from '../../../../src/components/common/Card';
import { CreditGate } from '../../../../src/components/credits/CreditGate';
import { AIService } from '../../../../src/services/ai.service';
import { useAccess } from '../../../../src/hooks/useAccess';
import { useCreditsStore } from '../../../../src/store/credits.store';
import { useI18n } from '../../../../src/i18n';
import { useTheme } from '../../../../src/theme';
import { useAuthStore } from '../../../../src/store/auth.store';
import { AIConversation } from '../../../../src/types/content.types';
import { formatDate } from '../../../../src/utils/helpers';
import { useTypingText } from '../../../../src/hooks/useTypingText';

type DreamTab = 'interpret' | 'history';

function InterpretTab({ onSuccess }: { onSuccess: () => void }) {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  const { hasSubscription, canPerform } = useAccess();
  const { spend } = useCreditsStore();
  const [dream, setDream] = useState('');
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [gateVisible, setGateVisible] = useState(false);

  const { displayed: typedInterpretation, isDone: typingDone, skip: skipTyping } = useTypingText(interpretation, 14, !!interpretation);

  const handleInterpret = async () => {
    if (!dream || dream.trim().length < 20) {
      Alert.alert('Erreur', 'Veuillez écrire au moins 20 caractères');
      return;
    }
    if (!hasSubscription) {
      if (!canPerform('dream_interpretation')) { setGateVisible(true); return; }
      const ok = await spend('dream_interpretation');
      if (!ok) { setGateVisible(true); return; }
    }
    setLoading(true);
    setInterpretation('');
    try {
      const res = await AIService.interpretDream(dream.trim());
      setInterpretation(res?.message?.content ?? 'Aucune interprétation reçue');
      setDream('');
      setDate(new Date().toISOString());
      onSuccess();
    } catch {
      Alert.alert('Erreur', 'Service indisponible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.base, gap: 16 }}>
        <View style={[st.costBadge, { backgroundColor: hasSubscription ? 'rgba(16,185,129,0.1)' : 'rgba(201,168,76,0.1)', borderColor: hasSubscription ? '#10B981' : '#C9A84C' }]}>
          <AppIcon icon={hasSubscription ? MessageCircle : Zap} size={14} color={hasSubscription ? '#10B981' : '#C9A84C'} strokeWidth={2.4} />
          <Text style={[st.costText, { color: hasSubscription ? '#10B981' : '#C9A84C' }]}>
            {hasSubscription ? 'Illimité avec votre abonnement' : '80 crédits par interprétation'}
          </Text>
        </View>
        <Card>
          <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 8 }}>Comment ça marche ?</Text>
          {[t.dreams.step1, t.dreams.step2, t.dreams.step3].map((step, i) => (
            <Text key={i} style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{i + 1}. {step}</Text>
          ))}
        </Card>
        <Text style={{ color: colors.text, fontWeight: '600' }}>{t.dreams.dreamLabel}</Text>
        <View style={[st.textArea, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <TextInput
            value={dream}
            onChangeText={setDream}
            placeholder={t.dreams.dreamPh}
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={[st.textInput, { color: colors.text }]}
          />
        </View>
        <Button label={loading ? t.dreams.interpreting : t.dreams.interpret} loading={loading} disabled={dream.trim().length < 20} onPress={handleInterpret} />
        {interpretation && date && (
          <Pressable
            onPress={!typingDone ? skipTyping : undefined}
            style={[st.resultCard, { backgroundColor: colors.surface, borderColor: 'rgba(201,168,76,0.3)' }]}
          >
            <View style={st.resultLabelRow}>
              <AppIcon icon={CloudMoon} size={14} color="#C9A84C" />
              <Text style={{ fontSize: 12, color: '#C9A84C', fontWeight: '700' }}>Interprétation du {formatDate(date)}</Text>
              {!typingDone && <Text style={{ fontSize: 10, color: colors.textTertiary, marginLeft: 'auto' }}>Appuyer pour sauter</Text>}
            </View>
            <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, marginTop: 10 }}>
              {typedInterpretation}
              {!typingDone && <Text style={{ color: '#C9A84C', fontWeight: '900' }}>▌</Text>}
            </Text>
            {typingDone && (
              <>
                <View style={[st.divider, { backgroundColor: 'rgba(201,168,76,0.2)' }]} />
                <Text style={{ color: colors.textTertiary, fontSize: 12, fontStyle: 'italic' }}>{t.dreams.disclaimer}</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
      <CreditGate visible={gateVisible} action="dream_interpretation" onClose={() => setGateVisible(false)} onSuccess={() => { setGateVisible(false); handleInterpret(); }} />
    </ScrollView>
  );
}

function HistoryTab({ conversations, loading, loadHistory }: any) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, any>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function handleExpand(item: AIConversation) {
    if (expanded === item.id) { setExpanded(null); return; }
    setExpanded(item.id);
    if (cache[item.id]) return;
    setLoadingId(item.id);
    try {
      const messages = await AIService.getConversationHistory(item.id);
      const safe = Array.isArray(messages) ? messages : [];
      setCache(prev => ({ ...prev, [item.id]: { userDream: safe.find(m => m.role === 'user')?.content ?? 'Rêve indisponible', aiInterpretation: safe.find(m => m.role === 'assistant')?.content ?? 'Aucune interprétation' } }));
    } catch { Alert.alert('Erreur', 'Impossible de charger'); }
    finally { setLoadingId(null); }
  }

  async function handleDelete(item: AIConversation) {
    try {
      await AIService.deleteConversation(item.id);
      await loadHistory();
      setCache(prev => { const c = { ...prev }; delete c[item.id]; return c; });
      if (expanded === item.id) setExpanded(null);
    } catch { Alert.alert('Erreur', 'Suppression impossible'); }
  }

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#C9A84C" /></View>;
  if (!conversations?.length) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Text style={{ fontSize: 32, marginBottom: 12 }}>🌙</Text>
      <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>Aucun rêve enregistré</Text>
    </View>
  );

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => {
        const open = expanded === item.id;
        const data = cache[item.id];
        return (
          <TouchableOpacity onPress={() => handleExpand(item)} onLongPress={() => handleDelete(item)} style={[st.histCard, { backgroundColor: colors.surface, borderColor: open ? '#C9A84C' : colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '600', color: colors.text, flex: 1 }} numberOfLines={open ? undefined : 2}>
                {data?.userDream ?? item.messages?.[0]?.content ?? 'Rêve'}
              </Text>
              <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 4 }}>
                <AppIcon icon={Trash2} size={16} color={colors.textTertiary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {open && data && <Text style={{ marginTop: 12, color: colors.textSecondary, lineHeight: 22 }}>{data.aiInterpretation}</Text>}
            {loadingId === item.id && <ActivityIndicator size="small" color="#C9A84C" style={{ marginTop: 8 }} />}
          </TouchableOpacity>
        );
      }}
    />
  );
}

export default function DreamsTabScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const user = useAuthStore(s => s.user);
  const [tab, setTab] = useState<DreamTab>('interpret');
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await AIService.getDreamHistory(user.id);
      setConversations(Array.isArray(data) ? data : []);
    } catch { setConversations([]); }
    finally { setLoading(false); }
  }, [user?.id]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[st.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={st.deco1} /><View style={st.deco2} />
        <View style={st.headerInner}>
          <AppIcon icon={CloudMoon} size={26} color="#C9A84C" strokeWidth={1.8} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[st.headerTitle, { color: colors.text }]}>Interprétation des Rêves</Text>
            <Text style={[st.headerSub, { color: colors.textSecondary }]}>Sagesse spirituelle africaine</Text>
          </View>
        </View>
      </View>
      <View style={[st.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['interpret', 'history'] as DreamTab[]).map((v) => (
          <TouchableOpacity key={v} onPress={() => setTab(v)} style={[st.tabBtn, tab === v && st.tabBtnActive]}>
            <AppIcon icon={v === 'interpret' ? MessageCircle : History} size={15} color={tab === v ? '#C9A84C' : colors.textSecondary} strokeWidth={2.2} />
            <Text style={[st.tabLabel, { color: tab === v ? '#C9A84C' : colors.textSecondary }]}>
              {v === 'interpret' ? 'Interpréter' : 'Historique'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'interpret'
        ? <InterpretTab onSuccess={loadHistory} />
        : <HistoryTab conversations={conversations} loading={loading} loadHistory={loadHistory} />
      }
    </View>
  );
}

const st = StyleSheet.create({
  header:         { paddingTop: 56, paddingBottom: 18, borderBottomWidth: 1, overflow: 'hidden', position: 'relative' },
  deco1:          { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(201,168,76,0.06)', top: -50, right: -30 },
  deco2:          { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(92,47,181,0.07)', bottom: -30, left: -20 },
  headerInner:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle:    { fontSize: 18, fontWeight: '800' },
  headerSub:      { fontSize: 12, marginTop: 2 },
  tabBar:         { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabBtnActive:   { borderBottomWidth: 2, borderBottomColor: '#C9A84C' },
  tabLabel:       { fontSize: 14, fontWeight: '700' },
  costBadge:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  costText:       { fontSize: 13, fontWeight: '600' },
  textArea:       { borderWidth: 1.5, borderRadius: 14, padding: 14 },
  textInput:      { fontSize: 15, minHeight: 120 },
  resultCard:     { padding: 18, borderRadius: 18, borderWidth: 1 },
  resultLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  divider:        { height: 1, marginVertical: 14 },
  histCard:       { borderWidth: 1, padding: 14, borderRadius: 14, marginBottom: 10 },
});
