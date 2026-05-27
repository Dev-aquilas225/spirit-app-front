/**
 * CreditGate — modal shown when user has insufficient credits.
 * Options: watch ad (+100 credits) or buy a credit pack via Paystack.
 * Subscribers never see this modal (bypassed in useAIChat).
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, Linking, Modal, Platform,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Crown, Play, Share2, X, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCreditsStore, CreditAction, CREDIT_COSTS, CREDIT_PACKS } from '../../store/credits.store';
import { useTheme } from '../../theme';
import { http } from '../../services/http.client';

interface Props {
  visible: boolean;
  action: CreditAction;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreditGate({ visible, action, onClose, onSuccess }: Props) {
  const { colors } = useTheme();
  const { credits, adsAvailable, adReward, purchase, fetchBalance } = useCreditsStore();
  const [loading, setLoading] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const cost = CREDIT_COSTS[action];

  const handleAdReward = async () => {
    setAdLoading(true);
    await adReward();
    setAdLoading(false);
    if (useCreditsStore.getState().credits >= cost) onSuccess();
  };

  const handlePurchase = async (packId: string, price: number) => {
    setLoading(true);
    try {
      const res = await http.post<{ authorization_url: string; reference: string }>(
        '/payments/initialize',
        { amount: price, plan: packId, type: 'credits' }
      );
      if (res?.authorization_url) {
        if (Platform.OS === 'web') window.open(res.authorization_url, '_blank');
        else await Linking.openURL(res.authorization_url);

        // Polling toutes les 4s pendant 3 min pour détecter le paiement confirmé
        let attempts = 0;
        const maxAttempts = 45;
        const poll = setInterval(async () => {
          attempts++;
          try {
            const statusRes = await http.get<{ status: string }>(`/subscriptions/status/${res.reference}`);
            if (statusRes?.status === 'success' || statusRes?.status === 'active') {
              clearInterval(poll);
              await purchase(packId, res.reference);
              await fetchBalance();
              setLoading(false);
              if (useCreditsStore.getState().credits >= cost) onSuccess();
              return;
            }
          } catch {}
          if (attempts >= maxAttempts) {
            clearInterval(poll);
            setLoading(false);
          }
        }, 4000);
        return;
      }
    } catch {}
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.iconWrap}>
              <Zap size={28} color="#C9A84C" strokeWidth={2} />
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[s.title, { color: colors.text }]}>Crédits insuffisants</Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>
            Vos prédictions attendent !{'\n'}
            Il vous faut <Text style={{ color: '#C9A84C', fontWeight: '700' }}>{cost} crédits</Text>
            {' '}· Solde : <Text style={{ color: colors.text, fontWeight: '700' }}>{credits}</Text>
          </Text>

          {/* ── Option 1 : S'abonner (accès illimité) ── */}
          <TouchableOpacity
            style={[s.subBtn]}
            onPress={() => { onClose(); router.push('/subscription'); }}
            activeOpacity={0.85}
          >
            <Crown size={20} color="#FFFFFF" strokeWidth={2} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.subBtnTitle}>S'abonner — Accès illimité</Text>
              <Text style={s.subBtnSub}>Dès 3 000 FCFA / semaine · Tous les services</Text>
            </View>
            <Text style={s.subBtnArrow}>→</Text>
          </TouchableOpacity>

          {/* ── Option 2 : Partage viral WhatsApp ── */}
          <TouchableOpacity
            style={[s.shareBtn, { borderColor: '#25D366' }]}
            onPress={() => { onClose(); router.push('/viral-share'); }}
            activeOpacity={0.85}
          >
            <Share2 size={18} color="#25D366" strokeWidth={2.5} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.shareBtnTitle, { color: colors.text }]}>Partager à 50 contacts</Text>
              <Text style={[s.shareBtnSub, { color: colors.textSecondary }]}>+1000 crédits gratuits · Validation sous 24h</Text>
            </View>
            <Text style={{ fontSize: 16, color: '#25D366', fontWeight: '700' }}>→</Text>
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={[s.line, { backgroundColor: colors.border }]} />
            <Text style={[s.dividerText, { color: colors.textSecondary }]}>ou acheter des crédits</Text>
            <View style={[s.line, { backgroundColor: colors.border }]} />
          </View>

          {/* Ad option */}
          {adsAvailable > 0 && (
            <TouchableOpacity
              style={[s.adBtn, { borderColor: '#C9A84C' }]}
              onPress={handleAdReward}
              disabled={adLoading}
            >
              {adLoading ? <ActivityIndicator color="#C9A84C" /> : (
                <>
                  <Play size={18} color="#C9A84C" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[s.adTitle, { color: colors.text }]}>Regarder une publicité</Text>
                    <Text style={[s.adSub, { color: colors.textSecondary }]}>
                      +100 crédits gratuits · {adsAvailable}/3 restantes aujourd'hui
                    </Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Divider */}
          {/* Packs */}
          {CREDIT_PACKS.map((pack) => (
            <TouchableOpacity
              key={pack.id}
              style={[s.pack, { backgroundColor: colors.background, borderColor: pack.id === 'standard' ? '#C9A84C' : colors.border }]}
              onPress={() => handlePurchase(pack.id, pack.price)}
              disabled={loading}
            >
              <View style={{ flex: 1 }}>
                <View style={s.packHeader}>
                  <Text style={[s.packName, { color: colors.text }]}>{pack.label}</Text>
                  {'badge' in pack && pack.badge && <Text style={s.badge}>{pack.badge as string}</Text>}
                </View>
                <Text style={[s.packCredits, { color: '#C9A84C' }]}>{pack.credits.toLocaleString()} crédits</Text>
              </View>
              <Text style={[s.packPrice, { color: colors.text }]}>{pack.priceLabel}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(201,168,76,0.15)', alignItems: 'center', justifyContent: 'center' },
  closeBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  adBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 16 },
  adTitle: { fontSize: 15, fontWeight: '700' },
  adSub: { fontSize: 12, marginTop: 2 },
  divider:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  line:        { flex: 1, height: 1 },
  dividerText: { fontSize: 12, marginHorizontal: 10 },
  subBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1628', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#C9A84C' },
  subBtnTitle: { fontSize: 14, fontWeight: '800', color: '#C9A84C' },
  subBtnSub:   { fontSize: 11, color: 'rgba(201,168,76,0.65)', marginTop: 2 },
  subBtnArrow: { fontSize: 18, color: '#C9A84C', fontWeight: '700' },
  shareBtn:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 12 },
  shareBtnTitle: { fontSize: 14, fontWeight: '700' },
  shareBtnSub:   { fontSize: 11, marginTop: 2 },
  pack: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 10 },
  packHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  packName: { fontSize: 15, fontWeight: '700' },
  badge: { fontSize: 11, color: '#C9A84C', fontWeight: '600' },
  packCredits: { fontSize: 13, fontWeight: '600' },
  packPrice: { fontSize: 16, fontWeight: '800' },
});
