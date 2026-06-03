/**
 * Onglet Livres — liste publique + achat Paystack + téléchargement PDF
 * 1 crédit = 1 FCFA — le prix du livre est en FCFA/crédits
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Linking, Platform,
  RefreshControl, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { BookOpen, Download, Lock, ShoppingCart, Zap } from 'lucide-react-native';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { http } from '../../../../src/services/http.client';
import { useAuthStore } from '../../../../src/store/auth.store';
import { useTheme } from '../../../../src/theme';

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
  status: string;
  purchased: boolean;
}

/* ─── Carte livre ────────────────────────────────────────────────────────── */
function BookCard({ book, onBuy, onDownload, buying }: {
  book: Book;
  onBuy: (book: Book) => void;
  onDownload: (book: Book) => void;
  buying: boolean;
}) {
  const { colors } = useTheme();
  const free = book.tokenCost === 0;

  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Couverture */}
      <View style={s.coverWrap}>
        {book.coverUrl ? (
          <Image source={{ uri: book.coverUrl }} style={s.cover} resizeMode="cover" />
        ) : (
          <View style={[s.coverFallback, { backgroundColor: colors.primaryPale }]}>
            <AppIcon icon={BookOpen} size={32} color="#C9A84C" strokeWidth={1.6} />
          </View>
        )}
        {/* Badge prix */}
        <View style={[s.priceBadge, { backgroundColor: free ? '#10B981' : '#C9A84C' }]}>
          <Text style={s.priceBadgeTxt}>{free ? 'GRATUIT' : `${book.tokenCost} FCFA`}</Text>
        </View>
      </View>

      {/* Infos */}
      <View style={s.info}>
        <Text style={[s.title, { color: colors.text }]} numberOfLines={2}>{book.title}</Text>
        {book.author ? (
          <Text style={[s.author, { color: colors.textSecondary }]} numberOfLines={1}>
            {book.author}
          </Text>
        ) : null}
        {book.description ? (
          <Text style={[s.desc, { color: colors.textSecondary }]} numberOfLines={3}>
            {book.description}
          </Text>
        ) : null}
        {book.pages ? (
          <Text style={[s.pages, { color: colors.textTertiary }]}>{book.pages} pages</Text>
        ) : null}

        {/* Bouton action */}
        {book.purchased || free ? (
          book.pdfUrl ? (
            <TouchableOpacity
              style={s.btnDownload}
              onPress={() => onDownload(book)}
              activeOpacity={0.85}
            >
              <AppIcon icon={Download} size={16} color="#fff" strokeWidth={2.5} />
              <Text style={s.btnTxt}>Télécharger le PDF</Text>
            </TouchableOpacity>
          ) : (
            <View style={[s.btnDownload, { backgroundColor: '#6B7280' }]}>
              <Text style={s.btnTxt}>PDF non disponible</Text>
            </View>
          )
        ) : (
          <TouchableOpacity
            style={[s.btnBuy, buying && s.btnDisabled]}
            onPress={() => onBuy(book)}
            disabled={buying}
            activeOpacity={0.85}
          >
            {buying ? (
              <ActivityIndicator color="#1A1A3E" size="small" />
            ) : (
              <>
                <AppIcon icon={ShoppingCart} size={16} color="#1A1A3E" strokeWidth={2.5} />
                <Text style={s.btnBuyTxt}>Acheter — {book.tokenCost} FCFA</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ─── Écran principal ────────────────────────────────────────────────────── */
export default function LivresScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);

  const [books, setBooks]       = useState<Book[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await http.get<Book[]>('/library');
      setBooks(Array.isArray(data) ? data : []);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Achat Paystack ──────────────────────────────────────────────────── */
  const handleBuy = async (book: Book) => {
    if (!user) { router.push('/onboarding'); return; }
    setBuyingId(book.id);
    try {
      const res = await http.post<any>(`/library/pay/${book.id}`);

      // Déjà acheté ou gratuit
      if (res?.alreadyPurchased || res?.purchased) {
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, purchased: true } : b));
        setBuyingId(null);
        return;
      }

      if (!res?.authorization_url) {
        setBuyingId(null);
        return;
      }

      // Ouvrir Paystack
      if (Platform.OS === 'web') {
        window.location.href = res.authorization_url;
        return;
      }
      await WebBrowser.openAuthSessionAsync(res.authorization_url, 'oracleplus://');

      // Polling vérification après retour
      const ref = res.reference;
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const v = await http.get<any>(`/library/verify/${ref}`);
          if (v?.success || v?.purchased) {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setBooks(prev => prev.map(b => b.id === book.id ? { ...b, purchased: true } : b));
            setBuyingId(null);
          }
        } catch {}
        if (attempts >= 15) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setBuyingId(null);
          load(true);
        }
      }, 3000);
    } catch {
      setBuyingId(null);
    }
  };

  /* ── Téléchargement PDF ──────────────────────────────────────────────── */
  const handleDownload = async (book: Book) => {
    if (!book.pdfUrl) return;
    // Ouvrir l'URL directement — le backend sert le fichier statiquement
    const url = book.pdfUrl;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      await Linking.openURL(url);
    }
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  /* ── Rendu ───────────────────────────────────────────────────────────── */
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12, backgroundColor: '#1A1A3E' }]}>
        <AppIcon icon={BookOpen} size={24} color="#C9A84C" strokeWidth={2} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Livres</Text>
          <Text style={s.headerSub}>
            {books.length > 0 ? `${books.length} livre${books.length > 1 ? 's' : ''} disponible${books.length > 1 ? 's' : ''}` : 'Bibliothèque spirituelle'}
          </Text>
        </View>
        <View style={s.creditBadge}>
          <AppIcon icon={Zap} size={12} color="#C9A84C" strokeWidth={2.5} />
          <Text style={s.creditTxt}>1 FCFA = 1 crédit</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#C9A84C" />
        </View>
      ) : books.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
          <AppIcon icon={BookOpen} size={56} color={colors.textTertiary} strokeWidth={1.4} />
          <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
            Aucun livre disponible
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: 13, textAlign: 'center' }}>
            Revenez bientôt — de nouveaux livres seront ajoutés.
          </Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={b => b.id}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor="#C9A84C"
            />
          }
          renderItem={({ item }) => (
            <BookCard
              book={item}
              onBuy={handleBuy}
              onDownload={handleDownload}
              buying={buyingId === item.id}
            />
          )}
        />
      )}
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle:  { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  creditBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(201,168,76,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  creditTxt:    { fontSize: 10, color: '#C9A84C', fontWeight: '700' },

  card:         { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  coverWrap:    { position: 'relative' },
  cover:        { width: '100%', height: 200 },
  coverFallback:{ width: '100%', height: 200, alignItems: 'center', justifyContent: 'center' },
  priceBadge:   { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  priceBadgeTxt:{ fontSize: 12, fontWeight: '900', color: '#fff' },

  info:         { padding: 16, gap: 8 },
  title:        { fontSize: 17, fontWeight: '800', lineHeight: 22 },
  author:       { fontSize: 13, fontWeight: '600' },
  catBadge:     { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catTxt:       { fontSize: 11, fontWeight: '700' },
  desc:         { fontSize: 13, lineHeight: 20 },
  pages:        { fontSize: 11 },

  btnBuy:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#C9A84C', borderRadius: 12, paddingVertical: 14, marginTop: 4 },
  btnBuyTxt:    { fontSize: 15, fontWeight: '800', color: '#1A1A3E' },
  btnDownload:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, marginTop: 4 },
  btnTxt:       { fontSize: 15, fontWeight: '800', color: '#fff' },
  btnDisabled:  { opacity: 0.6 },
});
