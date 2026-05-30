import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BookOpen, CheckCircle2, CreditCard, Download, Lock, Search, Star, X, Zap } from 'lucide-react-native';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { useTheme } from '../../../../src/theme';
import { useAccess } from '../../../../src/hooks/useAccess';
import { useCreditsStore } from '../../../../src/store/credits.store';
import { useGamificationStore } from '../../../../src/store/gamification.store';
import { http } from '../../../../src/services/http.client';
import { LibraryService } from '../../../../src/services/library.service';

// Largeur de carte = (écran - padding*2 - gap) / 2
const CARD_WIDTH  = (Dimensions.get('window').width - 24 - 12) / 2;
// Hauteur couverture = ratio livre A4 (1:1.414)
const COVER_HEIGHT = Math.round(CARD_WIDTH * 1.414);

function BookCover({ uri, title }: { uri?: string; title: string }) {
  const [error, setError] = React.useState(false);
  if (uri && !error) {
    return (
      <Image
        source={{ uri }}
        style={{ width: CARD_WIDTH - 24, height: COVER_HEIGHT, borderRadius: 10 }}
        resizeMode="cover"
        onError={() => setError(true)}
      />
    );
  }
  // Fallback : initiales du titre sur fond dégradé
  const initials = title.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  return (
    <View style={{
      width: CARD_WIDTH - 24, height: COVER_HEIGHT, borderRadius: 10,
      backgroundColor: '#1A2744', alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
    }}>
      <AppIcon icon={BookOpen} size={28} color="#C9A84C" strokeWidth={1.5} />
      <Text style={{ color: '#C9A84C', fontSize: 13, fontWeight: '900', marginTop: 8, letterSpacing: 1 }}>
        {initials}
      </Text>
    </View>
  );
}

interface Book { id: string; title: string; author: string; category: string; coverUrl?: string; tokenCost: number; pages: number; description?: string; }

const CATS = ['Tous','Prière','Prophétie','Sagesse','Guérison','Formation'];

export default function LibraryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { hasSubscription, credits } = useAccess();
  const { spend } = useCreditsStore();
  const { completeMission, earnBadge } = useGamificationStore();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Tous');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    http.get<Book[]>('/library').then(d => { setBooks(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => { setBooks(DEMO_BOOKS); setLoading(false); });
  }, []);

  // Ouvre la modal d'explication au clic sur un livre
  const handleBookPress = (b: Book) => setSelectedBook(b);

  // Lecture directe (abonné ou crédits suffisants)
  const openReader = async (b: Book) => {
    setSelectedBook(null);
    if (!hasSubscription) await spend('audio_preview');
    await completeMission('read_book');
    await earnBadge('book_reader');
    router.push({ pathname: '/library/reader', params: { id: b.id, title: b.title } } as any);
  };

  // Paiement par crédits → redirection vers pack crédits
  const handlePayWithCredits = (b: Book) => {
    setSelectedBook(null);
    router.push(`/subscription?tab=credits&book=${b.id}&cost=${b.tokenCost}` as any);
  };

  // Paiement direct (abonnement)
  const handleSubscribe = () => {
    setSelectedBook(null);
    router.push('/subscription?tab=subscription' as any);
  };

  const handleDownload = async (b: Book) => {
    if (!hasSubscription && credits < b.tokenCost) { setSelectedBook(b); return; }
    setDownloading(b.id);
    await LibraryService.download(b.id);
    setDownloading(null);
    await completeMission('read_book');
    await earnBadge('book_reader');
    router.push({ pathname: '/library/reader', params: { id: b.id, title: b.title } } as any);
  };

  const filtered = books.filter(b => (cat === 'Tous' || b.category === cat) && (b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase())));

  return (
    <View style={{ flex:1, backgroundColor: colors.background }}>
      <View style={[s.header, { backgroundColor: '#0D0D2B', paddingTop: insets.top + 16 }]}>
        <Text style={s.headerTitle}>Bibliothèque Spirituelle</Text>
        <Text style={s.headerSub}>{books.length} livres disponibles</Text>
      </View>
      <View style={[s.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppIcon icon={Search} size={16} color={colors.textTertiary} strokeWidth={2} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher un livre..." placeholderTextColor={colors.textTertiary} style={[s.searchInput, { color: colors.text }]} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:16, gap:8, paddingVertical:8 }}>
        {CATS.map(c => (
          <TouchableOpacity key={c} style={[s.catBtn, cat === c && s.catActive]} onPress={() => setCat(c)}>
            <Text style={[s.catTxt, { color: cat === c ? '#fff' : colors.textSecondary }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Modal détail livre */}
      <Modal visible={!!selectedBook} transparent animationType="slide" onRequestClose={() => setSelectedBook(null)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: colors.surface }]}>
            {selectedBook && (
              <>
                <TouchableOpacity style={s.modalClose} onPress={() => setSelectedBook(null)}>
                  <AppIcon icon={X} size={20} color={colors.textSecondary} strokeWidth={2.5} />
                </TouchableOpacity>

                {/* Couverture + titre */}
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <BookCover uri={selectedBook.coverUrl} title={selectedBook.title} />
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text, marginTop: 12, textAlign: 'center' }}>
                    {selectedBook.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    {selectedBook.author} · {selectedBook.pages} pages
                  </Text>
                </View>

                {/* Prix en crédits */}
                <View style={[s.priceBox, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}>
                  <AppIcon icon={Zap} size={16} color={colors.primary} strokeWidth={2.5} />
                  <Text style={{ fontSize: 15, fontWeight: '900', color: colors.primary }}>
                    {selectedBook.tokenCost} crédits
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1, textAlign: 'right' }}>
                    ≈ {Math.round(selectedBook.tokenCost * 0.25)} FCFA
                  </Text>
                </View>

                {/* Explication */}
                <View style={{ gap: 8, marginBottom: 16 }}>
                  {[
                    hasSubscription
                      ? '✅ Abonné — accès gratuit inclus dans votre abonnement'
                      : `💳 Coût : ${selectedBook.tokenCost} crédits débités de votre solde (${credits} disponibles)`,
                    '📖 Accès immédiat au lecteur PDF intégré',
                    '⬇️ Téléchargement disponible après paiement',
                    '🔒 Contenu sécurisé — accès personnel uniquement',
                  ].map((line, i) => (
                    <Text key={i} style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>{line}</Text>
                  ))}
                </View>

                {/* Boutons d'action */}
                {hasSubscription ? (
                  <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary }]} onPress={() => openReader(selectedBook)}>
                    <AppIcon icon={BookOpen} size={16} color="#fff" strokeWidth={2.5} />
                    <Text style={s.modalBtnTxt}>Lire maintenant — Inclus</Text>
                  </TouchableOpacity>
                ) : credits >= selectedBook.tokenCost ? (
                  <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary }]} onPress={() => openReader(selectedBook)}>
                    <AppIcon icon={Zap} size={16} color="#fff" strokeWidth={2.5} />
                    <Text style={s.modalBtnTxt}>Payer {selectedBook.tokenCost} crédits et lire</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary }]} onPress={() => handlePayWithCredits(selectedBook)}>
                      <AppIcon icon={CreditCard} size={16} color="#1A1A3E" strokeWidth={2.5} />
                      <Text style={[s.modalBtnTxt, { color: '#1A1A3E' }]}>Acheter des crédits</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary, marginTop: 8 }]} onPress={handleSubscribe}>
                      <AppIcon icon={CheckCircle2} size={16} color={colors.primary} strokeWidth={2.5} />
                      <Text style={[s.modalBtnTxt, { color: colors.primary }]}>S'abonner — accès illimité</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 11, color: colors.textTertiary, textAlign: 'center', marginTop: 8 }}>
                      Crédits insuffisants · Solde actuel : {credits} cr · Requis : {selectedBook.tokenCost} cr
                    </Text>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {loading ? <ActivityIndicator color="#C9A84C" style={{ marginTop:40 }} /> : (
        <FlatList data={filtered} keyExtractor={b => b.id} numColumns={2} contentContainerStyle={{ padding:12, gap:12 }} columnWrapperStyle={{ gap:12 }}
          renderItem={({ item: b }) => (
            <TouchableOpacity style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => handleBookPress(b)} activeOpacity={0.85}>
              <View style={s.cover}>
                <BookCover uri={b.coverUrl} title={b.title} />
                {!hasSubscription && <View style={s.lockBadge}><AppIcon icon={Lock} size={10} color="#fff" strokeWidth={2.5} /><Text style={s.lockTxt}>{b.tokenCost} cr</Text></View>}
              </View>
              <Text style={[s.bookTitle, { color: colors.text }]} numberOfLines={2}>{b.title}</Text>
              <Text style={[s.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{b.author}</Text>
              <View style={s.bookMeta}>
                <Text style={s.bookCat}>{b.category}</Text>
                {hasSubscription && <View style={s.freeBadge}><AppIcon icon={Star} size={10} color="#34D399" strokeWidth={2.5} /><Text style={s.freeTxt}>Inclus</Text></View>}
              </View>
              {/* Bouton Télécharger */}
              <TouchableOpacity
                style={[s.dlBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}
                onPress={() => handleDownload(b)}
                activeOpacity={0.8}
              >
                {downloading === b.id
                  ? <ActivityIndicator size="small" color="#C9A84C" />
                  : <>
                      <AppIcon icon={Download} size={12} color="#C9A84C" strokeWidth={2.5} />
                      <Text style={s.dlTxt}>Télécharger</Text>
                    </>
                }
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const DEMO_BOOKS: Book[] = [
  { id:'1', title:'Prières de Percée', author:'Prophète Georges', category:'Prière', tokenCost:100, pages:120 },
  { id:'2', title:'Les Secrets Prophétiques', author:'Prophète Georges', category:'Prophétie', tokenCost:150, pages:200 },
  { id:'3', title:'Sagesse Africaine', author:'Prophète Georges', category:'Sagesse', tokenCost:80, pages:90 },
  { id:'4', title:'Guérison Divine', author:'Prophète Georges', category:'Guérison', tokenCost:120, pages:160 },
];

const s = StyleSheet.create({
  header:{ padding:20, paddingBottom:20 },
  headerTitle:{ fontSize:22, fontWeight:'900', color:'#fff' },
  headerSub:{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:4 },
  searchWrap:{ flexDirection:'row', alignItems:'center', gap:10, margin:16, borderRadius:14, borderWidth:1, paddingHorizontal:14, paddingVertical:10 },
  searchInput:{ flex:1, fontSize:14 },
  catBtn:{ paddingHorizontal:16, paddingVertical:8, borderRadius:20, backgroundColor:'rgba(156,163,175,0.1)' },
  catActive:{ backgroundColor:'#C9A84C' },
  catTxt:{ fontSize:13, fontWeight:'700' },
  card:{ flex:1, borderRadius:16, borderWidth:1, padding:12, gap:8 },
  cover:{ width:'100%', height: COVER_HEIGHT, alignItems:'center', justifyContent:'center', position:'relative', marginBottom: 4 },
  lockBadge:{ position:'absolute', bottom:6, right:6, flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'rgba(0,0,0,0.7)', borderRadius:8, paddingHorizontal:6, paddingVertical:3 },
  lockTxt:{ fontSize:10, fontWeight:'700', color:'#C9A84C' },
  bookTitle:{ fontSize:13, fontWeight:'800', lineHeight:18 },
  bookAuthor:{ fontSize:11 },
  bookMeta:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  bookCat:{ fontSize:10, color:'#60A5FA', fontWeight:'600' },
  freeBadge:{ flexDirection:'row', alignItems:'center', gap:3 },
  freeTxt:{ fontSize:10, color:'#34D399', fontWeight:'700' },
  dlBtn:        { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, borderRadius:8, borderWidth:1, paddingVertical:6, marginTop:2 },
  dlTxt:        { fontSize:10, fontWeight:'700', color:'#C9A84C' },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' },
  modalBox:     { borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:40, gap:0 },
  modalClose:   { alignSelf:'flex-end', padding:4, marginBottom:8 },
  priceBox:     { flexDirection:'row', alignItems:'center', gap:10, borderRadius:12, borderWidth:1, padding:14, marginBottom:14 },
  modalBtn:     { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, borderRadius:14, paddingVertical:15 },
  modalBtnTxt:  { fontSize:15, fontWeight:'800', color:'#fff' },
});
