/**
 * Librairie — Oracle Plus
 * Liste des livres, page détail, achat Paystack, téléchargement sécurisé.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { BookOpen, Download, RefreshCw, ShoppingCart, X, BookMarked } from 'lucide-react-native';
import { router } from 'expo-router';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { useTheme } from '../../../../src/theme';
import { Livre, LibrairieService } from '../../../../src/services/librairie.service';
import { StorageService } from '../../../../src/services/storage.service';
import { STORAGE_KEYS } from '../../../../src/utils/constants';

const CATEGORIES = ['Tous', 'Spiritualité', 'Prophétie', 'Prières', 'Rêves', 'Délivrance', 'Formation', 'Autre'];
const POLL_MS = 4000;
const TIMEOUT_MS = 10 * 60 * 1000;

export default function LibrairieScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [books, setBooks]       = useState<Livre[]>([]);
  const [loading, setLoading]   = useState(true);
  const [cat, setCat]           = useState('Tous');
  const [detail, setDetail]     = useState<Livre | null>(null);
  const [paying, setPaying]     = useState(false);
  const [payRef, setPayRef]     = useState<string | null>(null);
  const [payError, setPayError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await LibrairieService.getAll(cat === 'Tous' ? undefined : cat);
    setBooks(data);
    setLoading(false);
  }, [cat]);

  useEffect(() => { load(); }, [load]);

  function stopPolling() {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function handleBuy(livre: Livre) {
    setPayError('');
    setPaying(true);
    const result = await LibrairieService.initierPaiement(livre.id);
    if (result.alreadyPurchased) {
      setBooks((prev) => prev.map((b) => b.id === livre.id ? { ...b, purchased: true } : b));
      if (detail?.id === livre.id) setDetail((d) => d ? { ...d, purchased: true } : d);
      setPaying(false);
      return;
    }
    if (result.error || !result.authorizationUrl || !result.reference) {
      setPayError(result.error ?? 'Impossible d\'initier le paiement.');
      setPaying(false);
      return;
    }
    const ref = result.reference;
    setPayRef(ref);

    // Démarrer le polling avant d'ouvrir le navigateur
    const startedAt = Date.now();
    pollRef.current = setInterval(async () => {
      const v = await LibrairieService.verifierPaiement(ref);
      if (v.success) {
        stopPolling();
        try { if (Platform.OS !== 'web') await WebBrowser.dismissBrowser(); } catch {}
        setBooks((prev) => prev.map((b) => b.id === livre.id ? { ...b, purchased: true } : b));
        if (detail?.id === livre.id) setDetail((d) => d ? { ...d, purchased: true } : d);
        setPaying(false);
        setPayRef(null);
      }
    }, POLL_MS);

    timerRef.current = setInterval(() => {
      if (Date.now() - startedAt > TIMEOUT_MS) {
        stopPolling();
        try { if (Platform.OS !== 'web') WebBrowser.dismissBrowser(); } catch {}
        setPaying(false);
        setPayRef(null);
        setPayError('Délai dépassé. Si vous avez été débité, le livre sera disponible sous peu.');
      }
    }, POLL_MS);

    // Ouvrir Paystack
    if (Platform.OS === 'web') {
      window.open(result.authorizationUrl, '_blank');
    } else {
      await WebBrowser.openAuthSessionAsync(result.authorizationUrl, 'oracleplus://');
      // Vérification immédiate au retour
      const v = await LibrairieService.verifierPaiement(ref);
      if (v.success) {
        stopPolling();
        setBooks((prev) => prev.map((b) => b.id === livre.id ? { ...b, purchased: true } : b));
        if (detail?.id === livre.id) setDetail((d) => d ? { ...d, purchased: true } : d);
        setPaying(false);
        setPayRef(null);
      }
    }
  }

  async function handleDownload(livre: Livre) {
    const result = await LibrairieService.telechargerPdf(livre);
    if (result.error) {
      setPayError(result.error);
    }
  }

  function handleRead(livre: Livre) {
    router.push(`/librairie/reader?id=${livre.id}&title=${encodeURIComponent(livre.title)}` as any);
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <AppIcon icon={BookOpen} size={22} color={colors.primary} strokeWidth={2} />
        <Text style={[s.headerTitle, { color: colors.text }]}>Librairie</Text>
        <TouchableOpacity onPress={() => router.push('/librairie/mes-livres' as any)} style={s.myBooksBtn}>
          <AppIcon icon={BookMarked} size={20} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity onPress={load} style={s.refreshBtn}>
          <AppIcon icon={RefreshCw} size={18} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Filtres catégorie */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[s.catChip, { backgroundColor: cat === c ? colors.primary : colors.surface, borderColor: cat === c ? colors.primary : colors.border }]}
            onPress={() => setCat(c)}
          >
            <Text style={{ color: cat === c ? '#fff' : colors.textSecondary, fontSize: 13, fontWeight: '600' }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Erreur paiement */}
      {payError ? (
        <View style={[s.errorBanner, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#EF4444' }]}>
          <Text style={{ color: '#EF4444', fontSize: 13, flex: 1 }}>{payError}</Text>
          <TouchableOpacity onPress={() => setPayError('')}><AppIcon icon={X} size={16} color="#EF4444" strokeWidth={2} /></TouchableOpacity>
        </View>
      ) : null}

      {/* Liste */}
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : books.length === 0 ? (
        <View style={s.center}>
          <AppIcon icon={BookOpen} size={52} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: 'center' }}>Aucun livre disponible pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(b) => b.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              colors={colors}
              onPress={() => setDetail(item)}
              onBuy={() => handleBuy(item)}
              onDownload={() => handleDownload(item)}
              paying={paying && payRef !== null}
            />
          )}
        />
      )}

      {/* Modal détail */}
      {detail && (
        <BookDetailModal
          book={detail}
          colors={colors}
          onClose={() => setDetail(null)}
          onBuy={() => handleBuy(detail)}
          onDownload={() => handleDownload(detail)}
          onRead={() => handleRead(detail)}
          paying={paying}
        />
      )}
    </View>
  );
}

// ── Carte livre ───────────────────────────────────────────────────────────────
function BookCard({ book, colors, onPress, onBuy, onDownload, paying }: {
  book: Livre; colors: any; onPress: () => void;
  onBuy: () => void; onDownload: () => void; paying: boolean;
}) {
  return (
    <TouchableOpacity style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.85}>
      {/* Couverture */}
      <View style={s.cardCover}>
        {book.coverUrl
          ? <Image source={{ uri: book.coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          : <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
              <AppIcon icon={BookOpen} size={32} color={colors.textTertiary} strokeWidth={1.5} />
            </View>
        }
        {book.purchased && (
          <View style={s.purchasedBadge}>
            <Text style={s.purchasedBadgeTxt}>Acheté</Text>
          </View>
        )}
      </View>
      {/* Infos */}
      <View style={s.cardBody}>
        <Text style={[s.cardTitle, { color: colors.text }]} numberOfLines={2}>{book.title}</Text>
        {book.author ? <Text style={[s.cardAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{book.author}</Text> : null}
        <Text style={[s.cardPrice, { color: colors.primary }]}>{book.priceFcfa.toLocaleString()} FCFA</Text>
        {book.purchased ? (
          <TouchableOpacity style={[s.cardBtn, { backgroundColor: '#10B981' }]} onPress={onDownload}>
            <AppIcon icon={Download} size={14} color="#fff" strokeWidth={2.5} />
            <Text style={s.cardBtnTxt}>Télécharger</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.cardBtn, { backgroundColor: colors.primary }]} onPress={onBuy} disabled={paying}>
            <AppIcon icon={ShoppingCart} size={14} color="#fff" strokeWidth={2.5} />
            <Text style={s.cardBtnTxt}>Acheter</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Modal détail ──────────────────────────────────────────────────────────────
function BookDetailModal({ book, colors, onClose, onBuy, onDownload, onRead, paying }: {
  book: Livre; colors: any; onClose: () => void;
  onBuy: () => void; onDownload: () => void; onRead: () => void; paying: boolean;
}) {
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.detailRoot, { backgroundColor: colors.background }]}>
        {/* Bouton fermer */}
        <TouchableOpacity style={[s.detailClose, { backgroundColor: colors.surface }]} onPress={onClose}>
          <AppIcon icon={X} size={20} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Grande couverture */}
          <View style={s.detailCoverWrap}>
            {book.coverUrl
              ? <Image source={{ uri: book.coverUrl }} style={s.detailCover} resizeMode="cover" />
              : <View style={[s.detailCover, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
                  <AppIcon icon={BookOpen} size={64} color={colors.textTertiary} strokeWidth={1.5} />
                </View>
            }
          </View>

          <View style={{ padding: 24, gap: 16 }}>
            {/* Titre + auteur */}
            <View style={{ gap: 4 }}>
              <Text style={[s.detailTitle, { color: colors.text }]}>{book.title}</Text>
              {book.author ? <Text style={[s.detailAuthor, { color: colors.textSecondary }]}>{book.author}</Text> : null}
              {book.category ? (
                <View style={[s.catTag, { backgroundColor: 'rgba(201,168,76,0.12)' }]}>
                  <Text style={[s.catTagTxt, { color: colors.primary }]}>{book.category}</Text>
                </View>
              ) : null}
            </View>

            {/* Prix */}
            <View style={[s.priceBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.priceLabel, { color: colors.textSecondary }]}>Prix</Text>
              <Text style={[s.priceValue, { color: colors.primary }]}>{book.priceFcfa.toLocaleString()} FCFA</Text>
            </View>

            {/* Description complète */}
            {(book.description || book.shortDescription) ? (
              <View style={{ gap: 8 }}>
                <Text style={[s.descLabel, { color: colors.textSecondary }]}>PRÉSENTATION</Text>
                <Text style={[s.descText, { color: colors.text }]}>
                  {book.description || book.shortDescription}
                </Text>
              </View>
            ) : null}

            {/* Boutons d'action */}
            {book.purchased ? (
              <View style={{ gap: 10 }}>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#10B981' }]} onPress={onDownload}>
                  <AppIcon icon={Download} size={20} color="#fff" strokeWidth={2.5} />
                  <Text style={s.actionBtnTxt}>Télécharger le PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]} onPress={onRead}>
                  <AppIcon icon={BookOpen} size={20} color={colors.text} strokeWidth={2} />
                  <Text style={[s.actionBtnTxt, { color: colors.text }]}>Lire en ligne</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.primary }]} onPress={onBuy} disabled={paying}>
                {paying
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><AppIcon icon={ShoppingCart} size={20} color="#fff" strokeWidth={2.5} /><Text style={s.actionBtnTxt}>Acheter maintenant</Text></>
                }
              </TouchableOpacity>
            )}

            {/* Notice sécurité */}
            <View style={[s.securityNote, { backgroundColor: 'rgba(16,185,129,0.07)', borderColor: 'rgba(16,185,129,0.2)' }]}>
              <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 17 }}>
                🔒 Paiement sécurisé via <Text style={{ fontWeight: '700', color: '#10B981' }}>universdeslivres.squares</Text>. Le PDF est protégé et accessible uniquement après achat.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:        { flex: 1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, gap: 10 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '900' },
  myBooksBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  refreshBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  catBar:      { maxHeight: 52, paddingVertical: 8 },
  catChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  // Carte
  card:        { flex: 1, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  cardCover:   { width: '100%', aspectRatio: 0.7, position: 'relative' },
  purchasedBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  purchasedBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
  cardBody:    { padding: 10, gap: 5 },
  cardTitle:   { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  cardAuthor:  { fontSize: 11 },
  cardPrice:   { fontSize: 13, fontWeight: '800' },
  cardBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 8, marginTop: 4 },
  cardBtnTxt:  { color: '#fff', fontSize: 12, fontWeight: '700' },
  // Détail
  detailRoot:  { flex: 1 },
  detailClose: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  detailCoverWrap: { width: '100%', alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  detailCover: { width: 180, height: 260, borderRadius: 12, overflow: 'hidden' },
  detailTitle: { fontSize: 22, fontWeight: '900', lineHeight: 28 },
  detailAuthor:{ fontSize: 15, fontWeight: '500' },
  catTag:      { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  catTagTxt:   { fontSize: 12, fontWeight: '700' },
  priceBox:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1 },
  priceLabel:  { fontSize: 13, fontWeight: '600' },
  priceValue:  { fontSize: 22, fontWeight: '900' },
  descLabel:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  descText:    { fontSize: 15, lineHeight: 24 },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  actionBtnTxt:{ color: '#fff', fontSize: 16, fontWeight: '800' },
  securityNote:{ padding: 12, borderRadius: 10, borderWidth: 1 },
});
