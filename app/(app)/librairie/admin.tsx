/**
 * Admin Librairie — Oracle Plus
 * CRUD complet : titre, auteur, catégorie, description courte + complète,
 * prix, couverture (JPG/PNG/WEBP), PDF, statut.
 * Couverture : zone large avec prévisualisation immédiate + remplacement.
 * PDF : nom affiché, remplacement, support fichiers volumineux.
 * Stats : achats et téléchargements par livre.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  BookOpen, Check, Edit2, Eye, EyeOff, FilePlus,
  RefreshCw, Trash2, Upload, X, BarChart2,
} from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { useTheme } from '../../../src/theme';
import { Livre, LibrairieService } from '../../../src/services/librairie.service';
import { useAuthStore } from '../../../src/store/auth.store';
import { router } from 'expo-router';
import { Env } from '../../../src/utils/env';

const CATEGORIES = ['Spiritualité', 'Prophétie', 'Prières', 'Rêves', 'Délivrance', 'Formation', 'Autre'];

// ── Formulaire vide ───────────────────────────────────────────────────────────
const EMPTY: Omit<Livre, 'id' | 'purchased' | 'purchasedAt' | 'purchaseCount' | 'downloadCount'> = {
  title: '', author: '', shortDescription: '', description: '',
  category: '', coverUrl: '', pdfUrl: '', priceFcfa: 0, status: 'active',
};

// ── Composant principal ───────────────────────────────────────────────────────
export default function AdminLibrairie() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [books, setBooks]         = useState<Livre[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Livre | null>(null);
  const [statsBook, setStatsBook] = useState<Livre | null>(null);

  // Vérification admin
  useEffect(() => {
    if (!user) return;
    const isAdmin = user.role === 'admin' || Env.ADMIN_EMAILS().includes((user.email ?? '').toLowerCase());
    if (!isAdmin) { router.replace('/dashboard' as any); }
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await LibrairieService.getAllAdmin();
    setBooks(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(b: Livre) { setEditing(b); setModalOpen(true); }

  async function handleDelete(b: Livre) {
    Alert.alert('Supprimer', `Supprimer "${b.title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await LibrairieService.supprimerLivre(b.id);
            load();
          } catch (e: any) {
            Alert.alert('Erreur', e.message);
          }
        },
      },
    ]);
  }

  async function handleToggle(b: Livre) {
    const next = b.status === 'active' ? 'inactive' : 'active';
    await LibrairieService.toggleStatut(b.id, next);
    load();
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <Text style={[s.headerTitle, { color: colors.text }]}>Bibliothèque Admin</Text>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={openCreate}>
          <AppIcon icon={FilePlus} size={18} color="#fff" strokeWidth={2.2} />
          <Text style={s.addBtnTxt}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Liste */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : books.length === 0 ? (
        <View style={s.center}>
          <AppIcon icon={BookOpen} size={52} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[s.emptyTxt, { color: colors.textSecondary }]}>Aucun livre. Cliquez sur Ajouter.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
          {books.map((b) => (
            <BookRow
              key={b.id}
              book={b}
              colors={colors}
              onEdit={() => openEdit(b)}
              onDelete={() => handleDelete(b)}
              onToggle={() => handleToggle(b)}
              onStats={() => setStatsBook(b)}
            />
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Modal formulaire */}
      <BookFormModal
        visible={modalOpen}
        editing={editing}
        colors={colors}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
      />

      {/* Modal stats */}
      {statsBook && (
        <StatsModal
          book={statsBook}
          colors={colors}
          onClose={() => setStatsBook(null)}
        />
      )}
    </View>
  );
}

// ── Ligne livre ───────────────────────────────────────────────────────────────
function BookRow({ book, colors, onEdit, onDelete, onToggle, onStats }: {
  book: Livre; colors: any;
  onEdit: () => void; onDelete: () => void;
  onToggle: () => void; onStats: () => void;
}) {
  const active = book.status === 'active';
  return (
    <View style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Couverture */}
      <View style={s.rowCover}>
        {book.coverUrl
          ? <Image source={{ uri: book.coverUrl }} style={s.rowCoverImg} resizeMode="cover" />
          : <View style={[s.rowCoverPlaceholder, { backgroundColor: colors.background }]}>
              <AppIcon icon={BookOpen} size={22} color={colors.textTertiary} strokeWidth={1.5} />
            </View>
        }
      </View>
      {/* Infos */}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[s.rowTitle, { color: colors.text }]} numberOfLines={1}>{book.title}</Text>
        {book.author ? <Text style={[s.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>{book.author}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
          <View style={[s.badge, { backgroundColor: active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
            <Text style={[s.badgeTxt, { color: active ? '#10B981' : '#EF4444' }]}>{active ? 'Publié' : 'Masqué'}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: 'rgba(201,168,76,0.12)' }]}>
            <Text style={[s.badgeTxt, { color: colors.primary }]}>{book.priceFcfa} FCFA</Text>
          </View>
          {book.category ? (
            <View style={[s.badge, { backgroundColor: colors.background }]}>
              <Text style={[s.badgeTxt, { color: colors.textSecondary }]}>{book.category}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {/* Actions */}
      <View style={{ gap: 6 }}>
        <TouchableOpacity style={[s.iconBtn, { backgroundColor: 'rgba(99,102,241,0.1)' }]} onPress={onEdit}>
          <AppIcon icon={Edit2} size={15} color="#6366F1" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.iconBtn, { backgroundColor: active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' }]} onPress={onToggle}>
          <AppIcon icon={active ? EyeOff : Eye} size={15} color={active ? '#EF4444' : '#10B981'} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.iconBtn, { backgroundColor: 'rgba(245,158,11,0.1)' }]} onPress={onStats}>
          <AppIcon icon={BarChart2} size={15} color="#F59E0B" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.iconBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]} onPress={onDelete}>
          <AppIcon icon={Trash2} size={15} color="#EF4444" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Modal formulaire ─────────────────────────────────────────────────────────
function BookFormModal({ visible, editing, colors, onClose, onSaved }: {
  visible: boolean; editing: Livre | null; colors: any;
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm]             = useState({ ...EMPTY });
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pdfName, setPdfName]       = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (visible) {
      if (editing) {
        setForm({
          title:            editing.title,
          author:           editing.author ?? '',
          shortDescription: editing.shortDescription ?? '',
          description:      editing.description ?? '',
          category:         editing.category ?? '',
          coverUrl:         editing.coverUrl ?? '',
          pdfUrl:           editing.pdfUrl ?? '',
          priceFcfa:        editing.priceFcfa,
          status:           editing.status,
        });
        setCoverPreview(editing.coverUrl ?? null);
        setPdfName(editing.pdfUrl ? 'PDF existant' : null);
      } else {
        setForm({ ...EMPTY });
        setCoverPreview(null);
        setPdfName(null);
      }
      setError('');
    }
  }, [visible, editing]);

  function set(key: keyof typeof form, val: any) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // ── Upload couverture ─────────────────────────────────────────────────────
  async function pickCover() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setCoverPreview(objectUrl);
        setUploadingCover(true);
        try {
          const url = await LibrairieService.uploaderCouverture(objectUrl, file.type);
          set('coverUrl', url);
          setCoverPreview(url);
        } catch (err: any) {
          setError('Erreur upload couverture : ' + err.message);
        } finally { setUploadingCover(false); }
      };
      input.click();
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setCoverPreview(asset.uri);
    setUploadingCover(true);
    try {
      const mime = asset.mimeType ?? 'image/jpeg';
      const url = await LibrairieService.uploaderCouverture(asset.uri, mime);
      set('coverUrl', url);
      setCoverPreview(url);
    } catch (err: any) {
      setError('Erreur upload couverture : ' + err.message);
      setCoverPreview(editing?.coverUrl ?? null);
    } finally { setUploadingCover(false); }
  }

  // ── Upload PDF ────────────────────────────────────────────────────────────
  async function pickPdf() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPdfName(file.name);
        const objectUrl = URL.createObjectURL(file);
        setUploadingPdf(true);
        try {
          const url = await LibrairieService.uploaderPdf(objectUrl, file.name);
          set('pdfUrl', url);
        } catch (err: any) {
          setError('Erreur upload PDF : ' + err.message);
          setPdfName(null);
        } finally { setUploadingPdf(false); }
      };
      input.click();
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPdfName(asset.name);
    setUploadingPdf(true);
    try {
      const url = await LibrairieService.uploaderPdf(asset.uri, asset.name);
      set('pdfUrl', url);
    } catch (err: any) {
      setError('Erreur upload PDF : ' + err.message);
      setPdfName(null);
    } finally { setUploadingPdf(false); }
  }

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.title.trim()) { setError('Le titre est obligatoire.'); return; }
    if (!form.pdfUrl && !editing?.pdfUrl) { setError('Le fichier PDF est obligatoire.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        title:     form.title.trim(),
        author:    (form.author ?? '').trim() || undefined,
        priceFcfa: Number(form.priceFcfa) || 0,
      };
      if (editing) {
        await LibrairieService.modifierLivre(editing.id, payload);
      } else {
        await LibrairieService.creerLivre(payload as any);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message ?? 'Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.modalRoot, { backgroundColor: colors.background }]}>
        {/* Header modal */}
        <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={s.modalCloseBtn}>
            <AppIcon icon={X} size={22} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[s.modalTitle, { color: colors.text }]}>
            {editing ? 'Modifier le livre' : 'Ajouter un livre'}
          </Text>
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: saving ? colors.border : colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <><AppIcon icon={Check} size={16} color="#fff" strokeWidth={2.5} /><Text style={s.saveBtnTxt}>Enregistrer</Text></>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
          {error ? (
            <View style={[s.errorBox, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#EF4444' }]}>
              <Text style={{ color: '#EF4444', fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          {/* ── Couverture ── */}
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>COUVERTURE</Text>
            <TouchableOpacity style={[s.coverZone, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={pickCover} activeOpacity={0.8}>
              {uploadingCover ? (
                <View style={s.coverLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[s.coverHint, { color: colors.textSecondary }]}>Upload en cours…</Text>
                </View>
              ) : coverPreview ? (
                <>
                  <Image source={{ uri: coverPreview }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                  <View style={s.coverOverlay}>
                    <AppIcon icon={Upload} size={24} color="#fff" strokeWidth={2} />
                    <Text style={s.coverOverlayTxt}>Changer la couverture</Text>
                  </View>
                </>
              ) : (
                <View style={s.coverEmpty}>
                  <AppIcon icon={Upload} size={36} color={colors.textTertiary} strokeWidth={1.5} />
                  <Text style={[s.coverHint, { color: colors.textSecondary }]}>Appuyez pour importer</Text>
                  <Text style={[s.coverFormats, { color: colors.textTertiary }]}>JPG · PNG · WEBP</Text>
                </View>
              )}
            </TouchableOpacity>
            {coverPreview && !uploadingCover && (
              <TouchableOpacity onPress={() => { setCoverPreview(null); set('coverUrl', ''); }} style={s.removeCoverBtn}>
                <AppIcon icon={X} size={14} color="#EF4444" strokeWidth={2.5} />
                <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Supprimer la couverture</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Titre ── */}
          <Field label="Titre *" value={form.title} onChangeText={(v) => set('title', v)} placeholder="Titre du livre" colors={colors} />

          {/* ── Auteur ── */}
          <Field label="Auteur" value={form.author ?? ''} onChangeText={(v) => set('author', v)} placeholder="Nom de l'auteur" colors={colors} />

          {/* ── Catégorie ── */}
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>CATÉGORIE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[s.chip, {
                    backgroundColor: form.category === cat ? colors.primary : colors.surface,
                    borderColor: form.category === cat ? colors.primary : colors.border,
                  }]}
                  onPress={() => set('category', cat)}
                >
                  <Text style={{ color: form.category === cat ? '#fff' : colors.textSecondary, fontSize: 13, fontWeight: '600' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Description courte ── */}
          <Field label="Description courte" value={form.shortDescription as string} onChangeText={(v) => set('shortDescription', v)} placeholder="Résumé affiché dans la liste (1-2 phrases)" colors={colors} multiline lines={2} />

          {/* ── Description complète ── */}
          <Field label="Description complète" value={form.description as string} onChangeText={(v) => set('description', v)} placeholder="Description détaillée affichée sur la page du livre" colors={colors} multiline lines={5} />

          {/* ── Prix ── */}
          <Field label="Prix (FCFA)" value={String(form.priceFcfa)} onChangeText={(v) => set('priceFcfa', v.replace(/[^0-9]/g, ''))} placeholder="Ex: 2000" colors={colors} keyboardType="numeric" />

          {/* ── PDF ── */}
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>FICHIER PDF *</Text>
            <TouchableOpacity
              style={[s.pdfBtn, {
                borderColor: form.pdfUrl ? '#10B981' : colors.border,
                backgroundColor: colors.surface,
              }]}
              onPress={pickPdf}
              activeOpacity={0.8}
            >
              {uploadingPdf ? (
                <><ActivityIndicator size="small" color={colors.primary} /><Text style={[s.pdfBtnTxt, { color: colors.textSecondary }]}>Upload en cours…</Text></>
              ) : (
                <>
                  <AppIcon icon={FilePlus} size={22} color={form.pdfUrl ? '#10B981' : colors.textSecondary} strokeWidth={1.8} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.pdfBtnTxt, { color: form.pdfUrl ? '#10B981' : colors.textSecondary }]}>
                      {pdfName ?? (form.pdfUrl ? 'PDF chargé ✓' : 'Importer un fichier PDF')}
                    </Text>
                    {form.pdfUrl && <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 2 }}>Appuyez pour remplacer</Text>}
                  </View>
                  {form.pdfUrl && <AppIcon icon={Check} size={18} color="#10B981" strokeWidth={2.5} />}
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Statut ── */}
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>STATUT</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['active', 'inactive'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[s.statusBtn, {
                    backgroundColor: form.status === st
                      ? (st === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)')
                      : colors.surface,
                    borderColor: form.status === st
                      ? (st === 'active' ? '#10B981' : '#EF4444')
                      : colors.border,
                  }]}
                  onPress={() => set('status', st)}
                >
                  <Text style={{
                    fontWeight: '700', fontSize: 14,
                    color: form.status === st
                      ? (st === 'active' ? '#10B981' : '#EF4444')
                      : colors.textSecondary,
                  }}>
                    {st === 'active' ? '✓ Publié' : '✗ Masqué'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Champ texte réutilisable ──────────────────────────────────────────────────
function Field({ label, value, onChangeText, placeholder, colors, multiline, lines, keyboardType }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; colors: any; multiline?: boolean; lines?: number; keyboardType?: any;
}) {
  return (
    <View style={s.section}>
      <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>{label.toUpperCase()}</Text>
      <TextInput
        style={[s.input, {
          color: colors.text, backgroundColor: colors.surface,
          borderColor: colors.border,
          height: multiline ? (lines ?? 3) * 24 + 24 : 48,
          textAlignVertical: multiline ? 'top' : 'center',
        }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        numberOfLines={lines}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

// ── Modal stats ───────────────────────────────────────────────────────────────
function StatsModal({ book, colors, onClose }: { book: Livre; colors: any; onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.statsCard, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <Text style={[s.statsTitle, { color: colors.text }]}>{book.title}</Text>
          <Text style={[s.statsSub, { color: colors.textSecondary }]}>Statistiques</Text>
          <View style={s.statsRow}>
            <View style={[s.statBox, { backgroundColor: colors.background }]}>
              <Text style={[s.statNum, { color: colors.primary }]}>{book.purchaseCount ?? 0}</Text>
              <Text style={[s.statLabel, { color: colors.textSecondary }]}>Achats</Text>
            </View>
            <View style={[s.statBox, { backgroundColor: colors.background }]}>
              <Text style={[s.statNum, { color: '#10B981' }]}>{book.downloadCount ?? 0}</Text>
              <Text style={[s.statLabel, { color: colors.textSecondary }]}>Téléchargements</Text>
            </View>
            <View style={[s.statBox, { backgroundColor: colors.background }]}>
              <Text style={[s.statNum, { color: '#6366F1' }]}>{((book.purchaseCount ?? 0) * book.priceFcfa).toLocaleString()}</Text>
              <Text style={[s.statLabel, { color: colors.textSecondary }]}>FCFA générés</Text>
            </View>
          </View>
          <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Fermer</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:        { flex: 1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyTxt:    { fontSize: 15, textAlign: 'center' },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, gap: 10 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800' },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnTxt:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  // Ligne livre
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  rowCover:    { width: 56, height: 72, borderRadius: 8, overflow: 'hidden' },
  rowCoverImg: { width: '100%', height: '100%' },
  rowCoverPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  rowTitle:    { fontSize: 14, fontWeight: '700' },
  rowSub:      { fontSize: 12 },
  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeTxt:    { fontSize: 11, fontWeight: '700' },
  iconBtn:     { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  // Modal formulaire
  modalRoot:   { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, gap: 10 },
  modalCloseBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  modalTitle:  { flex: 1, fontSize: 17, fontWeight: '800' },
  saveBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  saveBtnTxt:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  errorBox:    { borderWidth: 1, borderRadius: 10, padding: 12 },
  section:     { gap: 8 },
  sectionLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  // Couverture
  coverZone:   { width: '100%', height: 220, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  coverLoading:{ alignItems: 'center', gap: 10 },
  coverEmpty:  { alignItems: 'center', gap: 8 },
  coverHint:   { fontSize: 14, fontWeight: '600' },
  coverFormats:{ fontSize: 12 },
  coverOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', gap: 8 },
  coverOverlayTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  removeCoverBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  // PDF
  pdfBtn:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 12, borderStyle: 'dashed', paddingHorizontal: 16, paddingVertical: 16 },
  pdfBtnTxt:   { fontSize: 14, fontWeight: '600', flex: 1 },
  // Champ texte
  input:       { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  // Chips catégorie
  chip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  // Statut
  statusBtn:   { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  // Stats modal
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  statsCard:   { width: '100%', borderRadius: 20, padding: 24, gap: 16 },
  statsTitle:  { fontSize: 18, fontWeight: '800' },
  statsSub:    { fontSize: 13, marginTop: -8 },
  statsRow:    { flexDirection: 'row', gap: 10 },
  statBox:     { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, gap: 4 },
  statNum:     { fontSize: 22, fontWeight: '900' },
  statLabel:   { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  closeBtn:    { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
});
