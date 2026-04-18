/**
 * Admin — Gestion des abonnements
 * Accessible uniquement aux admins (EXPO_PUBLIC_ADMIN_EMAIL).
 * Permet de voir tous les paiements et d'activer manuellement un abonnement.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CheckCircle, Crown, RefreshCw, Search, User } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { AdminSubscription, PaymentService } from '../../../src/services/payment.service';
import { useTheme } from '../../../src/theme';

/* ─── Config statut ─────────────────────────────────────────────────────── */

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Actif',     color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  pending:   { label: 'En attente',color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  failed:    { label: 'Échoué',    color: '#EF4444', bg: 'rgba(239,68,68,0.15)'  },
  cancelled: { label: 'Annulé',    color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)'},
  expired:   { label: 'Expiré',    color: '#6B7280', bg: 'rgba(107,114,128,0.15)'},
};

const FILTERS = ['all', 'pending', 'failed', 'active', 'cancelled'] as const;
type Filter = typeof FILTERS[number];

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function userName(sub: AdminSubscription) {
  const u = sub.user;
  if (u?.firstName || u?.lastName) return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return u?.email ?? u?.phone ?? 'Inconnu';
}

/* ─── Composant card ────────────────────────────────────────────────────── */

function SubscriptionCard({
  sub,
  onActivate,
  activating,
}: {
  sub: AdminSubscription;
  onActivate: (id: string) => void;
  activating: boolean;
}) {
  const { colors } = useTheme();
  const cfg = STATUS_CFG[sub.status] ?? STATUS_CFG.failed;
  const canActivate = sub.status !== 'active';

  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header: nom + badge statut */}
      <View style={s.cardHeader}>
        <View style={[s.avatarCircle, { backgroundColor: colors.background }]}>
          <AppIcon icon={User} size={18} color={colors.textSecondary} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.cardName, { color: colors.text }]} numberOfLines={1}>
            {userName(sub)}
          </Text>
          <Text style={[s.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
            {sub.user?.email ?? sub.user?.phone ?? '—'}
          </Text>
        </View>
        <View style={[s.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Infos */}
      <View style={[s.infoRow, { borderTopColor: colors.border }]}>
        <InfoCell label="Montant"    value={`${sub.amount.toLocaleString()} FCFA`} />
        <InfoCell label="Créé le"   value={fmt(sub.createdAt)} />
        <InfoCell label="Référence" value={sub.paymentReference?.slice(-12) ?? '—'} mono />
      </View>

      {sub.status === 'active' && (
        <View style={[s.infoRow, { borderTopColor: colors.border }]}>
          <InfoCell label="Début"    value={fmt(sub.startDate)} />
          <InfoCell label="Expiration" value={fmt(sub.endDate)} />
          <InfoCell label="Via"      value={sub.paymentProvider ?? '—'} />
        </View>
      )}

      {/* Bouton Activer */}
      {canActivate && (
        <TouchableOpacity
          style={[s.activateBtn, { opacity: activating ? 0.6 : 1 }]}
          onPress={() => onActivate(sub.id)}
          disabled={activating}
          activeOpacity={0.8}
        >
          {activating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <AppIcon icon={Crown} size={15} color="#fff" strokeWidth={2.4} />
              <Text style={s.activateBtnText}>Passer Premium</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {sub.status === 'active' && (
        <View style={s.activeRow}>
          <AppIcon icon={CheckCircle} size={14} color="#10B981" strokeWidth={2.4} />
          <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600' }}>Abonnement actif</Text>
        </View>
      )}
    </View>
  );
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[s.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[s.infoValue, { color: colors.text, fontFamily: mono ? 'monospace' : undefined }]}
        numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/* ─── Écran principal ───────────────────────────────────────────────────── */

export default function AdminSubscriptionsScreen() {
  const { colors, spacing } = useTheme();

  const [data, setData]           = useState<AdminSubscription[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState<Filter>('all');
  const [search, setSearch]       = useState('');
  const [activating, setActivating] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const rows = await PaymentService.adminGetAll();
    setData(rows);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  // ── Filtrage ──────────────────────────────────────────────────────────
  const filtered = data.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = userName(s).toLowerCase();
      const email = (s.user?.email ?? '').toLowerCase();
      const phone = (s.user?.phone ?? '').toLowerCase();
      const ref   = (s.paymentReference ?? '').toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !phone.includes(q) && !ref.includes(q)) return false;
    }
    return true;
  });

  // ── Counts par statut ─────────────────────────────────────────────────
  const counts: Record<string, number> = { all: data.length };
  data.forEach((s) => { counts[s.status] = (counts[s.status] ?? 0) + 1; });

  // ── Activer ───────────────────────────────────────────────────────────
  async function handleActivate(id: string) {
    const sub = data.find((s) => s.id === id);
    const name = sub ? userName(sub) : id;

    const confirmed = Platform.OS === 'web'
      ? window.confirm(`Activer l'abonnement de ${name} ?`)
      : await new Promise<boolean>((resolve) =>
          Alert.alert('Confirmer', `Activer l'abonnement de ${name} ?`, [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Activer', onPress: () => resolve(true) },
          ])
        );

    if (!confirmed) return;

    setActivating(id);
    const result = await PaymentService.adminActivate(id);
    setActivating(null);

    if (result.success) {
      // Mise à jour locale immédiate
      setData((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: 'active' as any, paymentProvider: 'manual', startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
            : s,
        ),
      );
    } else {
      if (Platform.OS === 'web') window.alert(`Erreur : ${result.error}`);
      else Alert.alert('Erreur', result.error);
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.deepBlue ?? '#1A1A3E', paddingTop: 56 }]}>
        <View style={s.headerTop}>
          <BackButton variant="dark" />
          <TouchableOpacity onPress={() => load(true)} style={s.refreshBtn}>
            <AppIcon icon={RefreshCw} size={18} color="rgba(255,255,255,0.7)" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
        <Text style={s.headerTitle}>Abonnements</Text>
        <Text style={s.headerSub}>{data.length} entrées au total</Text>
      </View>

      {/* Barre de recherche */}
      <View style={[s.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppIcon icon={Search} size={16} color={colors.textSecondary} strokeWidth={2} />
        <TextInput
          style={[s.searchInput, { color: colors.text }]}
          placeholder="Nom, email, téléphone, référence…"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}
        contentContainerStyle={{ paddingHorizontal: spacing.base, gap: 8, paddingVertical: 8 }}>
        {FILTERS.map((f) => {
          const cfg = f === 'all' ? { color: colors.primary, bg: `${colors.primary}20` } : (STATUS_CFG[f] ?? STATUS_CFG.failed);
          const active = filter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                s.filterChip,
                {
                  backgroundColor: active ? cfg.bg : colors.surface,
                  borderColor: active ? cfg.color : colors.border,
                },
              ]}
            >
              <Text style={[s.filterLabel, { color: active ? cfg.color : colors.textSecondary }]}>
                {f === 'all' ? 'Tous' : STATUS_CFG[f]?.label ?? f}
                {counts[f] ? ` (${counts[f]})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Liste */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#C9A84C" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={[s.empty, { color: colors.textSecondary }]}>Aucun résultat</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.base, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#C9A84C" />}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              onActivate={handleActivate}
              activating={activating === sub.id}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  root:       { flex: 1 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:      { fontSize: 15 },

  /* Header */
  header:     { paddingHorizontal: 20, paddingBottom: 20 },
  headerTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle:{ fontSize: 24, fontWeight: '900', color: '#fff' },
  headerSub:  { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  refreshBtn: { padding: 8 },

  /* Search */
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, marginBottom: 0, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput:{ flex: 1, fontSize: 14 },

  /* Filters */
  filterScroll: { flexGrow: 0 },
  filterChip:   { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  filterLabel:  { fontSize: 13, fontWeight: '600' },

  /* Card */
  card:       { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatarCircle:{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  cardName:   { fontSize: 15, fontWeight: '700' },
  cardSub:    { fontSize: 12 },

  badge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText:  { fontSize: 11, fontWeight: '700' },

  infoRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  infoLabel:  { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue:  { fontSize: 12, fontWeight: '600' },

  activateBtn:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 12, marginTop: 4, backgroundColor: '#C9A84C', borderRadius: 12, paddingVertical: 12 },
  activateBtnText:{ color: '#fff', fontWeight: '800', fontSize: 14 },

  activeRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, paddingTop: 4, justifyContent: 'center' },
});
