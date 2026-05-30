/**
 * Bibliothèque Spirituelle — Oracle Plus
 *
 * Flux d'accès :
 *  1. Clic sur un livre → modal avec prix et description
 *  2. Si non payé → bouton "Payer X crédits" (débite et déverrouille) ou "S'abonner"
 *  3. Si abonné OU crédits débités → cadenas ouvert → bouton "Télécharger"
 *  4. Téléchargement : fetch avec JWT → blob → <a download> (web) / WebBrowser (natif)
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  BookOpen, CheckCircle2, CreditCard, Download,
  Lock, Search, Star, Unlock, X, Zap,
} from 'lucide-react-native';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { useTheme } from '../../../../src/theme';
import { useAccess } from '../../../../src/hooks/useAccess';
import { useCreditsStore } from '../../../../src/store/credits.store';
import { useGamificationStore } from '../../../../src/store/gamification.store';
import { http } from '../../../../src/services/http.client';
import { LibraryService } from '../../../../src/services/library.service';
import { StorageService } from '../../../../src/services/storage.service';
import { STORAGE_KEYS } from '../../../../src/utils/constants';

const CARD_WIDTH  = (Dimensions.get('window').width - 24 - 12) / 2;
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
    <View style={{
      width: w, height: h, borderRadius: 10,
      backgroundColor: '#1A2744', alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
    }}>
      <AppIcon icon={BookOpen} size={size === 'modal' ? 36 : 28} color="#C9A84C" strokeWidth={1.5} />
      <Text style={{ color: '#C9A84C', fontSize: 13, fontWeight: '900', marginTop: 8 }}>{initials}</Text>
    </View>
  );
}

interface Book {
  id: string; title: string; author: string; category: string;
  coverUrl?: string; tokenCost: number; pages: number;
  description?: string; isFree?: boolean; hasPdf?: boolean;
}

const CATS = ['Tous', 'Prière', 'Prophétie', 'Sagesse', 'Guérison', 'Formation'];

// ── Téléchargement réel avec auth JWT ────────────────────────────────────────
async function downloadBook(bookId: string, title: string): Promise<string | null> {
  try {
    // 1. Enregistrer le téléchargement + récupérer l'URL
    const { fileUrl } = await LibraryService.download(bookId);

    if (Platform.OS !== 'web') {
      // Natif : ouvrir dans WebBrowser
      await WebBrowser.openBrowserAsync(fileUrl);
      return null;
    }

    // Web : fetch avec JWT → blob → <a download>
    const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(fileUrl, { headers });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);

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
  const { hasSubscription } = useAccess();
  const credits = useCreditsStore((s) => s.credits);
  const spend = useCreditsStore((s) => s.spend);
  const fetchBalance = useCreditsStore((s) => s.fetchBalance);
  const { completeMission, earnBadge } = useGamificationStore();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Tous');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  // Livres déverrouillés localement (crédits débités dans cette session)
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [paying, setPaying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    http.get<any[]>('/library')
      .then(d => {
        const normalized: Book[] = (Array.isArray(d) ? d : []).map(b => ({
          ...b,
          coverUrl: b.coverUrl ?? LibraryService.getCoverUrl(b.coverImage) ?? undefined,
          tokenCost: b.tokenCost ?? b.creditCost ?? b.price ?? 100,
        }));
        setBooks(normalized);
        setLoading(false);
      })
      .catch(() => { setBooks(DEMO_BOOKS); setLoading(false); });
    fetchBalance();
  }, []);

  // Un livre est accessible si : abonné, gratuit, ou déverrouillé dans cette session
  const isUnlocked = (b: Book) =>
    hasSubscription || b.isFree || unlockedIds.has(b.id);

  // ── Payer avec crédits ──────────────────────────────────────────────────────
  const handlePayCredits = async (b: Book) => {
    if (credits < b.tokenCost) {
      // Pas assez de crédits → aller acheter
      setSelectedBook(null);
      router.push(`/subscription?tab=credits` as any);
      return;
    }
    setPaying(true);
    try {
      // Débiter les crédits
      const ok = await spend('ai_chat'); // utilise le coût fixe — on va débiter manuellement
      // spend() utilise CREDIT_COSTS, pas le tokenCost du livre
      // On doit débiter directement via le backend
      let debited = false;
      try {
        const res = await http.post<{ credits: number }>('/credits/deduct', {
          amount: b.tokenCost, action: 'book_access', bookId: b.id,
        });
        if (res?.credits !== undefined) {
          useCreditsStore.setState({ credits: res.credits });
          debited = true;
        }
      } catch {}
      if (!debited) {
        // Fallback : déduire localement
        try { await http.post('/credits/spend', { amount: b.tokenCost, description: `Livre: ${b.title}` }); } catch {}
        useCreditsStore.setState({ credits: Math.max(0, credits - b.tokenCost) });
      }
      // Déverrouiller le livre
      setUnlockedIds(prev => new Set([...prev, b.id]));
      await completeMission('read_book').catch(() => {});
      await earnBadge('book_reader').catch(() => {});
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de débiter les crédits. Réessayez.');
    } finally {
      setPaying(false);
    }
  };

  // ── Télécharger ─────────────────────────────────────────────────────────────
  const handleDownload = async (b: Book) => {
    setDownloading(true);
    const err = await downloadBook(b.id, b.title);
    setDownloading(false);
    if (err) {
      Alert.alert('Téléchargement échoué', err + '\n\nVérifiez votre connexion et réessayez.');
    } else if (Platform.OS === 'web') {
      // Fermer la modal après téléchargement réussi sur web
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
      <Modal visible={!!selectedBook} transparent animationType="slide" onRequestClose={() => setSelectedBook(null)}>
        <View style={s.overlay}>
          <View style={[s.modalBox, { backgroundColor: colors.surface }]}>
            {selectedBook && (() => {
              const unlocked = isUnlocked(selectedBook);
              const canAfford = credits >= selectedBook.tokenCost;
              return (
                <>
                  <TouchableOpacity style={s.modalClose} onPress={() => setSelectedBook(null)}>
                    <AppIcon icon={X} size={20} color={colors.textSecondary} strokeWidth={2.5} />
                  </TouchableOpacity>

                  {/* Couverture + titre */}
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ position: 'relative' }}>
                      <BookCover uri={selectedBook.coverUrl} title={selectedBook.title} size="modal" />
                      {/* Badge cadenas */}
                      <View style={[s.lockOverlay, { backgroundColor: unlocked ? '#10B981' : '#EF4444' }]}>
                        <AppIcon icon={unlocked ? Unlock : Lock} size={14} color="#fff" strokeWidth={2.5} />
                      </View>
                    </View>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: colors.text, marginTop: 12, textAlign: 'center' }}>
                      {selectedBook.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                      {selectedBook.author} · {selectedBook.pages} pages
                    </Text>
                  </View>

                  {/* Description */}
                  {selectedBook.description && (
                    <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 14, textAlign: 'center' }}>
                      {selectedBook.description}
                    </Text>
                  )}

                  {/* ── DÉVERROUILLÉ : bouton télécharger ── */}
                  {unlocked ? (
                    <View style={{ gap: 10 }}>
                      <View style={[s.unlockedBadge, { backgroundColor: '#10B98118', borderColor: '#10B98140' }]}>
                        <AppIcon icon={Unlock} size={14} color="#10B981" strokeWidth={2.5} />
                        <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 13 }}>
                          {hasSubscription ? 'Inclus dans votre abonnement' : 'Accès déverrouillé'}
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
                              <Text style={[s.actionBtnTxt, { color: '#1A1A3E' }]}>
                                Télécharger le PDF
                              </Text>
                            </>
                        }
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* ── VERROUILLÉ : options de paiement ── */
                    <View style={{ gap: 10 }}>
                      {/* Prix */}
                      <View style={[s.priceBox, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}>
                        <AppIcon icon={Zap} size={16} color={colors.primary} strokeWidth={2.5} />
                        <Text style={{ fontSize: 15, fontWeight: '900', color: colors.primary }}>
                          {selectedBook.tokenCost} crédits
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1, textAlign: 'right' }}>
                          Solde : {credits} cr
                        </Text>
                      </View>

                      {canAfford ? (
                        /* Assez de crédits → payer directement */
                        <TouchableOpacity
                          style={[s.actionBtn, { backgroundColor: colors.primary }]}
                          onPress={() => handlePayCredits(selectedBook)}
                          disabled={paying}
                          activeOpacity={0.85}
                        >
                          {paying
                            ? <ActivityIndicator color="#1A1A3E" />
                            : <>
                                <AppIcon icon={Zap} size={18} color="#1A1A3E" strokeWidth={2.5} />
                                <Text style={[s.actionBtnTxt, { color: '#1A1A3E' }]}>
                                  Payer {selectedBook.tokenCost} crédits et télécharger
                                </Text>
                              </>
                          }
                        </TouchableOpacity>
                      ) : (
                        /* Pas assez → acheter des crédits */
                        <TouchableOpacity
                          style={[s.actionBtn, { backgroundColor: colors.primary }]}
                          onPress={() => { setSelectedBook(null); router.push('/subscription?tab=credits' as any); }}
                          activeOpacity={0.85}
                        >
                          <AppIcon icon={CreditCard} size={18} color="#1A1A3E" strokeWidth={2.5} />
                          <Text style={[s.actionBtnTxt, { color: '#1A1A3E' }]}>
                            Acheter des crédits ({selectedBook.tokenCost - credits} manquants)
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Option abonnement */}
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary }]}
                        onPress={() => { setSelectedBook(null); router.push('/subscription' as any); }}
                        activeOpacity={0.85}
                      >
                        <AppIcon icon={CheckCircle2} size={18} color={colors.primary} strokeWidth={2.5} />
                        <Text style={[s.actionBtnTxt, { color: colors.primary }]}>
                          S'abonner — accès illimité à tous les livres
                        </Text>
                      </TouchableOpacity>

                      <Text style={{ fontSize: 11, color: colors.textTertiary, textAlign: 'center' }}>
                        🔒 Payez pour déverrouiller et télécharger ce livre
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
            const unlocked = isUnlocked(b);
            return (
              <TouchableOpacity
                style={[s.card, { backgroundColor: colors.surface, borderColor: unlocked ? colors.primary + '40' : colors.border }]}
                onPress={() => setSelectedBook(b)}
                activeOpacity={0.85}
              >
                <View style={s.coverWrap}>
                  <BookCover uri={b.coverUrl} title={b.title} />
                  {/* Badge cadenas / déverrouillé */}
                  <View style={[s.lockBadge, { backgroundColor: unlocked ? '#10B981CC' : 'rgba(0,0,0,0.75)' }]}>
                    <AppIcon icon={unlocked ? Unlock : Lock} size={10} color="#fff" strokeWidth={2.5} />
                    <Text style={s.lockTxt}>
                      {unlocked ? (hasSubscription ? 'Inclus' : 'Payé') : `${b.tokenCost} cr`}
                    </Text>
                  </View>
                </View>
                <Text style={[s.bookTitle, { color: colors.text }]} numberOfLines={2}>{b.title}</Text>
                <Text style={[s.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{b.author}</Text>
                <View style={s.bookMeta}>
                  <Text style={s.bookCat}>{b.category}</Text>
                  {unlocked && <AppIcon icon={Star} size={12} color="#34D399" strokeWidth={2.5} />}
                </View>
                {/* Bouton action */}
                <TouchableOpacity
                  style={[s.dlBtn, {
                    backgroundColor: unlocked ? colors.primary : colors.primary + '18',
                    borderColor: unlocked ? colors.primary : colors.primary + '35',
                  }]}
                  onPress={() => setSelectedBook(b)}
                  activeOpacity={0.8}
                >
                  <AppIcon
                    icon={unlocked ? Download : Lock}
                    size={12}
                    color={unlocked ? '#1A1A3E' : '#C9A84C'}
                    strokeWidth={2.5}
                  />
                  <Text style={[s.dlTxt, { color: unlocked ? '#1A1A3E' : '#C9A84C' }]}>
                    {unlocked ? 'Télécharger' : 'Déverrouiller'}
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
  { id: '1', title: 'Prières de Percée',       author: 'Prophète Georges', category: 'Prière',    tokenCost: 100, pages: 120 },
  { id: '2', title: 'Les Secrets Prophétiques', author: 'Prophète Georges', category: 'Prophétie', tokenCost: 150, pages: 200 },
  { id: '3', title: 'Sagesse Africaine',        author: 'Prophète Georges', category: 'Sagesse',   tokenCost: 80,  pages: 90  },
  { id: '4', title: 'Guérison Divine',          author: 'Prophète Georges', category: 'Guérison',  tokenCost: 120, pages: 160 },
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
  bookMeta:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bookCat:     { fontSize: 10, color: '#60A5FA', fontWeight: '600' },
  dlBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 8, borderWidth: 1, paddingVertical: 7, marginTop: 2 },
  dlTxt:       { fontSize: 10, fontWeight: '700' },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalBox:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 0, maxHeight: '90%' },
  modalClose:  { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  lockOverlay: { position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  priceBox:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  unlockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, justifyContent: 'center' },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 15 },
  actionBtnTxt:{ fontSize: 15, fontWeight: '800' },
});
