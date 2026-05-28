import { router } from 'expo-router';
import {
  Bell, BookOpen, CloudMoon, Crown, Eye,
  Heart, MessageCircle, Share2, Sparkles, Star, Users, Zap,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { CreditBadge } from '../../../../src/components/credits/CreditBadge';
import { LoginModal } from '../../../../src/components/auth/LoginModal';
import { DailyChallenge } from '../../../../src/components/gamification/DailyChallenge';
import { getTodayMessage } from '../../../../src/data/messages.data';
import { useAuth } from '../../../../src/hooks/useAuth';
import { useAccess } from '../../../../src/hooks/useAccess';
import { useAuthStore } from '../../../../src/store/auth.store';
import { useGamificationStore, getLevelFromXp, getXpProgress, getNextLevel } from '../../../../src/store/gamification.store';
import { useTheme } from '../../../../src/theme';
import { formatDate } from '../../../../src/utils/helpers';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 52) / 2;

function XPBar() {
  const { xp, streak } = useGamificationStore();
  const { colors } = useTheme();
  const level = getLevelFromXp(xp);
  const next  = getNextLevel(xp);
  const pct   = getXpProgress(xp);
  const anim  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct / 100, duration: 1200, useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={[xp_.wrap, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '20' }]}>
      <View style={xp_.row}>
        <View style={[xp_.badge, { borderColor: level.color + '40' }]}>
          <Text style={[xp_.lvlNum, { color: level.color }]}>{level.level}</Text>
          <Text style={[xp_.lvlName, { color: colors.textTertiary }]}>{level.name}</Text>
        </View>
        <View style={{ flex: 1, marginHorizontal: 14 }}>
          <View style={[xp_.track, { backgroundColor: colors.border }]}>
            <Animated.View style={[xp_.fill, {
              width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: level.color,
            }]} />
          </View>
          <Text style={[xp_.xpTxt, { color: colors.textTertiary }]}>{xp} XP{next ? ` · prochain : ${next.minXp}` : ' · MAX'}</Text>
        </View>
        {streak > 0 && (
          <View style={xp_.streak}>
            <Text style={xp_.fire}>🔥</Text>
            <Text style={xp_.streakNum}>{streak}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function DailyThought() {
  const msg = getTodayMessage();
  const { colors } = useTheme();
  if (!msg) return null;
  return (
    <View style={{ backgroundColor: colors.primaryPale, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.primary + '25', marginTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <AppIcon icon={Sparkles} size={12} color={colors.primary} strokeWidth={2.5} />
        <Text style={{ fontSize: 9, fontWeight: '800', color: colors.primary, letterSpacing: 2, textTransform: 'uppercase' }}>PAROLE DU JOUR</Text>
      </View>
      <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22, fontStyle: 'italic' }} numberOfLines={3}>"{msg.content}"</Text>
      {msg.verse && <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600', marginTop: 10, letterSpacing: 0.3 }}>— {msg.verse}</Text>}
    </View>
  );
}

const MODULES = [
  { id: 'dreams',  label: 'Rêves',             sub: 'Illimité', icon: CloudMoon, color: '#818CF8', bg: 'rgba(129,140,248,0.12)', route: '/(app)/(tabs)/home' },
  { id: 'consult', label: 'Consulter',           sub: 'Illimité', icon: Star,      color: '#C9A84C', bg: 'rgba(201,168,76,0.12)',  route: '/(app)/(tabs)/ai' },
  { id: 'accomp',  label: 'Suivi',              sub: 'Illimité', icon: Heart,     color: '#F472B6', bg: 'rgba(244,114,182,0.12)', route: '/accompagnements' },
  { id: 'library', label: 'Livres',             sub: 'Gratuit',  icon: BookOpen,  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  route: '/(app)/(tabs)/library' },
  { id: 'futur',   label: 'Connaître le futur', sub: 'Illimité', icon: Eye,       color: '#2DD4A0', bg: 'rgba(45,212,160,0.12)',  route: '/(app)/(tabs)/ai' },
  { id: 'prayer',  label: 'Prières',            sub: 'Gratuit',  icon: Sparkles,  color: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  route: '/(app)/(tabs)/prayers' },
] as const;

function ModuleCard({ mod, index, hasSub }: { mod: typeof MODULES[number]; index: number; hasSub: boolean }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 60, tension: 50, friction: 8, useNativeDriver: true }).start();
  }, []);
  const free = mod.id === 'prayer' || mod.id === 'library';
  const badgeTxt = hasSub && !free ? '∞ Illimité' : mod.sub;
  const badgeColor = hasSub && !free ? '#2DD4A0' : mod.color;

  return (
    <Animated.View style={{ opacity: anim, transform: [{ scale: anim }, { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
      <TouchableOpacity
        onPress={() => router.push(mod.route as any)}
        style={[mc.card, { width: CARD_W, borderColor: mod.color + '30', backgroundColor: colors.surface }]}
        activeOpacity={0.75}
      >
        <View style={[mc.cardBg, { backgroundColor: mod.bg }]} />
        <View style={[mc.iconWrap, { backgroundColor: mod.bg, borderColor: mod.color + '35' }]}>
          <AppIcon icon={mod.icon} size={22} color={mod.color} strokeWidth={2} />
        </View>
        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, lineHeight: 18 }}>{mod.label}</Text>
        <View style={[mc.badge, { backgroundColor: badgeColor + '18', borderColor: badgeColor + '35' }]}>
          <Text style={[mc.badgeTxt, { color: badgeColor }]}>{badgeTxt}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { hasSubscription, credits } = useAccess();
  const initialize = useAuthStore((s) => s.initialize);
  const { init: initGamif, completeMission } = useGamificationStore();
  const [loginVisible, setLoginVisible] = useState(false);
  const firstName = user?.firstName?.trim() || user?.name?.split(' ')[0] || '';
  const today = formatDate(new Date().toISOString());

  useEffect(() => {
    initialize().catch(() => {});
    initGamif().catch(() => {});
    completeMission('open_app').catch(() => {});
  }, []);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[s.hero, { backgroundColor: colors.surface, paddingTop: insets.top + 12 }]}>
          <View style={s.orb1} /><View style={s.orb2} />
          <View style={[s.topLine, { backgroundColor: colors.primary }]} />
          <View style={s.heroInner}>
            <View style={s.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: 0.2 }}>
                  {firstName ? `Paix, ${firstName}` : 'Oracle Plus'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 3, fontWeight: '500' }}>{today}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <CreditBadge />
                <TouchableOpacity
                  onPress={() => router.push('/notifications' as any)}
                  style={[s.notifBtn, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '30' }]}
                >
                  <AppIcon icon={Bell} size={17} color={colors.primary} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            </View>
            <DailyThought />
          </View>
        </View>

        <View style={s.body}>
          <XPBar />

          {/* Stats bar */}
          <View style={[s.statsBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {hasSubscription ? (
              <View style={s.statItem}>
                <AppIcon icon={Crown} size={13} color={colors.primary} strokeWidth={2.2} />
                <Text style={[s.statTxt, { color: colors.primary }]}>Abonnement actif</Text>
              </View>
            ) : (
              <TouchableOpacity style={s.statItem} onPress={() => router.push('/subscription' as any)}>
                <AppIcon icon={Zap} size={13} color={colors.primary} strokeWidth={2.2} />
                <Text style={[s.statTxt, { color: colors.primary }]}>{credits.toLocaleString()} crédits</Text>
              </TouchableOpacity>
            )}
            <View style={[s.statSep, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={s.statItem} onPress={() => router.push('/referral' as any)}>
              <AppIcon icon={Users} size={13} color="#7B52D4" strokeWidth={2.2} />
              <Text style={[s.statTxt, { color: '#7B52D4' }]}>Parrainer</Text>
            </TouchableOpacity>
            <View style={[s.statSep, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={s.statItem} onPress={() => router.push('/viral-share' as any)}>
              <AppIcon icon={Share2} size={13} color="#25D366" strokeWidth={2.2} />
              <Text style={[s.statTxt, { color: '#25D366' }]}>Partager</Text>
            </TouchableOpacity>
          </View>

          {/* Grille modules */}
          <View>
            <View style={s.sectionHead}>
              <View style={[s.sectionAccent, { backgroundColor: colors.primary }]} />
              <Text style={[s.sectionTitle, { color: colors.text }]}>Services spirituels</Text>
            </View>
            <View style={s.grid}>
              {MODULES.map((m, i) => (
                <ModuleCard key={m.id} mod={m} index={i} hasSub={hasSubscription} />
              ))}
            </View>
          </View>

          {/* Défis quotidiens */}
          {isAuthenticated && (
            <View>
              <View style={s.sectionHead}>
                <View style={[s.sectionAccent, { backgroundColor: colors.primary }]} />
                <Text style={[s.sectionTitle, { color: colors.text }]}>Défis & progression</Text>
              </View>
              <DailyChallenge />
            </View>
          )}

          {/* Banner abonnement */}
          {!hasSubscription && (
            <TouchableOpacity
              style={[s.subBanner, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '35' }]}
              onPress={() => router.push('/subscription' as any)}
              activeOpacity={0.85}
            >
              <View style={s.subLeft}>
                <View style={[s.subIconWrap, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '30' }]}>
                  <AppIcon icon={Crown} size={22} color={colors.primary} strokeWidth={1.8} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Accès illimité</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Dès 3 000 FCFA / semaine</Text>
                </View>
              </View>
              <View style={[s.subCta, { backgroundColor: colors.primary }]}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>Voir</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Connexion */}
          {!isAuthenticated && (
            <TouchableOpacity
              style={[s.loginCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setLoginVisible(true)}
              activeOpacity={0.85}
            >
              <AppIcon icon={Star} size={16} color={colors.primary} strokeWidth={2.2} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>Se connecter</Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>Sauvegardez vos consultations</Text>
              </View>
              <Text style={{ fontSize: 18, color: colors.primary, fontWeight: '700' }}>→</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <LoginModal visible={loginVisible} onClose={() => setLoginVisible(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  hero:          { paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden', position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  orb1:          { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(201,168,76,0.07)', top: -80, right: -60 },
  orb2:          { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(92,47,181,0.07)', bottom: -60, left: -40 },
  topLine:       { height: 3, borderRadius: 2, width: 40, marginBottom: 16 },
  heroInner:     { gap: 14 },
  heroTop:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  notifBtn:      { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  body:          { padding: 16, gap: 18 },
  statsBar:      { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16 },
  statItem:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  statTxt:       { fontSize: 12, fontWeight: '700' },
  statSep:       { width: 1, height: 20 },
  sectionHead:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle:  { fontSize: 16, fontWeight: '800' },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  subBanner:     { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1 },
  subLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subIconWrap:   { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  subCta:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  loginCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 16, borderWidth: 1 },
});

const xp_ = StyleSheet.create({
  wrap:      { borderRadius: 14, padding: 14, borderWidth: 1 },
  row:       { flexDirection: 'row', alignItems: 'center' },
  badge:     { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  lvlNum:    { fontSize: 16, fontWeight: '900' },
  lvlName:   { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  track:     { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill:      { height: '100%', borderRadius: 3 },
  xpTxt:     { fontSize: 11, marginTop: 5 },
  streak:    { alignItems: 'center' },
  fire:      { fontSize: 18 },
  streakNum: { fontSize: 12, fontWeight: '800', color: '#F97316' },
});

const mc = StyleSheet.create({
  card:     { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8, overflow: 'hidden', position: 'relative' },
  cardBg:   { position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: 40, opacity: 0.4 },
  iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  badge:    { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
});
