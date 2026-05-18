import { CloudMoon, History, MessageCircle, NotebookPen, Trash2 } from 'lucide-react-native'; import React, { useCallback, useEffect, useState } from 'react'; import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';

import { PremiumGuard } from '../../../src/components/auth/PremiumGuard'; import { AppIcon } from '../../../src/components/common/AppIcon'; import { BackButton } from '../../../src/components/common/BackButton'; import { Button } from '../../../src/components/common/Button'; import { Card } from '../../../src/components/common/Card';

import { AIService } from '../../../src/services/ai.service'; import { useI18n } from '../../../src/i18n'; import { useTheme } from '../../../src/theme'; import { useAuthStore } from '../../../src/store/auth.store';

import { AIConversation } from '../../../src/types/content.types'; import { formatDate } from '../../../src/utils/helpers';

type DreamTab = 'interpret' | 'history';

// ───────────────────────── INTERPRET TAB ─────────────────────────

function InterpretTab({ onInterpretationSuccess }: { onInterpretationSuccess: () => void }) { const { colors, spacing } = useTheme(); const { t } = useI18n();

const [dream, setDream] = useState(''); const [loading, setLoading] = useState(false); const [interpretation, setInterpretation] = useState<string | null>(null); const [date, setDate] = useState<string | null>(null);

async function handleInterpret() { if (!dream || dream.trim().length < 20) { Alert.alert('Erreur', 'Veuillez écrire au moins 20 caractères'); return; }

setLoading(true);
setInterpretation(null);

try {
  const res = await AIService.interpretDream(dream.trim());

  const message = res?.message?.content ?? 'Aucune interprétation reçue';

  setInterpretation(message);
  setDate(new Date().toISOString());

  onInterpretationSuccess();
} catch (e) {
  Alert.alert('Erreur', 'Service indisponible');
} finally {
  setLoading(false);
}

}

return ( <ScrollView style={{ flex: 1, backgroundColor: colors.background }}> <View style={{ padding: spacing.base }}>

<Card>
      <Text style={{ fontWeight: '700', color: colors.text }}>
        {t.dreams.howTitle}
      </Text>

      {[t.dreams.step1, t.dreams.step2, t.dreams.step3].map((step, i) => (
        <Text key={i} style={{ color: colors.textSecondary, fontSize: 13 }}>
          {i + 1}. {step}
        </Text>
      ))}
    </Card>

    <Text style={{ marginTop: 12, color: colors.text, fontWeight: '600' }}>
      {t.dreams.dreamLabel}
    </Text>

    <View style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
      <TextInput
        value={dream}
        onChangeText={setDream}
        placeholder={t.dreams.dreamPh}
        placeholderTextColor={colors.textTertiary}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        style={[styles.textInput, { color: colors.text }]}
      />
    </View>

    <Button
      label={loading ? t.dreams.interpreting : t.dreams.interpret}
      loading={loading}
      disabled={dream.trim().length < 20}
      onPress={handleInterpret}
    />

    {interpretation && date && (
      <View style={[styles.resultCard, { backgroundColor: colors.premiumBackground, borderColor: colors.premiumBorder }]}> 

        <View style={styles.resultLabelRow}>
          <AppIcon icon={MessageCircle} size={14} color="#C9A84C" />
          <Text style={{ fontSize: 12, color: '#C9A84C', fontWeight: '700' }}>
            {t.dreams.resultLabel(formatDate(date))}
          </Text>
        </View>

        <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24 }}>
          {interpretation}
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.premiumBorder }]} />

        <Text style={{ color: colors.textTertiary, fontSize: 12, fontStyle: 'italic' }}>
          {t.dreams.disclaimer}
        </Text>
      </View>
    )}

  </View>
</ScrollView>

); }

// ───────────────────────── HISTORY TAB ─────────────────────────

function HistoryTab({ conversations, loading, loadHistory }: any) { const { colors } = useTheme();

const [expanded, setExpanded] = useState<string | null>(null); const [cache, setCache] = useState<Record<string, any>>({}); const [loadingId, setLoadingId] = useState<string | null>(null);

useEffect(() => { loadHistory(); }, [loadHistory]);

async function handleExpand(item: AIConversation) { const id = item.id;

if (expanded === id) {
  setExpanded(null);
  return;
}

setExpanded(id);

if (cache[id]) return;

setLoadingId(id);

try {
  const messages = await AIService.getConversationHistory(id);

  const safe = Array.isArray(messages) ? messages : [];

  const userMsg = safe.find(m => m.role === 'user');
  const aiMsg = safe.find(m => m.role === 'assistant');

  setCache(prev => ({
    ...prev,
    [id]: {
      userDream: userMsg?.content ?? 'Rêve indisponible',
      aiInterpretation: aiMsg?.content ?? 'Aucune interprétation'
    }
  }));

} catch (e) {
  Alert.alert('Erreur', 'Impossible de charger le message');
} finally {
  setLoadingId(null);
}

}

async function handleDelete(item: AIConversation) { try { await AIService.deleteConversation(item.id);

await loadHistory();

  setCache(prev => {
    const copy = { ...prev };
    delete copy[item.id];
    return copy;
  });

  if (expanded === item.id) setExpanded(null);

} catch (e) {
  Alert.alert('Erreur', 'Suppression impossible');
}

}

if (loading) { return ( <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}> <ActivityIndicator size="large" color="#C9A84C" /> </View> ); }

if (!Array.isArray(conversations) || conversations.length === 0) { return ( <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}> <Text style={{ color: '#888' }}>Aucun rêve enregistré</Text> </View> ); }

return ( <FlatList data={conversations} keyExtractor={(item) => item.id} contentContainerStyle={{ padding: 16 }} renderItem={({ item }) => { const open = expanded === item.id; const data = cache[item.id];

const preview = item.messages?.[0]?.content ?? 'Ancien rêve';

    return (
      <TouchableOpacity
        onPress={() => handleExpand(item)}
        onLongPress={() => handleDelete(item)}
        style={[styles.histCard, { borderColor: open ? '#C9A84C' : '#ddd' }]}
      >
        <Text style={{ fontWeight: '600' }}>
          {data?.userDream ?? preview}
        </Text>

        {open && data && (
          <Text style={{ marginTop: 10 }}>
            {data.aiInterpretation}
          </Text>
        )}

        <TouchableOpacity onPress={() => handleDelete(item)}>
          <Trash2 size={18} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }}
/>

); }

// ───────────────────────── MAIN SCREEN ─────────────────────────

function DreamsContent() { const { colors } = useTheme(); const { t } = useI18n(); const user = useAuthStore(s => s.user);

const [tab, setTab] = useState<DreamTab>('interpret'); const [conversations, setConversations] = useState<AIConversation[]>([]); const [loading, setLoading] = useState(true);

const loadHistory = useCallback(async () => { if (!user?.id) return;

setLoading(true);

try {
  const data = await AIService.getDreamHistory(user.id);
  setConversations(Array.isArray(data) ? data : []);
} catch (e) {
  setConversations([]);
} finally {
  setLoading(false);
}

}, [user?.id]);

return ( <View style={{ flex: 1, backgroundColor: colors.background }}>

<View style={{ padding: 16 }}>
    <BackButton fallback="/(app)/(tabs)/home" />
    <Text style={{ fontSize: 20, fontWeight: '700' }}>
      {t.dreams.title}
    </Text>
  </View>

  <View style={{ flexDirection: 'row' }}>
    <TouchableOpacity onPress={() => setTab('interpret')}>
      <Text>Interpréter</Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => setTab('history')}>
      <Text>Historique</Text>
    </TouchableOpacity>
  </View>

  {tab === 'interpret' ? (
    <InterpretTab onInterpretationSuccess={loadHistory} />
  ) : (
    <HistoryTab
      conversations={conversations}
      loading={loading}
      loadHistory={loadHistory}
    />
  )}

</View>

); }

export default function DreamsScreen() { const { t } = useI18n();

return ( <PremiumGuard featureName={t.dreams.featureName}> <DreamsContent /> </PremiumGuard> ); }

const styles = StyleSheet.create({ textArea: { borderWidth: 1.5, borderRadius: 12, padding: 14 }, textInput: { fontSize: 15, minHeight: 120 }, resultCard: { padding: 16, borderRadius: 16, borderWidth: 1.5 }, resultLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, divider: { height: 1, marginVertical: 12 }, histCard: { borderWidth: 1, padding: 14, borderRadius: 12 } });