/**
 * Bibliothèque Spirituelle — Oracle Plus
 *
 * Chaque livre est verrouillé par un cadenas.
 * Clic → modal avec prix → paiement Paystack → téléchargement PDF.
 * Les livres à tokenCost=0 sont gratuits (téléchargement direct).
 * Aucune dépendance à l'abonnement.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Modal,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { BookOpen, Download, Lock, Search, Unlock, X } from 'lucide-react-native';
import { useTheme } from '../../../../src/theme';
import { LibraryBook, LibraryService } from '../../../../src/services/library.service';
import { AppIcon } from '../../../../src/components/common/AppIcon';

const CATEGORIES = ['Tous', 'Spiritualité', 'Prophétie', 'Prières', 'Rêves', 'Formation', 'Autre'];

export default function LibraryScreen() {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const [books, setBooks]           = useState<LibraryBook[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('Tous');
  const [selected, setSelected]     = useState<LibraryBook | null>(null);
  const [paying, setPaying]         = useState(false);
  const [downloading, setDownloading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await LibraryService.getAll(category === 'Tous' ? undefined : category);
    setBooks(data);
    setLoading(false);
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const filtered = books.filter(b =>
    !search || b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.author ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Payer et télécharger ────────────────────────────────────────────────────
  async function handleBuy(book: LibraryBook) {
    if (book.tokenCost === 0 || book.purchased) {
      await handleDownload(book);
      return;
    }
    setPaying(true);
    const result = await LibraryService.initiatePurchase(book.id);
    setPaying(false);

    if (result.purchased) {
      await handleDownload(book);
      return;
    }
    if (result.error) { Alert.alert('Erreur', result.error); return; }
    if (!result.authorization_url || !result.reference) { Alert.alert('Erreur', 'Réponse invalide'); return; }

    // Ouvrir Paystack
    const ref = result.reference;

    // Démarrer le polling AVANT d'ouvrir le navigateur
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      const verify = await LibraryService.verifyPurchase(ref);

      if (verify.success && verify.status === 'paid') {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, purchased: true } : b));
        if (selected?.id === book.id) setSelected({ ...book, purchased: true });
        Alert.alert('✅ Paiement confirmé', 'Votre livre est maintenant disponible.', [
          { text: 'Télécharger', onPress: () => handleDownload({ ...book, purchased: true }) },
          { text: 'Plus tard' },
        ]);
        return;
      }

      // Paystack a rejeté ou l'utilisateur a annulé
      if (verify.status === 'abandoned' || verify.status === 'failed') {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        Alert.alert(
          'Paiement annulé',
          'Vous avez annulé le paiement ou il a échoué. Vous pouvez réessayer à tout moment.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Timeout après 20 tentatives (~60s)
      if (attempts >= 20) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        Alert.alert(
          'Vérification expirée',
          'Nous n\'avons pas pu confirmer votre paiement. Si vous avez été débité, contactez le support.',
          [{ text: 'OK' }]
        );
      }
    }, 3000);

    if (Platform.OS === 'web') {
      // Sur web : ouvrir dans un nouvel onglet pour ne pas perdre le polling
      window.open(result.authorization_url, '_blank');
    } else {
      await WebBrowser.openAuthSessionAsync(result.authorization_url, 'oracle-plus://');
      // Après fermeture du navigateur natif : vérification immédiate
      const verify = await LibraryService.verifyPurchase(ref);
      if (verify.success && verify.status === 'paid') {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, purchased: true } : b));
        if (selected?.id === book.id) setSelected({ ...book, purchased: true });
        Alert.alert('✅ Paiement confirmé', 'Votre livre est maintenant disponible.', [
          { text: 'Télécharger', onPress: () => handleDownload({ ...book, purchased: true }) },
          { text: 'Plus tard' },
        ]);
      } else if (verify.status === 'abandoned' || verify.status === 'failed') {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        Alert.alert('Paiement annulé', 'Vous avez annulé le paiement. Vous pouvez réessayer à tout moment.');
      }
      // Sinon le polling continue
    }
  }

  async function handleDownload(book: LibraryBook) {
    setDownloading(true);
    const result = await LibraryService.downloadBook(book);
    setDownloading(false);
    if (result.error) { Alert.alert('Erreur', result.error); return; }
    if (Platform.OS !== 'web' && result.localUri) {
      Alert.alert('✅ Téléchargé', 'Le livre a été téléchargé dans votre bibliothèque.');
    }
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Rendu carte livre ───────────────────────────────────────────────────────
  function BookCard({ book }: { book: LibraryBook }) {
    const isFree = book.tokenCost === 0;
    const isPurchased = book.purchased;
    return (
      <TouchableOpacity style={s.card} onPress={() => setSelected(book)} activeOpacity={0.85}>
        {/* Couverture */}
        <View style={s.coverWrap}>
          {book.coverUrl
            ? <Image source={{ uri: book.coverUrl }} style={s.cover} resizeMode="cover" />
            : <View style={[s.cover, s.coverFallback]}>
                <AppIcon icon={BookOpen} size={32} color="#C9A84C" strokeWidth={1.5} />
              </View>
          }
          {/* Badge cadenas */}
          <View style={[s.lockBadge, isPurchased || isFree ? s.lockOpen : s.lockClosed]}>
            <AppIcon icon={isPurchased || isFree ? Unlock : Lock} size={12} color="#fff" strokeWidth={2.5} />
          </View>
        </View>
        <Text style={[s.bookTitle, { color: colors.text }]} numberOfLines={2}>{book.title}</Text>
        <Text style={[s.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{book.author}</Text>
        {isFree
          ? <Text style={s.freeTag}>Gratuit</Text>
          : <Text style={[s.priceTag, isPurchased && s.paidTag]}>
              {isPurchased ? '✓ Acheté' : `${book.tokenCost} XOF`}
            </Text>
        }
      </TouchableOpacity>
    );
  }

  // ── Modal détail ────────────────────────────────────────────────────────────
  function BookModal() {
    if (!selected) return null;
    const isFree = selected.tokenCost === 0;
    const isPurchased = selected.purchased;
    const canDownload = isFree || isPurchased;

    return (
      <Modal visible animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={s.modalClose} onPress={() => setSelected(null)}>
              <AppIcon icon={X} size={22} color={colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>

            {selected.coverUrl
              ? <Image source={{ uri: selected.coverUrl }} style={s.modalCover} resizeMode="cover" />
              : <View style={[s.modalCover, s.coverFallback]}>
                  <AppIcon icon={BookOpen} size={48} color="#C9A84C" strokeWidth={1.5} />
                </View>
            }

            <Text style={[s.modalTitle, { color: colors.text }]}>{selected.title}</Text>
            <Text style={[s.modalAuthor, { color: colors.textSecondary }]}>{selected.author}</Text>
            {selected.description
              ? <Text style={[s.modalDesc, { color: colors.textSecondary }]}>{selected.description}</Text>
              : null
            }

            {/* Prix / statut */}
            <View style={s.priceRow}>
              <AppIcon icon={canDownload ? Unlock : Lock} size={18} color={canDownload ? '#10B981' : '#F59E0B'} strokeWidth={2.5} />
              <Text style={[s.priceLabel, { color: canDownload ? '#10B981' : '#F59E0B' }]}>
                {isFree ? 'Gratuit' : isPurchased ? 'Déjà acheté' : `${selected.tokenCost} XOF pour télécharger`}
              </Text>
            </View>

            {canDownload ? (
              <>
                {/* Lire dans l'app */}
                <TouchableOpacity
                  style={[s.actionBtn, s.readBtn]}
                  onPress={() => {
                    setSelected(null);
                    router.push({ pathname: '/library/reader', params: { id: selected.id, title: selected.title } } as any);
                  }}
                >
                  <AppIcon icon={BookOpen} size={18} color="#fff" strokeWidth={2.5} />
                  <Text style={s.actionBtnTxt}>Lire dans l'application</Text>
                </TouchableOpacity>

                {/* Télécharger */}
                <TouchableOpacity
                  style={[s.actionBtn, s.downloadBtn, { marginTop: 8 }]}
                  onPress={() => handleDownload(selected)}
                  disabled={downloading}
                >
                  {downloading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <AppIcon icon={Download} size={18} color="#fff" strokeWidth={2.5} />
                        <Text style={s.actionBtnTxt}>Télécharger le PDF</Text>
                      </>
                  }
                </TouchableOpacity>
              </>
            ) : (
              /* Bouton achat */
              <TouchableOpacity
                style={[s.actionBtn, s.buyBtn]}
                onPress={() => handleBuy(selected)}
                disabled={paying}
              >
                {paying
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <AppIcon icon={Lock} size={18} color="#fff" strokeWidth={2.5} />
                      <Text style={s.actionBtnTxt}>{`Payer ${selected.tokenCost} XOF`}</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[s.title, { color: colors.text }]}>Bibliothèque</Text>
      </View>

      {/* Recherche */}
      <View style={[s.searchRow, { marginHorizontal: spacing.lg }]}>
        <AppIcon icon={Search} size={16} color={colors.textSecondary} strokeWidth={2} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un livre…"
          placeholderTextColor={colors.textSecondary}
          style={[s.searchInput, { color: colors.text }]}
        />
      </View>

      {/* Catégories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8 }}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} onPress={() => setCategory(c)}
            style={[s.catChip, category === c && s.catChipActive]}>
            <Text style={[s.catTxt, category === c && s.catTxtActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grille */}
      {loading
        ? <ActivityIndicator color="#C9A84C" style={{ marginTop: 40 }} />
        : <FlatList
            data={filtered}
            keyExtractor={b => b.id}
            numColumns={2}
            contentContainerStyle={{ padding: spacing.lg, gap: 16 }}
            columnWrapperStyle={{ gap: 16 }}
            renderItem={({ item }) => <BookCard book={item} />}
            ListEmptyComponent={
              <Text style={[s.empty, { color: colors.textSecondary }]}>Aucun livre disponible</Text>
            }
          />
      }

      <BookModal />
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  header:       { paddingVertical: 16 },
  title:        { fontSize: 24, fontWeight: '700' },
  searchRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  searchInput:  { flex: 1, fontSize: 14 },
  catScroll:    { maxHeight: 44, marginBottom: 8 },
  catChip:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  catChipActive:{ backgroundColor: '#C9A84C', borderColor: '#C9A84C' },
  catTxt:       { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  catTxtActive: { color: '#fff' },
  card:         { flex: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  coverWrap:    { position: 'relative' },
  cover:        { width: '100%', aspectRatio: 2/3 },
  coverFallback:{ alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(201,168,76,0.08)' },
  lockBadge:    { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lockClosed:   { backgroundColor: '#F59E0B' },
  lockOpen:     { backgroundColor: '#10B981' },
  bookTitle:    { fontSize: 13, fontWeight: '700', padding: 8, paddingBottom: 2 },
  bookAuthor:   { fontSize: 11, paddingHorizontal: 8, paddingBottom: 4 },
  freeTag:      { fontSize: 11, fontWeight: '700', color: '#10B981', paddingHorizontal: 8, paddingBottom: 8 },
  priceTag:     { fontSize: 11, fontWeight: '700', color: '#F59E0B', paddingHorizontal: 8, paddingBottom: 8 },
  paidTag:      { color: '#10B981' },
  empty:        { textAlign: 'center', marginTop: 40, fontSize: 15 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox:     { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalClose:   { alignSelf: 'flex-end', marginBottom: 12 },
  modalCover:   { width: 120, height: 180, borderRadius: 12, alignSelf: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  modalAuthor:  { fontSize: 14, textAlign: 'center', marginBottom: 12 },
  modalDesc:    { fontSize: 13, lineHeight: 20, marginBottom: 16, textAlign: 'center' },
  priceRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 20 },
  priceLabel:   { fontSize: 16, fontWeight: '700' },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24 },
  buyBtn:       { backgroundColor: '#F59E0B' },
  readBtn:      { backgroundColor: '#C9A84C' },
  downloadBtn:  { backgroundColor: '#10B981' },
  actionBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
