// Admin Librairie — partie 1 (squelette)
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { BookOpen, Edit2, FilePlus, RefreshCw, Trash2, Upload, X } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { Button } from '../../../src/components/common/Button';
import { useTheme } from '../../../src/theme';
import { Livre, LibrairieService } from '../../../src/services/librairie.service';

const CATEGORIES = ['Spiritualité', 'Prophétie', 'Prières', 'Rêves', 'Délivrance', 'Formation', 'Autre'];

export default function AdminLibrairieScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const [livres,    setLivres]    = useState<Livre[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [addModal,  setAddModal]  = useState(false);
  const [editLivre, setEditLivre] = useState<Livre | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await LibrairieService.getAll();
    setLivres(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(livre: Livre) {
    const doDelete = async () => {
      try {
        const { StorageService } = await import('../../../src/services/storage.service');
        const { STORAGE_KEYS } = await import('../../../src/utils/constants');
        const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
        const api = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.oracle-plus.online').replace(/\/$/, '');
        const res = await fetch(`${api}/api/v1/library/${livre.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token ?? ''}` },
        });
        if (!res.ok) throw new Error('Suppression échouée');
        setLivres(prev => prev.filter(b => b.id !== livre.id));
      } catch (e: any) { Alert.alert('Erreur', e?.message); }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer "${livre.title}" ?`)) doDelete();
    } else {
      Alert.alert('Supprimer', `Supprimer "${livre.title}" ?`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[st.header, { paddingTop: insets.top + 12 }]}>
        <BackButton variant="dark" style={{ marginBottom: 12 }} fallback="/profile" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AppIcon icon={BookOpen} size={26} color="#C9A84C" strokeWidth={2} />
          <View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>Librairie Admin</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {livres.length} livre{livres.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.base, paddingBottom: 120 }}>
        {loading ? (
          <ActivityIndicator color="#C9A84C" style={{ marginTop: 40 }} />
        ) : livres.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60, gap: 12 }}>
            <AppIcon icon={BookOpen} size={52} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={{ color: colors.textSecondary }}>Aucun livre</Text>
          </View>
        ) : (
          livres.map(livre => (
            <View key={livre.id} style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                {livre.coverUrl
                  ? <Image source={{ uri: livre.coverUrl }} style={st.thumb} resizeMode="cover" />
                  : <View style={[st.thumb, { backgroundColor: 'rgba(201,168,76,0.1)', alignItems: 'center', justifyContent: 'center' }]}>
                      <AppIcon icon={BookOpen} size={20} color="#C9A84C" strokeWidth={2} />
                    </View>
                }
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{livre.title}</Text>
                  {livre.author ? <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{livre.author}</Text> : null}
                  <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 12, marginTop: 4 }}>
                    {livre.priceFcfa === 0 ? 'Gratuit' : `${livre.priceFcfa} FCFA`}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    {livre.pdfUrl ? <Text style={st.pill}>PDF ✓</Text> : <Text style={[st.pill, { color: '#EF4444' }]}>Pas de PDF</Text>}
                    <Text style={[st.pill, { color: livre.status === 'active' ? '#10B981' : '#9CA3AF' }]}>
                      {livre.status === 'active' ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity style={[st.btn, { borderColor: '#6366F1' }]} onPress={() => setEditLivre(livre)}>
                  <AppIcon icon={Edit2} size={13} color="#6366F1" strokeWidth={2.5} />
                  <Text style={{ color: '#6366F1', fontSize: 12, fontWeight: '700' }}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.btn, { borderColor: '#EF4444' }]} onPress={() => handleDelete(livre)}>
                  <AppIcon icon={Trash2} size={13} color="#EF4444" strokeWidth={2.5} />
                  <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <View style={st.fabWrap}>
        <TouchableOpacity onPress={load} style={[st.fabSec, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppIcon icon={RefreshCw} size={20} color={colors.text} strokeWidth={2.2} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAddModal(true)} style={st.fab}>
          <AppIcon icon={FilePlus} size={20} color="#fff" strokeWidth={2.2} />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <LivreFormModal
        visible={addModal}
        onClose={() => setAddModal(false)}
        onSaved={() => { setAddModal(false); load(); }}
      />
      <LivreFormModal
        visible={!!editLivre}
        livre={editLivre ?? undefined}
        onClose={() => setEditLivre(null)}
        onSaved={() => { setEditLivre(null); load(); }}
      />
    </View>
  );
}

// ── Formulaire ajout/édition ──────────────────────────────────────────────────
function LivreFormModal({
  visible, livre, onClose, onSaved,
}: {
  visible: boolean;
  livre?: Livre;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { colors, spacing } = useTheme();
  const isEdit = !!livre;

  const [title,          setTitle]          = useState('');
  const [author,         setAuthor]         = useState('');
  const [description,    setDescription]    = useState('');
  const [category,       setCategory]       = useState('Spiritualité');
  const [priceFcfa,      setPriceFcfa]      = useState('0');
  const [coverUrl,       setCoverUrl]       = useState('');
  const [pdfUrl,         setPdfUrl]         = useState('');
  const [saving,         setSaving]         = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf,   setUploadingPdf]   = useState(false);

  useEffect(() => {
    if (livre) {
      setTitle(livre.title ?? '');
      setAuthor(livre.author ?? '');
      setDescription(livre.description ?? '');
      setCategory(livre.category ?? 'Spiritualité');
      setPriceFcfa(String(livre.priceFcfa ?? 0));
      setCoverUrl(livre.coverUrl ?? '');
      setPdfUrl(livre.pdfUrl ?? '');
    } else {
      setTitle(''); setAuthor(''); setDescription('');
      setCategory('Spiritualité'); setPriceFcfa('0');
      setCoverUrl(''); setPdfUrl('');
    }
  }, [livre, visible]);

  async function pickCover() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file: File = e.target.files[0];
        if (!file) return;
        setUploadingCover(true);
        try {
          const url = URL.createObjectURL(file);
          const uploaded = await LibrairieService.uploaderCouverture(url, file.type);
          setCoverUrl(uploaded);
        } catch (err: any) { Alert.alert('Erreur', err.message); }
        setUploadingCover(false);
      };
      input.click(); return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission requise', 'Autorisez la galerie.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.85 });
    if (res.canceled || !res.assets?.[0]) return;
    setUploadingCover(true);
    try {
      const url = await LibrairieService.uploaderCouverture(res.assets[0].uri, res.assets[0].mimeType ?? 'image/jpeg');
      setCoverUrl(url);
    } catch (err: any) { Alert.alert('Erreur', err.message); }
    setUploadingCover(false);
  }

  async function pickPdf() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'application/pdf';
      input.onchange = async (e: any) => {
        const file: File = e.target.files[0];
        if (!file) return;
        setUploadingPdf(true);
        try {
          const url = URL.createObjectURL(file);
          const uploaded = await LibrairieService.uploaderPdf(url);
          setPdfUrl(uploaded);
        } catch (err: any) { Alert.alert('Erreur', err.message); }
        setUploadingPdf(false);
      };
      input.click(); return;
    }
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    setUploadingPdf(true);
    try {
      const url = await LibrairieService.uploaderPdf(res.assets[0].uri);
      setPdfUrl(url);
    } catch (err: any) { Alert.alert('Erreur', err.message); }
    setUploadingPdf(false);
  }

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Requis', 'Le titre est obligatoire.'); return; }
    if (!pdfUrl) { Alert.alert('Requis', 'Veuillez uploader un fichier PDF.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(), author: author.trim() || undefined,
        description: description.trim() || undefined,
        category: category || undefined,
        priceFcfa: parseInt(priceFcfa) || 0,
        coverUrl: coverUrl || undefined,
        pdfUrl: pdfUrl || undefined,
        status: 'active' as const,
      };
      if (isEdit && livre) {
        await LibrairieService.modifierLivre(livre.id, payload);
      } else {
        await LibrairieService.creerLivre(payload);
      }
      onSaved();
    } catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Erreur sauvegarde'); }
    setSaving(false);
  }

  const field = [st.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} />
      <View style={[st.sheet, { backgroundColor: colors.background }]}>
        <View style={[st.handle, { backgroundColor: colors.border }]} />
        <View style={[st.sheetHead, { borderBottomColor: colors.border }]}>
          <Text style={[st.sheetTitle, { color: colors.text }]}>{isEdit ? 'Modifier le livre' : 'Nouveau livre'}</Text>
          <TouchableOpacity onPress={onClose}>
            <AppIcon icon={X} size={22} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.base, gap: 16 }} keyboardShouldPersistTaps="handled">

          {/* Couverture A4 */}
          <View style={{ gap: 6 }}>
            <Text style={[st.label, { color: colors.text }]}>Couverture (format A4 recommandé)</Text>
            <TouchableOpacity
              onPress={pickCover}
              style={[st.coverZone, { borderColor: coverUrl ? '#C9A84C' : colors.border, backgroundColor: colors.surface }]}
            >
              {uploadingCover ? (
                <ActivityIndicator color="#C9A84C" size="large" />
              ) : coverUrl ? (
                <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : (
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <AppIcon icon={Upload} size={28} color="#C9A84C" strokeWidth={2} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Appuyer pour choisir</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 11 }}>JPG, PNG · Ratio A4 (0.707)</Text>
                </View>
              )}
              {coverUrl && (
                <View style={st.coverBadge}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Changer</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Titre */}
          <View style={{ gap: 4 }}>
            <Text style={[st.label, { color: colors.text }]}>Titre *</Text>
            <TextInput style={field} value={title} onChangeText={setTitle} placeholder="Ex : La Vie de Foi" placeholderTextColor={colors.textSecondary} />
          </View>

          {/* Auteur */}
          <View style={{ gap: 4 }}>
            <Text style={[st.label, { color: colors.text }]}>Auteur</Text>
            <TextInput style={field} value={author} onChangeText={setAuthor} placeholder="Ex : Prophète Georges" placeholderTextColor={colors.textSecondary} />
          </View>

          {/* Description */}
          <View style={{ gap: 4 }}>
            <Text style={[st.label, { color: colors.text }]}>Description</Text>
            <TextInput style={[field, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
              value={description} onChangeText={setDescription} multiline
              placeholder="Résumé du livre…" placeholderTextColor={colors.textSecondary} />
          </View>

          {/* PDF — obligatoire */}
          <View style={{ gap: 6 }}>
            <Text style={[st.label, { color: colors.text }]}>Fichier PDF *</Text>
            <TouchableOpacity
              onPress={pickPdf}
              style={[st.pdfBtn, { borderColor: pdfUrl ? '#10B981' : colors.border, backgroundColor: colors.surface }]}
            >
              {uploadingPdf
                ? <ActivityIndicator color="#10B981" size="small" />
                : <AppIcon icon={Upload} size={18} color={pdfUrl ? '#10B981' : colors.textSecondary} strokeWidth={2} />
              }
              <Text style={{ color: pdfUrl ? '#10B981' : colors.textSecondary, fontSize: 14, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                {pdfUrl ? '✅ PDF chargé — Appuyer pour changer' : 'Choisir un PDF (obligatoire)'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Catégorie */}
          <View style={{ gap: 6 }}>
            <Text style={[st.label, { color: colors.text }]}>Catégorie</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
                  style={[st.chip, { backgroundColor: category === cat ? '#C9A84C' : colors.surface, borderColor: category === cat ? '#C9A84C' : colors.border }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: category === cat ? '#1A1A3E' : colors.text }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Prix FCFA */}
          <View style={{ gap: 4 }}>
            <Text style={[st.label, { color: colors.text }]}>Prix en FCFA (0 = gratuit)</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 11, marginBottom: 4 }}>1 FCFA = 1 crédit Oracle Plus</Text>
            <TextInput style={field} value={priceFcfa} onChangeText={setPriceFcfa}
              keyboardType="number-pad" placeholder="Ex : 1500" placeholderTextColor={colors.textSecondary} />
          </View>

          <Button
            label={saving ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Publier le livre'}
            variant="gold" fullWidth onPress={handleSave} style={{ marginTop: 4 }}
          />
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  header:    { backgroundColor: '#1A1A3E', paddingHorizontal: 20, paddingBottom: 24 },
  card:      { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  thumb:     { width: 48, height: 72, borderRadius: 8 },
  pill:      { fontSize: 10, fontWeight: '700', color: '#6366F1' },
  btn:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  fabWrap:   { position: 'absolute', bottom: 28, right: 20, flexDirection: 'row', gap: 10, alignItems: 'center' },
  fabSec:    { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  fab:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#C9A84C', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30 },
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:     { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  handle:    { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  sheetTitle:{ fontSize: 17, fontWeight: '700' },
  label:     { fontSize: 13, fontWeight: '600' },
  input:     { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  coverZone: { width: '100%', aspectRatio: 0.707, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  coverBadge:{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pdfBtn:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 12, borderStyle: 'dashed', paddingHorizontal: 16, paddingVertical: 16 },
  chip:      { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
});
