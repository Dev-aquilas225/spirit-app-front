import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  BookMarked,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Edit2,
  FilePlus,
  FolderPlus,
  Layers,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { Card } from '../../../src/components/common/Card';
import { Button } from '../../../src/components/common/Button';
import {
  Formation,
  Lesson,
  CreateFormationPayload,
  CreateLessonPayload,
  FormationsService,
} from '../../../src/services/formations.service';
import { useTheme } from '../../../src/theme';

/* ─── Constantes ─────────────────────────────────────────────────────────── */

const LEVEL_CFG: Record<string, { label: string; color: string; bg: string }> = {
  beginner:     { label: 'Débutant',      color: '#10B981', bg: 'rgba(16,185,129,0.13)' },
  intermediate: { label: 'Intermédiaire', color: '#F59E0B', bg: 'rgba(245,158,11,0.13)' },
  advanced:     { label: 'Avancé',        color: '#EF4444', bg: 'rgba(239,68,68,0.13)' },
};

const FILE_TYPE_CFG: Record<string, { label: string; color: string }> = {
  pdf:   { label: 'PDF',   color: '#6366F1' },
  image: { label: 'Image', color: '#EC4899' },
  video: { label: 'Vidéo', color: '#F59E0B' },
  text:  { label: 'Texte', color: '#10B981' },
};

/* ─── Modal — Ajouter une formation ─────────────────────────────────────── */

interface AddFormationModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function AddFormationModal({ visible, onClose, onCreated }: AddFormationModalProps) {
  const { colors, spacing } = useTheme();

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('');
  const [instructor,  setInstructor]  = useState('');
  const [level,       setLevel]       = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isPremium,   setIsPremium]   = useState(true);
  const [saving,      setSaving]      = useState(false);

  function reset() {
    setTitle(''); setDescription(''); setCategory('');
    setInstructor(''); setLevel('beginner'); setIsPremium(true);
  }

  function handleClose() { reset(); onClose(); }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Champ requis', 'Le titre est obligatoire.');
      return;
    }
    setSaving(true);
    const payload: CreateFormationPayload = {
      title:       title.trim(),
      description: description.trim() || undefined,
      category:    category.trim()    || undefined,
      instructor:  instructor.trim()  || undefined,
      level,
      isPremium,
      isActive: true,
    };
    const { error } = await FormationsService.adminCreateFormation(payload);
    setSaving(false);
    if (error) { Alert.alert('Erreur', error); return; }
    reset();
    onCreated();
  }

  const fieldStyle = [styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Nouvelle formation</Text>
          <TouchableOpacity onPress={handleClose}>
            <AppIcon icon={X} size={22} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: spacing.base, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Titre */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>
              Titre <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              style={fieldStyle}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex : Prophétie & Intercession"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Formateur */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Formateur</Text>
            <TextInput
              style={fieldStyle}
              value={instructor}
              onChangeText={setInstructor}
              placeholder="Ex : Prophète Georges Tchingankong"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Catégorie */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Catégorie</Text>
            <TextInput
              style={fieldStyle}
              value={category}
              onChangeText={setCategory}
              placeholder="Ex : Prière, Prophétie, Foi…"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Description */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[fieldStyle, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Présentation de la formation…"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          </View>

          {/* Niveau */}
          <View style={{ gap: 8 }}>
            <Text style={[styles.label, { color: colors.text }]}>Niveau</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['beginner', 'intermediate', 'advanced'] as const).map((l) => {
                const cfg = LEVEL_CFG[l];
                const active = level === l;
                return (
                  <TouchableOpacity
                    key={l}
                    onPress={() => setLevel(l)}
                    style={[
                      styles.levelBtn,
                      {
                        backgroundColor: active ? cfg.bg : colors.surface,
                        borderColor: active ? cfg.color : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: active ? cfg.color : colors.textSecondary }}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Premium toggle */}
          <TouchableOpacity
            onPress={() => setIsPremium(!isPremium)}
            style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Réservé aux abonnés</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {isPremium ? 'Formation premium (abonnés uniquement)' : 'Formation gratuite (tous les utilisateurs)'}
              </Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: isPremium ? '#C9A84C' : colors.border }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: isPremium ? 18 : 2 }] }]} />
            </View>
          </TouchableOpacity>

          <Button
            label={saving ? 'Création…' : 'Créer la formation'}
            variant="gold"
            fullWidth
            onPress={handleSave}
            style={{ marginTop: 8 }}
          />
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ─── Modal — Modifier une formation ────────────────────────────────────── */

interface EditFormationModalProps {
  visible: boolean;
  formation: Formation | null;
  onClose: () => void;
  onSaved: () => void;
}

function EditFormationModal({ visible, formation, onClose, onSaved }: EditFormationModalProps) {
  const { colors, spacing } = useTheme();

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('');
  const [instructor,  setInstructor]  = useState('');
  const [level,       setLevel]       = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isPremium,   setIsPremium]   = useState(true);
  const [saving,      setSaving]      = useState(false);

  // Pré-remplir quand la formation change
  useEffect(() => {
    if (formation) {
      setTitle(formation.title ?? '');
      setDescription(formation.description ?? '');
      setCategory(formation.category ?? '');
      setInstructor(formation.instructor ?? '');
      setLevel((formation.level as 'beginner' | 'intermediate' | 'advanced') ?? 'beginner');
      setIsPremium(formation.isPremium ?? true);
    }
  }, [formation]);

  function handleClose() { onClose(); }

  async function handleSave() {
    if (!formation) return;
    if (!title.trim()) {
      Alert.alert('Champ requis', 'Le titre est obligatoire.');
      return;
    }
    setSaving(true);
    const payload: Partial<CreateFormationPayload> = {
      title:       title.trim(),
      description: description.trim() || undefined,
      category:    category.trim()    || undefined,
      instructor:  instructor.trim()  || undefined,
      level,
      isPremium,
    };
    const { error } = await FormationsService.adminUpdateFormation(formation.id, payload);
    setSaving(false);
    if (error) { Alert.alert('Erreur', error); return; }
    onSaved();
  }

  const fieldStyle = [styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Modifier la formation</Text>
            {formation && (
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                {formation.title}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleClose}>
            <AppIcon icon={X} size={22} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: spacing.base, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Titre */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>
              Titre <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              style={fieldStyle}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex : Prophétie & Intercession"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Formateur */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Formateur</Text>
            <TextInput
              style={fieldStyle}
              value={instructor}
              onChangeText={setInstructor}
              placeholder="Ex : Prophète Georges Tchingankong"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Catégorie */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Catégorie</Text>
            <TextInput
              style={fieldStyle}
              value={category}
              onChangeText={setCategory}
              placeholder="Ex : Prière, Prophétie, Foi…"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Description */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[fieldStyle, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Présentation de la formation…"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          </View>

          {/* Niveau */}
          <View style={{ gap: 8 }}>
            <Text style={[styles.label, { color: colors.text }]}>Niveau</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['beginner', 'intermediate', 'advanced'] as const).map((l) => {
                const cfg = LEVEL_CFG[l];
                const active = level === l;
                return (
                  <TouchableOpacity
                    key={l}
                    onPress={() => setLevel(l)}
                    style={[
                      styles.levelBtn,
                      {
                        backgroundColor: active ? cfg.bg : colors.surface,
                        borderColor: active ? cfg.color : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: active ? cfg.color : colors.textSecondary }}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Premium toggle */}
          <TouchableOpacity
            onPress={() => setIsPremium(!isPremium)}
            style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Réservé aux abonnés</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {isPremium ? 'Formation premium (abonnés uniquement)' : 'Formation gratuite (tous les utilisateurs)'}
              </Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: isPremium ? '#C9A84C' : colors.border }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: isPremium ? 18 : 2 }] }]} />
            </View>
          </TouchableOpacity>

          <Button
            label={saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            variant="gold"
            fullWidth
            onPress={handleSave}
            style={{ marginTop: 8 }}
          />
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ─── Modal — Ajouter une leçon ─────────────────────────────────────────── */

interface AddLessonModalProps {
  visible: boolean;
  formation: Formation | null;
  onClose: () => void;
  onCreated: () => void;
}

function AddLessonModal({ visible, formation, onClose, onCreated }: AddLessonModalProps) {
  const { colors, spacing } = useTheme();

  const [title,        setTitle]        = useState('');
  const [content,      setContent]      = useState('');
  const [order,        setOrder]        = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving,       setSaving]       = useState(false);

  function reset() {
    setTitle(''); setContent(''); setOrder(''); setSelectedFile(null);
  }

  function handleClose() { reset(); onClose(); }

  function pickFile() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,application/pdf,image/*,video/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) setSelectedFile(file);
      };
      input.click();
    } else {
      Alert.alert('Non disponible', 'Le chargement de fichiers n\'est disponible que depuis le navigateur web.');
    }
  }

  async function handleSave() {
    if (!formation) return;
    if (!title.trim()) {
      Alert.alert('Champ requis', 'Le titre est obligatoire.');
      return;
    }
    setSaving(true);
    const payload: CreateLessonPayload = {
      title:   title.trim(),
      content: content.trim() || undefined,
      order:   order ? parseInt(order, 10) : undefined,
    };
    const { error } = await FormationsService.adminCreateLesson(formation.id, payload, selectedFile ?? undefined);
    setSaving(false);
    if (error) { Alert.alert('Erreur', error); return; }
    reset();
    onCreated();
  }

  const fieldStyle = [styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Nouvelle leçon</Text>
            {formation && (
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                {formation.title}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleClose}>
            <AppIcon icon={X} size={22} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: spacing.base, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Titre */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>
              Titre <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              style={fieldStyle}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex : Introduction à la prophétie"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Ordre */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Ordre (numéro)</Text>
            <TextInput
              style={fieldStyle}
              value={order}
              onChangeText={setOrder}
              placeholder="Ex : 1"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />
          </View>

          {/* Contenu texte */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Contenu (texte libre)</Text>
            <TextInput
              style={[fieldStyle, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
              value={content}
              onChangeText={setContent}
              placeholder="Description ou transcription de la leçon…"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          </View>

          {/* Fichier */}
          <View style={{ gap: 6 }}>
            <Text style={[styles.label, { color: colors.text }]}>Fichier (PDF, image ou vidéo)</Text>
            <TouchableOpacity
              onPress={pickFile}
              style={[
                styles.fileBtn,
                {
                  borderColor: selectedFile ? '#10B981' : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <AppIcon
                icon={selectedFile ? CheckCircle : Upload}
                size={20}
                color={selectedFile ? '#10B981' : colors.textSecondary}
                strokeWidth={2}
              />
              <Text
                style={{ flex: 1, color: selectedFile ? '#10B981' : colors.textSecondary, fontSize: 13 }}
                numberOfLines={1}
              >
                {selectedFile ? selectedFile.name : 'Choisir un fichier…'}
              </Text>
              {selectedFile && (
                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                  <AppIcon icon={X} size={16} color={colors.textSecondary} strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {Platform.OS !== 'web' && (
              <Text style={{ fontSize: 11, color: colors.textTertiary }}>
                Le chargement de fichiers est disponible uniquement depuis le navigateur web.
              </Text>
            )}
          </View>

          <Button
            label={saving ? 'Enregistrement…' : 'Ajouter la leçon'}
            variant="gold"
            fullWidth
            onPress={handleSave}
            style={{ marginTop: 8 }}
          />
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ─── Carte formation ────────────────────────────────────────────────────── */

interface FormationCardProps {
  formation: Formation;
  onAddLesson: (formation: Formation) => void;
  onToggleActive: (formation: Formation) => void;
  onEdit: (formation: Formation) => void;
  onDelete: (formation: Formation) => void;
}

function FormationCard({ formation, onAddLesson, onToggleActive, onEdit, onDelete }: FormationCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const levelCfg = LEVEL_CFG[formation.level] ?? LEVEL_CFG.beginner;
  const isActive = formation.isActive !== false; // default true if undefined

  async function handleToggle() {
    setLoading(true);
    await onToggleActive(formation);
    setLoading(false);
  }

  return (
    <Card style={{ marginBottom: 12 }} padding="none">
      {/* En-tête de la carte */}
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.8}>
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            {/* Icône */}
            <View style={[styles.formationIcon, { backgroundColor: 'rgba(201,168,76,0.12)' }]}>
              <AppIcon icon={BookMarked} size={22} color="#C9A84C" strokeWidth={2} />
            </View>

            {/* Infos */}
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={1}>
                  {formation.title}
                </Text>
                {/* Badge actif/inactif */}
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: isActive ? 'rgba(16,185,129,0.13)' : 'rgba(156,163,175,0.13)' },
                  ]}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: isActive ? '#10B981' : '#9CA3AF' }}>
                    {isActive ? 'ACTIF' : 'INACTIF'}
                  </Text>
                </View>
              </View>

              {formation.instructor ? (
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{formation.instructor}</Text>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                {/* Niveau */}
                <View style={[styles.pill, { backgroundColor: levelCfg.bg }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: levelCfg.color }}>{levelCfg.label}</Text>
                </View>
                {/* Premium */}
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: formation.isPremium ? 'rgba(201,168,76,0.12)' : 'rgba(16,185,129,0.12)' },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: formation.isPremium ? '#C9A84C' : '#10B981',
                    }}
                  >
                    {formation.isPremium ? 'PREMIUM' : 'GRATUIT'}
                  </Text>
                </View>
                {/* Nombre de leçons */}
                <View style={[styles.pill, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#6366F1' }}>
                    {(formation.lessons ?? []).length} leçon{(formation.lessons ?? []).length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>

            {/* Chevron */}
            <AppIcon
              icon={expanded ? ChevronDown : ChevronRight}
              size={18}
              color={colors.textTertiary}
              strokeWidth={2}
            />
          </View>

          {/* Boutons d'action */}
          {loading ? (
            <ActivityIndicator size="small" color="#C9A84C" style={{ marginTop: 12, alignSelf: 'flex-start' }} />
          ) : (
            <View style={styles.actionRow}>
              {/* Activer / Désactiver */}
              {isActive ? (
                <TouchableOpacity
                  onPress={handleToggle}
                  style={[styles.actionBtn, { backgroundColor: 'rgba(156,163,175,0.12)', borderColor: '#9CA3AF' }]}
                >
                  <AppIcon icon={PauseCircle} size={13} color="#9CA3AF" strokeWidth={2.5} />
                  <Text style={[styles.actionBtnText, { color: '#9CA3AF' }]}>Désactiver</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleToggle}
                  style={[styles.actionBtn, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: '#10B981' }]}
                >
                  <AppIcon icon={PlayCircle} size={13} color="#10B981" strokeWidth={2.5} />
                  <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Activer</Text>
                </TouchableOpacity>
              )}
              {/* Modifier */}
              <TouchableOpacity
                onPress={() => onEdit(formation)}
                style={[styles.actionBtn, { backgroundColor: 'rgba(139,92,246,0.12)', borderColor: '#8B5CF6' }]}
              >
                <AppIcon icon={Edit2} size={13} color="#8B5CF6" strokeWidth={2.5} />
                <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>Modifier</Text>
              </TouchableOpacity>
              {/* Ajouter une leçon */}
              <TouchableOpacity
                onPress={() => onAddLesson(formation)}
                style={[styles.actionBtn, { backgroundColor: 'rgba(201,168,76,0.12)', borderColor: '#C9A84C' }]}
              >
                <AppIcon icon={FilePlus} size={13} color="#C9A84C" strokeWidth={2.5} />
                <Text style={[styles.actionBtnText, { color: '#C9A84C' }]}>Ajouter une leçon</Text>
              </TouchableOpacity>
              {/* Supprimer */}
              <TouchableOpacity
                onPress={() => onDelete(formation)}
                style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: '#EF4444' }]}
              >
                <AppIcon icon={Trash2} size={13} color="#EF4444" strokeWidth={2.5} />
                <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Liste des leçons (expandable) */}
      {expanded && (formation.lessons ?? []).length > 0 && (
        <View style={[styles.lessonsContainer, { borderTopColor: colors.border }]}>
          {(formation.lessons ?? [])
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((lesson, idx) => (
              <LessonRow key={lesson.id} lesson={lesson} index={idx} colors={colors} />
            ))}
        </View>
      )}
      {expanded && (formation.lessons ?? []).length === 0 && (
        <View style={[styles.lessonsContainer, { borderTopColor: colors.border, alignItems: 'center', paddingVertical: 20 }]}>
          <AppIcon icon={Layers} size={28} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: 8 }}>Aucune leçon pour l'instant</Text>
          <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 2 }}>
            Utilisez « Ajouter une leçon » pour commencer
          </Text>
        </View>
      )}
    </Card>
  );
}

/* ─── Ligne leçon ─────────────────────────────────────────────────────────── */

function LessonRow({ lesson, index, colors }: { lesson: Lesson; index: number; colors: ReturnType<typeof useTheme>['colors'] }) {
  const ftCfg = lesson.fileType ? FILE_TYPE_CFG[lesson.fileType] : null;

  return (
    <View style={[styles.lessonRow, { borderBottomColor: colors.border }]}>
      <View
        style={[
          styles.lessonIndex,
          { backgroundColor: 'rgba(201,168,76,0.12)' },
        ]}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#C9A84C' }}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={1}>
          {lesson.title}
        </Text>
        {lesson.content ? (
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
            {lesson.content}
          </Text>
        ) : null}
      </View>
      {ftCfg ? (
        <View style={[styles.pill, { backgroundColor: `${ftCfg.color}18` }]}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: ftCfg.color }}>{ftCfg.label}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* ─── Écran principal ─────────────────────────────────────────────────────── */

export default function AdminFormationsScreen() {
  const { colors, spacing } = useTheme();

  const [formations,      setFormations]      = useState<Formation[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [addFormModal,    setAddFormModal]    = useState(false);
  const [addLessonModal,  setAddLessonModal]  = useState(false);
  const [targetFormation, setTargetFormation] = useState<Formation | null>(null);
  const [editFormation,   setEditFormation]   = useState<Formation | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await FormationsService.adminGetAll();
    setFormations(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggleActive(formation: Formation) {
    const isActive = formation.isActive !== false;
    if (isActive) {
      const { error } = await FormationsService.adminDeleteFormation(formation.id);
      if (error) { Alert.alert('Erreur', error); return; }
      setFormations((prev) =>
        prev.map((f) => (f.id === formation.id ? { ...f, isActive: false } : f)),
      );
    } else {
      const { error } = await FormationsService.adminActivateFormation(formation.id);
      if (error) { Alert.alert('Erreur', error); return; }
      setFormations((prev) =>
        prev.map((f) => (f.id === formation.id ? { ...f, isActive: true } : f)),
      );
    }
  }

  function handleAddLesson(formation: Formation) {
    setTargetFormation(formation);
    setAddLessonModal(true);
  }

  function handleEdit(formation: Formation) {
    setEditFormation(formation);
  }

  function handleDeleteFormation(formation: Formation) {
    Alert.alert(
      'Supprimer la formation',
      `Voulez-vous vraiment supprimer définitivement « ${formation.title} » et toutes ses leçons ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await FormationsService.adminPurgeFormation(formation.id);
            if (error) { Alert.alert('Erreur', error); return; }
            setFormations((prev) => prev.filter((f) => f.id !== formation.id));
          },
        },
      ],
    );
  }

  function handleFormationSaved() {
    setEditFormation(null);
    load();
  }

  const active   = formations.filter((f) => f.isActive !== false);
  const inactive = formations.filter((f) => f.isActive === false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#1A1A3E', paddingTop: 56 }]}>
        <BackButton variant="dark" style={{ alignSelf: 'flex-start', marginBottom: 16 }} fallback="/(app)/(tabs)/profile" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AppIcon icon={BookMarked} size={28} color="#C9A84C" strokeWidth={2} />
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>Formations</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              {formations.length} formation{formations.length !== 1 ? 's' : ''} au total
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.base, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator size="large" color="#C9A84C" />
            <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Chargement…</Text>
          </View>
        ) : formations.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <AppIcon icon={BookMarked} size={56} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Aucune formation</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 13 }}>
              Appuyez sur « Nouvelle formation » pour commencer
            </Text>
          </View>
        ) : (
          <>
            {/* Actives */}
            {active.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.sectionTitle, { color: '#10B981' }]}>
                  Actives ({active.length})
                </Text>
                {active.map((f) => (
                  <FormationCard
                    key={f.id}
                    formation={f}
                    onAddLesson={handleAddLesson}
                    onToggleActive={handleToggleActive}
                    onEdit={handleEdit}
                    onDelete={handleDeleteFormation}
                  />
                ))}
              </View>
            )}

            {/* Inactives */}
            {inactive.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                  Inactives ({inactive.length})
                </Text>
                {inactive.map((f) => (
                  <FormationCard
                    key={f.id}
                    formation={f}
                    onAddLesson={handleAddLesson}
                    onToggleActive={handleToggleActive}
                    onEdit={handleEdit}
                    onDelete={handleDeleteFormation}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FABs */}
      <View style={styles.fabWrap}>
        <TouchableOpacity
          onPress={load}
          style={[styles.fabSecondary, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppIcon icon={RefreshCw} size={20} color={colors.text} strokeWidth={2.2} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAddFormModal(true)} style={styles.fab}>
          <AppIcon icon={FolderPlus} size={22} color="#fff" strokeWidth={2.2} />
          <Text style={styles.fabLabel}>Nouvelle formation</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <AddFormationModal
        visible={addFormModal}
        onClose={() => setAddFormModal(false)}
        onCreated={() => { setAddFormModal(false); load(); }}
      />
      <AddLessonModal
        visible={addLessonModal}
        formation={targetFormation}
        onClose={() => { setAddLessonModal(false); setTargetFormation(null); }}
        onCreated={() => {
          setAddLessonModal(false);
          setTargetFormation(null);
          load();
        }}
      />
      <EditFormationModal
        visible={editFormation !== null}
        formation={editFormation}
        onClose={() => setEditFormation(null)}
        onSaved={handleFormationSaved}
      />
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  header:       { paddingHorizontal: 20, paddingBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },

  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  pill:  { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },

  formationIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  actionRow:    { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionBtnText:{ fontSize: 12, fontWeight: '700' },

  levelBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },

  lessonsContainer: { borderTopWidth: 1, paddingHorizontal: 14, paddingBottom: 6 },
  lessonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lessonIndex: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },

  fabWrap:      { position: 'absolute', bottom: 28, right: 20, flexDirection: 'row', gap: 10, alignItems: 'center' },
  fabSecondary: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  fab: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#C9A84C', paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 30, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6,
  },
  fabLabel: { color: '#fff', fontWeight: '800', fontSize: 14 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  label:      { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  fileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 12, borderStyle: 'dashed',
    paddingHorizontal: 14, paddingVertical: 14,
  },
  toggleRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  toggle:      { width: 40, height: 24, borderRadius: 12, justifyContent: 'center' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', elevation: 2 },
});
