/**
 * Admin — Gestion des livres
 * Liste + ajout + édition + suppression
 * Upload image et PDF avec gestion web/natif
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BookOpen, ChevronLeft, Edit2, FileText, Plus, Save, Trash2, Upload, X } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { http } from '../../../src/services/http.client';
import { StorageService } from '../../../src/services/storage.service';
import { STORAGE_KEYS } from '../../../src/utils/constants';
import { useTheme } from '../../../src/theme';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  category: string | null;
  coverUrl: string | null;
  pdfUrl: string | null;
  tokenCost: number;
  pages: number | null;
  status: 'active' | 'inactive';
}

const EMPTY: Omit<Book, 'id'> = {
  title: '', author: '', description: '', category: 'Spiritualité',
  coverUrl: '', pdfUrl: '', tokenCost: 0, pages: null, status: 'active',
};

const CATEGORIES = ['Spiritualité', 'Prophétie', 'Prières', 'Rêves', 'Formation', 'Délivrance', 'Autre'];

/* ─── Helper upload ──────────────────────────────────────────────────────── */
async function uploadToServer(endpoint: string, file: File | { uri: string; name: string; type: string }): Promise<string | null> {
  try {
    const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.oracle-plus.online').replace(/\/$/, '');
    const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const form = new FormData();

    if (Platform.OS === 'web') {
      form.append('file', file as File);
    } else {
      form.append('file', file as any);
    }

    const res = await fetch(`${apiBase}/api/v1${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body: form,
    });
    const data = await res.json();
    return data?.url ?? null;
  } catch {
    return null;
  }
}

/* ─── Formulaire livre ───────────────────────────────────────────────────── */
function BookForm({
  initial, onSave, onCancel, saving,
}: {
  initial: Omit<Book, 'id'>;
  onSave: (data: Omit<Book, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { colors } = useTheme();
  const [form, setForm] = useState({ ...initial });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf]     = useState(false);

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  /* ── Choisir couverture ── */
  async function pickCover() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file: File = e.target.files?.[0];
        if (!file) return;
        setUploadingCover(true);
        const url = await uploadToServer('/library/upload/cover', file);
        setUploadingCover(false);
        if (url) set('coverUrl', url);
        else Alert.alert('Erreur', 'Upload couverture échoué');
      };
      input.click();
      return;
    }
    // Natif
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.85 });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setUploadingCover(true);
      const url = await uploadToServer('/library/upload/cover', {
        uri: asset.uri,
        name: asset.uri.split('/').pop() ?? 'cover.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
      setUploadingCover(false);
      if (url) set('coverUrl', url);
      else Alert.alert('Erreur', 'Upload couverture échoué');
    } catch (e: any) {
      setUploadingCover(false);
      Alert.alert('Erreur', e?.message ?? 'Erreur upload');
    }
  }

  /* ── Choisir PDF ── */
  async function pickPdf() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.onchange = async (e: any) => {
        const file: File = e.target.files?.[0];
        if (!file) return;
        setUploadingPdf(true);
        const url = await uploadToServer('/library/upload/pdf', file);
        setUploadingPdf(false);
        if (url) set('pdfUrl', url);
        else Alert.alert('Erreur', 'Upload PDF échoué');
      };
      input.click();
      return;
    }
    // Natif
    try {
      const DocPicker = await import('expo-document-picker');
      const result = await DocPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setUploadingPdf(true);

      // Android : content:// → copier dans le cache
      let uri = asset.uri;
      if (Platform.OS === 'android' && uri.startsWith('content://')) {
        const FS = await import('expo-file-system/legacy');
        const dest = `${FS.cacheDirectory}upload_${Date.now()}.pdf`;
        await FS.copyAsync({ from: uri, to: dest });
        uri = dest;
      }

      const url = await uploadToServer('/library/upload/pdf', {
        uri,
        name: asset.name ?? 'livre.pdf',
        type: 'application/pdf',
      });
      setUploadingPdf(false);
      if (url) set('pdfUrl', url);
      else Alert.alert('Erreur', 'Upload PDF échoué');
    } catch (e: any) {
      setUploadingPdf(false);
      Alert.alert('Erreur', e?.message ?? 'Erreur upload PDF');
    }
  }

  const inputStyle = [f.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header formulaire */}
      <View style={f.row}>
        <Text style={[f.heading, { color: colors.text }]}>
          {initial.title ? 'Modifier le livre' : 'Nouveau livre'}
        </Text>
        <TouchableOpacity onPress={onCancel} style={f.closeBtn}>
          <AppIcon icon={X} size={20} color={colors.textSecondary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Couverture */}
      <View style={{ gap: 6 }}>
        <Text style={[f.label, { color: colors.text }]}>Couverture</Text>
        <TouchableOpacity
          onPress={pickCover}
          disabled={uploadingCover}
          style={[f.coverZone, { borderColor: form.coverUrl ? '#C9A84C' : colors.border, backgroundColor: colors.surface }]}
          activeOpacity={0.8}
        >
          {uploadingCover ? (
            <ActivityIndicator color="#C9A84C" size="large" />
          ) : form.coverUrl ? (
            <>
              <Image source={{ uri: form.coverUrl }} style={f.coverImg} resizeMode="cover" />
              <View style={f.coverEditBadge}>
                <AppIcon icon={Upload} size={12} color="#fff" strokeWidth={2.5} />
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Changer</Text>
              </View>
            </>
          ) : (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <AppIcon icon={Upload} size={28} color="#C9A84C" strokeWidth={1.8} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Appuyer pour choisir une image</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Titre */}
      <View style={{ gap: 4 }}>
        <Text style={[f.label, { color: colors.text }]}>Titre *</Text>
        <TextInput
          style={inputStyle}
          value={form.title}
          onChangeText={v => set('title', v)}
          placeholder="Titre du livre"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      {/* Auteur */}
      <View style={{ gap: 4 }}>
        <Text style={[f.label, { color: colors.text }]}>Auteur</Text>
        <TextInput
          style={inputStyle}
          value={form.author ?? ''}
          onChangeText={v => set('author', v)}
          placeholder="Nom de l'auteur"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      {/* Description */}
      <View style={{ gap: 4 }}>
        <Text style={[f.label, { color: colors.text }]}>Description</Text>
        <TextInput
          style={[inputStyle, { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]}
          value={form.description ?? ''}
          onChangeText={v => set('description', v)}
          placeholder="Résumé du livre…"
          placeholderTextColor={colors.textTertiary}
          multiline
        />
      </View>

      {/* PDF */}
      <View style={{ gap: 6 }}>
        <Text style={[f.label, { color: colors.text }]}>Fichier PDF</Text>
        <TouchableOpacity
          onPress={pickPdf}
          disabled={uploadingPdf}
          style={[f.pdfBtn, { borderColor: form.pdfUrl ? '#6366F1' : colors.border, backgroundColor: colors.surface }]}
          activeOpacity={0.8}
        >
          {uploadingPdf ? (
            <ActivityIndicator color="#6366F1" size="small" />
          ) : (
            <AppIcon icon={FileText} size={20} color={form.pdfUrl ? '#6366F1' : colors.textSecondary} strokeWidth={2} />
          )}
          <Text style={{ color: form.pdfUrl ? '#6366F1' : colors.textSecondary, fontSize: 14, fontWeight: '600', flex: 1 }} numberOfLines={1}>
            {uploadingPdf ? 'Upload en cours…' : form.pdfUrl ? '✅ PDF chargé — Appuyer pour changer' : 'Choisir un PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Catégorie */}
      <View style={{ gap: 8 }}>
        <Text style={[f.label, { color: colors.text }]}>Catégorie</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => set('category', c)}
              style={[f.catChip, {
                backgroundColor: form.category === c ? '#C9A84C' : colors.surface,
                borderColor: form.category === c ? '#C9A84C' : colors.border,
              }]}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: form.category === c ? '#1A1A3E' : colors.text }}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Prix */}
      <View style={{ gap: 4 }}>
        <Text style={[f.label, { color: colors.text }]}>Prix (FCFA) — 0 = gratuit</Text>
        <TextInput
          style={inputStyle}
          value={String(form.tokenCost)}
          onChangeText={v => set('tokenCost', parseInt(v) || 0)}
          keyboardType="number-pad"
          placeholder="Ex : 500"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      {/* Statut */}
      <TouchableOpacity
        style={[f.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => set('status', form.status === 'active' ? 'inactive' : 'active')}
        activeOpacity={0.8}
      >
        <View style={[f.toggle, { backgroundColor: form.status === 'active' ? '#10B981' : colors.border }]}>
          <View style={[f.toggleThumb, { alignSelf: form.status === 'active' ? 'flex-end' : 'flex-start' }]} />
        </View>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
          {form.status === 'active' ? 'Livre actif (visible)' : 'Livre inactif (masqué)'}
        </Text>
      </TouchableOpacity>

      {/* Bouton sauvegarder */}
      <TouchableOpacity
        style={[f.saveBtn, (!form.title.trim() || saving) && f.saveBtnDisabled]}
        onPress={() => onSave(form)}
        disabled={!form.title.trim() || saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <AppIcon icon={Save} size={18} color="#fff" strokeWidth={2.5} />
            <Text style={f.saveTxt}>Enregistrer</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ─── Ligne livre dans la liste ──────────────────────────────────────────── */
function BookRow({ book, onEdit, onDelete }: { book: Book; onEdit: () => void; onDelete: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[r.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={r.cover} resizeMode="cover" />
      ) : (
        <View style={[r.coverFallback, { backgroundColor: colors.primaryPale }]}>
          <AppIcon icon={BookOpen} size={20} color="#C9A84C" strokeWidth={1.8} />
        </View>
      )}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[r.title, { color: colors.text }]} numberOfLines={1}>{book.title}</Text>
        {book.author ? <Text style={[r.sub, { color: colors.textSecondary }]} numberOfLines={1}>{book.author}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <View style={[r.badge, { backgroundColor: book.tokenCost === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(201,168,76,0.15)' }]}>
            <Text style={[r.badgeTxt, { color: book.tokenCost === 0 ? '#10B981' : '#C9A84C' }]}>
              {book.tokenCost === 0 ? 'Gratuit' : `${book.tokenCost} FCFA`}
            </Text>
          </View>
          {book.pdfUrl ? (
            <View style={[r.badge, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
              <Text style={[r.badgeTxt, { color: '#6366F1' }]}>PDF ✓</Text>
            </View>
          ) : null}
          {book.status !== 'active' ? (
            <View style={[r.badge, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <Text style={[r.badgeTxt, { color: '#EF4444' }]}>Inactif</Text>
            </View>
          ) : null}
        </View>
      </View>
      <TouchableOpacity onPress={onEdit} style={[r.iconBtn, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
        <AppIcon icon={Edit2} size={15} color="#6366F1" strokeWidth={2.5} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={[r.iconBtn, { backgroundColor: 'rgba(239,68,68,0.10)' }]}>
        <AppIcon icon={Trash2} size={15} color="#EF4444" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

/* ─── Écran principal ────────────────────────────────────────────────────── */
export default function AdminLivres() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [books, setBooks]     = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode]       = useState<'list' | 'add' | 'edit'>('list');
  const [editing, setEditing] = useState<Book | null>(null);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await http.get<Book[]>('/library/admin/books');
      setBooks(Array.isArray(data) ? data : []);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Sauvegarder ── */
  const handleSave = async (data: Omit<Book, 'id'>) => {
    setSaving(true);
    try {
      if (mode === 'edit' && editing) {
        const updated = await http.patch<Book>(`/library/${editing.id}`, data);
        setBooks(prev => prev.map(b => b.id === editing.id ? ({ ...editing, ...data, ...(updated as any) }) : b));
      } else {
        const created = await http.post<Book>('/library', data);
        setBooks(prev => [{ ...data, id: (created as any)?.id ?? '', ...(created as any) }, ...prev]);
      }
      setMode('list');
      setEditing(null);
    } catch (e: any) {
      const msg = e?.message ?? 'Erreur lors de l\'enregistrement';
      if (Platform.OS === 'web') window.alert(`Erreur : ${msg}`);
      else Alert.alert('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── Supprimer ── */
  const handleDelete = (book: Book) => {
    const doDelete = async () => {
      await http.delete(`/library/${book.id}`).catch(() => {});
      setBooks(prev => prev.filter(b => b.id !== book.id));
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer "${book.title}" ?`)) doDelete();
    } else {
      Alert.alert('Supprimer', `Supprimer "${book.title}" ?`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  /* ── Formulaire ── */
  if (mode === 'add' || mode === 'edit') {
    return (
      <BookForm
        initial={mode === 'edit' && editing ? { ...editing } : { ...EMPTY }}
        onSave={handleSave}
        onCancel={() => { setMode('list'); setEditing(null); }}
        saving={saving}
      />
    );
  }

  /* ── Liste ── */
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[l.header, { paddingTop: insets.top + 12, backgroundColor: '#1A1A3E' }]}>
        <TouchableOpacity onPress={() => router.back()} style={l.backBtn}>
          <AppIcon icon={ChevronLeft} size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={l.headerTitle}>Gestion des livres</Text>
          <Text style={l.headerSub}>{books.length} livre{books.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={l.addBtn} onPress={() => setMode('add')}>
          <AppIcon icon={Plus} size={20} color="#fff" strokeWidth={2.5} />
          <Text style={l.addTxt}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#C9A84C" />
        </View>
      ) : books.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
          <AppIcon icon={BookOpen} size={56} color={colors.textTertiary} strokeWidth={1.4} />
          <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '700' }}>Aucun livre</Text>
          <TouchableOpacity style={l.addBtn} onPress={() => setMode('add')}>
            <AppIcon icon={Plus} size={18} color="#fff" strokeWidth={2.5} />
            <Text style={l.addTxt}>Ajouter le premier livre</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          {books.map(book => (
            <BookRow
              key={book.id}
              book={book}
              onEdit={() => { setEditing(book); setMode('edit'); }}
              onDelete={() => handleDelete(book)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const f = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading:      { fontSize: 20, fontWeight: '900' },
  closeBtn:     { padding: 6 },
  label:        { fontSize: 13, fontWeight: '700' },
  input:        { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  coverZone:    { width: '100%', height: 180, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  coverImg:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  coverEditBadge: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pdfBtn:       { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 12, borderStyle: 'dashed', paddingHorizontal: 16, paddingVertical: 16 },
  catChip:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  toggleRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  toggle:       { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3 },
  toggleThumb:  { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  saveBtn:      { backgroundColor: '#C9A84C', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 },
  saveBtnDisabled: { opacity: 0.4 },
  saveTxt:      { color: '#fff', fontWeight: '800', fontSize: 16 },
});

const r = StyleSheet.create({
  wrap:         { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12 },
  cover:        { width: 52, height: 68, borderRadius: 8 },
  coverFallback:{ width: 52, height: 68, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: 14, fontWeight: '700' },
  sub:          { fontSize: 12 },
  badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeTxt:     { fontSize: 11, fontWeight: '700' },
  iconBtn:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

const l = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: '900', color: '#fff' },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  addBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#C9A84C', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  addTxt:       { color: '#fff', fontWeight: '800', fontSize: 13 },
});
