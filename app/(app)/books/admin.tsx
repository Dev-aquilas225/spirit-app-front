import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Archive, BookOpen, CheckCircle, Clock,
  Eye, FilePlus, RefreshCw, Upload, X,
} from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { Card } from '../../../src/components/common/Card';
import { Button } from '../../../src/components/common/Button';
import {
  CreateBookPayload,
  LibraryBook,
  LibraryBookStatus,
  LibraryService,
} from '../../../src/services/library.service';
import { useTheme } from '../../../src/theme';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const STATUS_CFG: Record<LibraryBookStatus, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Brouillon',  color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  published: { label: 'Publié',     color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  archived:  { label: 'Archivé',    color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' },
};

function StatusBadge({ status }: { status: LibraryBookStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

/* ─── Modal ajout livre ───────────────────────────────────────────────────── */

interface AddBookModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function AddBookModal({ visible, onClose, onCreated }: AddBookModalProps) {
  const { colors, spacing } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title,       setTitle]       = useState('');
  const [author,      setAuthor]      = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('');
  const [coverImage,  setCoverImage]  = useState('');
  const [isFree,      setIsFree]      = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving,      setSaving]      = useState(false);

  function reset() {
    setTitle(''); setAuthor(''); setDescription('');
    setCategory(''); setCoverImage(''); setIsFree(false);
    setSelectedFile(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  /* ── Sélection du fichier PDF ── */
  function pickFile() {
    if (Platform.OS === 'web') {
      // Créer un input file temporaire
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,application/pdf';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) setSelectedFile(file);
      };
      input.click();
    } else {
      Alert.alert('Non disponible', 'Le chargement de fichiers PDF n\'est disponible que depuis le navigateur web.');
    }
  }

  /* ── Enregistrer ── */
  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Champ requis', 'Le titre est obligatoire.');
      return;
    }
    if (!selectedFile) {
      Alert.alert('Fichier requis', 'Veuillez sélectionner un fichier PDF.');
      return;
    }

    setSaving(true);
    const payload: CreateBookPayload = {
      title: title.trim(),
      author:      author.trim()      || undefined,
      description: description.trim() || undefined,
      category:    category.trim()    || undefined,
      coverImage:  coverImage.trim()  || undefined,
      isFree,
      file: selectedFile,
    };

    const { error } = await LibraryService.createBook(payload);
    setSaving(false);

    if (error) {
      Alert.alert('Erreur', error);
      return;
    }

    reset();
    onCreated();
  }

  const fieldStyle = [styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Ajouter un livre</Text>
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
            <Text style={[styles.label, { color: colors.text }]}>Titre <Text style={{ color: '#EF4444' }}>*</Text></Text>
            <TextInput
              style={fieldStyle}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex : La Vie de Foi"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Auteur */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Auteur</Text>
            <TextInput
              style={fieldStyle}
              value={author}
              onChangeText={setAuthor}
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
              placeholder="Ex : Spiritualité, Prière…"
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
              placeholder="Résumé du livre…"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          </View>

          {/* Image de couverture (URL) */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Image de couverture (URL)</Text>
            <TextInput
              style={fieldStyle}
              value={coverImage}
              onChangeText={setCoverImage}
              placeholder="https://…"
              placeholderTextColor={colors.textSecondary}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Accès libre */}
          <TouchableOpacity
            onPress={() => setIsFree(!isFree)}
            style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: 14, fontWeight: '600', color: colors.text }]}>Accès libre (gratuit)</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {isFree ? 'Tous les utilisateurs peuvent lire ce livre' : 'Réservé aux abonnés premium'}
              </Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: isFree ? '#10B981' : colors.border }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: isFree ? 18 : 2 }] }]} />
            </View>
          </TouchableOpacity>

          {/* Fichier PDF */}
          <View style={{ gap: 6 }}>
            <Text style={[styles.label, { color: colors.text }]}>Fichier PDF <Text style={{ color: '#EF4444' }}>*</Text></Text>
            <TouchableOpacity
              onPress={pickFile}
              style={[styles.fileBtn, { borderColor: selectedFile ? '#10B981' : colors.border, backgroundColor: colors.surface }]}
            >
              <AppIcon
                icon={selectedFile ? CheckCircle : Upload}
                size={20}
                color={selectedFile ? '#10B981' : colors.textSecondary}
                strokeWidth={2}
              />
              <Text style={{ flex: 1, color: selectedFile ? '#10B981' : colors.textSecondary, fontSize: 13 }} numberOfLines={1}>
                {selectedFile ? selectedFile.name : 'Choisir un fichier PDF…'}
              </Text>
              {selectedFile && (
                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                  <AppIcon icon={X} size={16} color={colors.textSecondary} strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {Platform.OS !== 'web' && (
              <Text style={{ fontSize: 11, color: colors.textTertiary }}>
                Le chargement de PDF est disponible uniquement depuis le navigateur web.
              </Text>
            )}
          </View>

          {/* Bouton enregistrer */}
          <Button
            label={saving ? 'Enregistrement…' : 'Enregistrer le livre'}
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

/* ─── Carte livre ─────────────────────────────────────────────────────────── */

interface BookCardProps {
  book: LibraryBook;
  onStatusChange: (id: string, status: LibraryBookStatus) => void;
}

function BookCard({ book, onStatusChange }: BookCardProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  async function handleToggle(next: LibraryBookStatus) {
    setLoading(true);
    await onStatusChange(book.id, next);
    setLoading(false);
  }

  return (
    <Card style={{ marginBottom: 10 }} padding="none">
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          {/* Icône */}
          <View style={[styles.bookIcon, { backgroundColor: 'rgba(201,168,76,0.12)' }]}>
            <AppIcon icon={BookOpen} size={22} color="#C9A84C" strokeWidth={2} />
          </View>

          {/* Infos */}
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={1}>
                {book.title}
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color="#C9A84C" />
              ) : (
                <StatusBadge status={book.status} />
              )}
            </View>
            {book.author ? (
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{book.author}</Text>
            ) : null}
            {book.category ? (
              <Text style={{ fontSize: 11, color: colors.textTertiary }}>{book.category}</Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <View style={[styles.pill, { backgroundColor: book.isFree ? 'rgba(16,185,129,0.12)' : 'rgba(201,168,76,0.12)' }]}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: book.isFree ? '#10B981' : '#C9A84C' }}>
                  {book.isFree ? 'GRATUIT' : 'PREMIUM'}
                </Text>
              </View>
              {book.hasPdf ? (
                <View style={[styles.pill, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#6366F1' }}>PDF</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Boutons d'action ── */}
        {!loading && (
          <View style={styles.actionRow}>
            {book.status !== 'published' && (
              <TouchableOpacity
                onPress={() => handleToggle('published')}
                style={[styles.actionBtn, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: '#10B981' }]}
              >
                <AppIcon icon={Eye} size={13} color="#10B981" strokeWidth={2.5} />
                <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Publier</Text>
              </TouchableOpacity>
            )}
            {book.status !== 'draft' && (
              <TouchableOpacity
                onPress={() => handleToggle('draft')}
                style={[styles.actionBtn, { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: '#F59E0B' }]}
              >
                <AppIcon icon={Clock} size={13} color="#F59E0B" strokeWidth={2.5} />
                <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>Brouillon</Text>
              </TouchableOpacity>
            )}
            {book.status !== 'archived' && (
              <TouchableOpacity
                onPress={() => handleToggle('archived')}
                style={[styles.actionBtn, { backgroundColor: 'rgba(156,163,175,0.12)', borderColor: '#9CA3AF' }]}
              >
                <AppIcon icon={Archive} size={13} color="#9CA3AF" strokeWidth={2.5} />
                <Text style={[styles.actionBtnText, { color: '#9CA3AF' }]}>Archiver</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Card>
  );
}

/* ─── Écran principal ─────────────────────────────────────────────────────── */

export default function AdminBooksScreen() {
  const { colors, spacing } = useTheme();
  const [books,    setBooks]    = useState<LibraryBook[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [addModal, setAddModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await LibraryService.getAllAdmin();
    setBooks(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(id: string, status: LibraryBookStatus) {
    const { data, error } = await LibraryService.updateStatus(id, status);
    if (error) { Alert.alert('Erreur', error); return; }
    if (data) {
      setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status: data.status } : b)));
    }
  }

  const byStatus = (s: LibraryBookStatus) => books.filter((b) => b.status === s);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#1A1A3E', paddingTop: 56 }]}>
        <BackButton variant="dark" style={{ alignSelf: 'flex-start', marginBottom: 16 }} fallback="/(app)/(tabs)/profile" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AppIcon icon={BookOpen} size={28} color="#C9A84C" strokeWidth={2} />
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>Bibliothèque</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              {books.length} livre{books.length !== 1 ? 's' : ''} au total
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.base, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator size="large" color="#C9A84C" />
            <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Chargement…</Text>
          </View>
        ) : books.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <AppIcon icon={BookOpen} size={56} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Aucun livre enregistré</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 13 }}>Appuyez sur « Ajouter » pour commencer</Text>
          </View>
        ) : (
          <>
            {/* Publiés */}
            {byStatus('published').length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.sectionTitle, { color: '#10B981' }]}>
                  Publiés ({byStatus('published').length})
                </Text>
                {byStatus('published').map((b) => (
                  <BookCard key={b.id} book={b} onStatusChange={handleStatusChange} />
                ))}
              </View>
            )}

            {/* Brouillons */}
            {byStatus('draft').length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>
                  Brouillons ({byStatus('draft').length})
                </Text>
                {byStatus('draft').map((b) => (
                  <BookCard key={b.id} book={b} onStatusChange={handleStatusChange} />
                ))}
              </View>
            )}

            {/* Archivés */}
            {byStatus('archived').length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                  Archivés ({byStatus('archived').length})
                </Text>
                {byStatus('archived').map((b) => (
                  <BookCard key={b.id} book={b} onStatusChange={handleStatusChange} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB — Rafraîchir + Ajouter */}
      <View style={styles.fabWrap}>
        <TouchableOpacity
          onPress={load}
          style={[styles.fabSecondary, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppIcon icon={RefreshCw} size={20} color={colors.text} strokeWidth={2.2} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setAddModal(true)}
          style={styles.fab}
        >
          <AppIcon icon={FilePlus} size={22} color="#fff" strokeWidth={2.2} />
          <Text style={styles.fabLabel}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Modal ajout */}
      <AddBookModal
        visible={addModal}
        onClose={() => setAddModal(false)}
        onCreated={() => { setAddModal(false); load(); }}
      />
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  pill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },

  bookIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  fabWrap: { position: 'absolute', bottom: 28, right: 20, flexDirection: 'row', gap: 10, alignItems: 'center' },
  fabSecondary: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  fab: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#C9A84C', paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 30, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6,
  },
  fabLabel: { color: '#fff', fontWeight: '800', fontSize: 14 },

  /* Modal */
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  fileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 12, borderStyle: 'dashed',
    paddingHorizontal: 14, paddingVertical: 14,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  toggle: { width: 40, height: 24, borderRadius: 12, justifyContent: 'center' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', elevation: 2 },
});
