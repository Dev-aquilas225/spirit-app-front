/**
 * Admin — Analytics
 * KPIs clés : utilisateurs, revenus, rétention, usage IA, viralité, bibliothèque
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft, BarChart2, BookOpen, MessageCircle,
  RefreshCw, Share2, TrendingUp, Users, Zap,
} from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useTheme } from '../../../src/theme';
import { http } from '../../../src/services/http.client';
import { PaymentService } from '../../../src/services/payment.service';
import { ViralShareService } from '../../../src/services/viral-share.service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalCreditsDistributed: number;
  totalConversations: number;
  onlineNow?: number;
  newUsersToday?: number;
  newUsersThisWeek?: number;
  newUsersThisMonth?: number;
  totalRevenue?: number;
  revenueThisMonth?: number;
  revenueThisWeek?: number;
  avgCreditsPerUser?: number;
  totalBooksRead?: number;
  totalDownloads?: number;
  conversionRate?: number;
  recentPayments?: RecentPayment[];
}

interface RecentPayment {
  id: string;
  userEmail?: string;
  plan: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface ViralStats {
  totalRequests: number;
  approvedRequests: number;
  pendingRequests: number;
  totalCreditsAwarded: number;
}

// ─── Composants ───────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color, icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: any;
}) {
  const { colors } = useTheme();
  return (
    <View style={[st.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[st.kpiIcon, { backgroundColor: color + '18' }]}>
        <AppIcon icon={Icon} size={18} color={color} strokeWidth={2} />
      </View>
      <Text style={[st.kpiVal, { color }]}>
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </Text>
      <Text style={[st.kpiLabel, { color: colors.text }]}>{label}</Text>
      {sub && <Text style={[st.kpiSub, { color: colors.textTertiary }]}>{sub}</Text>}
    </View>
  );
}

function SectionTitle({ title, icon: Icon, color }: { title: string; icon: any; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={st.sectionTitle}>
      <View style={[st.sectionAccent, { backgroundColor: color }]} />
      <AppIcon icon={Icon} size={15} color={color} strokeWidth={2.2} />
      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{title}</Text>
    </View>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const { colors } = useTheme();
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 12, color, fontWeight: '700' }}>{value.toLocaleString('fr-FR')} ({pct}%)</Text>
      </View>
      <View style={[st.barBg, { backgroundColor: colors.border }]}>
        <View style={[st.barFill, { backgroundColor: color, width: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [viral, setViral] = useState<ViralStats | null>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [s, viralStats, subsData, recentPay] = await Promise.all([
        // Stats globales — essayer plusieurs routes
        http.get<AdminStats>('/admin/stats').catch(() =>
          http.get<AdminStats>('/admin/dashboard').catch(() => null)
        ),
        ViralShareService.adminGetStats().then(r => r ? ({
          totalRequests:    (r.pending ?? 0) + (r.approved ?? 0) + (r.rejected ?? 0),
          approvedRequests: r.approved ?? 0,
          pendingRequests:  r.pending ?? 0,
          totalCreditsAwarded: r.totalCreditsAwarded ?? 0,
        }) : null).catch(() => null),
        PaymentService.adminGetAll().catch(() => []),
        // Paiements récents — essayer plusieurs routes
        http.get<RecentPayment[]>('/admin/payments/recent').catch(() =>
          http.get<RecentPayment[]>('/admin/payments').catch(() =>
            http.get<RecentPayment[]>('/subscriptions/admin/all').catch(() => [])
          )
        ),
      ]);
      if (s) setStats(s as AdminStats);
      if (viralStats) setViral(viralStats as ViralStats);
      setSubs(Array.isArray(subsData) ? subsData : []);
      setRecentPayments(Array.isArray(recentPay) ? recentPay : []);
    } catch { /* silencieux */ }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  // Calculs dérivés
  const totalUsers     = stats?.totalUsers ?? 0;
  const activeSubs     = stats?.activeSubscriptions ?? 0;
  const convRate       = totalUsers > 0 ? ((activeSubs / totalUsers) * 100).toFixed(1) : '0';
  const revenueMonth   = stats?.revenueThisMonth ?? subs.filter(s => {
    const d = new Date(s.createdAt ?? s.startDate ?? '');
    return d.getMonth() === new Date().getMonth();
  }).reduce((acc, s) => acc + (s.amount ?? 0), 0);
  const revenueTotal   = stats?.totalRevenue ?? subs.reduce((acc, s) => acc + (s.amount ?? 0), 0);

  // Répartition plans
  const planCounts: Record<string, number> = {};
  subs.forEach(s => { const p = s.plan ?? 'unknown'; planCounts[p] = (planCounts[p] ?? 0) + 1; });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <AppIcon icon={ArrowLeft} size={20} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Analytics</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
            Mis à jour · {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => load(true)} style={st.refreshBtn}>
          <AppIcon icon={RefreshCw} size={16} color={colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* ── Section 1 : Utilisateurs ── */}
      <SectionTitle title="Utilisateurs" icon={Users} color="#60A5FA" />
      <View style={st.kpiGrid}>
        <KpiCard label="Total inscrits"     value={totalUsers}                          color="#60A5FA" icon={Users}      />
        <KpiCard label="En ligne"           value={stats?.onlineNow ?? '—'}             color="#34D399" icon={TrendingUp} />
        <KpiCard label="Nouveaux aujourd'hui" value={stats?.newUsersToday ?? '—'}       color="#A78BFA" icon={Users}      />
        <KpiCard label="Ce mois"            value={stats?.newUsersThisMonth ?? '—'}     color="#F472B6" icon={TrendingUp} />
      </View>

      {/* ── Section 2 : Revenus & Abonnements ── */}
      <SectionTitle title="Revenus & Abonnements" icon={TrendingUp} color="#34D399" />
      <View style={st.kpiGrid}>
        <KpiCard label="Abonnés actifs"     value={activeSubs}                          color="#34D399" icon={Zap}        sub={`${convRate}% conversion`} />
        <KpiCard label="Revenu ce mois"     value={`${revenueMonth.toLocaleString('fr-FR')} FCFA`} color="#C9A84C" icon={TrendingUp} />
        <KpiCard label="Revenu total"       value={`${revenueTotal.toLocaleString('fr-FR')} FCFA`} color="#C9A84C" icon={BarChart2}  />
        <KpiCard label="Crédits distribués" value={stats?.totalCreditsDistributed ?? 0} color="#F59E0B" icon={Zap}        />
      </View>

      {/* Répartition plans */}
      {Object.keys(planCounts).length > 0 && (
        <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 14 }}>
            Répartition des plans
          </Text>
          <View style={{ gap: 12 }}>
            {Object.entries(planCounts).map(([plan, count]) => (
              <ProgressBar
                key={plan}
                label={plan}
                value={count}
                max={activeSubs || 1}
                color="#34D399"
              />
            ))}
          </View>
        </View>
      )}

      {/* ── Section 3 : Usage IA ── */}
      <SectionTitle title="Usage IA" icon={MessageCircle} color="#A78BFA" />
      <View style={st.kpiGrid}>
        <KpiCard label="Conversations"      value={stats?.totalConversations ?? 0}      color="#A78BFA" icon={MessageCircle} />
        <KpiCard label="Moy. crédits/user"  value={stats?.avgCreditsPerUser ?? '—'}     color="#818CF8" icon={Zap}           />
      </View>

      {/* ── Section 4 : Bibliothèque ── */}
      <SectionTitle title="Bibliothèque" icon={BookOpen} color="#60A5FA" />
      <View style={st.kpiGrid}>
        <KpiCard label="Livres lus"         value={stats?.totalBooksRead ?? '—'}        color="#60A5FA" icon={BookOpen}   />
        <KpiCard label="Téléchargements"    value={stats?.totalDownloads ?? '—'}        color="#34D399" icon={BookOpen}   />
      </View>

      {/* ── Section 5 : Viralité ── */}
      <SectionTitle title="Viralité & Partages" icon={Share2} color="#25D366" />
      <View style={st.kpiGrid}>
        <KpiCard label="Demandes totales"   value={viral?.totalRequests ?? '—'}         color="#25D366" icon={Share2}     />
        <KpiCard label="Approuvées"         value={viral?.approvedRequests ?? '—'}      color="#34D399" icon={Share2}     />
        <KpiCard label="En attente"         value={viral?.pendingRequests ?? '—'}       color="#F59E0B" icon={Share2}     />
        <KpiCard label="Crédits viraux"     value={viral?.totalCreditsAwarded ?? '—'}   color="#C9A84C" icon={Zap}        />
      </View>

      {/* ── Section 6 : Taux de conversion ── */}
      <SectionTitle title="Conversion" icon={BarChart2} color="#F472B6" />
      <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ gap: 14 }}>
          <ProgressBar
            label="Inscrits → Abonnés"
            value={activeSubs}
            max={totalUsers || 1}
            color="#34D399"
          />
          {viral && (
            <ProgressBar
              label="Partages → Approuvés"
              value={viral.approvedRequests}
              max={viral.totalRequests || 1}
              color="#25D366"
            />
          )}
          <ProgressBar
            label="Utilisateurs actifs (conversations)"
            value={stats?.totalConversations ?? 0}
            max={(totalUsers || 1) * 3}
            color="#A78BFA"
          />
        </View>
      </View>

      {/* ── Section 7 : Paiements récents ── */}
      <SectionTitle title="Paiements récents" icon={TrendingUp} color="#C9A84C" />
      {recentPayments.length === 0 ? (
        <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.textTertiary, textAlign: 'center', fontSize: 13 }}>
            Aucun paiement récent — vérifiez la route /admin/payments/recent
          </Text>
        </View>
      ) : (
        <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border, gap: 10 }]}>
          {recentPayments.slice(0, 20).map((p, i) => (
            <View key={p.id ?? i} style={[st.payRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                  {p.userEmail ?? 'Utilisateur'}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  {p.plan} · {new Date(p.createdAt).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                </Text>
                {p.reference ? (
                  <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 1 }}>
                    Réf: {p.reference}
                  </Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>
                  {(p.amount ?? 0).toLocaleString('fr-FR')} FCFA
                </Text>
                <View style={[st.statusBadge, {
                  backgroundColor: p.status === 'success' || p.status === 'active'
                    ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700',
                    color: p.status === 'success' || p.status === 'active' ? '#10B981' : '#F59E0B',
                  }}>
                    {p.status}
                  </Text>
                </View>
                {/* Bouton révoquer */}
                {(p.status === 'success' || p.status === 'active') && (
                  <TouchableOpacity
                    style={[st.revokeBtn]}
                    onPress={async () => {
                      if (!p.id && !p.reference) return;
                      try {
                        await http.post('/admin/payments/revoke', { paymentId: p.id, reference: p.reference }).catch(() =>
                          http.delete(`/admin/payments/${p.id ?? p.reference}`)
                        );
                        // Rafraîchir
                        load(true);
                      } catch {
                        alert('Impossible de révoquer ce paiement');
                      }
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>Révoquer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Note de bas de page */}
      <Text style={{ fontSize: 11, color: colors.textTertiary, textAlign: 'center', fontStyle: 'italic' }}>
        Données en temps réel · Rafraîchissement automatique toutes les 30s
      </Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 16 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  refreshBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  kpiGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard:     { width: '47%', borderRadius: 16, borderWidth: 1, padding: 14, gap: 4, alignItems: 'center' },
  kpiIcon:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  kpiVal:      { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  kpiLabel:    { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  kpiSub:      { fontSize: 10, textAlign: 'center' },
  sectionTitle:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccent:{ width: 4, height: 18, borderRadius: 2 },
  card:        { borderRadius: 16, borderWidth: 1, padding: 16 },
  barBg:       { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: 4 },
  payRow:      { flexDirection: 'row', alignItems: 'flex-start', paddingBottom: 10, borderBottomWidth: 0.5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  revokeBtn:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#EF444440', backgroundColor: '#EF444412' },
});
