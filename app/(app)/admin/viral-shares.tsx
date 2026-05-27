/**
 * Admin — Validation des partages viraux WhatsApp
 * Affiche les demandes en attente + stats + boutons approuver/rejeter
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { CheckCircle2, Share2, TrendingUp, Users, XCircle, Zap } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { useTheme } from '../../../src/theme';
import { ViralShareService } from '../../../src/services/viral-share.service';

interface ShareRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  contactsCount: number;
  creditsAwarded: number;
  createdAt: string;
  user: { id: string; firstName?: string; lastName?: string; email: string; credits: number };
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  totalCreditsAwarded: number;
}

export default function AdminViralSharesScreen() {
  const { colors } = useTheme();
  const [requests, setRequests] = useState<ShareRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [reqs, st] = await Promise.all([
      ViralShareService.adminGetPending() as unknown as ShareRequest[],
      ViralShareService.adminGetStats(),
    ]);
    setRequests(reqs);
    setStats(st);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id: string, userName: string) {
    Alert.alert(
      'Approuver le partage',
      `Créditer 1000 crédits à ${userName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: async () => {
            setProcessing(id);
            const ok = await ViralShareService.adminApprove(id);
            setProcessing(null);
            if (ok) {
              Alert.alert('✓ Approuvé', `1000 crédits accordés à ${userName}`);
              await load();
            } else {
              Alert.alert('Erreur', 'Impossible d\'approuver');
            }
          },
        },
      ]
    );
  }

  async function handleReject(id: string, userName: string) {
    Alert.alert(
      'Rejeter la demande',
      `Rejeter la demande de ${userName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            setProcessing(id);
            const ok = await ViralShareService.adminReject(id);
            setProcessing(null);
            if (ok) await load();
            else Alert.alert('Erreur', 'Impossible de rejeter');
          },
        },
      ]
    );
  }

  function userName(req: ShareRequest) {
    const n = [req.user.firstName, req.user.lastName].filter(Boolean).join(' ');
    return n || req.user.email;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={st.headerRow}>
          <BackButton />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[st.headerTitle, { color: colors.text }]}>Partages Viraux</Text>
            <Text style={[st.headerSub, { color: colors.textSecondary }]}>Validation WhatsApp</Text>
          </View>
          <AppIcon icon={Share2} size={24} color="#25D366" strokeWidth={2} />
        </View>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={() => (
          <>
            {/* Stats */}
            {stats && (
              <View style={st.statsGrid}>
                {[
                  { label: 'En attente', value: stats.pending,             color: '#F59E0B', icon: Users },
                  { label: 'Approuvés',  value: stats.approved,            color: '#10B981', icon: CheckCircle2 },
                  { label: 'Rejetés',    value: stats.rejected,            color: '#EF4444', icon: XCircle },
                  { label: 'Crédits',    value: stats.totalCreditsAwarded, color: '#C9A84C', icon: Zap },
                ].map((s) => (
                  <View key={s.label} style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <AppIcon icon={s.icon} size={16} color={s.color} strokeWidth={2} />
                    <Text style={[st.statVal, { color: s.color }]}>{s.value?.toLocaleString() ?? '0'}</Text>
                    <Text style={[st.statLbl, { color: colors.textSecondary }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {requests.length === 0 && !loading && (
              <View style={st.empty}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
                <Text style={[st.emptyTxt, { color: colors.textSecondary }]}>Aucune demande en attente</Text>
              </View>
            )}

            {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}

            {requests.length > 0 && (
              <Text style={[st.sectionTitle, { color: colors.text }]}>
                {requests.length} demande(s) en attente
              </Text>
            )}
          </>
        )}
        renderItem={({ item }) => {
          const isProcessing = processing === item.id;
          const name = userName(item);
          const date = new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
          });

          return (
            <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* User info */}
              <View style={st.cardHeader}>
                <View style={[st.avatar, { backgroundColor: 'rgba(37,211,102,0.12)', borderColor: 'rgba(37,211,102,0.3)' }]}>
                  <Text style={[st.avatarTxt, { color: '#25D366' }]}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[st.userName, { color: colors.text }]}>{name}</Text>
                  <Text style={[st.userEmail, { color: colors.textSecondary }]}>{item.user.email}</Text>
                </View>
                <View style={[st.creditsBadge, { backgroundColor: 'rgba(201,168,76,0.1)', borderColor: 'rgba(201,168,76,0.3)' }]}>
                  <AppIcon icon={Zap} size={12} color="#C9A84C" strokeWidth={2} />
                  <Text style={st.creditsVal}>{item.user.credits.toLocaleString()}</Text>
                </View>
              </View>

              {/* Details */}
              <View style={[st.details, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={st.detailRow}>
                  <AppIcon icon={Share2} size={14} color="#25D366" strokeWidth={2} />
                  <Text style={[st.detailTxt, { color: colors.textSecondary }]}>
                    {item.contactsCount} contacts WhatsApp
                  </Text>
                </View>
                <View style={st.detailRow}>
                  <AppIcon icon={TrendingUp} size={14} color={colors.textTertiary} strokeWidth={2} />
                  <Text style={[st.detailTxt, { color: colors.textTertiary }]}>{date}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={st.actions}>
                <TouchableOpacity
                  style={[st.rejectBtn, { borderColor: '#EF4444', opacity: isProcessing ? 0.5 : 1 }]}
                  onPress={() => handleReject(item.id, name)}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? <ActivityIndicator size="small" color="#EF4444" />
                    : <><AppIcon icon={XCircle} size={16} color="#EF4444" strokeWidth={2} /><Text style={st.rejectTxt}>Rejeter</Text></>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={[st.approveBtn, { opacity: isProcessing ? 0.5 : 1 }]}
                  onPress={() => handleApprove(item.id, name)}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><AppIcon icon={CheckCircle2} size={16} color="#fff" strokeWidth={2.5} /><Text style={st.approveTxt}>+1000 crédits</Text></>
                  }
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  header:       { paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1 },
  headerRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle:  { fontSize: 18, fontWeight: '800' },
  headerSub:    { fontSize: 12, marginTop: 2 },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard:     { flex: 1, minWidth: '45%', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 14, padding: 12 },
  statVal:      { fontSize: 20, fontWeight: '900' },
  statLbl:      { fontSize: 11, fontWeight: '600' },
  empty:        { alignItems: 'center', paddingVertical: 40 },
  emptyTxt:     { fontSize: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  card:         { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  avatarTxt:    { fontSize: 16, fontWeight: '800' },
  userName:     { fontSize: 14, fontWeight: '700' },
  userEmail:    { fontSize: 12, marginTop: 1 },
  creditsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  creditsVal:   { fontSize: 12, fontWeight: '700', color: '#C9A84C' },
  details:      { borderWidth: 1, borderRadius: 10, padding: 10, gap: 6 },
  detailRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailTxt:    { fontSize: 13 },
  actions:      { flexDirection: 'row', gap: 10 },
  rejectBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 12, paddingVertical: 10 },
  rejectTxt:    { fontSize: 13, fontWeight: '700', color: '#EF4444' },
  approveBtn:   { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 10 },
  approveTxt:   { fontSize: 13, fontWeight: '800', color: '#fff' },
});
