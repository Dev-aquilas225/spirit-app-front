/**
 * Home — Oracle Plus Premium
 * Glassmorphism, noir profond / or / bleu nuit
 */
import { router } from 'expo-router';
import { Bell, BookOpen, CloudMoon, Crown, MessageCircle, Sparkles, Star, Users, Zap, ChevronRight, Heart, Flame, Target } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { CreditBadge } from '../../../../src/components/credits/CreditBadge';
import { LoginModal } from '../../../../src/components/auth/LoginModal';
import { getTodayMessage } from '../../../../src/data/messages.data';
import { useAuth } from '../../../../src/hooks/useAuth';
import { useAccess } from '../../../../src/hooks/useAccess';
import { useAuthStore } from '../../../../src/store/auth.store';
import { useGamificationStore, getLevelFromXp, getXpProgress, getNextLevel } from '../../../../src/store/gamification.store';
import { useTheme } from '../../../../src/theme';
import { formatDate } from '../../../../src/utils/helpers';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 48) / 2;
const SPLASH_KEY = 'oracle_splash_seen';
const SPLASH_MS  = 5000;

function SplashOverlay({ onDone }: { onDone: () => void }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const line  = useRef(new Animated.Value(0)).current;
  const exit  = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 45, friction: 9, useNativeDriver: true }),
    ]).start();
    Animated.timing(line, { toValue: 1, duration: SPLASH_MS, useNativeDriver: false }).start();
    const t = setTimeout(() => {
      Animated.timing(exit, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => onDone());
    }, SPLASH_MS - 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View style={[sp.root, { opacity: exit }]} pointerEvents="none">
      <View style={sp.c1} /><View style={sp.c2} /><View style={sp.c3} />
      <Animated.View style={[sp.content, { opacity: fade, transform: [{ scale }] }]}>
        <Text style={sp.symbol}>✦</Text>
        <Text style={sp.welcome}>Bienvenue dans</Text>
        <Text style={sp.brand}>Oracle Plus</Text>
        <Text style={sp.tagline}>Votre guide spirituel africain</Text>
        <View style={sp.divider} />
        <Text style={sp.sub}>Consultation · Rêves · Voyance · Prières</Text>
        <View style={sp.track}>
          <Animated.View style={[sp.bar, { width: line.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }) }]} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function XPBar() {
  const { xp, streak } = useGamificationStore();
  const level = getLevelFromXp(xp);
  const next  = getNextLevel(xp);
  const pct   = getXpProgress(xp);
  const anim  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct / 100, duration: 1000, useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={xps.wrap}>
      <View style={xps.row}>
        <View style={xps.lvlBadge}>
          <Text style={[xps.lvlNum, { color: level.color }]}>{level.level}</Text>
          <Text style={xps.lvlName}>{level.name}</Text>
        </View>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <View style={xps.track}>
            <Animated.View style={[xps.fill, { width: anim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }), backgroundColor: level.color }]} />
          </View>
          <Text style={xps.xpTxt}>{xp} XP{next ? ` → ${next.minXp}` : ' · MAX'}</Text>
        </View>
        <View style={xps.streak}>
          <AppIcon icon={Flame} size={14} color="#F59E0B" strokeWidth={2.5} />
          <Text style={xps.streakNum}>{streak}</Text>
        </View>
      </View>
    </View>
  );
}

function DailyThought() {
  const msg = getTodayMessage();
  if (!msg) return null;
  return (
    <View style={dt.card}>
      <View style={dt.hdr}><AppIcon icon={Sparkles} size={13} color="#C9A84C" strokeWidth={2.5} /><Text style={dt.lbl}>PENSÉE DU JOUR</Text></View>
      <Text style={dt.q}>"</Text>
      <Text style={dt.txt} numberOfLines={3}>{msg.content}</Text>
      {msg.verse && <Text style={dt.verse}>— {msg.verse}</Text>}
    </View>
  );
}

const MODULES = [
  { id: 'dreams',  label: 'Rêves',         sub: '80 cr',  icon: CloudMoon,     color: '#818CF8', bg: 'rgba(129,140,248,0.15)', route: '/dreams' },
  { id: 'consult', label: 'Voyance',        sub: '100 cr', icon: Star,          color: '#C9A84C', bg: 'rgba(201,168,76,0.15)',  route: '/consultation/chat' },
  { id: 'accomp',  label: 'Suivi',          sub: '50 cr',  icon: Heart,         color: '#F472B6', bg: 'rgba(244,114,182,0.15)', route: '/accompagnements' },
  { id: 'library', label: 'Livres',         sub: 'Gratuit',icon: BookOpen,      color: '#60A5FA', bg: 'rgba(96,165,250,0.15)',  route: '/library' },
  { id: 'ai',      label: 'Connaître le futur', sub: '50 cr',  icon: MessageCircle, color: '#34D399', bg: 'rgba(52,211,153,0.15)',  route: '/ai' },
  { id: 'prayer',  label: 'Prières',        sub: 'Gratuit',icon: Sparkles,      color: '#FBBF24', bg: 'rgba(251,191,36,0.15)',  route: '/prayers' },
] as const;

function ModuleCard({ mod, index, hasSub }: { mod: typeof MODULES[number]; index: number; hasSub: boolean }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(anim, { toValue: 1, delay: index * 70, tension: 55, friction: 8, useNativeDriver: true }).start(); }, []);
  const free = mod.id === 'prayer' || mod.id === 'library';
  return (
    <Animated.View style={{ opacity: anim, transform: [{ scale: anim }, { translateY: anim.interpolate({ inputRange:[0,1], outputRange:[24,0] }) }] }}>
      <TouchableOpacity onPress={() => router.push(mod.route as any)} style={[mc.card, { backgroundColor: colors.surface, borderColor: colors.border, width: CARD_W }]} activeOpacity={0.8}>
        <View style={[mc.icon, { backgroundColor: mod.bg }]}><AppIcon icon={mod.icon} size={24} color={mod.color} strokeWidth={2} /></View>
        <Text style={[mc.lbl, { color: colors.text }]}>{mod.label}</Text>
        <View style={[mc.badge, { backgroundColor: hasSub && !free ? 'rgba(52,211,153,0.15)' : mod.bg }]}>
          <Text style={[mc.badgeTxt, { color: hasSub && !free ? '#34D399' : mod.color }]}>{hasSub && !free ? '∞ Illimité' : mod.sub}</Text>
        </View>
        <View style={[mc.arrow, { backgroundColor: mod.bg }]}><AppIcon icon={ChevronRight} size={12} color={mod.color} strokeWidth={3} /></View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { hasSubscription, credits } = useAccess();
  const initialize = useAuthStore((s) => s.initialize);
  const { init: initGamif, completeMission } = useGamificationStore();
  const [loginVisible, setLoginVisible] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.d1} /><View style={s.d2} />
          <View style={s.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.greet}>Bonjour{firstName ? `, ${firstName}` : ''} 👋</Text>
              <Text style={s.date}>{today}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <CreditBadge />
              <TouchableOpacity onPress={() => router.push('/notifications')} style={s.notif}>
                <AppIcon icon={Bell} size={18} color="#fff" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}><DailyThought /></View>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 18, marginTop: 12 }}>
          <XPBar />

          <View style={s.statsBar}>
            {hasSubscription ? (
              <View style={s.statItem}><AppIcon icon={Crown} size={14} color="#C9A84C" strokeWidth={2.2} /><Text style={s.statTxt}>Abonnement actif</Text></View>
            ) : (
              <TouchableOpacity style={s.statItem} onPress={() => router.push('/subscription')}>
                <AppIcon icon={Zap} size={14} color="#C9A84C" strokeWidth={2.2} /><Text style={s.statTxt}>{credits.toLocaleString()} crédits</Text>
              </TouchableOpacity>
            )}
            <View style={s.statDiv} />
            <TouchableOpacity style={s.statItem} onPress={() => router.push('/referral')}>
              <AppIcon icon={Users} size={14} color="#818CF8" strokeWidth={2.2} /><Text style={[s.statTxt, { color: '#818CF8' }]}>Parrainer</Text>
            </TouchableOpacity>
            <View style={s.statDiv} />
            <TouchableOpacity style={s.statItem} onPress={() => router.push('/subscription')}>
              <AppIcon icon={Target} size={14} color="#F472B6" strokeWidth={2.2} /><Text style={[s.statTxt, { color: '#F472B6' }]}>Missions</Text>
            </TouchableOpacity>
          </View>

          <View>
            <View style={s.secHd}><View style={s.secAcc} /><Text style={[s.secTtl, { color: colors.text }]}>Services spirituels</Text></View>
            <View style={s.grid}>
              {MODULES.map((m, i) => <ModuleCard key={m.id} mod={m} index={i} hasSub={hasSubscription} />)}
            </View>
          </View>

          <TouchableOpacity style={s.aiBanner} onPress={() => router.push('/ai')} activeOpacity={0.88}>
            <View style={s.aiL}>
              <View style={s.aiIco}><AppIcon icon={MessageCircle} size={26} color="#34D399" strokeWidth={1.8} /></View>
              <View><Text style={s.aiTtl}>Assistant Prophétique</Text><Text style={s.aiSub}>Posez vos questions spirituelles</Text></View>
            </View>
            <View style={s.aiCta}><Text style={s.aiCtaTxt}>Ouvrir</Text></View>
          </TouchableOpacity>

          {!hasSubscription && (
            <TouchableOpacity style={s.subBanner} onPress={() => router.push('/subscription')} activeOpacity={0.88}>
              <AppIcon icon={Crown} size={26} color="#C9A84C" strokeWidth={1.8} />
              <View style={{ flex: 1 }}><Text style={s.subTtl}>Passer à l'illimité</Text><Text style={s.subSub}>Dès 3 000 FCFA / semaine</Text></View>
              <View style={s.subCta}><Text style={s.subCtaTxt}>Voir</Text></View>
            </TouchableOpacity>
          )}

          {!isAuthenticated && (
            <TouchableOpacity style={[s.loginBtn, { borderColor: colors.border }]} onPress={() => setLoginVisible(true)} activeOpacity={0.85}>
              <View style={[s.loginIn, { backgroundColor: 'rgba(201,168,76,0.06)' }]}>
                <View style={s.loginIco}><AppIcon icon={Star} size={16} color="#C9A84C" strokeWidth={2.2} /></View>
                <View style={{ flex: 1 }}><Text style={[s.loginTtl, { color: colors.text }]}>Se connecter</Text><Text style={[s.loginSub, { color: colors.textSecondary }]}>Sauvegardez vos consultations</Text></View>
                <AppIcon icon={ChevronRight} size={16} color={colors.textTertiary} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          )}
        </View>
        <LoginModal visible={loginVisible} onClose={() => setLoginVisible(false)} />
      </ScrollView>
      {showSplash && <SplashOverlay onDone={handleSplashDone} />}
    </View>
  );
}

const sp = StyleSheet.create({
  root:{ ...StyleSheet.absoluteFillObject, backgroundColor:'#0D0D2B', alignItems:'center', justifyContent:'center', zIndex:9999 },
  c1:{ position:'absolute', width:380, height:380, borderRadius:190, backgroundColor:'rgba(201,168,76,0.07)', top:-120, right:-100 },
  c2:{ position:'absolute', width:280, height:280, borderRadius:140, backgroundColor:'rgba(99,102,241,0.09)', bottom:-80, left:-80 },
  c3:{ position:'absolute', width:180, height:180, borderRadius:90, backgroundColor:'rgba(201,168,76,0.05)', bottom:100, right:30 },
  content:{ alignItems:'center', paddingHorizontal:32, width:'100%' },
  symbol:{ fontSize:56, color:'#C9A84C', marginBottom:28, textShadowColor:'rgba(201,168,76,0.6)', textShadowOffset:{width:0,height:0}, textShadowRadius:24 },
  welcome:{ fontSize:17, fontWeight:'300', color:'rgba(255,255,255,0.55)', letterSpacing:4, textTransform:'uppercase', marginBottom:10 },
  brand:{ fontSize:54, fontWeight:'900', color:'#C9A84C', letterSpacing:-1, textShadowColor:'rgba(201,168,76,0.35)', textShadowOffset:{width:0,height:6}, textShadowRadius:20 },
  tagline:{ fontSize:15, color:'rgba(255,255,255,0.45)', marginTop:14, fontStyle:'italic' },
  divider:{ width:80, height:1.5, backgroundColor:'rgba(201,168,76,0.35)', borderRadius:1, marginTop:32, marginBottom:18 },
  sub:{ fontSize:12, color:'rgba(255,255,255,0.28)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:44 },
  track:{ width:'70%', height:2, backgroundColor:'rgba(255,255,255,0.08)', borderRadius:1, overflow:'hidden' },
  bar:{ height:'100%', backgroundColor:'#C9A84C', borderRadius:1 },
});
const xps = StyleSheet.create({
  wrap:{ backgroundColor:'rgba(201,168,76,0.06)', borderRadius:16, padding:14, borderWidth:1, borderColor:'rgba(201,168,76,0.15)' },
  row:{ flexDirection:'row', alignItems:'center' },
  lvlBadge:{ alignItems:'center', minWidth:52 },
  lvlNum:{ fontSize:22, fontWeight:'900' },
  lvlName:{ fontSize:10, color:'rgba(255,255,255,0.5)', fontWeight:'600', marginTop:1 },
  track:{ height:6, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:3, overflow:'hidden' },
  fill:{ height:'100%', borderRadius:3 },
  xpTxt:{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:4 },
  streak:{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(245,158,11,0.12)', paddingHorizontal:10, paddingVertical:6, borderRadius:12 },
  streakNum:{ fontSize:14, fontWeight:'800', color:'#F59E0B' },
});
const dt = StyleSheet.create({
  card:{ backgroundColor:'rgba(255,255,255,0.06)', borderRadius:18, padding:16, borderWidth:1, borderColor:'rgba(201,168,76,0.18)' },
  hdr:{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:8 },
  lbl:{ fontSize:10, fontWeight:'800', color:'#C9A84C', letterSpacing:1.5 },
  q:{ fontSize:34, lineHeight:30, color:'#C9A84C', fontWeight:'900', marginBottom:2 },
  txt:{ fontSize:14, color:'rgba(255,255,255,0.82)', lineHeight:22, fontStyle:'italic' },
  verse:{ color:'#C9A84C', fontSize:12, fontWeight:'600', marginTop:8 },
});
const mc = StyleSheet.create({
  card:{ borderRadius:20, borderWidth:1, padding:14, gap:8, position:'relative' },
  icon:{ width:48, height:48, borderRadius:14, alignItems:'center', justifyContent:'center' },
  lbl:{ fontSize:13, fontWeight:'800', lineHeight:18 },
  badge:{ alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  badgeTxt:{ fontSize:11, fontWeight:'700' },
  arrow:{ position:'absolute', top:12, right:12, width:24, height:24, borderRadius:12, alignItems:'center', justifyContent:'center' },
});
const s = StyleSheet.create({
  hero:{ backgroundColor:'#0D0D2B', borderBottomLeftRadius:32, borderBottomRightRadius:32, overflow:'hidden', marginBottom:4 },
  d1:{ position:'absolute', width:240, height:240, borderRadius:120, backgroundColor:'rgba(201,168,76,0.08)', top:-80, right:-60 },
  d2:{ position:'absolute', width:180, height:180, borderRadius:90, backgroundColor:'rgba(99,102,241,0.1)', bottom:-50, left:-40 },
  heroTop:{ flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', paddingHorizontal:20, paddingTop:56, paddingBottom:18 },
  greet:{ fontSize:22, fontWeight:'800', color:'#fff' },
  date:{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:3 },
  notif:{ width:40, height:40, borderRadius:20, backgroundColor:'rgba(255,255,255,0.1)', alignItems:'center', justifyContent:'center' },
  statsBar:{ flexDirection:'row', alignItems:'center', backgroundColor:'#0D0D2B', borderRadius:16, paddingVertical:12, paddingHorizontal:16, borderWidth:1, borderColor:'rgba(201,168,76,0.18)' },
  statItem:{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6 },
  statTxt:{ fontSize:12, fontWeight:'700', color:'#C9A84C' },
  statDiv:{ width:1, height:20, backgroundColor:'rgba(255,255,255,0.08)' },
  secHd:{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:14 },
  secAcc:{ width:4, height:18, borderRadius:2, backgroundColor:'#C9A84C' },
  secTtl:{ fontSize:17, fontWeight:'800' },
  grid:{ flexDirection:'row', flexWrap:'wrap', gap:12, justifyContent:'space-between' },
  aiBanner:{ backgroundColor:'#0D1F1A', borderRadius:18, padding:16, flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderWidth:1, borderColor:'rgba(52,211,153,0.25)' },
  aiL:{ flexDirection:'row', alignItems:'center', gap:14, flex:1 },
  aiIco:{ width:50, height:50, borderRadius:25, backgroundColor:'rgba(52,211,153,0.12)', alignItems:'center', justifyContent:'center' },
  aiTtl:{ fontSize:15, fontWeight:'800', color:'#fff' },
  aiSub:{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 },
  aiCta:{ backgroundColor:'#34D399', borderRadius:12, paddingHorizontal:14, paddingVertical:8 },
  aiCtaTxt:{ color:'#0D1F1A', fontWeight:'900', fontSize:13 },
  subBanner:{ backgroundColor:'#1A1200', borderRadius:18, padding:16, flexDirection:'row', alignItems:'center', gap:14, borderWidth:1, borderColor:'rgba(201,168,76,0.3)' },
  subTtl:{ fontSize:15, fontWeight:'800', color:'#fff' },
  subSub:{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 },
  subCta:{ backgroundColor:'#C9A84C', borderRadius:12, paddingHorizontal:14, paddingVertical:8 },
  subCtaTxt:{ color:'#1A1200', fontWeight:'900', fontSize:13 },
  loginBtn:{ borderRadius:18, borderWidth:1, overflow:'hidden' },
  loginIn:{ flexDirection:'row', alignItems:'center', gap:14, padding:16 },
  loginIco:{ width:42, height:42, borderRadius:21, backgroundColor:'rgba(201,168,76,0.12)', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'rgba(201,168,76,0.25)' },
  loginTtl:{ fontSize:15, fontWeight:'800' },
  loginSub:{ fontSize:12, marginTop:2 },
});
