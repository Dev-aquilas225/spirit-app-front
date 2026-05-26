import { router } from 'expo-router';
import {
  Bell, BookOpen, CloudMoon, Crown, Eye,
  Heart, MessageCircle, Sparkles, Star, Users, Zap,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
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
const SPLASH_KEY = 'oracle_splash_seen';
const SPLASH_MS  = 5000;

// ── Splash ───────────────────────────────────────────────────────────────────
function SplashOverlay({ onDone }: { onDone: () => void }) {
  const fade    = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.9)).current;
  const line    = useRef(new Animated.Value(0)).current;
  const exit    = useRef(new Animated.Value(1)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const [loginVisible, setLoginVisible] = useState(false);

  const dismiss = () => {
    Animated.timing(exit, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => onDone());
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();
    Animated.timing(line, { toValue: 1, duration: SPLASH_MS, useNativeDriver: false }).start();
    // Bouton apparaît après 2s
    const btnTimer = setTimeout(() => {
      Animated.timing(btnFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 2000);
    // Auto-dismiss après SPLASH_MS
    const t = setTimeout(() => {
      Animated.timing(exit, { toValue: 0, duration: 700, useNativeDriver: true }).start(() => onDone());
    }, SPLASH_MS - 700);
    return () => { clearTimeout(t); clearTimeout(btnTimer); };
  }, []);

  return (
    <Animated.View style={[sp.root, { opacity: exit }]}>
      {/* Cercles décoratifs */}
      <View style={sp.orb1} /><View style={sp.orb2} /><View style={sp.orb3} />
      {/* Grille subtile */}
      <View style={sp.grid} />

      <Animated.View style={[sp.content, { opacity: fade, transform: [{ scale }] }]}>
        <View style={sp.symbolWrap}>
          <Text style={sp.symbol}>✦</Text>
        </View>
        <Text style={sp.eyebrow}>BIENVENUE DANS</Text>
        <Text style={sp.brand}>Oracle Plus</Text>
        <View style={sp.divider}>
          <View style={sp.divLine} /><Text style={sp.divDot}>◆</Text><View style={sp.divLine} />
        </View>
        <Text style={sp.tagline}>Votre guide spirituel africain</Text>
        <Text style={sp.services}>Consultation · Rêves · Voyance · Prières</Text>
        <View style={sp.track}>
          <Animated.View style={[sp.bar, {
            width: line.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>

        {/* Bouton Se connecter — apparaît après 2s */}
        <Animated.View style={[sp.btnWrap, { opacity: btnFade }]}>
          <TouchableOpacity style={sp.loginBtn} onPress={() => setLoginVisible(true)} activeOpacity={0.85}>
            <Text style={sp.loginBtnText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={dismiss} activeOpacity={0.7}>
            <Text style={sp.skipText}>Continuer sans compte →</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <LoginModal visible={loginVisible} onClose={() => { setLoginVisible(false); dismiss(); }} />
    </Animated.View>
  );
}

// ── Barre XP ─────────────────────────────────────────────────────────────────
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

// ── Pensée du jour ────────────────────────────────────────────────────────────
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

// ── Modules ───────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'dreams',   label: 'Rêves',          sub: '80 cr',   icon: CloudMoon,     color: '#818CF8', bg: 'rgba(129,140,248,0.12)', route: '/dreams' },
  { id: 'consult',  label: 'Consultation',   sub: '100 cr',  icon: Star,          color: '#C9A84C', bg: 'rgba(201,168,76,0.12)',  route: '/consultation' },
  { id: 'accomp',   label: 'Suivi spirituel',sub: '50 cr',   icon: Heart,         color: '#F472B6', bg: 'rgba(244,114,182,0.12)', route: '/accompagnements' },
  { id: 'library',  label: 'Bibliothèque',   sub: 'Gratuit', icon: BookOpen,      color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  route: '/library' },
  { id: 'futur',    label: 'Connaître le futur', sub: '50 cr', icon: Eye,         color: '#2DD4A0', bg: 'rgba(45,212,160,0.12)',  route: '/futur' },
  { id: 'prayer',   label: 'Prières',        sub: 'Gratuit', icon: Sparkles,      color: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  route: '/prayers' },
] as const;

function ModuleCard({ mod, index, hasSub }: { mod: typeof MODULES[number]; index: number; hasSub: boolean }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 60, tension: 50, friction: 8, useNativeDriver: true }).start();
  }, []);
  const free = mod.id === 'prayer' || mod.id === 'library';
  const badgeTxt = hasSub && !free ? '∞' : mod.sub;
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

// ── Écran principal ───────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { hasSubscription, credits } = useAccess();
  const initialize = useAuthStore((s) => s.initialize);
  const { init: initGamif, completeMission } = useGamificationStore();
  const [loginVisible, setLoginVisible] = useState(false);
  const [showSplash, setShowSplash]     = useState(false);
  const firstName = user?.firstName?.trim() || user?.name?.split(' ')[0] || '';
  const today = formatDate(new Date().toISOString());

  useEffect(() => {
    initialize().catch(() => {});
    initGamif().catch(() => {});
    completeMission('open_app').catch(() => {});
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      if (!sessionStorage.getItem(SPLASH_KEY)) setShowSplash(true);
    }
  }, []);

  const handleSplashDone = () => {
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') sessionStorage.setItem(SPLASH_KEY, '1');
    setShowSplash(false);
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={[s.hero, { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }]}>
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
                <TouchableOpacity onPress={() => router.push('/notifications')} style={[s.notifBtn, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '30' }]}>
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
              <TouchableOpacity style={s.statItem} onPress={() => router.push('/subscription')}>
                <AppIcon icon={Zap} size={13} color={colors.primary} strokeWidth={2.2} />
                <Text style={[s.statTxt, { color: colors.primary }]}>{credits.toLocaleString()} crédits</Text>
              </TouchableOpacity>
            )}
            <View style={[s.statSep, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={s.statItem} onPress={() => router.push('/referral')}>
              <AppIcon icon={Users} size={13} color="#7B52D4" strokeWidth={2.2} />
              <Text style={[s.statTxt, { color: '#7B52D4' }]}>Parrainer</Text>
            </TouchableOpacity>
            <View style={[s.statSep, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={s.statItem} onPress={() => router.push('/subscription')}>
              <AppIcon icon={Crown} size={13} color="#E8609A" strokeWidth={2.2} />
              <Text style={[s.statTxt, { color: '#E8609A' }]}>Premium</Text>
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
            <TouchableOpacity style={[s.subBanner, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '35' }]} onPress={() => router.push('/subscription')} activeOpacity={0.85}>
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
            <TouchableOpacity style={[s.loginCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setLoginVisible(true)} activeOpacity={0.85}>
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
      {showSplash && <SplashOverlay onDone={handleSplashDone} />}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
// Splash — toujours sombre (écran de marque)
const sp = StyleSheet.create({
  root:       { ...StyleSheet.absoluteFillObject, backgroundColor: '#0B1628', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  orb1:       { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(201,168,76,0.08)', top: -150, right: -120 },
  orb2:       { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(92,47,181,0.09)', bottom: -100, left: -80 },
  orb3:       { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(201,168,76,0.05)', bottom: 80, right: 20 },
  grid:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03, backgroundColor: 'transparent' },
  content:    { alignItems: 'center', paddingHorizontal: 32, width: '100%' },
  symbolWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(201,168,76,0.14)', borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.35)', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  symbol:     { fontSize: 38, color: '#C9A84C' },
  eyebrow:    { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 10 },
  brand:      { fontSize: 52, fontWeight: '900', color: '#C9A84C', letterSpacing: -1 },
  divider:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  divLine:    { flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.22)' },
  divDot:     { fontSize: 8, color: '#C9A84C' },
  tagline:    { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginBottom: 6 },
  services:   { fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 40 },
  track:      { width: '60%', height: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 1, overflow: 'hidden' },
  bar:        { height: '100%', backgroundColor: '#C9A84C', borderRadius: 1 },
  btnWrap:    { alignItems: 'center', gap: 14, marginTop: 32 },
  loginBtn:   { backgroundColor: '#C9A84C', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 30 },
  loginBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  skipText:   { fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.3 },
});

// XP bar — styles dynamiques via useTheme dans le composant
const xp_ = StyleSheet.create({
  wrap:     { borderRadius: 16, padding: 14, borderWidth: 1 },
  row:      { flexDirection: 'row', alignItems: 'center' },
  badge:    { alignItems: 'center', minWidth: 54, borderWidth: 1, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 8 },
  lvlNum:   { fontSize: 20, fontWeight: '900' },
  lvlName:  { fontSize: 9, fontWeight: '700', marginTop: 1, textTransform: 'uppercase' },
  track:    { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill:     { height: '100%', borderRadius: 3 },
  xpTxt:    { fontSize: 10, marginTop: 5 },
  streak:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  fire:     { fontSize: 14 },
  streakNum:{ fontSize: 14, fontWeight: '800', color: '#F59E0B' },
});

const mc = StyleSheet.create({
  card:    { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10, overflow: 'hidden' },
  cardBg:  { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
  iconWrap:{ width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  badge:   { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  badgeTxt:{ fontSize: 10, fontWeight: '700' },
});

const s = StyleSheet.create({
  root:         { flex: 1 },
  hero:         { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, overflow: 'hidden', paddingBottom: 4 },
  orb1:         { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(201,168,76,0.07)', top: -100, right: -80 },
  orb2:         { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(92,47,181,0.06)', bottom: -60, left: -50 },
  topLine:      { height: 3, opacity: 0.8 },
  heroInner:    { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20, gap: 16 },
  heroTop:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  body:         { paddingHorizontal: 16, gap: 16, marginTop: 16 },
  statsBar:     { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1 },
  statItem:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  statTxt:      { fontSize: 11, fontWeight: '700' },
  statSep:      { width: 1, height: 18 },
  sectionHead:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionAccent:{ width: 3, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  subBanner:    { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1 },
  subLeft:      { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  subIconWrap:  { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  subCta:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  loginCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 16, borderWidth: 1 },
  notifBtn:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
