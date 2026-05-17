import { CloudMoon, History, MessageCircle, NotebookPen, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PremiumGuard } from '../../../src/components/auth/PremiumGuard';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { AIService } from '../../../src/services/ai.service';
import { useI18n } from '../../../src/i18n';
import { useTheme } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/auth.store';
import { AIConversation } from '../../../src/types/content.types';
import { formatDate, truncateText } from '../../../src/utils/helpers';

type DreamTab = 'interpret' | 'history';

// ─── Onglet interprétation ────────────────────────────────────────────────────

function InterpretTab({ onInterpretationSuccess }: { onInterpretationSuccess: () => void }) {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  const [dream, setDream] = useState('');
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);

  async function handleInterpret() {
    if (!dream.trim() || dream.trim().length < 20) return;
    setLoading(true);
    setInterpretation(null);
    try {
      const { message } = await AIService.interpretDream(dream.trim());
      setInterpretation(message.content || "Une erreur s'est produite. Réessaie.");
      setDate(new Date().toISOString());
      // Rafraîchir l'historique en arrière-plan pour inclure ce nouveau rêve
      onInterpretationSuccess();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de contacter le service d'interprétation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ padding: spacing.base, gap: spacing.lg }}>
        {/* Instructions */}
        <Card>
          <View style={styles.instructionsTitleRow}>
            <AppIcon icon={NotebookPen} size={16} color={colors.text} strokeWidth={2.4} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
              {t.dreams.howTitle}
            </Text>
          </View>
          {[t.dreams.step1, t.dreams.step2, t.dreams.step3].map((step, i) => (
            <Text key={i} style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
              {i + 1}. {step}
            </Text>
          ))}
        </Card>

        {/* Saisie du rêve */}
        <View>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8 }}>
            {t.dreams.dreamLabel}
          </Text>
          <View style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={dream}
              onChangeText={setDream}
              placeholder={t.dreams.dreamPh}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>
            {t.dreams.charCount(dream.length)}
          </Text>
        </View>

        <Button
          label={loading ? t.dreams.interpreting : t.dreams.interpret}
          variant="gold"
          fullWidth
          loading={loading}
          disabled={dream.trim().length < 20}
          onPress={handleInterpret}
        />

        {/* Résultat en direct */}
        {interpretation && (
          <View style={[styles.resultCard, { backgroundColor: colors.premiumBackground, borderColor: colors.premiumBorder }]}>
            <View style={styles.resultLabelRow}>
              <AppIcon icon={MessageCircle} size={14} color="#C9A84C" strokeWidth={2.6} />
              <Text style={{ fontSize: 12, color: '#C9A84C', fontWeight: '700' }}>
                {t.dreams.resultLabel(formatDate(date!))}
              </Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 15, lineHeight: 26 }}>
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
  );
}

// ─── Onglet historique (Anciens messages sécurisés) ───────────────────────────

function HistoryTab({ conversations, loading, loadHistory }: { conversations: AIConversation[], loading: boolean, loadHistory: () => void }) {
  const { colors, spacing } = useTheme();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<string, { userDream: string, aiInterpretation: string }>>({});
  const [loadingResponse, setLoadingResponse] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleExpand(item: AIConversation) {
    const isOpen = expanded === item.id;
    if (isOpen) {
      setExpanded(null);
      return;
    }
    setExpanded(item.id);

    // Si l'ancien rêve et son interprétation sont déjà chargés en cache, on s'arrête là
    if (aiResponses[item.id]) return;

    setLoadingResponse(item.id);
    try {
      // Récupération complète de l'historique du message depuis le serveur LWS
      const messages = await AIService.getConversationHistory(item.id);
      
      const userMsg = messages.find((m) => m.role === 'user');
      const aiMsg = messages.find((m) => m.role === 'assistant');

      const userDreamText = userMsg 
        ? userMsg.content.replace(/^Interprète spirituellement ce rêve\s*:\s*/i, '').trim()
        : 'Rêve enregistré';
        
      const aiInterpretationText = aiMsg 
        ? aiMsg.content 
        : "L'interprétation n'a pas pu être récupérée.";

      setAiResponses((prev) => ({
        ...prev,
        [item.id]: {
          userDream: userDreamText,
          aiInterpretation: aiInterpretationText
        }
      }));
    } catch (e) {
      Alert.alert("Erreur", "Impossible de charger l'ancien message.");
    } finally {
      setLoadingResponse(null);
    }
  }

  async function handleDelete(conv: AIConversation) {
    Alert.alert(
      'Supprimer ce rêve',
      'Cette interprétation sera supprimée définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await AIService.deleteConversation(conv.id);
            loadHistory();
            setAiResponses((prev) => { const n = { ...prev }; delete n[conv.id]; return n; });
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
        <AppIcon icon={CloudMoon} size={48} color="#C9A84C" strokeWidth={1.6} />
        <Text style={{ color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
          Aucune interprétation de rêve enregistrée.{"\n"}Interprétez votre premier rêve pour le retrouver ici.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: spacing.base, gap: 12 }}
      renderItem={({ item }) => {
        const isOpen = expanded === item.id;
        const cachedData = aiResponses[item.id];
        const isLoadingThis = loadingResponse === item.id;

        // Titre de l'aperçu avant d'ouvrir
        const previewTitle = item.messages && item.messages.length > 0
          ? item.messages[0].content.replace(/^Interprète spirituellement ce rêve\s*:\s*/i, '').trim()
          : 'Ancien rêve';

        return (
          <TouchableOpacity
            onPress={() => handleExpand(item)}
            onLongPress={() => handleDelete(item)}
            style={[styles.histCard, { backgroundColor: colors.surface, borderColor: isOpen ? '#C9A84C' : colors.border }]}
            activeOpacity={0.85}
          >
            <View style={styles.histHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <AppIcon icon={CloudMoon} size={14} color="#C9A84C" strokeWidth={2.2} />
                  <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '700' }}>
                    {formatDate(item.updatedAt || item.createdAt)}
                  </Text>
                </View>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14, lineHeight: 20 }}>
                  {truncateText(cachedData ? cachedData.userDream : previewTitle, 75)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 6 }}>
                <AppIcon icon={Trash2} size={16} color={colors.textTertiary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {isOpen && (
              <View style={[styles.histBody, { borderTopColor: colors.border }]}>
                {isLoadingThis ? (
                  <View style={{ alignItems: 'center', padding: 16 }}>
                    <ActivityIndicator size="small" color="#C9A84C" />
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
                      Récupération de l'interprétation stockée…
                    </Text>
                  </View>
                ) : cachedData ? (
                  <View style={{ gap: 12 }}>
                    {/* Rappel du rêve soumis */}
                    <View style={{ backgroundColor: colors.background, padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#C9A84C' }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, fontStyle: 'italic', lineHeight: 18 }}>
                        " {cachedData.userDream} "
                      </Text>
                    </View>
                    
                    {/* Interprétation divine de l'IA */}
                    <Text style={{ color: colors.text, fontSize: 14, lineHeight: 24, fontWeight: '400' }}>
                      {cachedData.aiInterpretation}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: colors.textTertiary, fontSize: 13, fontStyle: 'italic' }}>
                    Impossible d'afficher les détails.
                  </Text>
                )}
              </View>
            )}

            <View style={{ alignItems: 'center', marginTop: 10, borderTopWidth: isOpen ? 0.5 : 0, borderTopColor: colors.border, paddingTop: isOpen ? 8 : 0 }}>
              <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: '500' }}>
                {isOpen ? 'Réduire ▲' : 'Consulter l\'ancien message ▼'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

function DreamsContent() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<DreamTab>('interpret');
  
  // Partage de l'état de l'historique pour mise à jour instantanée
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    setLoadingHistory(true);
    try {
      const data = await AIService.getDreamHistory(user.id);
      setConversations(data);
    } catch (e) {
      console.log("Erreur historique:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [user?.id]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.deepBlue ?? '#1A1A3E', paddingTop: 56 }]}>
        <BackButton variant="dark" style={{ marginBottom: 12 }} fallback="/(app)/(tabs)/home" />
        <View style={styles.headerTitleRow}>
          <AppIcon icon={CloudMoon} size={20} color="#fff" strokeWidth={2.4} />
          <Text style={styles.headerTitle}>{t.dreams.title}</Text>
        </View>
        <Text style={styles.headerSubtitle}>{t.dreams.subtitle}</Text>
      </View>

      {/* Onglets */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {([
          { key: 'interpret' as DreamTab, label: 'Interpréter', icon: NotebookPen },
          { key: 'history' as DreamTab, label: 'Historique', icon: History },
        ] as const).map(({ key, label, icon }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setActiveTab(key)}
            style={[styles.tab, activeTab === key && { borderBottomColor: '#C9A84C' }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppIcon
                icon={icon}
                size={14}
                color={activeTab === key ? '#C9A84C' : colors.textSecondary}
                strokeWidth={2.4}
              />
              <Text style={[styles.tabLabel, { color: activeTab === key ? '#C9A84C' : colors.textSecondary }]}>
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'interpret' ? (
        <InterpretTab onInterpretationSuccess={loadHistory} />
      ) : (
        <HistoryTab conversations={conversations} loading={loadingHistory} loadHistory={loadHistory} />
      )}
    </View>
  );
}

export default function DreamsScreen() {
  const { t } = useI18n();
  return (
    <PremiumGuard featureName={t.dreams.featureName}>
      <DreamsContent />
    </PremiumGuard>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 24 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 14, fontWeight: '600' },

  instructionsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  textArea: { borderWidth: 1.5, borderRadius: 12, padding: 14 },
  textInput: { fontSize: 15, minHeight: 120, lineHeight: 24 },
  resultCard: { padding: 16, borderRadius: 16, borderWidth: 1.5 },
  resultLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  divider: { height: 1, marginVertical: 12 },

  histCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  histHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  histBody: { borderTopWidth: 1, marginTop: 12, paddingTop: 12 },
});
