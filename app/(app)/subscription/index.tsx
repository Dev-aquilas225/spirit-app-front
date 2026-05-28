import { useSafeAreaInsets } from 'react-native-safe-area-context';
/**
 * Boutique Oracle Plus — Crédits + Abonnements
 * Deux onglets : Crédits (freemium) et Abonnements (illimité 24h/24)
 */
import React, { useState } from 'react';
import {
  Linking, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  Calendar, Check, Clock, Crown, Infinity,
  ShoppingBag, Sparkles, Star, Zap,
} from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { useTheme } from '../../../src/theme';
import { useAccess } from '../../../src/hooks/useAccess';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { useCreditsStore, CREDIT_PACKS } from '../../../src/store/credits.store';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '../../../src/services/payment.service';
import { http } from '../../../src/services/http.client';
import { formatDate } from '../../../src/utils/helpers';

type Tab = 'credits' | 'subscriptions';

/* ─── Tab bar ─────────────────────────────────────────────────────────────── */
function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[tb.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {(['credits', 'subscriptions'] as Tab[]).map((t) => {
        const isActive = active === t;
        return (
          <TouchableOpacity key={t} onPress={() => onChange(t)} style={[tb.tab, isActive && tb.tabActive]} activeOpacity={0.8}>
            <AppIcon icon={t === 'credits' ? Zap : Crown} size={15} color={isActive ? '#C9A84C' : colors.textSecondary} strokeWidth={2.4} />
            <Text style={[tb.label, { color: isActive ? '#C9A84C' : colors.textSecondary }]}>
              {t === 'credits' ? 'Crédits' : 'Abonnements'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ─── Credits tab ─────────────────────────────────────────────────────────── */
function CreditsTab() {
  const { colors } = useTheme();
  const credits = useCreditsStore((s) => s.credits);
  const { hasSubscription } = useAccess();
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (packId: string, price: number) => {
    setLoading(packId);
    try {
      const res = await http.post<{ paymentUrl?: string; authorization_url?: string; reference: string }>(
        '/subscriptions/initiate',
        { plan: packId, autoRenew: false }
      );
      const url = res?.paymentUrl ?? res?.authorization_url;
      if (url) {
        if (Platform.OS === 'web') window.location.href = url;
        else await Linking.openURL(url);
      }
    } catch {}
    setLoading(null);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16 }}>
      {/* Balance */}
      <View style={[ct.balanceCard, { backgroundColor: '#1A1A3E' }]}>
        <View style={ct.balanceRow}>
          <View style={ct.balanceIcon}>
            <AppIcon icon={Zap} size={24} color="#C9A84C" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ct.balanceLabel}>Votre solde</Text>
            <Text style={ct.balanceValue}>{credits.toLocaleString()} crédits</Text>
          </View>
          {hasSubscription && (
            <View style={ct.subBadge}>
              <AppIcon icon={Infinity} size={14} color="#C9A84C" />
              <Text style={ct.subBadgeText}>Illimité</Text>
            </View>
          )}
        </View>
        <Text style={ct.balanceNote}>
          {hasSubscription ? 'Abonnement actif — accès illimité' : '1 crédit = 1 mot · 2 000 crédits offerts à l\'inscription'}
        </Text>
      </View>

      {/* Tarifs */}
      <View style={[ct.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[ct.infoTitle, { color: colors.text }]}>Coût par service</Text>
        {[
          ['💬', 'Voyance', '50 crédits'],
          ['🌙', 'Interprétation de rêve', '80 crédits'],
          ['🔮', 'Consultation prophétique', '100 crédits'],
          ['🙏', 'Génération de prière', '20 crédits'],
          ['🎵', 'Audio aperçu (100 mots)', '10 crédits'],
          ['🎧', 'Audio standard (1000 mots)', '50 crédits'],
        ].map(([emoji, label, cost]) => (
          <View key={label} style={ct.infoRow}>
            <Text style={ct.infoEmoji}>{emoji}</Text>
            <Text style={[ct.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
            <Text style={[ct.infoCost, { color: '#C9A84C' }]}>{cost}</Text>
          </View>
        ))}
      </View>

      {/* Packs */}
      <Text style={[ct.sectionTitle, { color: colors.text }]}>Recharger mes crédits</Text>
      {CREDIT_PACKS.map((pack) => (
        <TouchableOpacity
          key={pack.id}
          style={[ct.packCard, { backgroundColor: colors.surface, borderColor: pack.id === 'standard' ? '#C9A84C' : colors.border, borderWidth: pack.id === 'standard' ? 2 : 1 }]}
          onPress={() => handleBuy(pack.id, pack.price)}
          disabled={loading === pack.id}
          activeOpacity={0.85}
        >
          {'badge' in pack && pack.badge && <View style={ct.packBadge}><Text style={ct.packBadgeText}>{pack.badge as string}</Text></View>}
          <View style={ct.packLeft}>
            <View style={ct.packIconWrap}>
              <AppIcon icon={Zap} size={20} color="#C9A84C" strokeWidth={2} />
            </View>
            <View>
              <Text style={[ct.packName, { color: colors.text }]}>{pack.label}</Text>
              <Text style={[ct.packCredits, { color: '#C9A84C' }]}>{pack.credits.toLocaleString()} crédits</Text>
            </View>
          </View>
          <View style={ct.packRight}>
            <Text style={[ct.packPrice, { color: colors.text }]}>{pack.priceLabel}</Text>
            {loading === pack.id
              ? <ActivityIndicator size="small" color="#C9A84C" />
              : <Text style={ct.packCta}>Acheter →</Text>}
          </View>
        </TouchableOpacity>
      ))}

      {/* Pub gratuite */}
      <View style={[ct.adCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppIcon icon={Sparkles} size={20} color="#F59E0B" strokeWidth={2.2} />
        <View style={{ flex: 1 }}>
          <Text style={[ct.adTitle, { color: colors.text }]}>Regarder une publicité</Text>
          <Text style={[ct.adSub, { color: colors.textSecondary }]}>+100 crédits gratuits · 3 fois par jour</Text>
        </View>
        <TouchableOpacity style={ct.adBtn} onPress={() => router.push('/subscription/payment')}>
          <Text style={ct.adBtnText}>Voir</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ─── Subscriptions tab ───────────────────────────────────────────────────── */
function SubscriptionsTab() {
  const { colors } = useTheme();
  const { hasSubscription } = useAccess();
  const { subscription, daysUntilExpiry, isExpiringSoon, initiatePayment } = useSubscription();
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null);
  const [selected, setSelected] = useState<SubscriptionPlan>('monthly');

  const PLAN_ICONS = { weekly: Clock, weekly_plus: Star, monthly: Crown } as const;
  const PLAN_COLORS = { weekly: '#3B82F6', weekly_plus: '#8B5CF6', monthly: '#C9A84C' } as const;

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelected(plan);
    router.push(`/subscription/payment?plan=${plan}` as any);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16 }}>
      {/* Active status */}
      {hasSubscription && subscription && (
        <View style={[st.activeCard, { backgroundColor: '#1A1A3E' }]}>
          <View style={st.activeRow}>
            <AppIcon icon={Crown} size={28} color="#C9A84C" strokeWidth={1.8} />
            <View style={{ flex: 1 }}>
              <Text style={st.activeTitle}>Abonnement actif ✓</Text>
              <Text style={st.activeSub}>Expire le {formatDate(subscription.expiryDate)} · {daysUntilExpiry}j restants</Text>
            </View>
            <View style={st.activeBadge}><Text style={st.activeBadgeText}>VIP</Text></View>
          </View>
          {isExpiringSoon && (
            <TouchableOpacity style={st.renewBtn} onPress={() => handleSubscribe(selected)}>
              <Text style={st.renewBtnText}>Renouveler maintenant</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Avantages */}
      <View style={[st.valueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[st.valueTitle, { color: colors.text }]}>Pourquoi s'abonner ?</Text>
        {[
          [Infinity, 'Crédits non consommés — accès illimité'],
          [ShoppingBag, 'Audio illimité (1000 mots par service)'],
          [Star, 'Consultations prophétiques prioritaires'],
          [Check, 'Bibliothèque complète débloquée'],
        ].map(([Icon, text]) => (
          <View key={text as string} style={st.valueRow}>
            <AppIcon icon={Icon as any} size={16} color="#C9A84C" strokeWidth={2.2} />
            <Text style={[st.valueText, { color: colors.textSecondary }]}>{text as string}</Text>
          </View>
        ))}
      </View>

      {/* Plans */}
      <Text style={[st.sectionTitle, { color: colors.text }]}>Choisir un plan</Text>
      {SUBSCRIPTION_PLANS.map((plan) => {
        const Icon = PLAN_ICONS[plan.id];
        const color = PLAN_COLORS[plan.id];
        const isSelected = selected === plan.id;
        return (
          <TouchableOpacity
            key={plan.id}
            onPress={() => setSelected(plan.id)}
            style={[st.planCard, { backgroundColor: colors.surface, borderColor: isSelected ? color : colors.border, borderWidth: isSelected ? 2 : 1 }]}
            activeOpacity={0.85}
          >
            {plan.badge && (
              <View style={[st.planBadge, { backgroundColor: color + '20', borderColor: color }]}>
                <Text style={[st.planBadgeText, { color }]}>{plan.badge}</Text>
              </View>
            )}
            <View style={st.planHeader}>
              <View style={[st.planIcon, { backgroundColor: color + '18' }]}>
                <AppIcon icon={Icon} size={22} color={color} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[st.planName, { color: colors.text }]}>{plan.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <AppIcon icon={Calendar} size={12} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[st.planDuration, { color: colors.textSecondary }]}>{plan.durationDays} jours d'accès illimité</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[st.planPrice, { color }]}>{plan.priceLabel}</Text>
                <Text style={[st.planPerDay, { color: colors.textTertiary }]}>{Math.round(plan.price / plan.durationDays)} FCFA/j</Text>
              </View>
            </View>
            <View style={[st.planFeatures, { borderTopColor: colors.border }]}>
              {plan.features.map((f) => (
                <View key={f} style={st.featureRow}>
                  <AppIcon icon={Check} size={13} color="#10B981" strokeWidth={3} />
                  <Text style={[st.featureText, { color: colors.textSecondary }]}>{f}</Text>
                </View>
              ))}
            </View>
            {isSelected && <View style={[st.selectedBar, { backgroundColor: color }]} />}
          </TouchableOpacity>
        );
      })}

      {/* CTA */}
      <TouchableOpacity
        style={[st.cta, { opacity: loading ? 0.7 : 1 }]}
        onPress={() => handleSubscribe(selected)}
        disabled={loading !== null}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#1A1A3E" />
        ) : (
          <><AppIcon icon={Crown} size={20} color="#1A1A3E" strokeWidth={2.4} />
          <Text style={st.ctaText}>S'abonner — {SUBSCRIPTION_PLANS.find(p => p.id === selected)?.priceLabel}</ Text></>
        )}
      </TouchableOpacity>
      <Text style={[st.disclaimer, { color: colors.textTertiary }]}>
        Paiement sécurisé via Paystack · Annulation à tout moment
      </Text>
    </ScrollView>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function BoutiqueScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('subscriptions');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={s.header}>
        <View style={s.deco1} /><View style={s.deco2} />
        <View style={s.headerContent}>
          <BackButton variant="dark" />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.headerTitle}>Boutique Oracle Plus</Text>
            <Text style={s.headerSub}>Crédits & Abonnements</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <TabBar active={tab} onChange={setTab} />
      </View>
      {tab === 'credits' ? <CreditsTab /> : <SubscriptionsTab />}
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingTop: 0, paddingBottom: 24, backgroundColor: '#1A1A3E', overflow: 'hidden', position: 'relative' },
  deco1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(201,168,76,0.12)', top: -60, right: -40 },
  deco2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(124,58,237,0.15)', bottom: -30, left: -20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
});
const tb = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: 'rgba(201,168,76,0.15)' },
  label: { fontSize: 14, fontWeight: '700' },
});
const ct = StyleSheet.create({
  balanceCard: { borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  balanceIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(201,168,76,0.15)', alignItems: 'center', justifyContent: 'center' },
  balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 2 },
  balanceValue: { fontSize: 24, fontWeight: '900', color: '#C9A84C' },
  balanceNote: { fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 18 },
  subBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(201,168,76,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#C9A84C' },
  subBadgeText: { color: '#C9A84C', fontSize: 11, fontWeight: '700' },
  infoBox: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  infoTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoEmoji: { fontSize: 16, width: 24 },
  infoLabel: { fontSize: 13, flex: 1 },
  infoCost: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  packCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' },
  packBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(201,168,76,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  packBadgeText: { fontSize: 10, color: '#C9A84C', fontWeight: '700' },
  packLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  packIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(201,168,76,0.12)', alignItems: 'center', justifyContent: 'center' },
  packName: { fontSize: 15, fontWeight: '700' },
  packCredits: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  packRight: { alignItems: 'flex-end', gap: 4 },
  packPrice: { fontSize: 16, fontWeight: '800' },
  packCta: { fontSize: 12, fontWeight: '700', color: '#C9A84C' },
  adCard: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  adTitle: { fontSize: 14, fontWeight: '700' },
  adSub: { fontSize: 12, marginTop: 2 },
  adBtn: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#F59E0B' },
  adBtnText: { color: '#F59E0B', fontWeight: '700', fontSize: 13 },
});
const st = StyleSheet.create({
  activeCard: { borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  activeTitle: { fontSize: 16, fontWeight: '800', color: '#C9A84C' },
  activeSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  activeBadge: { backgroundColor: 'rgba(201,168,76,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#C9A84C' },
  activeBadgeText: { color: '#C9A84C', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  renewBtn: { marginTop: 14, backgroundColor: '#C9A84C', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  renewBtnText: { color: '#1A1A3E', fontWeight: '800', fontSize: 14 },
  valueCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  valueTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  valueText: { fontSize: 13, flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  planCard: { borderRadius: 18, padding: 16, position: 'relative', overflow: 'hidden' },
  planBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  planBadgeText: { fontSize: 11, fontWeight: '700' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: 16, fontWeight: '800' },
  planDuration: { fontSize: 12 },
  planPrice: { fontSize: 20, fontWeight: '900' },
  planPerDay: { fontSize: 11, marginTop: 2 },
  planFeatures: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, flex: 1 },
  selectedBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  cta: { backgroundColor: '#C9A84C', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { fontSize: 16, fontWeight: '900', color: '#1A1A3E' },
  disclaimer: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
