import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Search, BookOpen, Lock, Star } from 'lucide-react-native';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { useTheme } from '../../../../src/theme';
import { useAccess } from '../../../../src/hooks/useAccess';
import { useCreditsStore } from '../../../../src/store/credits.store';
import { useGamificationStore } from '../../../../src/store/gamification.store';
import { http } from '../../../../src/services/http.client';

interface Book { id: string; title: string; author: string; category: string; coverUrl?: string; tokenCost: number; pages: number; description?: string; }

const CATS = ['Tous','Prière','Prophétie','Sagesse','Guérison','Formation'];

export default function LibraryScreen() {
  const { colors } = useTheme();
  const { hasSubscription, credits } = useAccess();
  const { spend } = useCreditsStore();
  const { completeMission, earnBadge } = useGamificationStore();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Tous');

  useEffect(() => {
    http.get<Book[]>('/books').then(d => { setBooks((d as any) ?? []); setLoading(false); }).catch(() => { setBooks(DEMO_BOOKS); setLoading(false); });
  }, []);

  const open = async (b: Book) => {
    if (!hasSubscription && credits < b.tokenCost) { router.push('/subscription'); return; }
    if (!hasSubscription) await spend('audio_preview');
    await completeMission('read_book');
    await earnBadge('book_reader');
    router.push({ pathname: '/library/reader', params: { id: b.id, title: b.title } } as any);
  };

  const filtered = books.filter(b => (cat === 'Tous' || b.category === cat) && (b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase())));

  return (
    <View style={{ flex:1, backgroundColor: colors.background }}>
      <View style={[s.header, { backgroundColor: '#0D0D2B' }]}>
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
      {loading ? <ActivityIndicator color="#C9A84C" style={{ marginTop:40 }} /> : (
        <FlatList data={filtered} keyExtractor={b => b.id} numColumns={2} contentContainerStyle={{ padding:12, gap:12 }} columnWrapperStyle={{ gap:12 }}
          renderItem={({ item: b }) => (
            <TouchableOpacity style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => open(b)} activeOpacity={0.85}>
              <View style={[s.cover, { backgroundColor: 'rgba(96,165,250,0.1)' }]}>
                {b.coverUrl ? <Image source={{ uri: b.coverUrl }} style={{ width:'100%', height:'100%', borderRadius:12 }} /> : <AppIcon icon={BookOpen} size={32} color="#60A5FA" strokeWidth={1.8} />}
                {!hasSubscription && <View style={s.lockBadge}><AppIcon icon={Lock} size={10} color="#fff" strokeWidth={2.5} /><Text style={s.lockTxt}>{b.tokenCost}</Text></View>}
              </View>
              <Text style={[s.bookTitle, { color: colors.text }]} numberOfLines={2}>{b.title}</Text>
              <Text style={[s.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{b.author}</Text>
              <View style={s.bookMeta}>
                <Text style={s.bookCat}>{b.category}</Text>
                {hasSubscription && <View style={s.freeBadge}><AppIcon icon={Star} size={10} color="#34D399" strokeWidth={2.5} /><Text style={s.freeTxt}>Inclus</Text></View>}
              </View>
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
  header:{ padding:20, paddingTop:56, paddingBottom:20 },
  headerTitle:{ fontSize:22, fontWeight:'900', color:'#fff' },
  headerSub:{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:4 },
  searchWrap:{ flexDirection:'row', alignItems:'center', gap:10, margin:16, borderRadius:14, borderWidth:1, paddingHorizontal:14, paddingVertical:10 },
  searchInput:{ flex:1, fontSize:14 },
  catBtn:{ paddingHorizontal:16, paddingVertical:8, borderRadius:20, backgroundColor:'rgba(156,163,175,0.1)' },
  catActive:{ backgroundColor:'#C9A84C' },
  catTxt:{ fontSize:13, fontWeight:'700' },
  card:{ flex:1, borderRadius:16, borderWidth:1, padding:12, gap:8 },
  cover:{ width:'100%', aspectRatio:0.75, borderRadius:12, alignItems:'center', justifyContent:'center', position:'relative' },
  lockBadge:{ position:'absolute', bottom:6, right:6, flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'rgba(0,0,0,0.7)', borderRadius:8, paddingHorizontal:6, paddingVertical:3 },
  lockTxt:{ fontSize:10, fontWeight:'700', color:'#C9A84C' },
  bookTitle:{ fontSize:13, fontWeight:'800', lineHeight:18 },
  bookAuthor:{ fontSize:11 },
  bookMeta:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  bookCat:{ fontSize:10, color:'#60A5FA', fontWeight:'600' },
  freeBadge:{ flexDirection:'row', alignItems:'center', gap:3 },
  freeTxt:{ fontSize:10, color:'#34D399', fontWeight:'700' },
});
