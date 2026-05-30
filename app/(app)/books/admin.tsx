import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  Archive, BookOpen, Edit2, Eye, FilePlus, RefreshCw, Trash2, X,
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
  active:   { label: 'Actif',    color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  inactive: { label: 'Inactif',  color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' },
};

function StatusBadge({ status }: { status: LibraryBookStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.inactive;
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
  const [tokenCost,   setTokenCost]   = useState('100');
  const [coverUrl,    setCoverUrl]    = useState('');
  const [pdfUrl,      setPdfUrl]      = useState('');
  const [saving,      setSaving]      = useState(false);

  function reset() {
    setTitle(''); setAuthor(''); setDescription('');
    setCategory(''); setTokenCost('100'); setCoverUrl(''); setPdfUrl('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Champ requis', 'Le titre est obligatoire.'); return; }
    setSaving(true);
    const payload: CreateBookPayload = {
      title:       title.trim(),
      author:      author.trim()      || undefined,
      description: description.trim() || undefined,
      category:    category.trim()    || undefined,
      tokenCost:   parseInt(tokenCost) || 0,
      coverUrl:    coverUrl.trim()    || undefined,
      pdfUrl:      pdfUrl.trim()      || undefined,
    };
    const { error } = await LibraryService.createBook(payload);
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
          {[
            { label: 'Titre *',        value: title,       set: setTitle,       placeholder: 'Ex : La Vie de Foi' },
            { label: 'Auteur',         value: author,      set: setAuthor,      placeholder: 'Ex : Prophète Georges' },
            { label: 'Catégorie',      value: category,    set: setCategory,    placeholder: 'Ex : Spiritualité, Prière…' },
            { label: 'URL couverture', value: coverUrl,    set: setCoverUrl,    placeholder: 'https://…/cover.jpg' },
            { label: 'URL PDF',        value: pdfUrl,      set: setPdfUrl,      placeholder: 'https://…/livre.pdf' },
          ].map(({ label, value, set, placeholder }) => (
            <View key={label} style={{ gap: 4 }}>
              <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
              <TextInput style={fieldStyle} value={value} onChangeText={set}
                placeholder={placeholder} placeholderTextColor={colors.textSecondary}
                autoCapitalize="none" />
            </View>
          ))}

          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput style={[fieldStyle, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]}
              value={description} onChangeText={setDescription} multiline
              placeholder="Résumé du livre…" placeholderTextColor={colors.textSecondary} />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Coût (crédits) — 0 = gratuit</Text>
            <TextInput style={fieldStyle} value={tokenCost} onChangeText={setTokenCost}
              keyboardType="number-pad" placeholderTextColor={colors.textSecondary} />
          </View>

          {/* Aperçu couverture */}
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={{ width: 80, height: 110, borderRadius: 8 }} resizeMode="cover" />
          ) : null}

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

/* ─── Modal édition livre ─────────────────────────────────────────────────── */

interface EditBookModalProps {
  book: LibraryBook | null;
  onClose: () => void;
  onSaved: (updated: LibraryBook) => void;
}

function EditBookModal({ book, onClose, onSaved }: EditBookModalProps) {
  const { colors, spacing } = useTheme();
  const [title,        setTitle]        = useState('');
  const [author,       setAuthor]       = useState('');
  const [description,  setDescription]  = useState('');
  const [category,     setCategory]     = useState('');
  const [tokenCost,   setTokenCost]   = useState('100');
  const [coverUrl,    setCoverUrl]    = useState('');
  const [pdfUrl,      setPdfUrl]      = useState('');
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    if (book) {
      setTitle(book.title ?? '');
      setAuthor(book.author ?? '');
      setDescription(book.description ?? '');
      setCategory(book.category ?? '');
      setTokenCost(String(book.tokenCost ?? 100));
      setCoverUrl(book.coverUrl ?? '');
      setPdfUrl(book.pdfUrl ?? '');
    }
  }, [book]);

  async function handleSave() {
    if (!book) return;
    if (!title.trim()) { Alert.alert('Champ requis', 'Le titre est obligatoire.'); return; }
    setSaving(true);
    const { data, error } = await LibraryService.updateBook(book.id, {
      title:       title.trim(),
      author:      author.trim()      || undefined,
      description: description.trim() || undefined,
      category:    category.trim()    || undefined,
      tokenCost:   parseInt(tokenCost) || 0,
      coverUrl:    coverUrl.trim()    || undefined,
      pdfUrl:      pdfUrl.trim()      || undefined,
    });
    setSaving(false);
    if (error) { Alert.alert('Erreur', error); return; }
    if (data) onSaved(data);
    onClose();
  }

  const visible    = !!book;
  const fieldStyle = [styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Modifier le livre</Text>
            {book && (
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                {book.title}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose}>
            <AppIcon icon={X} size={22} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: spacing.base, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {[
            { label: 'Titre *',        value: title,       set: setTitle,       placeholder: 'Titre du livre' },
            { label: 'Auteur',         value: author,      set: setAuthor,      placeholder: "Nom de l'auteur" },
            { label: 'Catégorie',      value: category,    set: setCategory,    placeholder: 'Ex : Spiritualité, Prière…' },
            { label: 'URL couverture', value: coverUrl,    set: setCoverUrl,    placeholder: 'https://…/cover.jpg' },
            { label: 'URL PDF',        value: pdfUrl,      set: setPdfUrl,      placeholder: 'https://…/livre.pdf' },
          ].map(({ label, value, set, placeholder }) => (
            <View key={label} style={{ gap: 4 }}>
              <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
              <TextInput style={fieldStyle} value={value} onChangeText={set}
                placeholder={placeholder} placeholderTextColor={colors.textSecondary}
                autoCapitalize="none" />
            </View>
          ))}

          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput style={[fieldStyle, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]}
              value={description} onChangeText={setDescription} multiline
              placeholder="Résumé du livre…" placeholderTextColor={colors.textSecondary} />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.text }]}>Coût (crédits) — 0 = gratuit</Text>
            <TextInput style={fieldStyle} value={tokenCost} onChangeText={setTokenCost}
              keyboardType="number-pad" placeholderTextColor={colors.textSecondary} />
          </View>

          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={{ width: 72, height: 96, borderRadius: 8 }} resizeMode="cover" />
          ) : null}

          <Button
            label={saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            variant="gold" fullWidth onPress={handleSave} style={{ marginTop: 8 }}
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
  onEdit: (book: LibraryBook) => void;
  onDelete: (book: LibraryBook) => void;
}

function BookCard({ book, onStatusChange, onEdit, onDelete }: BookCardProps) {
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
          {book.coverUrl ? (
            <Image source={{ uri: book.coverUrl }} style={[styles.bookIcon, { borderRadius: 10 }]} resizeMode="cover" />
          ) : (
            <View style={[styles.bookIcon, { backgroundColor: 'rgba(201,168,76,0.12)', alignItems: 'center', justifyContent: 'center' }]}>
              <AppIcon icon={BookOpen} size={22} color="#C9A84C" strokeWidth={2} />
            </View>
          )}

          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={1}>
                {book.title}
              </Text>
              {loading ? <ActivityIndicator size="small" color="#C9A84C" /> : <StatusBadge status={book.status} />}
            </View>
            {book.author   ? <Text style={{ fontSize: 12, color: colors.textSecondary }}>{book.author}</Text>   : null}
            {book.category ? <Text style={{ fontSize: 11, color: colors.textTertiary }}>{book.category}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <View style={[styles.pill, { backgroundColor: book.tokenCost === 0 ? 'rgba(16,185,129,0.12)' : 'rgba(201,168,76,0.12)' }]}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: book.tokenCost === 0 ? '#10B981' : '#C9A84C' }}>
                  {book.tokenCost === 0 ? 'GRATUIT' : `${book.tokenCost} CR`}
                </Text>
              </View>
              {book.pdfUrl ? (
                <View style={[styles.pill, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#6366F1' }}>PDF</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {!loading && (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => onEdit(book)}
              style={[styles.actionBtn, { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: '#6366F1' }]}>
              <AppIcon icon={Edit2} size={13} color="#6366F1" strokeWidth={2.5} />
              <Text style={[styles.actionBtnText, { color: '#6366F1' }]}>Modifier</Text>
            </TouchableOpacity>

            {book.status !== 'active' && (
              <TouchableOpacity onPress={() => handleToggle('active')}
                style={[styles.actionBtn, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: '#10B981' }]}>
                <AppIcon icon={Eye} size={13} color="#10B981" strokeWidth={2.5} />
                <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Activer</Text>
              </TouchableOpacity>
            )}
            {book.status !== 'inactive' && (
              <TouchableOpacity onPress={() => handleToggle('inactive')}
                style={[styles.actionBtn, { backgroundColor: 'rgba(156,163,175,0.12)', borderColor: '#9CA3AF' }]}>
                <AppIcon icon={Archive} size={13} color="#9CA3AF" strokeWidth={2.5} />
                <Text style={[styles.actionBtnText, { color: '#9CA3AF' }]}>Désactiver</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => onDelete(book)}
              style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: '#EF4444' }]}>
              <AppIcon icon={Trash2} size={13} color="#EF4444" strokeWidth={2.5} />
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Card>
  );
}

/* ─── Écran principal ─────────────────────────────────────────────────────── */

export default function AdminBooksScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const [books,     setBooks]     = useState<LibraryBook[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [addModal,  setAddModal]  = useState(false);
  const [editBook,  setEditBook]  = useState<LibraryBook | null>(null);

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
    if (data) setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
  }

  function handleBookSaved(updated: LibraryBook) {
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
  }

  function handleDeleteBook(book: LibraryBook) {
    const doDelete = async () => {
      const { error } = await LibraryService.deleteBook(book.id);
      if (error) { Alert.alert('Erreur', error); return; }
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer définitivement « ${book.title} » ? Cette action est irréversible.`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Supprimer le livre',
        `Supprimer définitivement « ${book.title} » ? Cette action est irréversible.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: doDelete },
        ],
      );
    }
  }

  const byStatus = (s: LibraryBookStatus) => books.filter((b) => b.status === s);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#1A1A3E', paddingTop: insets.top + 12 }]}>
        <BackButton variant="dark" style={{ alignSelf: 'flex-start', marginBottom: 16 }} fallback="/profile" />
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
            {/* Actifs */}
            {byStatus('active').length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.sectionTitle, { color: '#10B981' }]}>
                  Actifs ({byStatus('active').length})
                </Text>
                {byStatus('active').map((b) => (
                  <BookCard key={b.id} book={b} onStatusChange={handleStatusChange} onEdit={setEditBook} onDelete={handleDeleteBook} />
                ))}
              </View>
            )}

            {/* Inactifs */}
            {byStatus('inactive').length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                  Inactifs ({byStatus('inactive').length})
                </Text>
                {byStatus('inactive').map((b) => (
                  <BookCard key={b.id} book={b} onStatusChange={handleStatusChange} onEdit={setEditBook} onDelete={handleDeleteBook} />
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

      {/* Modal édition */}
      <EditBookModal
        book={editBook}
        onClose={() => setEditBook(null)}
        onSaved={handleBookSaved}
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
