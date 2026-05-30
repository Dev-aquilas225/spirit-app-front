/**
 * Bibliothèque Spirituelle — Oracle Plus
 *
 * Flux d'accès :
 *  1. Clic sur un livre → modal avec prix FCFA
 *  2. Bouton "Acheter ce livre" → paiement Paystack (indépendant abonnement/crédits)
 *  3. Après paiement confirmé → cadenas vert → bouton "Télécharger le PDF"
 *  4. Téléchargement : fetch avec JWT → blob → <a download> (web) / WebBrowser (natif)
 *
 * L'abonnement et les crédits ne donnent PAS accès aux livres.
 * Chaque livre doit être acheté individuellement via Paystack.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Dimensions, FlatList, Image, Modal,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  BookOpen, CheckCircle2, Download, Lock, Search,
  ShoppingCart, Unlock, X, Zap,
} from 'lucide-react-native';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { useTheme } from '../../../../src/theme';
import { useAuthStore } from '../../../../src/store/auth.store';
import { http } from '../../../../src/services/http.client';
import { LibraryService } from '../../../../src/services/library.service';
import { StorageService } from '../../../../src/services/storage.service';
import { STORAGE_KEYS } from '../../../../src/utils/constants';

const CARD_WIDTH   = (Dimensions.get('window').width - 24 - 12) / 2;
const COVER_HEIGHT = Math.round(CARD_WIDTH * 1.414);

// ── Couverture livre ──────────────────────────────────────────────────────────
function BookCover({ uri, title, size = 'card' }: { uri?: string; title: string; size?: 'card' | 'modal' }) {
  const [err, setErr] = useState(false);
  const w = size === 'modal' ? 120 : CARD_WIDTH - 24;
  const h = size === 'modal' ? 170 : COVER_HEIGHT;
  if (uri && !err) {
    return (
      <Image
        source={{ uri }}
        style={{ width: w, height: h, borderRadius: 10 }}
        resizeMode="cover"
        onError={() => setErr(true)}
      />
    );
  }
  const initials = title.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  return (
    <View style={{ width: w, height: h, borderRadius: 10, backgroundColor: '#1A2744', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)' }}>
      <AppIcon icon={BookOpen} size={size === 'modal' ? 36 : 28} color="#C9A84C" strokeWidth={1.5} />
      <Text style={{ color: '#C9A84C', fontSize: 13, fontWeight: '900', marginTop: 8 }}>{initials}</Text>
    </View>
  );
}

interface Book {
  id: string; title: string; author: string; category: string;
  coverUrl?: string; price: number; pages: number;
  description?: string; isFree?: boolean;
}

const CATS = ['Tous', 'Prière', 'Prophétie', 'Sagesse', 'Guérison', 'Formation'];

// ── Téléchargement réel avec auth JWT ────────────────────────────────────────
async function downloadBook(bookId: string, title: string): Promise<string | null> {
  try {
    const { fileUrl } = await LibraryService.download(bookId);

    if (Platform.OS !== 'web') {
      await WebBrowser.openBrowserAsync(fileUrl);
      return null;
    }

    // Web : fetch avec JWT → blob → <a download>
    const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(fileUrl, { headers });
    if (!res.ok) throw new Error(`Erreur serveur ${res.status} — fichier introuvable`);

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    return null;
  } catch (e: any) {
    return e?.message ?? 'Téléchargement échoué';
  }
}

// ── Écran principal ───────────────────────────────────────────────────────────
export default function LibraryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [books, setBooks]               = useState<Book[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [cat, setCat]                   = useState('Tous');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  // IDs des livres achetés (chargés depuis le backend + mis à jour après achat)
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading]   = useState(false);
  const [paying, setPaying]             = useState(false);
  const [payError, setPayError]         = useState('');

  useEffect(() => {
    loadBooks();
    loadPurchased();
  }, []);

  async function loadBooks() {
    try {
      const raw = await http.get<any[]>('/library');
      const normalized: Book[] = (Array.isArray(raw) ? raw : []).map(b => ({
        id: b.id,
        title: b.title ?? 'Sans titre',
        author: b.author ?? 'Prophète Georges',
        category: b.category ?? 'Prière',
        coverUrl: b.coverUrl ?? LibraryService.getCoverUrl(b.coverImage) ?? undefined,
        price: b.price ?? b.amount ?? b.tokenCost ?? 500,
        pages: b.pages ?? 0,
        description: b.description,
        isFree: b.isFree ?? false,
      }));
      setBooks(normalized);
    } catch {
      setBooks(DEMO_BOOKS);
    }
    setLoading(false);
  }

  async function loadPurchased() {
    try {
      // Récupérer les livres déjà achetés par l'utilisateur
      const raw = await http.get<any>('/library/purchased');
      const ids: string[] = Array.isArray(raw)
        ? raw.map((b: any) => b.id ?? b.bookId)
        : Array.isArray(raw?.data) ? raw.data.map((b: any) => b.id ?? b.bookId)
        : [];
      setPurchasedIds(new Set(ids));
    } catch {
      // Silencieux — l'utilisateur devra acheter
    }
  }

  const isPurchased = (b: Book) => b.isFree || purchasedIds.has(b.id);

  // ── Acheter un livre via Paystack ─────────────────────────────────────────
  const handleBuyBook = async (b: Book) => {
    setPayError('');
    setPaying(true);
    try {
      // Initier le paiement Paystack pour ce livre spécifique
      const res = await http.post<any>('/library/purchase/initiate', {
        bookId: b.id,
        amount: b.price,
      });

      const payUrl: string = res?.authorization_url ?? res?.paymentUrl ?? res?.url ?? '';
      if (!payUrl) throw new Error('URL de paiement non reçue du serveur');

      // Sauvegarder le bookId pour le récupérer après retour Paystack
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem('pending_book_id', b.id);
        localStorage.setItem('pending_book_title', b.title);
        localStorage.setItem('pending_book_ref', res?.reference ?? '');
      }

      if (Platform.OS === 'web') {
        // Web : ouvrir dans le même onglet (Paystack redirige vers /library/callback)
        window.location.href = payUrl;
      } else {
        // Natif : WebBrowser
        const result = await WebBrowser.openAuthSessionAsync(payUrl, 'oracle-plus://library/callback');
        if (result.type === 'success') {
          // Vérifier le paiement
          const ref = res?.reference ?? '';
          if (ref) {
            await http.post('/library/purchase/verify', { reference: ref, bookId: b.id }).catch(() => null);
            setPurchasedIds(prev => new Set([...prev, b.id]));
          }
        }
      }
    } catch (e: any) {
      setPayError(e?.message ?? 'Erreur lors de l\'initiation du paiement');
    }
    setPaying(false);
  };

  // ── Télécharger ─────────────────────────────────────────────────────────────
  const handleDownload = async (b: Book) => {
    setDownloading(true);
    const err = await downloadBook(b.id, b.title);
    setDownloading(false);
    if (err) {
      setPayError(err);
    } else if (Platform.OS === 'web') {
      setSelectedBook(null);
    }
  };

  const filtered = books.filter(b =>
    (cat === 'Tous' || b.category === cat) &&
    (b.title.toLowerCase().includes(search.toLowerCase()) ||
     (b.author ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: '#0D0D2B', paddingTop: insets.top + 16 }]}>
        <Text style={s.headerTitle}>Bibliothèque Spirituelle</Text>
        <Text style={s.headerSub}>{books.length} livres disponibles</Text>
      </View>

      {/* Recherche */}
      <View style={[s.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppIcon icon={Search} size={16} color={colors.textTertiary} strokeWidth={2} />
        <TextInput
          value={search} onChangeText={setSearch}
          placeholder="Rechercher un livre..." placeholderTextColor={colors.textTertiary}
          style={[s.searchInput, { color: colors.text }]}
        />
      </View>

      {/* Catégories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}>
        {CATS.map(c => (
          <TouchableOpacity key={c} style={[s.catBtn, cat === c && s.catActive]} onPress={() => setCat(c)}>
            <Text style={[s.catTxt, { color: cat === c ? '#fff' : colors.textSecondary }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal détail livre */}
      <Modal visible={!!selectedBook} transparent animationType="slide" onRequestClose={() => { setSelectedBook(null); setPayError(''); }}>
        <View style={s.overlay}>
          <View style={[s.modalBox, { backgroundColor: colors.surface }]}>
            {selectedBook && (() => {
              const purchased = isPurchased(selectedBook);
              return (
                <>
                  <TouchableOpacity style={s.modalClose} onPress={() => { setSelectedBook(null); setPayError(''); }}>
                    <AppIcon icon={X} size={20} color={colors.textSecondary} strokeWidth={2.5} />
                  </TouchableOpacity>

                  {/* Couverture + titre */}
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ position: 'relative' }}>
                      <BookCover uri={selectedBook.coverUrl} title={selectedBook.title} size="modal" />
                      <View style={[s.lockOverlay, { backgroundColor: purchased ? '#10B981' : '#EF4444' }]}>
                        <AppIcon icon={purchased ? Unlock : Lock} size={14} color="#fff" strokeWidth={2.5} />
                      </View>
                    </View>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: colors.text, marginTop: 12, textAlign: 'center' }}>
                      {selectedBook.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                      {selectedBook.author}{selectedBook.pages ? ` · ${selectedBook.pages} pages` : ''}
                    </Text>
                  </View>

                  {/* Description */}
                  {selectedBook.description ? (
                    <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 14, textAlign: 'center' }}>
                      {selectedBook.description}
                    </Text>
                  ) : null}

                  {/* Erreur */}
                  {payError ? (
                    <View style={[s.errorBox, { backgroundColor: '#EF444418', borderColor: '#EF444440' }]}>
                      <Text style={{ color: '#EF4444', fontSize: 12, textAlign: 'center' }}>{payError}</Text>
                    </View>
                  ) : null}

                  {/* ── ACHETÉ : bouton télécharger ── */}
                  {purchased ? (
                    <View style={{ gap: 10 }}>
                      <View style={[s.badge, { backgroundColor: '#10B98118', borderColor: '#10B98140' }]}>
                        <AppIcon icon={CheckCircle2} size={14} color="#10B981" strokeWidth={2.5} />
                        <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 13 }}>
                          {selectedBook.isFree ? 'Livre gratuit' : 'Livre acheté'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleDownload(selectedBook)}
                        disabled={downloading}
                        activeOpacity={0.85}
                      >
                        {downloading
                          ? <ActivityIndicator color="#1A1A3E" />
                          : <>
                              <AppIcon icon={Download} size={18} color="#1A1A3E" strokeWidth={2.5} />
                              <Text style={[s.actionBtnTxt, { color: '#1A1A3E' }]}>Télécharger le PDF</Text>
                            </>
                        }
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* ── NON ACHETÉ : payer via Paystack ── */
                    <View style={{ gap: 10 }}>
                      {/* Prix */}
                      <View style={[s.priceBox, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}>
                        <Zap size={16} color={colors.primary} strokeWidth={2.5} />
                        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.primary }}>
                          {selectedBook.price.toLocaleString('fr-FR')} FCFA
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, flex: 1, textAlign: 'right' }}>
                          Achat unique
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleBuyBook(selectedBook)}
                        disabled={paying}
                        activeOpacity={0.85}
                      >
                        {paying
                          ? <ActivityIndicator color="#1A1A3E" />
                          : <>
                              <AppIcon icon={ShoppingCart} size={18} color="#1A1A3E" strokeWidth={2.5} />
                              <Text style={[s.actionBtnTxt, { color: '#1A1A3E' }]}>
                                Acheter ce livre — {selectedBook.price.toLocaleString('fr-FR')} FCFA
                              </Text>
                            </>
                        }
                      </TouchableOpacity>

                      <Text style={{ fontSize: 11, color: colors.textTertiary, textAlign: 'center', lineHeight: 16 }}>
                        🔒 Paiement sécurisé via Paystack · Accès permanent après achat
                      </Text>
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Liste des livres */}
      {loading ? (
        <ActivityIndicator color="#C9A84C" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={b => b.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item: b }) => {
            const purchased = isPurchased(b);
            return (
              <TouchableOpacity
                style={[s.card, { backgroundColor: colors.surface, borderColor: purchased ? colors.primary + '50' : colors.border }]}
                onPress={() => { setPayError(''); setSelectedBook(b); }}
                activeOpacity={0.85}
              >
                <View style={s.coverWrap}>
                  <BookCover uri={b.coverUrl} title={b.title} />
                  <View style={[s.lockBadge, { backgroundColor: purchased ? '#10B981CC' : 'rgba(0,0,0,0.75)' }]}>
                    <AppIcon icon={purchased ? Unlock : Lock} size={10} color="#fff" strokeWidth={2.5} />
                    <Text style={s.lockTxt}>
                      {purchased ? (b.isFree ? 'Gratuit' : 'Acheté') : `${b.price.toLocaleString('fr-FR')} F`}
                    </Text>
                  </View>
                </View>
                <Text style={[s.bookTitle, { color: colors.text }]} numberOfLines={2}>{b.title}</Text>
                <Text style={[s.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{b.author}</Text>
                <TouchableOpacity
                  style={[s.dlBtn, {
                    backgroundColor: purchased ? colors.primary : colors.primary + '18',
                    borderColor: purchased ? colors.primary : colors.primary + '35',
                  }]}
                  onPress={() => { setPayError(''); setSelectedBook(b); }}
                  activeOpacity={0.8}
                >
                  <AppIcon icon={purchased ? Download : ShoppingCart} size={12} color={purchased ? '#1A1A3E' : '#C9A84C'} strokeWidth={2.5} />
                  <Text style={[s.dlTxt, { color: purchased ? '#1A1A3E' : '#C9A84C' }]}>
                    {purchased ? 'Télécharger' : 'Acheter'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const DEMO_BOOKS: Book[] = [
  { id: '1', title: 'Prières de Percée',        author: 'Prophète Georges', category: 'Prière',    price: 2000, pages: 120 },
  { id: '2', title: 'Les Secrets Prophétiques',  author: 'Prophète Georges', category: 'Prophétie', price: 3000, pages: 200 },
  { id: '3', title: 'Sagesse Africaine',         author: 'Prophète Georges', category: 'Sagesse',   price: 1500, pages: 90  },
  { id: '4', title: 'Guérison Divine',           author: 'Prophète Georges', category: 'Guérison',  price: 2500, pages: 160 },
];

const s = StyleSheet.create({
  header:      { padding: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  catBtn:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(156,163,175,0.1)' },
  catActive:   { backgroundColor: '#C9A84C' },
  catTxt:      { fontSize: 13, fontWeight: '700' },
  card:        { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, gap: 8 },
  coverWrap:   { width: '100%', height: COVER_HEIGHT, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 4 },
  lockBadge:   { position: 'absolute', bottom: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  lockTxt:     { fontSize: 10, fontWeight: '700', color: '#fff' },
  bookTitle:   { fontSize: 13, fontWeight: '800', lineHeight: 18 },
  bookAuthor:  { fontSize: 11 },
  dlBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 8, borderWidth: 1, paddingVertical: 7, marginTop: 2 },
  dlTxt:       { fontSize: 10, fontWeight: '700' },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalBox:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalClose:  { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  lockOverlay: { position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  priceBox:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, justifyContent: 'center' },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 15 },
  actionBtnTxt:{ fontSize: 15, fontWeight: '800' },
  errorBox:    { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 4 },
});
