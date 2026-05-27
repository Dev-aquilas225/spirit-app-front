/**
 * Onboarding Flash — Oracle Plus
 * CDC : message d'accueil + "Continuer avec Google" + confirmation 2000 crédits
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Platform, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { Sparkles, Zap } from 'lucide-react-native';
import { AppIcon } from '../../src/components/common/AppIcon';
import { StorageService } from '../../src/services/storage.service';
import { STORAGE_KEYS } from '../../src/utils/constants';

// ── Étape 1 : Accueil ─────────────────────────────────────────────────────────
function WelcomeStep({ onGoogle, onSkip }: { onGoogle: () => void; onSkip: () => void }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[st.step, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={st.orb1} /><View style={st.orb2} />

      <View style={st.logoWrap}>
        <Text style={st.logoSymbol}>✦</Text>
      </View>

      <Text style={st.eyebrow}>ORACLE PLUS</Text>
      <Text style={st.headline}>Bienvenue dans{'\n'}l'application Oracle !</Text>
      <Text style={st.body}>
        Pour bénéficier de{' '}
        <Text style={st.highlight}>2000 crédits gratuits</Text>
        {' '}et accéder à tous nos services, inscrivez-vous ici.
      </Text>

      <View style={st.services}>
        {[
          { icon: '🌙', label: 'Interprétation des Rêves' },
          { icon: '🔮', label: 'Voyance Spirituelle' },
          { icon: '🙏', label: 'Prière Guidée par l\'IA' },
        ].map((s, i) => (
          <View key={i} style={st.serviceRow}>
            <Text style={st.serviceIcon}>{s.icon}</Text>
            <Text style={st.serviceLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={st.googleBtn} onPress={onGoogle} activeOpacity={0.88}>
        <Text style={st.googleIcon}>G</Text>
        <Text style={st.googleTxt}>Continuer avec Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSkip} style={st.skipBtn}>
        <Text style={st.skipTxt}>Continuer sans compte →</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Étape 2 : Confirmation crédits ────────────────────────────────────────────
function ConfirmStep({ onDone }: { onDone: () => void }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      Animated.timing(fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[st.step, { opacity: fade, transform: [{ scale }] }]}>
      <View style={st.orb1} /><View style={st.orb2} />
      <Text style={{ fontSize: 56, marginBottom: 8 }}>🎉</Text>
      <Text style={st.headline}>Félicitations !</Text>
      <Text style={st.body}>
        Vous avez gagné{' '}
        <Text style={st.highlight}>2000 crédits</Text>
        {' '}gratuits !
      </Text>
      <View style={st.creditBox}>
        <AppIcon icon={Zap} size={22} color="#C9A84C" strokeWidth={2} />
        <Text style={st.creditTxt}>2000 crédits disponibles</Text>
      </View>
      <Text style={st.hint}>
        Une fois vos crédits épuisés, rechargez-les en appuyant sur{' '}
        <Text style={st.highlight}>"Crédits"</Text>
        {' '}ou{' '}
        <Text style={st.highlight}>"Abonnement"</Text>.
      </Text>
      <TouchableOpacity style={st.doneBtn} onPress={onDone} activeOpacity={0.88}>
        <AppIcon icon={Sparkles} size={18} color="#0B1628" strokeWidth={2.5} />
        <Text style={st.doneTxt}>Découvrir Oracle Plus</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [step, setStep] = useState<'welcome' | 'confirm'>('welcome');

  async function markDone() {
    await StorageService.set(STORAGE_KEYS.ONBOARDING_DONE, true);
  }

  function handleGoogle() {
    // Rediriger vers la page login qui gère GIS/Google OAuth
    // On passe un param pour afficher la confirmation après connexion
    router.replace('/login?from=onboarding');
  }

  async function handleSkip() {
    await markDone();
    router.replace('/home');
  }

  async function handleDone() {
    await markDone();
    router.replace('/home');
  }

  return (
    <View style={st.root}>
      {step === 'welcome'
        ? <WelcomeStep onGoogle={handleGoogle} onSkip={handleSkip} />
        : <ConfirmStep onDone={handleDone} />
      }
    </View>
  );
}

const st = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#0B1628' },
  step:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  orb1:         { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(201,168,76,0.07)', top: -80, right: -80 },
  orb2:         { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(92,47,181,0.08)', bottom: -60, left: -60 },
  logoWrap:     { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(201,168,76,0.12)', borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.3)', alignItems: 'center', justifyContent: 'center' },
  logoSymbol:   { fontSize: 36, color: '#C9A84C' },
  eyebrow:      { fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.6)', letterSpacing: 4, textTransform: 'uppercase' },
  headline:     { fontSize: 26, fontWeight: '900', color: '#FDF8EE', textAlign: 'center', lineHeight: 34 },
  body:         { fontSize: 15, color: 'rgba(253,248,238,0.65)', textAlign: 'center', lineHeight: 24 },
  highlight:    { color: '#C9A84C', fontWeight: '800' },
  services:     { width: '100%', gap: 10, marginVertical: 4 },
  serviceRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(201,168,76,0.06)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(201,168,76,0.12)' },
  serviceIcon:  { fontSize: 20 },
  serviceLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(253,248,238,0.85)' },
  googleBtn:    { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FDF8EE', borderRadius: 14, paddingVertical: 15, marginTop: 8,
                  ...Platform.select({ web: { boxShadow: '0 4px 20px rgba(201,168,76,0.3)' }, default: { shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 } }) },
  googleIcon:   { fontSize: 18, fontWeight: '900', color: '#4285F4' },
  googleTxt:    { fontSize: 15, fontWeight: '800', color: '#0B1628' },
  skipBtn:      { paddingVertical: 8 },
  skipTxt:      { fontSize: 13, color: 'rgba(253,248,238,0.35)' },
  creditBox:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  creditTxt:    { fontSize: 18, fontWeight: '900', color: '#C9A84C' },
  hint:         { fontSize: 13, color: 'rgba(253,248,238,0.5)', textAlign: 'center', lineHeight: 20 },
  doneBtn:      { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#C9A84C', borderRadius: 14, paddingVertical: 15, marginTop: 8 },
  doneTxt:      { fontSize: 15, fontWeight: '800', color: '#0B1628' },
});
