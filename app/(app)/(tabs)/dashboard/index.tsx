/**
 * Dashboard — Écran d'accueil Oracle Plus
 * Message du Jour + 3 boutons principaux (Rêves, Voyance, Prière)
 */
import { router } from 'expo-router';
import { CloudMoon, Eye, Sparkles, Crown, Zap } from 'lucide-react-native';
import React from 'react';
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { DailyMessage } from '../../../../src/components/home/DailyMessage';
import { useAuthStore } from '../../../../src/store/auth.store';
import { useCreditsStore } from '../../../../src/store/credits.store';
import { useAccess } from '../../../../src/hooks/useAccess';
import { useTheme } from '../../../../src/theme';

const ACTIONS = [
  {
    id: 'dreams',
    label: 'Interprétation des Rêves',
    sub: 'Découvrez le sens spirituel de vos rêves',
    icon: CloudMoon,
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.12)',
    route: '/(app)/(tabs)/home',
  },
  {
    id: 'voyance',
    label: 'Voyance & Consultation',
    sub: 'Guidance prophétique personnalisée',
    icon: Eye,
    color: '#C9A84C',
    bg: 'rgba(201,168,76,0.12)',
    route: '/(app)/(tabs)/ai',
  },
  {
    id: 'prayer',
    label: 'Prière & Intercession',
    sub: 'Prières générées selon votre situation',
    icon: Sparkles,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    route: '/(app)/(tabs)/prayers',
  },
] as const;

export default function DashboardScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const credits = useCreditsStore((s) => s.credits);
  const { hasSubscription } = useAccess();

  const firstName = user?.firstName?.trim() || user?.name?.split(' ')[0] || 'vous';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[st.header, { paddingTop: insets.top + 16 }]}>
        <View style={st.headerDeco1} />
        <View style={st.headerDeco2} />
        <View style={st.headerContent}>
          <View>
            <Text style={st.greeting}>Bonjour, {firstName} 👋</Text>
            <Text style={st.subtitle}>Que souhaitez-vous explorer aujourd'hui ?</Text>
          </View>
          {/* Solde crédits */}
          <TouchableOpacity
            style={[st.creditBadge, { backgroundColor: hasSubscription ? 'rgba(201,168,76,0.2)' : 'rgba(201,168,76,0.12)', borderColor: 'rgba(201,168,76,0.4)' }]}
            onPress={() => router.push('/subscription' as any)}
            activeOpacity={0.8}
          >
            <AppIcon icon={hasSubscription ? Crown : Zap} size={14} color="#C9A84C" strokeWidth={2.4} />
            <Text style={st.creditText}>
              {hasSubscription ? 'VIP' : `${credits.toLocaleString()} cr.`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ padding: spacing.base, gap: 20 }}>
        {/* Message du Jour */}
        <DailyMessage />

        {/* 3 boutons principaux */}
        <Text style={[st.sectionTitle, { color: colors.text }]}>Nos services</Text>
        <View style={st.actionsGrid}>
          {ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[st.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.82}
            >
              <View style={[st.actionIcon, { backgroundColor: action.bg }]}>
                <AppIcon icon={action.icon} size={28} color={action.color} strokeWidth={1.8} />
              </View>
              <Text style={[st.actionLabel, { color: colors.text }]}>{action.label}</Text>
              <Text style={[st.actionSub, { color: colors.textSecondary }]}>{action.sub}</Text>
              <View style={[st.actionArrow, { backgroundColor: action.bg }]}>
                <Text style={[st.actionArrowText, { color: action.color }]}>Accéder →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bannière abonnement si non abonné */}
        {!hasSubscription && (
          <TouchableOpacity
            style={st.premiumBanner}
            onPress={() => router.push('/subscription' as any)}
            activeOpacity={0.88}
          >
            <View style={st.premiumLeft}>
              <AppIcon icon={Crown} size={22} color="#C9A84C" strokeWidth={1.8} />
              <View>
                <Text style={st.premiumTitle}>Passer en VIP</Text>
                <Text style={st.premiumSub}>Accès illimité à tous les services</Text>
              </View>
            </View>
            <Text style={st.premiumCta}>Voir →</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  header:        { backgroundColor: '#1A1A3E', paddingHorizontal: 20, paddingBottom: 28, overflow: 'hidden', position: 'relative' },
  headerDeco1:   { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(201,168,76,0.08)', top: -60, right: -40 },
  headerDeco2:   { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(124,58,237,0.1)', bottom: -50, left: -30 },
  headerContent: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting:      { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle:      { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  creditBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  creditText:    { fontSize: 12, fontWeight: '700', color: '#C9A84C' },
  sectionTitle:  { fontSize: 16, fontWeight: '800' },
  actionsGrid:   { gap: 14 },
  actionCard:    { borderRadius: 18, borderWidth: 1, padding: 18, gap: 8 },
  actionIcon:    { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  actionLabel:   { fontSize: 16, fontWeight: '800' },
  actionSub:     { fontSize: 13, lineHeight: 19 },
  actionArrow:   { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginTop: 4 },
  actionArrowText: { fontSize: 13, fontWeight: '700' },
  premiumBanner: { backgroundColor: '#1A1A3E', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  premiumLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  premiumTitle:  { fontSize: 15, fontWeight: '800', color: '#C9A84C' },
  premiumSub:    { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  premiumCta:    { fontSize: 14, fontWeight: '700', color: '#C9A84C' },
});
