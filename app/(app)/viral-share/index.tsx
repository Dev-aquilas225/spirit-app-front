import { useSafeAreaInsets } from 'react-native-safe-area-context';
/**
 * Partage Viral WhatsApp — 1000 crédits pour 50 contacts
 * Alternative gratuite au paiement selon le CDC Oracle Plus.
 */
import { CheckCircle2, Clock, Gift, Share2, Users, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Platform,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { useTheme } from '../../../src/theme';
import { ViralShareService, ViralShareRequest } from '../../../src/services/viral-share.service';
import { useCreditsStore } from '../../../src/store/credits.store';

const STEPS = [
  { icon: '📲', label: 'Appuyez sur "Partager sur WhatsApp"' },
  { icon: '👥', label: 'Envoyez le message à 50 contacts' },
  { icon: '✅', label: 'Revenez ici et confirmez le partage' },
  { icon: '⏳', label: 'Un admin valide sous 24h → 1000 crédits !' },
];

function StatusBadge({ status }: { status: ViralShareRequest['status'] }) {
  const map = {
    pending:  { label: 'En attente',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    approved: { label: 'Approuvé',    color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    rejected: { label: 'Refusé',      color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  };
  const s = map[status];
  return (
    <View style={[st.badge, { backgroundColor: s.bg }]}>
      <Text style={[st.badgeTxt, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

export default function ViralShareScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const fetchBalance = useCreditsStore(s => s.fetchBalance);

  const [requests, setRequests] = useState<ViralShareRequest[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shared, setShared] = useState(false); // a ouvert WhatsApp

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [reqs, count] = await Promise.all([
      ViralShareService.getMyRequests(),
      ViralShareService.getTodayCount(),
    ]);
    setRequests(reqs);
    setTodayCount(count);
    setLoading(false);
  }

  async function handleShare() {
    await ViralShareService.openWhatsApp();
    setShared(true);
  }

  async function handleConfirm() {
    if (!shared) {
      Alert.alert('Attention', 'Partagez d\'abord sur WhatsApp avant de confirmer.');
      return;
    }
    setSubmitting(true);
    const res = await ViralShareService.submitShareRequest();
    setSubmitting(false);
    if (res.success) {
      Alert.alert('Demande envoyée !', res.message);
      setShared(false);
      await load();
      await fetchBalance().catch(() => {});
    } else {
      Alert.alert('Erreur', res.message);
    }
  }

  const canSubmit = todayCount < 2;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={st.deco} />
        <View style={st.headerRow}>
          <BackButton />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[st.headerTitle, { color: colors.text }]}>Partage Viral</Text>
            <Text style={[st.headerSub, { color: colors.textSecondary }]}>1000 crédits gratuits</Text>
          </View>
          <View style={[st.rewardBadge, { backgroundColor: 'rgba(201,168,76,0.12)', borderColor: 'rgba(201,168,76,0.3)' }]}>
            <AppIcon icon={Zap} size={14} color="#C9A84C" strokeWidth={2} />
            <Text style={st.rewardTxt}>1000 cr</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>

        {/* Explication */}
        <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={st.cardHeader}>
            <AppIcon icon={Gift} size={20} color="#C9A84C" strokeWidth={2} />
            <Text style={[st.cardTitle, { color: colors.text }]}>Comment obtenir 1000 crédits ?</Text>
          </View>
          <View style={{ gap: 12, marginTop: 12 }}>
            {STEPS.map((step, i) => (
              <View key={i} style={st.step}>
                <Text style={st.stepIcon}>{step.icon}</Text>
                <Text style={[st.stepLabel, { color: colors.textSecondary }]}>{step.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quota du jour */}
        <View style={[st.quotaBar, { backgroundColor: colors.surface, borderColor: todayCount >= 2 ? '#EF4444' : colors.border }]}>
          <AppIcon icon={Clock} size={16} color={todayCount >= 2 ? '#EF4444' : colors.textSecondary} strokeWidth={2} />
          <Text style={[st.quotaTxt, { color: todayCount >= 2 ? '#EF4444' : colors.textSecondary }]}>
            {todayCount}/2 demandes aujourd'hui
          </Text>
          {approvedCount > 0 && (
            <View style={[st.badge, { backgroundColor: 'rgba(16,185,129,0.12)', marginLeft: 'auto' }]}>
              <Text style={[st.badgeTxt, { color: '#10B981' }]}>{approvedCount} approuvé(s)</Text>
            </View>
          )}
        </View>

        {/* Boutons d'action */}
        {canSubmit ? (
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              style={[st.btnPrimary, { backgroundColor: '#25D366' }]}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <AppIcon icon={Share2} size={20} color="#fff" strokeWidth={2.5} />
              <Text style={st.btnPrimaryTxt}>Partager sur WhatsApp</Text>
            </TouchableOpacity>

            {shared && (
              <TouchableOpacity
                style={[st.btnSecondary, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
                onPress={handleConfirm}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <AppIcon icon={CheckCircle2} size={18} color="#fff" strokeWidth={2.5} />
                      <Text style={st.btnPrimaryTxt}>J'ai partagé à 50 contacts</Text>
                    </>
                }
              </TouchableOpacity>
            )}

            {!shared && (
              <Text style={[st.hint, { color: colors.textTertiary }]}>
                Partagez d'abord sur WhatsApp, puis confirmez ici.
              </Text>
            )}
          </View>
        ) : (
          <View style={[st.limitBox, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }]}>
            <Text style={{ fontSize: 20 }}>⏰</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>Limite quotidienne atteinte</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Revenez demain pour 2 nouvelles demandes.</Text>
            </View>
          </View>
        )}

        {/* Historique */}
        {requests.length > 0 && (
          <View style={{ gap: 10 }}>
            <View style={st.sectionHead}>
              <AppIcon icon={Users} size={16} color={colors.primary} strokeWidth={2} />
              <Text style={[st.sectionTitle, { color: colors.text }]}>Mes demandes</Text>
            </View>
            {requests.map((req) => (
              <View key={req.id} style={[st.reqCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[st.reqDate, { color: colors.textSecondary }]}>
                    {new Date(req.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                  {req.status === 'approved' && (
                    <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                      +{req.creditsAwarded} crédits reçus
                    </Text>
                  )}
                </View>
                <StatusBadge status={req.status} />
              </View>
            ))}
          </View>
        )}

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}

      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  header:       { paddingTop: 0, paddingBottom: 18, borderBottomWidth: 1, overflow: 'hidden' },
  deco:         { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(37,211,102,0.06)', top: -80, right: -60 },
  headerRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle:  { fontSize: 18, fontWeight: '800' },
  headerSub:    { fontSize: 12, marginTop: 2 },
  rewardBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  rewardTxt:    { fontSize: 13, fontWeight: '800', color: '#C9A84C' },
  card:         { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle:    { fontSize: 15, fontWeight: '800' },
  step:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepIcon:     { fontSize: 20, width: 28, textAlign: 'center' },
  stepLabel:    { flex: 1, fontSize: 14, lineHeight: 20 },
  quotaBar:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  quotaTxt:     { fontSize: 13, fontWeight: '600' },
  btnPrimary:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 14 },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 14 },
  btnPrimaryTxt:{ fontSize: 15, fontWeight: '800', color: '#fff' },
  hint:         { fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
  limitBox:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 16 },
  sectionHead:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  reqCard:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14 },
  reqDate:      { fontSize: 13, fontWeight: '600' },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt:     { fontSize: 12, fontWeight: '700' },
});
