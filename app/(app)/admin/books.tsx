import { useSafeAreaInsets } from 'react-native-safe-area-context';
/**
 * Admin — Bibliothèque (CRUD complet)
 * - Liste des livres avec couverture, auteur, catégorie, coût
 * - Ajout : upload couverture (web FileReader → base64) + PDF URL
 * - Édition inline
 * - Suppression avec confirmation
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator, FlatList, Image, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  BookOpen, ChevronLeft, Edit2, Plus, Save,
  Trash2, Upload, X, FileText,
} from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { http } from '../../../src/services/http.client';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  coverUrl: string;
  pdfUrl: string;
  tokenCost: number;
  pages: number;
  isFree: boolean;
}

const EMPTY_FORM: Omit<Book, 'id'> = {
  title: '', author: '', category: 'Spiritualité',
  description: '', coverUrl: '', pdfUrl: '',
  tokenCost: 100, pages: 0, isFree: false,
};

const CATEGORIES = ['Spiritualité', 'Prophétie', 'Prières', 'Rêves', 'Formation', 'Autre'];

/* ─── Upload helper (web only) ───────────────────────────────────────────── */
function pickFileWeb(accept: string): Promise<{ data: string; name: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve({ data: reader.result as string, name: file.name });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

function pickImageWeb(): Promise<string | null> {
  return pickFileWeb('image/*').then(r => r?.data ?? null);
}

/* ─── BookForm ───────────────────────────────────────────────────────────── */
function BookForm({
  initial, onSave, onCancel, saving,
}: {
  initial: Omit<Book, 'id'>;
  onSave: (data: Omit<Book, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfName, setPdfName] = useState(initial.pdfUrl ? initial.pdfUrl.split('/').pop() ?? 'PDF chargé' : '');

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  const pickCover = async () => {
    if (Platform.OS !== 'web') return;
    setUploading(true);
    const b64 = await pickImageWeb();
    if (b64) {
      try {
        const res = await http.post<{ url: string }>('/admin/upload/image', { data: b64 });
        if (res?.url) set('coverUrl', res.url);
        else set('coverUrl', b64);
      } catch {
        set('coverUrl', b64);
      }
    }
    setUploading(false);
  };

  const pickPdf = async () => {
    if (Platform.OS !== 'web') return;
    setUploadingPdf(true);
    const result = await pickFileWeb('application/pdf');
    if (result) {
      try {
        const res = await http.post<{ url: string }>('/admin/upload/pdf', { data: result.data, name: result.name });
        if (res?.url) { set('pdfUrl', res.url); setPdfName(result.name); }
        else { set('pdfUrl', result.data); setPdfName(result.name); }
      } catch {
        set('pdfUrl', result.data);
        setPdfName(result.name);
      }
    }
    setUploadingPdf(false);
  };

  return (
    <ScrollView
      style={f.wrap}
      contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={f.row}>
        <Text style={f.heading}>{initial.title ? 'Modifier le livre' : 'Nouveau livre'}</Text>
        <TouchableOpacity onPress={onCancel} style={f.closeBtn}>
          <AppIcon icon={X} size={20} color="rgba(255,255,255,0.6)" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Cover picker */}
      <TouchableOpacity style={f.coverPicker} onPress={pickCover} disabled={uploading}>
        {form.coverUrl ? (
          <Image source={{ uri: form.coverUrl }} style={f.coverPreview} resizeMode="cover" />
        ) : (
          <View style={f.coverPlaceholder}>
            {uploading
              ? <ActivityIndicator color="#C9A84C" />
              : <>
                  <AppIcon icon={Upload} size={28} color="#C9A84C" strokeWidth={1.8} />
                  <Text style={f.coverHint}>Choisir une couverture</Text>
                </>
            }
          </View>
        )}
        {form.coverUrl && (
          <View style={f.coverOverlay}>
            <AppIcon icon={Upload} size={18} color="#fff" strokeWidth={2} />
          </View>
        )}
      </TouchableOpacity>

      {[
        { label: 'Titre *', key: 'title' as const },
        { label: 'Auteur *', key: 'author' as const },
        { label: 'Description', key: 'description' as const, multi: true },
      ].map(({ label, key, multi }) => (
        <View key={key}>
          <Text style={f.lbl}>{label}</Text>
          <TextInput
            value={String(form[key])}
            onChangeText={v => set(key, v)}
            placeholder={label}
            placeholderTextColor="rgba(255,255,255,0.2)"
            multiline={multi}
            style={[f.input, multi && { minHeight: 80, textAlignVertical: 'top' }]}
          />
        </View>
      ))}

      {/* PDF Upload */}
      <View>
        <Text style={f.lbl}>Fichier PDF</Text>
        <TouchableOpacity
          style={[f.input, { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 }]}
          onPress={pickPdf}
          disabled={uploadingPdf}
        >
          {uploadingPdf
            ? <ActivityIndicator color="#C9A84C" size="small" />
            : <AppIcon icon={FileText} size={20} color="#60A5FA" strokeWidth={2} />
          }
          <Text style={{ color: pdfName ? '#60A5FA' : 'rgba(255,255,255,0.3)', flex: 1, fontSize: 14 }} numberOfLines={1}>
            {pdfName || 'Choisir un fichier PDF...'}
          </Text>
          {form.pdfUrl && <AppIcon icon={Upload} size={16} color="rgba(255,255,255,0.4)" strokeWidth={2} />}
        </TouchableOpacity>
      </View>

      {/* Catégorie */}
      <View>
        <Text style={f.lbl}>Catégorie</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[f.catBtn, form.category === c && f.catActive]}
                onPress={() => set('category', c)}
              >
                <Text style={[f.catTxt, { color: form.category === c ? '#fff' : 'rgba(255,255,255,0.5)' }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Coût + Pages */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={f.lbl}>Coût (crédits)</Text>
          <TextInput
            value={String(form.tokenCost)}
            onChangeText={v => set('tokenCost', parseInt(v) || 0)}
            keyboardType="number-pad"
            style={f.input}
            placeholderTextColor="rgba(255,255,255,0.2)"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={f.lbl}>Pages</Text>
          <TextInput
            value={String(form.pages)}
            onChangeText={v => set('pages', parseInt(v) || 0)}
            keyboardType="number-pad"
            style={f.input}
            placeholderTextColor="rgba(255,255,255,0.2)"
          />
        </View>
      </View>

      {/* Gratuit toggle */}
      <TouchableOpacity style={f.freeRow} onPress={() => set('isFree', !form.isFree)}>
        <View style={[f.checkbox, form.isFree && f.checkboxActive]}>
          {form.isFree && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>}
        </View>
        <Text style={f.freeTxt}>Livre gratuit (sans crédits)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[f.saveBtn, (!form.title || !form.author) && f.saveBtnDisabled]}
        onPress={() => onSave(form)}
        disabled={saving || !form.title || !form.author}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <>
              <AppIcon icon={Save} size={18} color="#fff" strokeWidth={2.5} />
              <Text style={f.saveTxt}>Enregistrer</Text>
            </>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ─── BookRow ────────────────────────────────────────────────────────────── */
function BookRow({ book, onEdit, onDelete }: { book: Book; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={r.wrap}>
      {book.coverUrl
        ? <Image source={{ uri: book.coverUrl }} style={r.cover} resizeMode="cover" />
        : <View style={r.coverFallback}><AppIcon icon={BookOpen} size={22} color="#C9A84C" strokeWidth={1.8} /></View>
      }
      <View style={{ flex: 1 }}>
        <Text style={r.title} numberOfLines={1}>{book.title}</Text>
        <Text style={r.author} numberOfLines={1}>{book.author} · {book.category}</Text>
        <View style={r.badges}>
          <View style={r.badge}>
            <Text style={r.badgeTxt}>{book.isFree ? 'Gratuit' : `${book.tokenCost} cr`}</Text>
          </View>
          {book.pdfUrl ? (
            <View style={[r.badge, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
              <AppIcon icon={FileText} size={10} color="#60A5FA" strokeWidth={2.5} />
              <Text style={[r.badgeTxt, { color: '#60A5FA' }]}>PDF</Text>
            </View>
          ) : null}
        </View>
      </View>
      <TouchableOpacity onPress={onEdit} style={r.iconBtn}>
        <AppIcon icon={Edit2} size={16} color="#C9A84C" strokeWidth={2.5} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={[r.iconBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
        <AppIcon icon={Trash2} size={16} color="#EF4444" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

/* ─── Main screen ────────────────────────────────────────────────────────── */
export default function AdminBooks() {
  const insets = useSafeAreaInsets();
  const [books, setBooks]       = useState<Book[]>([]);
  const [loading, setLoading]   = useState(true);
  const [mode, setMode]         = useState<'list' | 'add' | 'edit'>('list');
  const [editing, setEditing]   = useState<Book | null>(null);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await http.get<Book[]>('/books');
      setBooks((d as any) ?? []);
    } catch { setBooks([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const handleSave = async (data: Omit<Book, 'id'>) => {
    setSaving(true);
    try {
      if (mode === 'edit' && editing) {
        const updated = await http.put<Book>(`/admin/books/${editing.id}`, data);
        setBooks(prev => prev.map(b => b.id === editing.id ? (updated as any ?? { ...editing, ...data }) : b));
      } else {
        const created = await http.post<Book>('/admin/books', data);
        setBooks(prev => [created as any, ...prev]);
      }
      setMode('list');
      setEditing(null);
    } catch {}
    setSaving(false);
  };

  const handleDelete = (book: Book) => {
    if (Platform.OS === 'web') {
      if (!window.confirm(`Supprimer "${book.title}" ?`)) return;
      doDelete(book.id);
    } else {
      Alert.alert('Supprimer', `Supprimer "${book.title}" ?`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => doDelete(book.id) },
      ]);
    }
  };

  const doDelete = async (id: string) => {
    await http.delete(`/admin/books/${id}`).catch(() => {});
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  const filtered = books.filter(b =>
    !search || b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  if (mode === 'add' || mode === 'edit') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D2B' }}>
        <BookForm
          initial={mode === 'edit' && editing ? { ...editing } : { ...EMPTY_FORM }}
          onSave={handleSave}
          onCancel={() => { setMode('list'); setEditing(null); }}
          saving={saving}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D2B' }}>
      {/* Header */}
      <View style={s.hdr}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <AppIcon icon={ChevronLeft} size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.title}>Bibliothèque</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setMode('add')}>
          <AppIcon icon={Plus} size={20} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un livre..."
          placeholderTextColor="rgba(255,255,255,0.25)"
          style={s.search}
        />
      </View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        <Text style={s.statsTxt}>{books.length} livre{books.length !== 1 ? 's' : ''}</Text>
        <Text style={s.statsTxt}>·</Text>
        <Text style={s.statsTxt}>{books.filter(b => b.isFree).length} gratuit{books.filter(b => b.isFree).length !== 1 ? 's' : ''}</Text>
        <Text style={s.statsTxt}>·</Text>
        <Text style={s.statsTxt}>{books.filter(b => b.pdfUrl).length} avec PDF</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#C9A84C" style={{ marginTop: 60 }} />
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <AppIcon icon={BookOpen} size={48} color="rgba(201,168,76,0.3)" strokeWidth={1.5} />
          <Text style={s.emptyTxt}>{search ? 'Aucun résultat' : 'Aucun livre — ajoutez-en un'}</Text>
          {!search && (
            <TouchableOpacity style={s.emptyBtn} onPress={() => setMode('add')}>
              <Text style={s.emptyBtnTxt}>+ Ajouter un livre</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={b => b.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <BookRow
              book={item}
              onEdit={() => { setEditing(item); setMode('edit'); }}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  hdr:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  back:      { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  title:     { flex: 1, fontSize: 18, fontWeight: '800', color: '#fff' },
  addBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center' },
  searchWrap:{ paddingHorizontal: 16, paddingVertical: 12 },
  search:    { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12, color: '#fff', fontSize: 14 },
  statsBar:  { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  statsTxt:  { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 },
  emptyTxt:  { fontSize: 15, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  emptyBtn:  { backgroundColor: '#C9A84C', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnTxt:{ color: '#fff', fontWeight: '800', fontSize: 14 },
});

const f = StyleSheet.create({
  wrap:      { flex: 1 },
  row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading:   { fontSize: 18, fontWeight: '800', color: '#fff' },
  closeBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  coverPicker:{ height: 160, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderStyle: 'dashed' },
  coverPreview:{ width: '100%', height: '100%' },
  coverPlaceholder:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(201,168,76,0.05)' },
  coverHint: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  coverOverlay:{ position: 'absolute', bottom: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  lbl:       { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  input:     { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12, color: '#fff', fontSize: 14 },
  catBtn:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  catActive: { backgroundColor: '#C9A84C', borderColor: '#C9A84C' },
  catTxt:    { fontSize: 13, fontWeight: '700' },
  freeRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox:  { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  checkboxActive:{ backgroundColor: '#34D399', borderColor: '#34D399' },
  freeTxt:   { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  saveBtn:   { backgroundColor: '#C9A84C', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  saveBtnDisabled:{ opacity: 0.4 },
  saveTxt:   { color: '#fff', fontWeight: '800', fontSize: 15 },
});

const r = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12 },
  cover:       { width: 52, height: 72, borderRadius: 8 },
  coverFallback:{ width: 52, height: 72, borderRadius: 8, backgroundColor: 'rgba(201,168,76,0.1)', alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 2 },
  author:      { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 },
  badges:      { flexDirection: 'row', gap: 6 },
  badge:       { backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeTxt:    { fontSize: 11, fontWeight: '700', color: '#C9A84C' },
  iconBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(201,168,76,0.1)', alignItems: 'center', justifyContent: 'center' },
});
