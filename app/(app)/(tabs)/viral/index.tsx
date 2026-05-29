/**
 * Onglet Viral — Partage WhatsApp + Parrainage
 * Deux sections : partage viral (1000 crédits) + parrainage (200 crédits)
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  CheckCircle2, Clock, Copy, Gift,
  Share2, Users, Zap,
} from 'lucide-react-native';
import { Platform, Share } from 'react-native';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { useTheme } from '../../../../src/theme';
import { useAuth } from '../../../../src/hooks/useAuth';
import { useCreditsStore } from '../../../../src/store/credits.store';
import { ViralShareService, ViralShareRequest } from '../../../../src/services/viral-share.service';
import { ReferralsService } from '../../../../src/services/referrals.service';
import { http } from '../../../../src/services/http.client';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? 'https://oracle-plus.online';

function StatusBadge({ status }: { status: ViralShareRequest['status'] }) {
  const map = {
    pending:  { label: 'En attente', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    approved: { label: 'Approuvé',   color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    rejected: { label: 'Refusé',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  };
  const s = map[status];
  return (
    <View style={[st.badge, { backgroundColor: s.bg }]}>
      <Text style={[st.badgeTxt, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

export default function ViralScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const fetchBalance = useCreditsStore(s => s.fetchBalance);
  const credits = useCreditsStore(s => s.credits);

  // Viral share state
  const [requests, setRequests] = useState<ViralShareRequest[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loadingViral, setLoadingViral] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shared, setShared] = useState(false);

  // Referral state
  const [refCode, setRefCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [refCount, setRefCount] = useState(0);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoadingViral(true);
    const [reqs, count, refData] = await Promise.all([
      ViralShareService.getMyRequests(),
      ViralShareService.getTodayCount(),
      ReferralsService.getMine(),
    ]);
    setRequests(reqs);
    setTodayCount(count);
    setRefCode(refData?.referralCode ?? refData?.code ?? user?.referralCode ?? '');
    setRefCount(refData?.referrals?.length ?? 0);
    setLoadingViral(false);
  }

  async function handleShare() {
    await ViralShareService.openWhatsApp();
    setShared(true);
  }

  async function handleConfirm() {
    if (!shared) {
      Alert.alert('Attention', "Partagez d'abord sur WhatsApp avant de confirmer.");
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

  async function handleCopyCode() {
    if (!refCode) return;
    if (Platform.OS === 'web' && navigator?.clipboard) {
      await navigator.clipboard.writeText(refCode);
    } else {
      await Share.share({ message: refCode });
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleShareRef() {
    const msg = `Oracle Plus — Guide spirituel africain\n\nUtilise mon code de parrainage *${refCode}* et reçois 200 crédits offerts à l'inscription !\n\n${APP_URL}`;
    await Share.share({ message: msg });
  }

  const canSubmit = todayCount < 2;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.surface, paddingTop: insets.top + 14, borderBottomColor: colors.border }]}>
        <View style={st.headerOrb} />
        <View style={st.headerRow}>
          <View style={[st.headerIcon, { backgroundColor: '#25D36620', borderColor: '#25D36630' }]}>
            <AppIcon icon={Share2} size={20} color='#25D366' strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Viralité</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              Partagez et gagnez des crédits
            </Text>
          </View>
          <View style={[st.creditsBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
            <AppIcon icon={Zap} size={13} color={colors.primary} strokeWidth={2.2} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>{credits.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section 1 : Partage Viral ── */}
        <View style={[st.sectionHead]}>
          <View style={[st.sectionAccent, { backgroundColor: '#25D366' }]} />
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Partage WhatsApp</Text>
          <View style={[st.pill, { backgroundColor: 'rgba(37,211,102,0.12)', borderColor: 'rgba(37,211,102,0.3)' }]}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#25D366' }}>+1000 crédits</Text>
          </View>
        </View>

        {/* Quota */}
        <View style={[st.quotaBar, { backgroundColor: colors.surface, borderColor: todayCount >= 2 ? '#EF4444' : colors.border }]}>
          <AppIcon icon={Clock} size={15} color={todayCount >= 2 ? '#EF4444' : colors.textSecondary} strokeWidth={2} />
          <Text style={[st.quotaTxt, { color: todayCount >= 2 ? '#EF4444' : colors.textSecondary }]}>
            {todayCount}/2 demandes aujourd'hui
          </Text>
          {approvedCount > 0 && (
            <View style={[st.badge, { backgroundColor: 'rgba(16,185,129,0.12)', marginLeft: 'auto' }]}>
              <Text style={[st.badgeTxt, { color: '#10B981' }]}>{approvedCount} approuvé(s)</Text>
            </View>
          )}
        </View>

        {/* Boutons partage */}
        {canSubmit ? (
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={[st.btnGreen]}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <AppIcon icon={Share2} size={18} color='#fff' strokeWidth={2.5} />
              <Text style={st.btnTxt}>Partager sur WhatsApp</Text>
            </TouchableOpacity>

            {shared && (
              <TouchableOpacity
                style={[st.btnGold, { opacity: submitting ? 0.7 : 1 }]}
                onPress={handleConfirm}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting
                  ? <ActivityIndicator size='small' color='#1A1A3E' />
                  : <>
                      <AppIcon icon={CheckCircle2} size={16} color='#1A1A3E' strokeWidth={2.5} />
                      <Text style={[st.btnTxt, { color: '#1A1A3E' }]}>J'ai partagé à 50 contacts</Text>
                    </>
                }
              </TouchableOpacity>
            )}

            {!shared && (
              <Text style={{ fontSize: 12, color: colors.textTertiary, textAlign: 'center', fontStyle: 'italic' }}>
                Partagez d'abord sur WhatsApp, puis confirmez ici.
              </Text>
            )}
          </View>
        ) : (
          <View style={[st.limitBox, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }]}>
            <Text style={{ fontSize: 18 }}>⏰</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>Limite quotidienne atteinte</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Revenez demain pour 2 nouvelles demandes.</Text>
            </View>
          </View>
        )}

        {/* Historique demandes */}
        {requests.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>Mes demandes</Text>
            {requests.map(req => (
              <View key={req.id} style={[st.reqCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
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

        {loadingViral && <ActivityIndicator color={colors.primary} />}

        {/* Séparateur */}
        <View style={[st.divider, { backgroundColor: colors.border }]} />

        {/* ── Section 2 : Parrainage ── */}
        <View style={st.sectionHead}>
          <View style={[st.sectionAccent, { backgroundColor: colors.primary }]} />
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Parrainage</Text>
          <View style={[st.pill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>+200 crédits chacun</Text>
          </View>
        </View>

        {/* Stats parrainage */}
        <View style={[st.refStats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={st.refStat}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.primary }}>{refCount}</Text>
            <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 2 }}>Filleuls</Text>
          </View>
          <View style={[st.refStatDiv, { backgroundColor: colors.border }]} />
          <View style={st.refStat}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.primary }}>{(refCount * 200).toLocaleString()}</Text>
            <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 2 }}>Crédits gagnés</Text>
          </View>
          <View style={[st.refStatDiv, { backgroundColor: colors.border }]} />
          <View style={st.refStat}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.primary }}>{credits.toLocaleString()}</Text>
            <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 2 }}>Solde actuel</Text>
          </View>
        </View>

        {/* Code parrainage */}
        <View style={[st.codeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginBottom: 10 }}>
            Votre code de parrainage
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: 3 }}>
              {refCode || '—'}
            </Text>
            <TouchableOpacity
              style={[st.copyBtn, {
                backgroundColor: copied ? 'rgba(16,185,129,0.15)' : colors.primary + '18',
                borderColor: copied ? '#10B981' : colors.primary,
              }]}
              onPress={handleCopyCode}
            >
              <AppIcon icon={copied ? CheckCircle2 : Copy} size={15} color={copied ? '#10B981' : colors.primary} strokeWidth={2.2} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: copied ? '#10B981' : colors.primary }}>
                {copied ? 'Copié !' : 'Copier'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA partage parrainage */}
        <TouchableOpacity style={st.btnGold} onPress={handleShareRef} activeOpacity={0.85}>
          <AppIcon icon={Gift} size={18} color='#1A1A3E' strokeWidth={2.2} />
          <Text style={[st.btnTxt, { color: '#1A1A3E' }]}>Partager mon lien de parrainage</Text>
        </TouchableOpacity>

        {/* Voir plus */}
        <TouchableOpacity
          onPress={() => router.push('/referral' as any)}
          style={[st.linkBtn, { borderColor: colors.border }]}
        >
          <AppIcon icon={Users} size={15} color={colors.textSecondary} strokeWidth={2} />
          <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>
            Voir tous mes filleuls
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  header:       { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, overflow: 'hidden', position: 'relative' },
  headerOrb:    { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(37,211,102,0.05)', top: -60, right: -40 },
  headerRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon:   { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  creditsBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  sectionHead:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccent:{ width: 4, height: 18, borderRadius: 2 },
  pill:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  quotaBar:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  quotaTxt:     { fontSize: 13, fontWeight: '600' },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt:     { fontSize: 12, fontWeight: '700' },
  btnGreen:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 14, backgroundColor: '#25D366' },
  btnGold:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 14, backgroundColor: '#C9A84C' },
  btnTxt:       { fontSize: 15, fontWeight: '800', color: '#fff' },
  limitBox:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 16 },
  reqCard:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14 },
  divider:      { height: 1, marginVertical: 4 },
  refStats:     { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 16 },
  refStat:      { flex: 1, alignItems: 'center' },
  refStatDiv:   { width: 1, height: 36 },
  codeCard:     { borderRadius: 16, borderWidth: 1, padding: 16 },
  copyBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  linkBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 12 },
});
