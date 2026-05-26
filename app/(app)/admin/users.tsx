import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Search, Crown, Zap } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useTheme } from '../../../src/theme';
import { http } from '../../../src/services/http.client';

interface UserRow { id: string; name: string; email: string; credits: number; role: string; createdAt: string; }

export default function AdminUsers() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    http.get<UserRow[]>('/admin/users').then(d => { setUsers((d as any) ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const addCredits = async (userId: string, amount: number) => {
    await http.post(`/admin/users/${userId}/credits`, { amount }).catch(() => {});
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits: u.credits + amount } : u));
  };

  return (
    <View style={{ flex:1, backgroundColor: colors.background }}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><AppIcon icon={ChevronLeft} size={22} color={colors.text} strokeWidth={2.5} /></TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]}>Utilisateurs</Text>
        <Text style={[s.count, { color: colors.textSecondary }]}>{users.length}</Text>
      </View>
      <View style={[s.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppIcon icon={Search} size={16} color={colors.textTertiary} strokeWidth={2} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher..." placeholderTextColor={colors.textTertiary} style={[s.searchInput, { color: colors.text }]} />
      </View>
      {loading ? <ActivityIndicator color="#C9A84C" style={{ marginTop:40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={u => u.id}
          contentContainerStyle={{ padding:16, gap:10 }}
          renderItem={({ item: u }) => (
            <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={s.cardTop}>
                <View style={s.avatar}><Text style={s.avatarTxt}>{u.name?.[0]?.toUpperCase() ?? '?'}</Text></View>
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                    <Text style={[s.name, { color: colors.text }]}>{u.name}</Text>
                    {u.role === 'admin' && <AppIcon icon={Crown} size={12} color="#C9A84C" strokeWidth={2.5} />}
                  </View>
                  <Text style={[s.email, { color: colors.textSecondary }]}>{u.email}</Text>
                </View>
                <View style={s.creditsBadge}>
                  <AppIcon icon={Zap} size={12} color="#C9A84C" strokeWidth={2.5} />
                  <Text style={s.creditsNum}>{u.credits?.toLocaleString() ?? 0}</Text>
                </View>
              </View>
              <View style={s.actions}>
                {[100, 500, 1000].map(amt => (
                  <TouchableOpacity key={amt} style={s.addBtn} onPress={() => addCredits(u.id, amt)}>
                    <Text style={s.addBtnTxt}>+{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header:{ flexDirection:'row', alignItems:'center', gap:12, padding:16, borderBottomWidth:1 },
  back:{ width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
  title:{ flex:1, fontSize:18, fontWeight:'800' },
  count:{ fontSize:14, fontWeight:'600' },
  searchWrap:{ flexDirection:'row', alignItems:'center', gap:10, margin:16, borderRadius:12, borderWidth:1, paddingHorizontal:14, paddingVertical:10 },
  searchInput:{ flex:1, fontSize:14 },
  card:{ borderRadius:16, borderWidth:1, padding:14, gap:10 },
  cardTop:{ flexDirection:'row', alignItems:'center', gap:12 },
  avatar:{ width:42, height:42, borderRadius:21, backgroundColor:'rgba(201,168,76,0.15)', alignItems:'center', justifyContent:'center' },
  avatarTxt:{ fontSize:16, fontWeight:'800', color:'#C9A84C' },
  name:{ fontSize:14, fontWeight:'700' },
  email:{ fontSize:12, marginTop:1 },
  creditsBadge:{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(201,168,76,0.1)', paddingHorizontal:8, paddingVertical:4, borderRadius:10 },
  creditsNum:{ fontSize:13, fontWeight:'800', color:'#C9A84C' },
  actions:{ flexDirection:'row', gap:8 },
  addBtn:{ flex:1, backgroundColor:'rgba(201,168,76,0.12)', borderRadius:10, paddingVertical:8, alignItems:'center', borderWidth:1, borderColor:'rgba(201,168,76,0.2)' },
  addBtnTxt:{ fontSize:13, fontWeight:'800', color:'#C9A84C' },
});
