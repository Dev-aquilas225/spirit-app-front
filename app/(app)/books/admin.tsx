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
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  Archive, BookOpen, Edit2, Eye, FilePlus, FileText, Image as ImageIcon,
  RefreshCw, Trash2, Upload, X,
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

// ── Composant réutilisable : upload couverture + PDF ──────────────────────────
interface BookFormProps {
  title: string; setTitle: (v: string) => void;
  author: string; setAuthor: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  tokenCost: string; setTokenCost: (v: string) => void;
  coverUrl: string; setCoverUrl: (v: string) => void;
  pdfUrl: string; setPdfUrl: (v: string) => void;
  uploadingCover: boolean; setUploadingCover: (v: boolean) => void;
  uploadingPdf: boolean; setUploadingPdf: (v: boolean) => void;
}

const CATEGORIES = ['Spiritualité', 'Prophétie', 'Prières', 'Rêves', 'Délivrance', 'Autre'];

function BookForm({
  title, setTitle, author, setAuthor, description, setDescription,
  category, setCategory, tokenCost, setTokenCost,
  coverUrl, setCoverUrl, pdfUrl, setPdfUrl,
  uploadingCover, setUploadingCover, uploadingPdf, setUploadingPdf,
}: BookFormProps) {
  const { colors } = useTheme();
  const fieldStyle = [styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }];

  async function pickCover() {
    if (Platform.OS === 'web') {
      // Sur web : input file HTML
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file: File = e.target.files[0];
        if (!file) return;
        setUploadingCover(true);
        try {
          const form = new FormData();
          form.append('file', file);
          const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.oracle-plus.online').replace(/\/$/, '');
          const { StorageService } = await import('../../../src/services/storage.service');
          const token = await StorageService.get<string>('@oracle/access_token');
          const res = await fetch(`${apiBase}/api/v1/library/upload/cover`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token ?? ''}` },
            body: form,
          });
          const data = await res.json();
          if (data.url) setCoverUrl(data.url);
          else Alert.alert('Erreur', data.error ?? 'Upload échoué');
        } catch (e: any) { Alert.alert('Erreur', e.message); }
        setUploadingCover(false);
      };
      input.click();
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setUploadingCover(true);
    try {
      const asset = result.assets[0];
      const url = await (LibraryService as any).uploadCover(asset.uri, asset.mimeType ?? 'image/jpeg');
      setCoverUrl(url);
    } catch (e: any) { Alert.alert('Erreur upload', e.message); }
    setUploadingCover(false);
  }

  async function pickPdf() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.onchange = async (e: any) => {
        const file: File = e.target.files[0];
        if (!file) return;
        setUploadingPdf(true);
        try {
          const form = new FormData();
          form.append('file', file);
          const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.oracle-plus.online').replace(/\/$/, '');
          const { StorageService } = await import('../../../src/services/storage.service');
          const token = await StorageService.get<string>('@oracle/access_token');
          const res = await fetch(`${apiBase}/api/v1/library/upload/pdf`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token ?? ''}` },
            body: form,
          });
          const data = await res.json();
          if (data.url) setPdfUrl(data.url);
          else Alert.alert('Erreur', data.error ?? 'Upload échoué');
        } catch (e: any) { Alert.alert('Erreur', e.message); }
        setUploadingPdf(false);
      };
      input.click();
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    setUploadingPdf(true);
    try {
      const asset = result.assets[0];
      const url = await (LibraryService as any).uploadPdf(asset.uri, 'application/pdf');
      setPdfUrl(url);
    } catch (e: any) { Alert.alert('Erreur upload', e.message); }
    setUploadingPdf(false);
  }

  return (
    <>
      {/* ── Zone couverture A4 ── */}
      <View style={{ gap: 6 }}>
        <Text style={[styles.label, { color: colors.text }]}>Couverture</Text>
        <TouchableOpacity onPress={pickCover} activeOpacity={0.8}
          style={[styles.coverZone, { borderColor: coverUrl ? '#C9A84C' : colors.border, backgroundColor: colors.surface }]}>
          {uploadingCover ? (
            <ActivityIndicator color="#C9A84C" size="large" />
          ) : coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverPreview} resizeMode="cover" />
          ) : (
            <View style={{ alignItems: 'center', gap: 10 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(201,168,76,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <AppIcon icon={Upload} size={26} color="#C9A84C" strokeWidth={2} />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Appuyer pour choisir une couverture</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 11 }}>JPG, PNG · Format A4 recommandé</Text>
            </View>
          )}
          {coverUrl && (
            <View style={styles.coverEditBadge}>
              <AppIcon icon={ImageIcon} size={12} color="#fff" strokeWidth={2.5} />
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Changer</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Titre ── */}
      <View style={{ gap: 4 }}>
        <Text style={[styles.label, { color: colors.text }]}>Titre *</Text>
        <TextInput style={fieldStyle} value={title} onChangeText={setTitle}
          placeholder="Ex : La Vie de Foi" placeholderTextColor={colors.textSecondary} />
      </View>

      {/* ── Auteur ── */}
      <View style={{ gap: 4 }}>
        <Text style={[styles.label, { color: colors.text }]}>Auteur</Text>
        <TextInput style={fieldStyle} value={author} onChangeText={setAuthor}
          placeholder="Ex : Prophète Georges" placeholderTextColor={colors.textSecondary} />
      </View>

      {/* ── Description ── */}
      <View style={{ gap: 4 }}>
        <Text style={[styles.label, { color: colors.text }]}>Description</Text>
        <TextInput style={[fieldStyle, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
          value={description} onChangeText={setDescription} multiline
          placeholder="Résumé du livre…" placeholderTextColor={colors.textSecondary} />
      </View>

      {/* ── PDF ── */}
      <View style={{ gap: 6 }}>
        <Text style={[styles.label, { color: colors.text }]}>Fichier PDF</Text>
        <TouchableOpacity onPress={pickPdf} activeOpacity={0.8}
          style={[styles.pdfBtn, { borderColor: pdfUrl ? '#6366F1' : colors.border, backgroundColor: colors.surface }]}>
          {uploadingPdf ? (
            <ActivityIndicator color="#6366F1" size="small" />
          ) : (
            <AppIcon icon={FileText} size={20} color={pdfUrl ? '#6366F1' : colors.textSecondary} strokeWidth={2} />
          )}
          <Text style={{ color: pdfUrl ? '#6366F1' : colors.textSecondary, fontSize: 14, fontWeight: '600', flex: 1 }} numberOfLines={1}>
            {pdfUrl ? '✅ PDF chargé — Appuyer pour changer' : 'Choisir un PDF'}
          </Text>
          {pdfUrl && <AppIcon icon={Upload} size={14} color="#6366F1" strokeWidth={2.5} />}
        </TouchableOpacity>
      </View>

      {/* ── Catégorie ── */}
      <View style={{ gap: 6 }}>
        <Text style={[styles.label, { color: colors.text }]}>Catégorie</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
              style={[styles.catChip, {
                backgroundColor: category === cat ? '#C9A84C' : colors.surface,
                borderColor: category === cat ? '#C9A84C' : colors.border,
              }]}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: category === cat ? '#1A1A3E' : colors.text }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Coût ── */}
      <View style={{ gap: 4 }}>
        <Text style={[styles.label, { color: colors.text }]}>Coût (XOF) — 0 = gratuit</Text>
        <TextInput style={fieldStyle} value={tokenCost} onChangeText={setTokenCost}
          keyboardType="number-pad" placeholderTextColor={colors.textSecondary} />
      </View>
    </>
  );
}

function AddBookModal({ visible, onClose, onCreated }: AddBookModalProps) {
  const { colors, spacing } = useTheme();

  const [title,          setTitle]          = useState('');
  const [author,         setAuthor]         = useState('');
  const [description,    setDescription]    = useState('');
  const [category,       setCategory]       = useState('Spiritualité');
  const [tokenCost,      setTokenCost]      = useState('0');
  const [coverUrl,       setCoverUrl]       = useState('');
  const [pdfUrl,         setPdfUrl]         = useState('');
  const [saving,         setSaving]         = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf,   setUploadingPdf]   = useState(false);

  function reset() {
    setTitle(''); setAuthor(''); setDescription('');
    setCategory('Spiritualité'); setTokenCost('0');
    setCoverUrl(''); setPdfUrl('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Champ requis', 'Le titre est obligatoire.'); return; }
    setSaving(true);
    const payload = {
      title:       title.trim(),
      author:      author.trim() || '',
      description: description.trim() || undefined,
      category:    category || undefined,
      tokenCost:   parseInt(tokenCost) || 0,
      coverUrl:    coverUrl || undefined,
      pdfUrl:      pdfUrl || undefined,
      status:      'active' as const,
    };
    try {
      await (LibraryService as any).createBook(payload);
      setSaving(false);
      reset();
      onCreated();
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Erreur', e?.message ?? 'Erreur création');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Nouveau livre</Text>
          <TouchableOpacity onPress={handleClose}>
            <AppIcon icon={X} size={22} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.base, gap: 16 }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BookForm
            title={title} setTitle={setTitle}
            author={author} setAuthor={setAuthor}
            description={description} setDescription={setDescription}
            category={category} setCategory={setCategory}
            tokenCost={tokenCost} setTokenCost={setTokenCost}
            coverUrl={coverUrl} setCoverUrl={setCoverUrl}
            pdfUrl={pdfUrl} setPdfUrl={setPdfUrl}
            uploadingCover={uploadingCover} setUploadingCover={setUploadingCover}
            uploadingPdf={uploadingPdf} setUploadingPdf={setUploadingPdf}
          />
          <Button label={saving ? 'Enregistrement…' : 'Enregistrer le livre'}
            variant="gold" fullWidth onPress={handleSave} style={{ marginTop: 4 }} />
          <View style={{ height: 40 }} />
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
  const [title,          setTitle]          = useState('');
  const [author,         setAuthor]         = useState('');
  const [description,    setDescription]    = useState('');
  const [category,       setCategory]       = useState('');
  const [tokenCost,      setTokenCost]      = useState('0');
  const [coverUrl,       setCoverUrl]       = useState('');
  const [pdfUrl,         setPdfUrl]         = useState('');
  const [saving,         setSaving]         = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf,   setUploadingPdf]   = useState(false);

  useEffect(() => {
    if (book) {
      setTitle(book.title ?? '');
      setAuthor(book.author ?? '');
      setDescription(book.description ?? '');
      setCategory(book.category ?? 'Spiritualité');
      setTokenCost(String(book.tokenCost ?? 0));
      setCoverUrl(book.coverUrl ?? '');
      setPdfUrl(book.pdfUrl ?? '');
    }
  }, [book]);

  async function handleSave() {
    if (!book) return;
    if (!title.trim()) { Alert.alert('Champ requis', 'Le titre est obligatoire.'); return; }
    setSaving(true);
    try {
      const updated = await (LibraryService as any).updateBook(book.id, {
        title:       title.trim(),
        author:      author.trim() || undefined,
        description: description.trim() || undefined,
        category:    category || undefined,
        tokenCost:   parseInt(tokenCost) || 0,
        coverUrl:    coverUrl || undefined,
        pdfUrl:      pdfUrl || undefined,
      });
      setSaving(false);
      if (updated) onSaved(updated);
      onClose();
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Erreur', e?.message ?? 'Mise à jour échouée');
    }
  }

  return (
    <Modal visible={!!book} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Modifier le livre</Text>
            {book && <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>{book.title}</Text>}
          </View>
          <TouchableOpacity onPress={onClose}>
            <AppIcon icon={X} size={22} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.base, gap: 16 }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BookForm
            title={title} setTitle={setTitle}
            author={author} setAuthor={setAuthor}
            description={description} setDescription={setDescription}
            category={category} setCategory={setCategory}
            tokenCost={tokenCost} setTokenCost={setTokenCost}
            coverUrl={coverUrl} setCoverUrl={setCoverUrl}
            pdfUrl={pdfUrl} setPdfUrl={setPdfUrl}
            uploadingCover={uploadingCover} setUploadingCover={setUploadingCover}
            uploadingPdf={uploadingPdf} setUploadingPdf={setUploadingPdf}
          />
          <Button label={saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            variant="gold" fullWidth onPress={handleSave} style={{ marginTop: 4 }} />
          <View style={{ height: 40 }} />
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
    const data = await (LibraryService as any).getAllAdmin();
    setBooks(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(id: string, status: LibraryBookStatus) {
    try {
      await (LibraryService as any).updateStatus(id, status);
      setBooks(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Erreur statut'); }
  }

  function handleBookSaved(updated: LibraryBook) {
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
  }

  function handleDeleteBook(book: LibraryBook) {
    const doDelete = async () => {
      try {
        await (LibraryService as any).deleteBook(book.id);
        setBooks(prev => prev.filter(b => b.id !== book.id));
      } catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Erreur suppression'); }
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

  /* Couverture A4 */
  coverZone: {
    width: '100%',
    aspectRatio: 0.707, // ratio A4 portrait (1/√2)
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverPreview: { width: '100%', height: '100%' },
  coverEditBadge: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },

  /* PDF */
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderRadius: 12, borderStyle: 'dashed',
    paddingHorizontal: 16, paddingVertical: 16,
  },

  /* Catégorie chips */
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
});
