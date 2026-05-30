/**
 * Bibliothèque Spirituelle — Oracle Plus
 *
 * Flux d'accès :
 *  1. Clic sur un livre → modal détail
 *  2. Si canRead/isFree → bouton "Télécharger le PDF"
 *  3. Sinon → rediriger vers l'abonnement (accès via abonnement actif)
 *  4. Téléchargement : fileUrl retournée par le backend (avec JWT si nécessaire)
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Dimensions, FlatList, Image, Modal,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  BookOpen, CheckCircle2, Lock, Search,
  Unlock, X, Zap,
} from 'lucide-react-native';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { useTheme } from '../../../../src/theme';
import { useAuthStore } from '../../../../src/store/auth.store';
import { http } from '../../../../src/services/http.client';
import { LibraryService } from '../../../../src/services/library.service';

import { useAccess } from '../../../../src/hooks/useAccess';

const CARD_WIDTH   = (Dimensions.get('window').width - 24 - 12) / 2;
const COVER_HEIGHT = Math.round(CARD_WIDTH * 1.414);

// ── Couverture livre ──────────────────────────────────────────────────────────
function BookCover({ uri, title, size = 'card' }: { uri?: string; title: string; size?: 'card' | 'modal' }) {
  const [err, setErr] = useState(false);
  // En mode carte : prend tout le coverWrap (width/height 100%)
  // En mode modal : taille fixe
  const modalStyle = { width: 120, height: 170, borderRadius: 10 } as const;
  const cardStyle  = { width: '100%' as const, height: '100%' as const, borderRadius: 10 };

  if (uri && !err) {
    return (
      <Image
        source={{ uri }}
        style={size === 'modal' ? modalStyle : cardStyle}
        resizeMode="cover"
        onError={() => setErr(true)}
      />
    );
  }
  // Fallback : fond sombre avec initiales
  const initials = title.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  return (
    <View style={[
      size === 'modal' ? modalStyle : cardStyle,
      { backgroundColor: '#1A2744', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)' }
    ]}>
      <AppIcon icon={BookOpen} size={size === 'modal' ? 36 : 28} color="#C9A84C" strokeWidth={1.5} />
      <Text style={{ color: '#C9A84C', fontSize: 13, fontWeight: '900', marginTop: 8 }}>{initials}</Text>
    </View>
  );
}

interface Book {
  id: string; title: string; author: string; category: string;
  coverUrl?: string; price: number; pages: number;
  description?: string; isFree?: boolean;
  canRead?: boolean; fileUrl?: string;
}

const CATS = ['Tous', 'Prière', 'Prophétie', 'Sagesse', 'Guérison', 'Formation'];



// ── Écran principal ───────────────────────────────────────────────────────────
export default function LibraryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { hasSubscription } = useAccess();

  const [books, setBooks]               = useState<Book[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [cat, setCat]                   = useState('Tous');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [payError, setPayError] = useState('');

  useEffect(() => { loadBooks(); }, []);

  async function loadBooks() {
    try {
      // Le backend retourne canRead=true si l'utilisateur a accès (abonnement actif)
      const raw = await LibraryService.getAll();
      const normalized: Book[] = raw.map(b => {
        // Résoudre la couverture : coverUrl > coverImage absolu > coverImage relatif préfixé
        const rawCover = (b as any).coverUrl ?? b.coverImage ?? null;
        const coverUrl = rawCover
          ? (rawCover.startsWith('http') ? rawCover : `${LibraryService.getCoverUrl(rawCover) ?? ''}`)
          : undefined;
        return {
          id: b.id,
          title: b.title ?? 'Sans titre',
          author: b.author ?? 'Prophète Georges',
          category: b.category ?? 'Prière',
          coverUrl: coverUrl || undefined,
          price: 0,
          pages: b.pages ?? 0,
          description: b.description,
          isFree: b.isFree ?? false,
          canRead: b.canRead ?? b.isFree ?? false,
          fileUrl: b.fileUrl ?? undefined,
        };
      });
      setBooks(normalized.length > 0 ? normalized : DEMO_BOOKS);
    } catch {
      setBooks(DEMO_BOOKS);
    }
    setLoading(false);
  }

  // Un livre est accessible si : gratuit, abonnement actif, ou canRead=true (backend)
  const isAccessible = (b: Book) => b.isFree || b.canRead || hasSubscription;

  // ── Accès refusé → rediriger vers abonnement ──────────────────────────────
  const handleRequestAccess = () => {
    setSelectedBook(null);
    router.push('/subscription' as any);
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
              const accessible = isAccessible(selectedBook);
              return (
                <>
                  <TouchableOpacity style={s.modalClose} onPress={() => { setSelectedBook(null); setPayError(''); }}>
                    <AppIcon icon={X} size={20} color={colors.textSecondary} strokeWidth={2.5} />
                  </TouchableOpacity>

                  {/* Couverture + titre */}
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ position: 'relative' }}>
                      <BookCover uri={selectedBook.coverUrl} title={selectedBook.title} size="modal" />
                      <View style={[s.lockOverlay, { backgroundColor: accessible ? '#10B981' : '#EF4444' }]}>
                        <AppIcon icon={accessible ? Unlock : Lock} size={14} color="#fff" strokeWidth={2.5} />
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

                  {/* ── ACCESSIBLE : bouton télécharger ── */}
                  {accessible ? (
                    <View style={{ gap: 10 }}>
                      <View style={[s.badge, { backgroundColor: '#10B98118', borderColor: '#10B98140' }]}>
                        <AppIcon icon={CheckCircle2} size={14} color="#10B981" strokeWidth={2.5} />
                        <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 13 }}>
                          {selectedBook.isFree ? 'Livre gratuit' : 'Inclus dans votre abonnement'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          setSelectedBook(null);
                          router.push({ pathname: '/library/reader', params: { id: selectedBook.id, title: selectedBook.title } } as any);
                        }}
                        activeOpacity={0.85}
                      >
                        <AppIcon icon={BookOpen} size={18} color="#1A1A3E" strokeWidth={2.5} />
                        <Text style={[s.actionBtnTxt, { color: '#1A1A3E' }]}>Lire dans l'application</Text>
                      </TouchableOpacity>


                    </View>
                  ) : (
                    /* ── ACCÈS RESTREINT : abonnement requis ── */
                    <View style={{ gap: 10 }}>
                      <View style={[s.priceBox, { backgroundColor: '#EF444412', borderColor: '#EF444435' }]}>
                        <AppIcon icon={Lock} size={16} color="#EF4444" strokeWidth={2.5} />
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444', flex: 1 }}>
                          Abonnement requis pour accéder à ce livre
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: colors.primary }]}
                        onPress={handleRequestAccess}
                        activeOpacity={0.85}
                      >
                        <AppIcon icon={Zap} size={18} color="#1A1A3E" strokeWidth={2.5} />
                        <Text style={[s.actionBtnTxt, { color: '#1A1A3E' }]}>
                          Voir les offres d'abonnement
                        </Text>
                      </TouchableOpacity>

                      <Text style={{ fontSize: 11, color: colors.textTertiary, textAlign: 'center', lineHeight: 16 }}>
                        Accès à toute la bibliothèque inclus dans l'abonnement
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
            const accessible = isAccessible(b);
            return (
              <TouchableOpacity
                style={[s.card, { backgroundColor: colors.surface, borderColor: accessible ? colors.primary + '50' : colors.border }]}
                onPress={() => { setPayError(''); setSelectedBook(b); }}
                activeOpacity={0.85}
              >
                <View style={s.coverWrap}>
                  <BookCover uri={b.coverUrl} title={b.title} />
                  {/* Overlay cadenas — toujours visible par-dessus la couverture */}
                  {!accessible && (
                    <View style={s.lockOverlayCard}>
                      <AppIcon icon={Lock} size={22} color="#fff" strokeWidth={2.2} />
                    </View>
                  )}
                  <View style={[s.lockBadge, { backgroundColor: accessible ? '#10B981DD' : 'rgba(30,10,60,0.85)' }]}>
                    <AppIcon icon={accessible ? Unlock : Lock} size={10} color="#fff" strokeWidth={2.5} />
                    <Text style={s.lockTxt}>
                      {accessible ? (b.isFree ? 'Gratuit' : 'Inclus') : 'Abonner'}
                    </Text>
                  </View>
                </View>
                <Text style={[s.bookTitle, { color: colors.text }]} numberOfLines={2}>{b.title}</Text>
                <Text style={[s.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{b.author}</Text>
                <TouchableOpacity
                  style={[s.dlBtn, {
                    backgroundColor: accessible ? colors.primary : colors.primary + '18',
                    borderColor: accessible ? colors.primary : colors.primary + '35',
                  }]}
                  onPress={() => { setPayError(''); setSelectedBook(b); }}
                  activeOpacity={0.8}
                >
                  <AppIcon icon={accessible ? BookOpen : Lock} size={12} color={accessible ? '#1A1A3E' : '#C9A84C'} strokeWidth={2.5} />
                  <Text style={[s.dlTxt, { color: accessible ? '#1A1A3E' : '#C9A84C' }]}>
                    {accessible ? 'Lire' : "S'abonner"}
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
  coverWrap:       { width: '100%', height: COVER_HEIGHT, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 4, borderRadius: 10, overflow: 'hidden' },
  lockOverlayCard: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,5,30,0.45)', alignItems: 'center', justifyContent: 'center' },
  lockBadge:       { position: 'absolute', bottom: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
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
  iosTip:      { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6, marginTop: 4 },
});
