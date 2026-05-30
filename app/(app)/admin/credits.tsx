/**
 * Admin — Gestion des crédits
 * Voir le solde de chaque utilisateur, créditer manuellement, historique.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Plus, RefreshCw, Zap } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useTheme } from '../../../src/theme';
import { http } from '../../../src/services/http.client';

interface UserCredit {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  credits: number;
  role: string;
}

export default function AdminCreditsScreen() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<UserCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [crediting, setCrediting] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await http.get<UserCredit[]>('/admin/users/credits');
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      // Fallback : charger depuis /admin/users
      try {
        const data = await http.get<UserCredit[]>('/admin/users');
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        setUsers([]);
      }
    }
    setLoading(false);
  }

  async function handleCredit(user: UserCredit) {
    Alert.prompt(
      'Créditer',
      `Combien de crédits ajouter à ${user.firstName ?? user.email} ?`,
      async (value) => {
        const amount = parseInt(value ?? '0', 10);
        if (!amount || amount <= 0) return;
        setCrediting(user.id);
        try {
          // Essayer plusieurs routes selon la version du backend
          let ok = false;
          try {
            await http.post(`/admin/users/${user.id}/credits`, { amount });
            ok = true;
          } catch {}
          if (!ok) {
            try {
              await http.post('/admin/credits/add', { userId: user.id, amount });
              ok = true;
            } catch {}
          }
          if (!ok) throw new Error('Route admin introuvable');
          Alert.alert('Succès', `+${amount} crédits ajoutés à ${user.firstName ?? user.email}.`);
          await load();
        } catch (e: any) {
          Alert.alert('Erreur', e?.message ?? 'Impossible de créditer');
        }
        setCrediting(null);
      },
      'plain-text',
      '',
      'numeric',
    );
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.firstName ?? '').toLowerCase().includes(q) ||
      (u.lastName ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.back}>
          <AppIcon icon={ChevronLeft} size={22} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[st.title, { color: colors.text }]}>Gestion des Crédits</Text>
        <TouchableOpacity onPress={load} style={st.back}>
          <AppIcon icon={RefreshCw} size={18} color={colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* Recherche */}
      <View style={[st.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un utilisateur..."
          placeholderTextColor={colors.textTertiary}
          style={[st.searchInput, { color: colors.text }]}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={u => u.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={
            <Text style={{ color: colors.textTertiary, textAlign: 'center', marginTop: 40 }}>
              Aucun utilisateur trouvé
            </Text>
          }
          renderItem={({ item: u }) => (
            <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                  {u.firstName ?? ''} {u.lastName ?? ''}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  {u.email ?? 'Sans email'}
                </Text>
                <View style={[st.roleBadge, { backgroundColor: u.role === 'admin' ? 'rgba(239,68,68,0.12)' : 'rgba(96,165,250,0.12)' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: u.role === 'admin' ? '#EF4444' : '#60A5FA' }}>
                    {u.role}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <View style={[st.creditBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}>
                  <AppIcon icon={Zap} size={12} color={colors.primary} strokeWidth={2.5} />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>
                    {(u.credits ?? 0).toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[st.creditBtn, { opacity: crediting === u.id ? 0.6 : 1 }]}
                  onPress={() => handleCredit(u)}
                  disabled={crediting === u.id}
                >
                  {crediting === u.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <AppIcon icon={Plus} size={13} color="#fff" strokeWidth={2.5} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Créditer</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 52 : 16, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, gap: 12 },
  back:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 18, fontWeight: '800', flex: 1 },
  searchWrap:  { margin: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { fontSize: 14 },
  card:        { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  roleBadge:   { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  creditBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  creditBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#C9A84C', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
});
