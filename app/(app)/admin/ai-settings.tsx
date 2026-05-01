import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CheckCircle, Edit3, RefreshCw, Save } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { Button } from '../../../src/components/common/Button';
import { AIService } from '../../../src/services/ai.service';
import { useAuthStore } from '../../../src/store/auth.store';
import { useTheme } from '../../../src/theme';
import { router } from 'expo-router';

interface AiSetting {
  id: number;
  section_name: string;
  system_prompt: string;
  updated_at: string;
}

const SECTION_LABELS: Record<string, { label: string; color: string; description: string }> = {
  guide:          { label: 'Guide spirituel',         color: '#6366F1', description: 'Tunnel de conversion vers l\'abonnement' },
  consultation:   { label: 'Consultation',            color: '#C9A84C', description: 'Canal du Prophète Georges — voyance et programme' },
  accompagnement: { label: 'Accompagnement',          color: '#10B981', description: 'Accompagnement spirituel vivant et adaptatif' },
  prayer:         { label: 'Prière et suivi',         color: '#EC4899', description: 'Programme de prière progressif (3, 7 ou 9 jours)' },
  dream:          { label: 'Interprétation des rêves', color: '#7C3AED', description: 'Lecture spirituelle et symbolique des rêves' },
};

export default function AdminAiSettingsScreen() {
  const { colors, spacing } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [settings, setSettings] = useState<AiSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSection, setSavedSection] = useState<string | null>(null);

  // Rediriger si pas admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      Alert.alert('Accès refusé', 'Cette section est réservée aux administrateurs.');
      router.back();
    }
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const data = await AIService.getAdminSettings();
    setSettings(data);
    setLoading(false);
  }

  function startEdit(setting: AiSetting) {
    setEditingSection(setting.section_name);
    setEditedPrompt(setting.system_prompt);
  }

  function cancelEdit() {
    setEditingSection(null);
    setEditedPrompt('');
  }

  async function handleSave(section: string) {
    if (!editedPrompt.trim()) {
      Alert.alert('Erreur', 'Le prompt ne peut pas être vide.');
      return;
    }
    setSaving(true);
    try {
      await AIService.updateAdminSetting(section, editedPrompt.trim());
      setSettings((prev) =>
        prev.map((s) =>
          s.section_name === section
            ? { ...s, system_prompt: editedPrompt.trim(), updated_at: new Date().toISOString() }
            : s,
        ),
      );
      setEditingSection(null);
      setEditedPrompt('');
      setSavedSection(section);
      setTimeout(() => setSavedSection(null), 3000);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Vérifiez votre connexion.');
    } finally {
      setSaving(false);
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[s.header, { backgroundColor: '#1A1A3E' }]}>
        <BackButton variant="dark" style={{ marginBottom: 12 }} fallback="/(app)/(tabs)/profile" />
        <Text style={s.headerTitle}>Tableau de bord — Prompts IA</Text>
        <Text style={s.headerSub}>
          Modifiez les instructions système de chaque section directement depuis ici.
          Les changements sont appliqués immédiatement.
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#C9A84C" />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Chargement des prompts...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.base, gap: 16, paddingBottom: 48 }}>

          {/* Notice */}
          <View style={[s.notice, { backgroundColor: '#C9A84C18', borderColor: '#C9A84C' }]}>
            <Text style={{ color: '#C9A84C', fontSize: 13, lineHeight: 20 }}>
              Chaque section utilise son propre prompt indépendant.
              Modifiez le texte et appuyez sur Enregistrer.
              L'IA applique le nouveau prompt dès le prochain message.
            </Text>
          </View>

          {/* Rafraîchir */}
          <TouchableOpacity onPress={loadSettings} style={[s.refreshBtn, { borderColor: colors.border }]}>
            <AppIcon icon={RefreshCw} size={16} color={colors.textSecondary} strokeWidth={2.2} />
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Recharger depuis le serveur</Text>
          </TouchableOpacity>

          {settings.map((setting) => {
            const meta = SECTION_LABELS[setting.section_name];
            const isEditing = editingSection === setting.section_name;
            const isSaved = savedSection === setting.section_name;

            return (
              <View
                key={setting.section_name}
                style={[s.card, { backgroundColor: colors.surface, borderColor: meta?.color ?? colors.border }]}
              >
                {/* En-tête section */}
                <View style={s.cardHeader}>
                  <View style={[s.sectionDot, { backgroundColor: (meta?.color ?? '#888') + '30' }]}>
                    <View style={[s.sectionDotInner, { backgroundColor: meta?.color ?? '#888' }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.sectionLabel, { color: colors.text }]}>
                      {meta?.label ?? setting.section_name}
                    </Text>
                    <Text style={[s.sectionDesc, { color: colors.textSecondary }]}>
                      {meta?.description ?? ''}
                    </Text>
                    <Text style={[s.sectionDate, { color: colors.textTertiary }]}>
                      Modifié le {formatDate(setting.updated_at)}
                    </Text>
                  </View>
                  {isSaved && (
                    <AppIcon icon={CheckCircle} size={20} color="#10B981" strokeWidth={2.4} />
                  )}
                </View>

                {/* Éditeur */}
                {isEditing ? (
                  <View style={{ gap: 10 }}>
                    <TextInput
                      style={[s.promptEditor, { color: colors.text, backgroundColor: colors.background, borderColor: meta?.color ?? colors.border }]}
                      value={editedPrompt}
                      onChangeText={setEditedPrompt}
                      multiline
                      textAlignVertical="top"
                      autoFocus
                      placeholder="Entrez le prompt système..."
                      placeholderTextColor={colors.textTertiary}
                    />
                    <Text style={{ color: colors.textTertiary, fontSize: 11 }}>
                      {editedPrompt.length} caractères
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        onPress={cancelEdit}
                        style={[s.cancelBtn, { borderColor: colors.border, flex: 1 }]}
                      >
                        <Text style={{ color: colors.textSecondary, fontWeight: '600', textAlign: 'center' }}>
                          Annuler
                        </Text>
                      </TouchableOpacity>
                      <Button
                        label={saving ? 'Enregistrement...' : 'Enregistrer'}
                        variant="gold"
                        loading={saving}
                        onPress={() => handleSave(setting.section_name)}
                        style={{ flex: 2 }}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    <View style={[s.promptPreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }} numberOfLines={4}>
                        {setting.system_prompt}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => startEdit(setting)}
                      style={[s.editBtn, { borderColor: meta?.color ?? colors.border }]}
                    >
                      <AppIcon icon={Edit3} size={14} color={meta?.color ?? '#888'} strokeWidth={2.4} />
                      <Text style={{ color: meta?.color ?? '#888', fontWeight: '600', fontSize: 13 }}>
                        Modifier ce prompt
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 20 },
  notice: { borderRadius: 12, borderWidth: 1, padding: 14 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  card: { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sectionDot: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  sectionDotInner: { width: 12, height: 12, borderRadius: 6 },
  sectionLabel: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  sectionDesc: { fontSize: 12, lineHeight: 18 },
  sectionDate: { fontSize: 10, marginTop: 4 },
  promptPreview: { borderRadius: 10, borderWidth: 1, padding: 12 },
  promptEditor: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 20, minHeight: 300 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 10, padding: 12, justifyContent: 'center' },
  cancelBtn: { borderWidth: 1, borderRadius: 10, padding: 12 },
});
