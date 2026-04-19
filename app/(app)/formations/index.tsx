import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { router } from 'expo-router';
import {
  Check,
  Crown,
  FileText,
  Film,
  GraduationCap,
  Image as ImageIcon,
  Lock,
  Plus,
  RefreshCw,
  ShieldBan,
  X,
} from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { useI18n } from '../../../src/i18n';
import { useTheme } from '../../../src/theme';
import { useAuth } from '../../../src/hooks/useAuth';
import { PremiumGuard } from '../../../src/components/auth/PremiumGuard';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { Button } from '../../../src/components/common/Button';
import { BackButton } from '../../../src/components/common/BackButton';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { FormationsService, type Formation, type Lesson } from '../../../src/services/formations.service';
import { StorageService } from '../../../src/services/storage.service';
import { STORAGE_KEYS } from '../../../src/utils/constants';

type FormationsView = 'list' | 'detail' | 'reader';

const LEVEL_COLORS: Record<string, string> = {
  beginner: '#10B981',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
};

/** Badge affiché sur le type de fichier d'une leçon */
function FileTypeBadge({ fileType }: { fileType?: string | null }) {
  const { colors } = useTheme();

  if (!fileType) return null;

  const config: Record<string, { label: string; icon: typeof FileText; color: string; bg: string }> = {
    pdf:   { label: 'PDF',   icon: FileText, color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
    image: { label: 'Image', icon: ImageIcon, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    video: { label: 'Vidéo', icon: Film,      color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
    text:  { label: 'Texte', icon: FileText,  color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  };

  const c = config[fileType];
  if (!c) return null;

  return (
    <View style={[s.fileTypeBadge, { backgroundColor: c.bg }]}>
      <AppIcon icon={c.icon} size={11} color={c.color} strokeWidth={2.4} />
      <Text style={{ color: c.color, fontSize: 10, fontWeight: '700' }}>{c.label}</Text>
    </View>
  );
}

/** Carte d'une formation dans la liste */
function FormationCard({
  formation,
  onPress,
}: {
  formation: Formation;
  onPress: () => void;
}) {
  const { colors, shadows, borderRadius: br } = useTheme();
  const { t } = useI18n();

  const levelLabels: Record<string, string> = {
    beginner: t.formations.levels.beginner,
    intermediate: t.formations.levels.intermediate,
    advanced: t.formations.levels.advanced,
  };
  const levelColor = LEVEL_COLORS[formation.level] ?? colors.primary;
  const lessonCount = formation.lessons?.length ?? 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.md }]}
    >
      <View style={[s.cover, { backgroundColor: colors.surfaceSecondary, borderRadius: br.md }]}>
        <AppIcon icon={GraduationCap} size={40} color={colors.primary} strokeWidth={1.8} />
        <View
          style={[
            s.lockBadge,
            { backgroundColor: formation.isLocked ? colors.primary : '#10B981' },
          ]}
        >
          <AppIcon
            icon={formation.isLocked ? Lock : Check}
            size={12}
            color="#fff"
            strokeWidth={2.6}
          />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.formationTitle, { color: colors.text }]} numberOfLines={2}>
          {formation.title}
        </Text>
        {formation.instructor ? (
          <Text style={[s.instructor, { color: colors.textSecondary }]}>
            {formation.instructor}
          </Text>
        ) : null}
        <View style={s.metaRow}>
          <View
            style={[
              s.metaTag,
              { backgroundColor: levelColor + '20', borderColor: levelColor, borderWidth: 1 },
            ]}
          >
            <Text style={{ fontSize: 10, color: levelColor, fontWeight: '700' }}>
              {levelLabels[formation.level] ?? formation.level}
            </Text>
          </View>
          {formation.category ? (
            <Text
              style={[
                s.metaTag,
                { backgroundColor: colors.surfaceSecondary, color: colors.textSecondary },
              ]}
            >
              {formation.category}
            </Text>
          ) : null}
          {lessonCount > 0 ? (
            <Text
              style={[
                s.metaTag,
                { backgroundColor: colors.surfaceSecondary, color: colors.textSecondary },
              ]}
            >
              {t.formations.lessons(lessonCount)}
            </Text>
          ) : null}
          <Text
            style={[
              s.metaTag,
              formation.isPremium
                ? { backgroundColor: colors.primaryPale ?? '#EDE9FE', color: colors.primary }
                : { backgroundColor: '#D1FAE5', color: '#10B981' },
            ]}
          >
            {formation.isPremium ? t.common.premium : t.common.free}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/** Ligne d'une leçon dans la vue détail */
function LessonRow({
  lesson,
  index,
  onOpen,
}: {
  lesson: Lesson;
  index: number;
  onOpen: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[s.lessonRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[s.lessonNum, { backgroundColor: colors.primary }]}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }} numberOfLines={2}>
          {lesson.title}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <FileTypeBadge fileType={lesson.fileType} />
          {lesson.isLocked ? (
            <AppIcon icon={Lock} size={12} color={colors.textTertiary} strokeWidth={2.4} />
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        onPress={onOpen}
        style={[s.openBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Ouvrir</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Modal de création de formation (admin uniquement) */
function CreateFormationModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [instructor, setInstructor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await FormationsService.adminCreateFormation({
      title: title.trim(),
      description: description.trim() || undefined,
      category: category.trim() || undefined,
      instructor: instructor.trim() || undefined,
      level: 'beginner',
      isPremium: true,
    });
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTitle('');
    setDescription('');
    setCategory('');
    setInstructor('');
    onCreated();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={[s.modalContent, { backgroundColor: colors.surface }]}>
          <View style={s.modalHeader}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Nouvelle formation</Text>
            <TouchableOpacity onPress={onClose}>
              <AppIcon icon={X} size={22} color={colors.textSecondary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
          {error ? (
            <Text style={{ color: '#EF4444', fontSize: 13, marginBottom: 8 }}>{error}</Text>
          ) : null}
          <TextInput
            placeholder="Titre *"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <TextInput
            placeholder="Description"
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, height: 80 }]}
          />
          <TextInput
            placeholder="Catégorie"
            placeholderTextColor={colors.textTertiary}
            value={category}
            onChangeText={setCategory}
            style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <TextInput
            placeholder="Instructeur"
            placeholderTextColor={colors.textTertiary}
            value={instructor}
            onChangeText={setInstructor}
            style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <Button
            label="Créer la formation"
            variant="primary"
            fullWidth
            loading={isLoading}
            onPress={handleCreate}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    </Modal>
  );
}

function FormationsContent() {
  const { colors, spacing } = useTheme();
  const { t, language } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [view, setView] = useState<FormationsView>('list');
  const [formations, setFormations] = useState<Formation[]>([]);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Reader state
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [readerToken, setReaderToken] = useState<string | null>(null);
  const [readerWebUrl, setReaderWebUrl] = useState<string | null>(null);
  const [readerAttempt, setReaderAttempt] = useState(0);

  // Prévenir les captures d'écran sur mobile
  useEffect(() => {
    if (Platform.OS === 'web') return;
    ScreenCapture.preventScreenCaptureAsync().catch(() => undefined);
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => undefined);
    };
  }, []);

  // Charger les formations depuis le backend
  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      const data = await FormationsService.getAll();
      if (isCancelled) return;
      setFormations(data);
      // Refresh la formation sélectionnée si on est en vue detail
      setSelectedFormation((prev) => {
        if (!prev) return null;
        return data.find((f) => f.id === prev.id) ?? null;
      });
      setIsLoading(false);
    }

    void load();
    return () => {
      isCancelled = true;
    };
  }, [reloadNonce]);

  // Si la formation sélectionnée disparaît, revenir à la liste
  useEffect(() => {
    if (!selectedFormation) {
      setView((cur) => (cur === 'list' ? cur : 'list'));
    }
  }, [selectedFormation]);

  // Préparer le reader quand on entre en vue reader
  useEffect(() => {
    if (view !== 'reader' || !selectedLesson || !selectedFormation) {
      setReaderToken(null);
      setReaderError(null);
      return;
    }

    const formation = selectedFormation;
    const lesson = selectedLesson;
    let isCancelled = false;

    async function prepareReader() {
      setReaderLoading(true);
      setReaderError(null);

      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        if (!isCancelled) {
          setReaderError('Session expirée. Veuillez vous reconnecter.');
          setReaderLoading(false);
        }
        return;
      }

      const fileType = lesson.fileType;

      // Sur WEB : fetch le fichier → blob URL
      if (Platform.OS === 'web' && fileType && fileType !== 'text') {
        try {
          const fileUrl = FormationsService.getLessonFileUrl(formation.id, lesson.id);
          const response = await fetch(fileUrl, {
            headers: { Authorization: `Bearer ${token}`, 'Accept-Language': language },
          });
          if (!response.ok) throw new Error(`Erreur ${response.status}`);

          const blob = await response.blob();
          const mimeType = lesson.mimeType ?? getMimeFromFileType(fileType);
          const typedBlob = new Blob([blob], { type: mimeType });
          const url = URL.createObjectURL(typedBlob);

          if (isCancelled) {
            URL.revokeObjectURL(url);
            return;
          }

          setReaderWebUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        } catch (err) {
          if (!isCancelled) {
            setReaderError(err instanceof Error ? err.message : 'Erreur de chargement du fichier');
          }
        } finally {
          if (!isCancelled) setReaderLoading(false);
        }
        return;
      }

      // Sur MOBILE (ou texte) : on passe juste le token
      if (!isCancelled) {
        setReaderToken(token);
        setReaderLoading(false);
      }
    }

    prepareReader();

    return () => {
      isCancelled = true;
    };
  }, [language, readerAttempt, view, selectedLesson, selectedFormation]);

  // Révoquer les blob URLs à la désinstallation
  useEffect(() => {
    return () => {
      if (readerWebUrl) URL.revokeObjectURL(readerWebUrl);
    };
  }, [readerWebUrl]);

  function openDetail(formation: Formation) {
    setSelectedFormation(formation);
    setView('detail');
  }

  function openReader(lesson: Lesson) {
    if (!selectedFormation) return;
    setSelectedLesson(lesson);
    if (lesson.isLocked) {
      router.push('/(app)/subscription');
      return;
    }
    setReaderAttempt((n) => n + 1);
    setView('reader');
  }

  function closeReader() {
    setReaderToken(null);
    setReaderError(null);
    setReaderLoading(false);
    setReaderWebUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setView('detail');
  }

  /* ─────────────────── VUE READER ─────────────────── */
  if (view === 'reader' && selectedLesson && selectedFormation) {
    const lesson = selectedLesson;
    const fileType = lesson.fileType;

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Top bar */}
        <View
          style={[
            s.readerTopBar,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={closeReader}>
            <AppIcon icon={X} size={18} color={colors.primary} strokeWidth={2.6} />
          </TouchableOpacity>
          <Text
            style={{ color: colors.text, fontWeight: '600', fontSize: 14, flex: 1, textAlign: 'center' }}
            numberOfLines={1}
          >
            {lesson.title}
          </Text>
          <View style={{ width: 18 }} />
        </View>

        {/* Contenu du reader */}
        {readerLoading ? (
          <LoadingSpinner fullScreen message="Chargement du contenu..." />
        ) : readerError ? (
          <EmptyState
            icon={<AppIcon icon={ShieldBan} size={46} color={colors.primary} strokeWidth={2} />}
            title="Contenu indisponible"
            message={readerError}
            actionLabel={t.common.retry}
            onAction={() => setReaderAttempt((n) => n + 1)}
          />
        ) : fileType === 'text' ? (
          // TEXTE : ScrollView simple
          <ScrollView contentContainerStyle={{ padding: spacing.base }}>
            <Text style={{ color: colors.text, fontSize: 15, lineHeight: 28 }}>
              {lesson.content ?? 'Aucun contenu disponible.'}
            </Text>
          </ScrollView>
        ) : Platform.OS === 'web' ? (
          // WEB : blob URL chargée
          readerWebUrl ? (
            renderWebReader(readerWebUrl, lesson, fileType)
          ) : (
            <LoadingSpinner fullScreen message="Préparation du contenu..." />
          )
        ) : (
          // MOBILE : WebView avec token dans les headers
          readerToken ? (
            renderMobileReader(
              FormationsService.getLessonFileUrl(selectedFormation.id, lesson.id),
              readerToken,
              language,
              lesson,
              fileType,
            )
          ) : (
            <LoadingSpinner fullScreen message="Préparation du contenu..." />
          )
        )}
      </View>
    );
  }

  /* ─────────────────── VUE DETAIL ─────────────────── */
  if (view === 'detail' && selectedFormation) {
    const formation = selectedFormation;
    const lessons = formation.lessons ?? [];
    const levelColor = LEVEL_COLORS[formation.level] ?? colors.primary;
    const levelLabel =
      formation.level === 'beginner'
        ? t.formations.levels.beginner
        : formation.level === 'intermediate'
        ? t.formations.levels.intermediate
        : t.formations.levels.advanced;

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[s.header, { backgroundColor: '#1A1A3E' }]}>
          <BackButton
            variant="dark"
            onPress={() => setView('list')}
            style={{ marginBottom: 16 }}
          />
          <View style={{ alignItems: 'center', paddingBottom: 24 }}>
            <View>
              <AppIcon icon={GraduationCap} size={64} color="#C9A84C" strokeWidth={1.6} />
              {formation.isLocked ? (
                <View style={[s.detailLockBadge, { backgroundColor: colors.primary }]}>
                  <AppIcon icon={Lock} size={16} color="#fff" strokeWidth={2.6} />
                </View>
              ) : null}
            </View>
            <Text style={[s.detailTitle, { color: '#fff' }]}>{formation.title}</Text>
            {formation.instructor ? (
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
                {formation.instructor}
              </Text>
            ) : null}
            <View style={s.badgesRow}>
              <View style={[s.badge, { backgroundColor: levelColor + '25', borderColor: levelColor }]}>
                <Text style={{ color: levelColor, fontSize: 12 }}>{levelLabel}</Text>
              </View>
              {formation.category ? (
                <View
                  style={[
                    s.badge,
                    { backgroundColor: 'rgba(201,168,76,0.2)', borderColor: '#C9A84C' },
                  ]}
                >
                  <Text style={{ color: '#C9A84C', fontSize: 12 }}>{formation.category}</Text>
                </View>
              ) : null}
              <View
                style={[
                  s.badge,
                  formation.isPremium
                    ? { backgroundColor: 'rgba(124,58,237,0.2)', borderColor: '#A78BFA' }
                    : { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: '#10B981' },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AppIcon
                    icon={formation.isPremium ? Crown : Check}
                    size={12}
                    color={formation.isPremium ? '#A78BFA' : '#10B981'}
                    strokeWidth={2.4}
                  />
                  <Text style={{ color: formation.isPremium ? '#A78BFA' : '#10B981', fontSize: 12 }}>
                    {formation.isPremium ? t.common.premium : t.common.free}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.base }}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>{t.formations.about}</Text>
          <Text style={[s.description, { color: colors.textSecondary }]}>
            {formation.description || 'Aucune description disponible.'}
          </Text>

          <Text style={[s.sectionTitle, { color: colors.text, marginTop: 24 }]}>
            {t.formations.programme(lessons.length)}
          </Text>

          {lessons.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' }}>
              Aucune leçon disponible pour cette formation.
            </Text>
          ) : (
            lessons.map((lesson, idx) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                index={idx}
                onOpen={() => openReader(lesson)}
              />
            ))
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    );
  }

  /* ─────────────────── VUE LISTE ─────────────────── */
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[s.header, { backgroundColor: '#1A1A3E', padding: spacing.base, paddingTop: 56 }]}
      >
        <BackButton variant="dark" style={{ marginBottom: 12 }} fallback="/(app)/(tabs)/home" />
        <View style={s.headerTitleRow}>
          <AppIcon icon={GraduationCap} size={24} color="#fff" strokeWidth={2.2} />
          <Text style={s.headerTitle}>Se former spirituellement</Text>
          {isAdmin ? (
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={[s.addBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            >
              <AppIcon icon={Plus} size={18} color="#fff" strokeWidth={2.6} />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={s.headerSub}>
          {t.formations.subtitle(formations.length)}
        </Text>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen message={t.common.loading} />
      ) : formations.length === 0 ? (
        <EmptyState
          icon={<AppIcon icon={GraduationCap} size={48} color={colors.primary} strokeWidth={2} />}
          title="Aucune formation disponible"
          message="Les formations spirituelles apparaîtront ici dès leur publication."
          actionLabel={t.common.refresh}
          onAction={() => setReloadNonce((n) => n + 1)}
        />
      ) : (
        <FlatList
          data={formations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.base, gap: 12 }}
          renderItem={({ item }) => (
            <FormationCard formation={item} onPress={() => openDetail(item)} />
          )}
          ListFooterComponent={
            <Button
              label="Rafraîchir les formations"
              variant="ghost"
              icon={<AppIcon icon={RefreshCw} size={16} color={colors.primary} strokeWidth={2.2} />}
              onPress={() => setReloadNonce((n) => n + 1)}
              style={{ marginTop: 8, marginBottom: spacing.lg }}
            />
          }
        />
      )}

      {isAdmin ? (
        <CreateFormationModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => setReloadNonce((n) => n + 1)}
        />
      ) : null}
    </View>
  );
}

/* ─────────────────── Helpers rendu reader ─────────────────── */

function getMimeFromFileType(fileType?: string | null): string {
  switch (fileType) {
    case 'pdf':
      return 'application/pdf';
    case 'image':
      return 'image/jpeg';
    case 'video':
      return 'video/mp4';
    default:
      return 'application/octet-stream';
  }
}

function renderWebReader(
  blobUrl: string,
  lesson: Lesson,
  fileType?: string | null,
) {
  if (fileType === 'pdf') {
    return React.createElement(
      'div',
      {
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
        },
      },
      React.createElement('embed', {
        src: blobUrl,
        type: 'application/pdf',
        style: { flex: 1, width: '100%', height: '100%', border: 'none' },
      }),
      React.createElement(
        'a',
        {
          href: blobUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          download: `${lesson.title}.pdf`,
          style: {
            display: 'block',
            textAlign: 'center',
            padding: '10px',
            background: '#7C3AED',
            color: '#fff',
            fontWeight: '600',
            fontSize: 14,
            textDecoration: 'none',
          },
        },
        '📄 Ouvrir / Télécharger le PDF',
      ),
    );
  }

  if (fileType === 'image') {
    return React.createElement(
      'div',
      {
        style: {
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          width: '100%',
          height: '100%',
        },
      },
      React.createElement('img', {
        src: blobUrl,
        alt: lesson.title,
        style: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
      }),
    );
  }

  if (fileType === 'video') {
    return React.createElement(
      'div',
      {
        style: {
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          width: '100%',
          height: '100%',
        },
      },
      React.createElement('video', {
        src: blobUrl,
        controls: true,
        autoPlay: false,
        style: { maxWidth: '100%', maxHeight: '100%' },
      }),
    );
  }

  return null;
}

function renderMobileReader(
  fileUrl: string,
  token: string,
  language: string,
  lesson: Lesson,
  fileType?: string | null,
) {
  const headers = { Authorization: `Bearer ${token}`, 'Accept-Language': language };

  if (fileType === 'pdf' || fileType === 'image') {
    return (
      <WebView
        source={{ uri: fileUrl, headers }}
        style={{ flex: 1 }}
        startInLoadingState
        renderLoading={() => <LoadingSpinner fullScreen message="Chargement..." />}
      />
    );
  }

  if (fileType === 'video') {
    const videoHtml = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; }
    video { width: 100%; max-height: 100vh; }
  </style>
</head>
<body>
  <video controls preload="metadata">
    <source src="${fileUrl}" type="${lesson.mimeType ?? 'video/mp4'}">
  </video>
  <script>
    // Injecter l'en-tête Authorization n'est pas possible directement en src.
    // On utilise fetch + blob URL pour contourner.
    fetch("${fileUrl}", { headers: { Authorization: "Bearer ${token}" } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        document.querySelector("video source").src = url;
        document.querySelector("video").load();
      })
      .catch(() => {});
  </script>
</body>
</html>`;

    return (
      <WebView
        source={{ html: videoHtml }}
        style={{ flex: 1 }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState
        renderLoading={() => <LoadingSpinner fullScreen message="Chargement de la vidéo..." />}
      />
    );
  }

  return null;
}

export default function FormationsScreen() {
  const { t } = useI18n();
  return (
    <PremiumGuard featureName={t.formations.featureName}>
      <FormationsContent />
    </PremiumGuard>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16 },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', flex: 1 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Formation card
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  cover: { width: 72, height: 100, alignItems: 'center', justifyContent: 'center' },
  lockBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formationTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  instructor: { fontSize: 12, marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  metaTag: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },

  // Detail view
  detailTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  detailLockBadge: {
    position: 'absolute',
    top: 0,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 24 },

  // Lesson row
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  lessonNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fileTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Reader
  readerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
});
