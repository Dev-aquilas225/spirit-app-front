import { router } from 'expo-router';
import { Users, Zap, BookOpen, MessageCircle, BarChart2, Bell, Settings, ChevronRight, Shield, Share2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useAuth } from '../../../src/hooks/useAuth';
import { useTheme } from '../../../src/theme';
import { http } from '../../../src/services/http.client';
import { Env } from '../../../src/utils/env';

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  totalCreditsDistributed: number;
  totalConversations: number;
  onlineNow?: number;
  recentEmails?: string[];
}

const SECTIONS = [
  { id: 'users',    label: 'Utilisateurs',   icon: Users,          color: '#60A5FA', route: '/admin/users' },
  { id: 'credits',  label: 'Crédits',         icon: Zap,            color: '#C9A84C', route: '/admin/credits' },
  { id: 'books',    label: 'Bibliothèque',    icon: BookOpen,       color: '#34D399', route: '/admin/books' },
  { id: 'ai',       label: 'Paramètres Guides', icon: MessageCircle,  color: '#A78BFA', route: '/admin/ai-settings' },
  { id: 'viral',    label: 'Partages Viraux',  icon: Share2,         color: '#25D366', route: '/admin/viral-shares' },
  { id: 'notifs',   label: 'Notifications',   icon: Bell,           color: '#F472B6', route: '/admin/notifications' },
  { id: 'settings', label: 'Paramètres',      icon: Settings,       color: '#9CA3AF', route: '/settings' },
] as const;

export default function AdminHome() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<{ email: string; createdAt: string }[]>([]);
  const [showEmails, setShowEmails] = useState(false);

  async function loadStats() {
    try {
      const [s, users] = await Promise.all([
        http.get<Stats>('/admin/stats'),
        http.get<{ email: string; createdAt: string }[]>('/admin/users').catch(() => []),
      ]);
      setStats(s as any);
      // Trier par date d'inscription décroissante
      const sorted = (Array.isArray(users) ? users : [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentUsers(sorted);
    } catch {
      // silencieux
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!user) { router.replace('/dashboard'); return; }
    const isAdmin = user.role === 'admin' || Env.ADMIN_EMAILS().includes((user.email ?? '').toLowerCase());
    if (!isAdmin) { router.replace('/dashboard'); return; }
    loadStats();
    // Rafraîchir les stats toutes les 30s (connectés en temps réel)
    const interval = setInterval(loadStats, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <ScrollView style={{ flex:1, backgroundColor: colors.background }} contentContainerStyle={{ padding:20, gap:20 }}>
      <View style={s.header}>
        <View style={s.headerIcon}><AppIcon icon={Shield} size={28} color="#C9A84C" strokeWidth={1.8} /></View>
        <View>
          <Text style={[s.headerTitle, { color: colors.text }]}>Admin Panel</Text>
          <Text style={[s.headerSub, { color: colors.textSecondary }]}>{user?.email}</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator color="#C9A84C" /> : stats && (
        <>
          <View style={s.statsGrid}>
            {[
              { label: 'Inscrits', value: stats.totalUsers ?? recentUsers.length, color: '#60A5FA' },
              { label: 'Abonnés actifs', value: stats.activeSubscriptions, color: '#34D399' },
              { label: 'En ligne', value: stats.onlineNow ?? '—', color: '#F472B6' },
              { label: 'Conversations', value: stats.totalConversations, color: '#A78BFA' },
            ].map(st => (
              <View key={st.label} style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.statVal, { color: st.color }]}>{typeof st.value === 'number' ? st.value.toLocaleString() : st.value}</Text>
                <Text style={[s.statLbl, { color: colors.textSecondary }]}>{st.label}</Text>
              </View>
            ))}
          </View>

          {/* Liste emails inscrits */}
          <TouchableOpacity
            style={[s.emailsToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowEmails(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={[s.emailsToggleTxt, { color: colors.text }]}>
              {recentUsers.length} emails inscrits {showEmails ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showEmails && (
            <View style={[s.emailsList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {recentUsers.slice(0, 50).map((u, i) => (
                <View key={i} style={[s.emailRow, { borderBottomColor: colors.border }]}>
                  <Text style={{ fontSize: 12, color: colors.text, flex: 1 }}>{u.email}</Text>
                  <Text style={{ fontSize: 10, color: colors.textTertiary }}>
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              ))}
              {recentUsers.length > 50 && (
                <Text style={{ fontSize: 11, color: colors.textTertiary, textAlign: 'center', padding: 8 }}>
                  + {recentUsers.length - 50} autres — voir Utilisateurs
                </Text>
              )}
            </View>
          )}
        </>
      )}

      <View style={s.grid}>
        {SECTIONS.map(sec => (
          <TouchableOpacity key={sec.id} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push(sec.route as any)} activeOpacity={0.8}>
            <View style={[s.cardIcon, { backgroundColor: sec.color + '20' }]}><AppIcon icon={sec.icon} size={24} color={sec.color} strokeWidth={2} /></View>
            <Text style={[s.cardLabel, { color: colors.text }]}>{sec.label}</Text>
            <AppIcon icon={ChevronRight} size={16} color={colors.textTertiary} strokeWidth={2.5} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  header:{ flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'rgba(201,168,76,0.08)', borderRadius:18, padding:16, borderWidth:1, borderColor:'rgba(201,168,76,0.2)' },
  headerIcon:{ width:56, height:56, borderRadius:28, backgroundColor:'rgba(201,168,76,0.12)', alignItems:'center', justifyContent:'center' },
  headerTitle:{ fontSize:20, fontWeight:'900' },
  headerSub:{ fontSize:12, marginTop:2 },
  statsGrid:{ flexDirection:'row', flexWrap:'wrap', gap:12 },
  statCard:{ width:'47%', borderRadius:16, borderWidth:1, padding:14, alignItems:'center', gap:4 },
  statVal:{ fontSize:24, fontWeight:'900' },
  statLbl:{ fontSize:11, textAlign:'center' },
  grid:{ gap:12 },
  card:{ flexDirection:'row', alignItems:'center', gap:14, borderRadius:16, borderWidth:1, padding:16 },
  cardIcon:{ width:46, height:46, borderRadius:13, alignItems:'center', justifyContent:'center' },
  cardLabel:     { flex:1, fontSize:15, fontWeight:'700' },
  emailsToggle:  { borderRadius:12, borderWidth:1, padding:14, alignItems:'center' },
  emailsToggleTxt:{ fontSize:13, fontWeight:'700' },
  emailsList:    { borderRadius:12, borderWidth:1, overflow:'hidden' },
  emailRow:      { flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingVertical:10, borderBottomWidth:0.5 },
});
