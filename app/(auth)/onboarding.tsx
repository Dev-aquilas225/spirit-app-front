/**
 * Onboarding — Oracle Plus
 * Inscription Google obligatoire avant tout accès à l'application.
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated, Platform, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  function handleGoogle() {
    router.replace('/login?from=onboarding');
  }

  return (
    <View style={[st.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View style={[st.content, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <View style={st.orb1} />
        <View style={st.orb2} />

        {/* Logo */}
        <View style={st.logoWrap}>
          <Text style={st.logoSymbol}>✦</Text>
        </View>

        <Text style={st.eyebrow}>ORACLE PLUS</Text>
        <Text style={st.headline}>Bienvenue dans{'\n'}l'application Oracle !</Text>
        <Text style={st.body}>
          Inscrivez-vous pour bénéficier de{' '}
          <Text style={st.highlight}>2000 crédits gratuits</Text>
          {' '}et accéder à tous nos services spirituels.
        </Text>

        {/* Services */}
        <View style={st.services}>
          {[
            { icon: '🌙', label: 'Interprétation des Rêves' },
            { icon: '🔮', label: 'Voyance Spirituelle' },
            { icon: '🙏', label: 'Prière Guidée' },
          ].map((s, i) => (
            <View key={i} style={st.serviceRow}>
              <Text style={st.serviceIcon}>{s.icon}</Text>
              <Text style={st.serviceLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bouton Google — seule option */}
        <TouchableOpacity style={st.googleBtn} onPress={handleGoogle} activeOpacity={0.88}>
          <Text style={st.googleIcon}>G</Text>
          <Text style={st.googleTxt}>Continuer avec Google</Text>
        </TouchableOpacity>

        <Text style={st.legal}>
          En continuant, vous acceptez nos{' '}
          <Text style={st.legalLink} onPress={() => router.push('/legal/terms')}>
            Conditions d'utilisation
          </Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#0B1628' },
  content:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  orb1:        { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(201,168,76,0.07)', top: -80, right: -80 },
  orb2:        { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(92,47,181,0.08)', bottom: -60, left: -60 },
  logoWrap:    { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(201,168,76,0.12)', borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.3)', alignItems: 'center', justifyContent: 'center' },
  logoSymbol:  { fontSize: 36, color: '#C9A84C' },
  eyebrow:     { fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.6)', letterSpacing: 4, textTransform: 'uppercase' },
  headline:    { fontSize: 26, fontWeight: '900', color: '#FDF8EE', textAlign: 'center', lineHeight: 34 },
  body:        { fontSize: 15, color: 'rgba(253,248,238,0.65)', textAlign: 'center', lineHeight: 24 },
  highlight:   { color: '#C9A84C', fontWeight: '800' },
  services:    { width: '100%', gap: 10, marginVertical: 4 },
  serviceRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(201,168,76,0.06)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(201,168,76,0.12)' },
  serviceIcon: { fontSize: 20 },
  serviceLabel:{ fontSize: 14, fontWeight: '600', color: 'rgba(253,248,238,0.85)' },
  googleBtn:   {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, backgroundColor: '#FDF8EE', borderRadius: 14, paddingVertical: 15, marginTop: 8,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(201,168,76,0.3)' } as any,
      default: { shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
    }),
  },
  googleIcon:  { fontSize: 18, fontWeight: '900', color: '#4285F4' },
  googleTxt:   { fontSize: 15, fontWeight: '800', color: '#0B1628' },
  legal:       { fontSize: 11, color: 'rgba(253,248,238,0.3)', textAlign: 'center', marginTop: 4 },
  legalLink:   { color: 'rgba(201,168,76,0.6)', textDecorationLine: 'underline' },
});
