/**
 * Confirmation post-inscription — affiche le message "2000 crédits gagnés"
 * Redirige automatiquement vers /home après 3s.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Sparkles, Zap } from 'lucide-react-native';
import { AppIcon } from '../../src/components/common/AppIcon';
import { StorageService } from '../../src/services/storage.service';
import { STORAGE_KEYS } from '../../src/utils/constants';

export default function OnboardingConfirmScreen() {
  const scale = useRef(new Animated.Value(0.7)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      Animated.timing(fade,  { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(handleDone, 3500);
    return () => clearTimeout(t);
  }, []);

  async function handleDone() {
    await StorageService.set(STORAGE_KEYS.ONBOARDING_DONE, true);
    router.replace('/dashboard');
  }

  return (
    <View style={st.root}>
      <View style={st.orb1} /><View style={st.orb2} />
      <Animated.View style={[st.content, { opacity: fade, transform: [{ scale }] }]}>
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
        <TouchableOpacity style={st.doneBtn} onPress={handleDone} activeOpacity={0.88}>
          <AppIcon icon={Sparkles} size={18} color="#0B1628" strokeWidth={2.5} />
          <Text style={st.doneTxt}>Découvrir Oracle Plus</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#0B1628', alignItems: 'center', justifyContent: 'center', padding: 32 },
  orb1:      { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(201,168,76,0.07)', top: -80, right: -80 },
  orb2:      { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(92,47,181,0.08)', bottom: -60, left: -60 },
  content:   { width: '100%', alignItems: 'center', gap: 16 },
  headline:  { fontSize: 28, fontWeight: '900', color: '#FDF8EE', textAlign: 'center' },
  body:      { fontSize: 16, color: 'rgba(253,248,238,0.65)', textAlign: 'center', lineHeight: 24 },
  highlight: { color: '#C9A84C', fontWeight: '800' },
  creditBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  creditTxt: { fontSize: 18, fontWeight: '900', color: '#C9A84C' },
  hint:      { fontSize: 13, color: 'rgba(253,248,238,0.5)', textAlign: 'center', lineHeight: 20 },
  doneBtn:   { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#C9A84C', borderRadius: 14, paddingVertical: 15, marginTop: 8 },
  doneTxt:   { fontSize: 15, fontWeight: '800', color: '#0B1628' },
});
