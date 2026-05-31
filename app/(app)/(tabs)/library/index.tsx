/**
 * Bibliothèque Spirituelle — Oracle Plus
 *
 * Paiement par crédits uniquement (pas Paystack/XOF).
 * 1 livre = N crédits débités côté backend (POST /library/:id/unlock).
 * Les livres à tokenCost=0 sont gratuits.
 * Aucune dépendance à l'abonnement.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Modal,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BookOpen, Download, Lock, Search, Unlock, X } from 'lucide-react-native';
import { useTheme } from '../../../../src/theme';
import { LibraryBook, LibraryService } from '../../../../src/services/library.service';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { useCreditsStore } from '../../../../src/store/credits.store';
import { http } from '../../../../src/services/http.client';

const CATEGORIES = ['Tous', 'Spiritualité', 'Prophétie', 'Prières', 'Rêves', 'Formation', 'Autre'];

export default function LibraryScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { credits, setCredits, fetchBalance } = useCreditsStore();

  const [books,       setBooks]       = useState<LibraryBook[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('Tous');
  const [selected,    setSelected]    = useState<LibraryBook | null>(null);
  const [unlocking,   setUnlocking]   = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await LibraryService.getAll(category === 'Tous' ? undefined : category);
    setBooks(data);
    setLoading(false);
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const filtered = books.filter(b =>
    !search ||
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.author ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Débloquer avec crédits ──────────────────────────────────────────────────
  async function handleUnlock(book: LibraryBook) {
    const isFree      = book.tokenCost === 0;
    const isPurchased = book.purchased;

    if (isFree || isPurchased) {
      setSelected(null);
      router.push({ pathname: '/library/reader', params: { id: book.id, title: book.title } } as any);
      return;
    }

    if (credits < (book.tokenCost ?? 0)) {
      Alert.alert(
        'Crédits insuffisants',
        `Il vous faut ${book.tokenCost} crédits pour débloquer ce livre.\nVotre solde : ${credits} crédits.\n\nRechargez votre crédit pour continuer.`,
        [
          { text: 'Recharger', onPress: () => { setSelected(null); router.push('/subscription' as any); } },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
      return;
    }

    setUnlocking(true);
    try {
      const res = await http.post<{
        success: boolean;
        purchased?: boolean;
        error?: string;
        creditsRequired?: number;
        creditsAvailable?: number;
        creditsRemaining?: number;
      }>(`/library/${book.id}/unlock`, {});

      if (res.success && res.purchased) {
        if (typeof res.creditsRemaining === 'number') {
          setCredits(res.creditsRemaining);
        } else {
          fetchBalance().catch(() => {});
        }
        const updatedBook = { ...book, purchased: true };
        setBooks(prev => prev.map(b => b.id === book.id ? updatedBook : b));
        setSelected(updatedBook);
        Alert.alert(
          '✅ Livre débloqué !',
          `"${book.title}" est maintenant disponible.`,
          [
            {
              text: 'Lire maintenant',
              onPress: () => {
                setSelected(null);
                router.push({ pathname: '/library/reader', params: { id: book.id, title: book.title } } as any);
              },
            },
            { text: 'Plus tard' },
          ]
        );
      } else if (res.error === 'Crédits insuffisants') {
        Alert.alert(
          'Crédits insuffisants',
          `Il vous faut ${res.creditsRequired} crédits.\nVotre solde : ${res.creditsAvailable} crédits.\n\nRechargez votre crédit pour continuer.`,
          [
            { text: 'Recharger', onPress: () => { setSelected(null); router.push('/subscription' as any); } },
            { text: 'Annuler', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Erreur', res.error ?? 'Impossible de débloquer ce livre.');
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Erreur réseau');
    }
    setUnlocking(false);
  }

  // ── Télécharger PDF ─────────────────────────────────────────────────────────
  async function handleDownload(book: LibraryBook) {
    setDownloading(true);
    const result = await LibraryService.downloadBook(book);
    setDownloading(false);
    if (result.error) { Alert.alert('Erreur', result.error); return; }
    Alert.alert('✅ Téléchargé', 'Le PDF a été téléchargé.');
  }

  // ── Carte livre ─────────────────────────────────────────────────────────────
  function BookCard({ book }: { book: LibraryBook }) {
    const isFree      = book.tokenCost === 0;
    const isPurchased = book.purchased;
    const accessible  = isFree || isPurchased;

    return (
      <TouchableOpacity style={s.card} onPress={() => setSelected(book)} activeOpacity={0.85}>
        <View style={s.coverWrap}>
          {book.coverUrl
            ? <Image source={{ uri: book.coverUrl }} style={s.cover} resizeMode="cover" />
            : <View style={[s.cover, s.coverFallback]}>
                <AppIcon icon={BookOpen} size={32} color="#C9A84C" strokeWidth={1.5} />
              </View>
          }
          <View style={[s.lockBadge, accessible ? s.lockOpen : s.lockClosed]}>
            <AppIcon icon={accessible ? Unlock : Lock} size={11} color="#fff" strokeWidth={2.5} />
          </View>
        </View>

        <Text style={[s.bookTitle, { color: colors.text }]} numberOfLines={2}>{book.title}</Text>
        <Text style={[s.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{book.author}</Text>

        {isFree
          ? <Text style={s.freeTag}>Gratuit</Text>
          : <Text style={[s.priceTag, isPurchased && s.paidTag]}>
              {isPurchased ? '✓ Débloqué' : `${book.tokenCost} crédits`}
            </Text>
        }

        <TouchableOpacity
          style={[s.quickBtn, accessible ? s.quickBtnGold : s.quickBtnOutline]}
          onPress={() => accessible
            ? router.push({ pathname: '/library/reader', params: { id: book.id, title: book.title } } as any)
            : setSelected(book)
          }
        >
          <Text style={s.quickBtnTxt}>{accessible ? 'Lire' : `${book.tokenCost} crédits`}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ── Modal détail ─────────────────────────────────────────────────────────────
  function BookModal() {
    if (!selected) return null;
    const isFree      = selected.tokenCost === 0;
    const isPurchased = selected.purchased;
    const accessible  = isFree || isPurchased;
    const canAfford   = credits >= (selected.tokenCost ?? 0);

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

            <View style={s.priceRow}>
              <AppIcon
                icon={accessible ? Unlock : Lock}
                size={18}
                color={accessible ? '#10B981' : '#F59E0B'}
                strokeWidth={2.5}
              />
              <Text style={[s.priceLabel, { color: accessible ? '#10B981' : '#F59E0B' }]}>
                {isFree ? 'Gratuit' : isPurchased ? 'Déjà débloqué' : `${selected.tokenCost} crédits`}
              </Text>
            </View>

            {!accessible && (
              <Text style={[s.balanceHint, { color: colors.textSecondary }]}>
                Votre solde :{' '}
                <Text style={{ fontWeight: '700', color: canAfford ? '#10B981' : '#EF4444' }}>
                  {credits} crédits
                </Text>
              </Text>
            )}

            {accessible ? (
              <>
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
              <TouchableOpacity
                style={[s.actionBtn, canAfford ? s.unlockBtn : s.rechargeBtn]}
                onPress={() => handleUnlock(selected)}
                disabled={unlocking}
              >
                {unlocking
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <AppIcon icon={Lock} size={18} color="#fff" strokeWidth={2.5} />
                      <Text style={s.actionBtnTxt}>
                        {canAfford
                          ? `Débloquer — ${selected.tokenCost} crédits`
                          : 'Recharger mes crédits'}
                      </Text>
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
      <View style={[s.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[s.title, { color: colors.text }]}>Bibliothèque Spirituelle</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          {books.length} livre{books.length !== 1 ? 's' : ''} disponible{books.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={[s.searchRow, { marginHorizontal: spacing.lg, backgroundColor: colors.surface }]}>
        <AppIcon icon={Search} size={16} color={colors.textSecondary} strokeWidth={2} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un livre…"
          placeholderTextColor={colors.textSecondary}
          style={[s.searchInput, { color: colors.text }]}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catScroll}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8 }}
      >
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategory(c)}
            style={[s.catChip, category === c && s.catChipActive]}
          >
            <Text style={[s.catTxt, category === c && s.catTxtActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
              <Text style={[s.empty, { color: colors.textSecondary }]}>
                Aucun livre disponible
              </Text>
            }
          />
      }

      <BookModal />
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1 },
  header:          { paddingVertical: 16 },
  title:           { fontSize: 22, fontWeight: '700' },
  subtitle:        { fontSize: 13, marginTop: 2 },
  searchRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  searchInput:     { flex: 1, fontSize: 14 },
  catScroll:       { maxHeight: 44, marginBottom: 8 },
  catChip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  catChipActive:   { backgroundColor: '#C9A84C', borderColor: '#C9A84C' },
  catTxt:          { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  catTxtActive:    { color: '#fff' },
  card:            { flex: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  coverWrap:       { position: 'relative' },
  cover:           { width: '100%', aspectRatio: 2 / 3 },
  coverFallback:   { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(201,168,76,0.08)' },
  lockBadge:       { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  lockClosed:      { backgroundColor: '#F59E0B' },
  lockOpen:        { backgroundColor: '#10B981' },
  bookTitle:       { fontSize: 13, fontWeight: '700', padding: 8, paddingBottom: 2 },
  bookAuthor:      { fontSize: 11, paddingHorizontal: 8, paddingBottom: 4 },
  freeTag:         { fontSize: 11, fontWeight: '700', color: '#10B981', paddingHorizontal: 8, paddingBottom: 4 },
  priceTag:        { fontSize: 11, fontWeight: '700', color: '#F59E0B', paddingHorizontal: 8, paddingBottom: 4 },
  paidTag:         { color: '#10B981' },
  quickBtn:        { margin: 8, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  quickBtnGold:    { backgroundColor: '#C9A84C' },
  quickBtnOutline: { backgroundColor: 'rgba(201,168,76,0.12)', borderWidth: 1, borderColor: '#C9A84C' },
  quickBtnTxt:     { fontSize: 12, fontWeight: '700', color: '#fff' },
  empty:           { textAlign: 'center', marginTop: 40, fontSize: 15 },
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalBox:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalClose:      { alignSelf: 'flex-end', marginBottom: 12 },
  modalCover:      { width: 120, height: 180, borderRadius: 12, alignSelf: 'center', marginBottom: 16 },
  modalTitle:      { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  modalAuthor:     { fontSize: 14, textAlign: 'center', marginBottom: 8 },
  modalDesc:       { fontSize: 13, lineHeight: 20, marginBottom: 12, textAlign: 'center' },
  priceRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 6 },
  priceLabel:      { fontSize: 16, fontWeight: '700' },
  balanceHint:     { fontSize: 12, textAlign: 'center', marginBottom: 16 },
  actionBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24 },
  unlockBtn:       { backgroundColor: '#F59E0B' },
  rechargeBtn:     { backgroundColor: '#EF4444' },
  readBtn:         { backgroundColor: '#C9A84C' },
  downloadBtn:     { backgroundColor: '#10B981' },
  actionBtnTxt:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});
