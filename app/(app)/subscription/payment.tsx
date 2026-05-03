/**
 * PaymentScreen — Oracle Plus
 *
 * Flux :
 * 1. Initie le paiement → récupère l'authorization_url Paystack
 * 2. Démarre le polling (toutes les 4s) et le décompte AVANT d'ouvrir le navigateur
 * 3. Ouvre Paystack dans un navigateur in-app via WebBrowser.openAuthSessionAsync
 *    → le navigateur se ferme AUTOMATIQUEMENT quand Paystack redirige vers
 *      oracleplus://subscription/callback (deep link intercepté par expo-web-browser)
 * 4. Le polling détecte l'activation → animation VIP → page succès
 * 5. Après 10 minutes sans confirmation → timeout côté client
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Crown, ExternalLink, XCircle } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { PaymentService } from '../../../src/services/payment.service';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { Button } from '../../../src/components/common/Button';

/* ─── Constantes ─────────────────────────────────────────────────────────── */

const POLL_INTERVAL_MS  = 4_000;   // poll toutes les 4 secondes
const TIMEOUT_MS        = 10 * 60 * 1000; // 10 minutes
const VIP_DISPLAY_MS    = 2_800;   // durée de l'animation VIP avant redirection

type Step = 'initiating' | 'waiting' | 'vip' | 'timeout' | 'error';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/**
 * Ouvre Paystack dans un navigateur in-app.
 *
 * Mobile : utilise WebBrowser.openAuthSessionAsync — le navigateur (Chrome
 *   Custom Tab sur Android / SFSafariViewController sur iOS) se ferme
 *   AUTOMATIQUEMENT dès que Paystack redirige vers oracleplus://...
 *
 * Web : ouvre dans un nouvel onglet (comportement inchangé).
 */
async function openPaystackUrl(url: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    // Le 2e paramètre = préfixe du deep link à intercepter.
    // Quand Paystack redirige vers oracleplus://..., le navigateur se ferme.
    await WebBrowser.openAuthSessionAsync(url, 'oracleplus://');
  } catch {
    // Fallback : ouvre dans le navigateur externe si WebBrowser échoue
    const { Linking } = await import('react-native');
    await Linking.openURL(url);
  }
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ─── Animation VIP ──────────────────────────────────────────────────────── */

function VipAnimation() {
  const { colors } = useTheme();

  // Scale de la couronne
  const crown    = useRef(new Animated.Value(0)).current;
  // Opacité du texte
  const textFade = useRef(new Animated.Value(0)).current;
  // Pulse autour de la couronne
  const ring     = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;
  // Étoiles
  const stars    = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // 1. Couronne pop-in
    Animated.spring(crown, {
      toValue: 1,
      tension: 60,
      friction: 5,
      useNativeDriver: true,
    }).start();

    // 2. Texte fade-in après 400ms
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(textFade, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    // 3. Ring pulse en boucle
    Animated.loop(
      Animated.parallel([
        Animated.timing(ring, { toValue: 1.8, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();

    // 4. Étoiles éclatent depuis le centre
    stars.forEach((s, i) => {
      Animated.sequence([
        Animated.delay(200 + i * 80),
        Animated.spring(s, { toValue: 1, tension: 55, friction: 5, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const starPositions = [
    { x: -90, y: -60 }, { x: 80, y: -80 }, { x: 110, y: 20 },
    { x: 70,  y: 90  }, { x: -80, y: 80  }, { x: -110, y: 10 },
  ];

  return (
    <View style={s.vipWrap}>
      {/* Étoiles */}
      {stars.map((anim, i) => {
        const pos = starPositions[i];
        return (
          <Animated.Text
            key={i}
            style={[
              s.star,
              {
                transform: [
                  { translateX: Animated.multiply(anim, pos.x) },
                  { translateY: Animated.multiply(anim, pos.y) },
                  { scale: anim },
                ],
                opacity: anim,
              },
            ]}
          >
            ✦
          </Animated.Text>
        );
      })}

      {/* Ring pulse */}
      <Animated.View
        style={[
          s.ring,
          {
            transform: [{ scale: ring }],
            opacity: ringOpacity,
          },
        ]}
      />

      {/* Couronne */}
      <Animated.View style={{ transform: [{ scale: crown }] }}>
        <View style={s.crownCircle}>
          <AppIcon icon={Crown} size={64} color="#C9A84C" strokeWidth={1.6} />
        </View>
      </Animated.View>

      {/* Texte */}
      <Animated.View style={{ opacity: textFade, alignItems: 'center', gap: 6, marginTop: 28 }}>
        <Text style={s.vipTitle}>Vous êtes maintenant VIP !</Text>
        <Text style={[s.vipSub, { color: colors.textSecondary }]}>
          Accès illimité à tous les services Oracle Plus
        </Text>
      </Animated.View>
    </View>
  );
}

/* ─── Écran principal ───────────────────────────────────────────────────── */

export default function PaymentScreen() {
  const { colors } = useTheme();
  const { initiatePayment, paymentError, clearPaymentError, loadSubscription } = useSubscription();

  const [step, setStep]         = useState<Step>('initiating');
  const [reference, setRef]     = useState<string | null>(null);
  const [authUrl, setAuthUrl]   = useState<string | null>(null);
  const [remaining, setRemaining] = useState(TIMEOUT_MS);
  const [error, setError]       = useState<string | null>(null);

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt  = useRef<number>(0);

  const stopAll = useCallback(() => {
    if (pollRef.current)  clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current  = null;
    timerRef.current = null;
  }, []);

  // ── Lance le paiement ───────────────────────────────────────────────────
  const launch = useCallback(async () => {
    stopAll();
    clearPaymentError();
    setError(null);
    setStep('initiating');
    setRemaining(TIMEOUT_MS);

    const result = await initiatePayment('monthly');
    if (!result) {
      setError(paymentError ?? 'Impossible d\'initier le paiement.');
      setStep('error');
      return;
    }

    setRef(result.reference);
    setAuthUrl(result.authorization_url);
    setStep('waiting');
    startedAt.current = Date.now();

    // ── Polling statut — démarré AVANT l'ouverture du navigateur ───────
    // (openAuthSessionAsync bloque jusqu'à la fermeture du navigateur,
    //  donc le polling doit être actif dès maintenant)
    pollRef.current = setInterval(async () => {
      const { status } = await PaymentService.getStatus(result.reference);

      if (status === 'active') {
        stopAll();
        await loadSubscription();
        setStep('vip');
        setTimeout(() => router.replace('/(app)/subscription/success'), VIP_DISPLAY_MS);
        return;
      }

      if (status === 'failed' || status === 'cancelled') {
        stopAll();
        setError('Le paiement n\'a pas abouti.');
        setStep('error');
      }
    }, POLL_INTERVAL_MS);

    // ── Décompte 10 minutes ─────────────────────────────────────────────
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const rem     = TIMEOUT_MS - elapsed;
      setRemaining(rem);

      if (rem <= 0) {
        stopAll();
        setError('Délai de 10 minutes dépassé. Si tu as été débité, contacte le support.');
        setStep('timeout');
      }
    }, 1_000);

    // ── Ouvrir Paystack dans le navigateur in-app ───────────────────────
    // Sur mobile : WebBrowser.openAuthSessionAsync — se ferme automatiquement
    // quand Paystack redirige vers oracleplus://subscription/callback
    // Le polling continue en arrière-plan pendant que le navigateur est ouvert.
    await openPaystackUrl(result.authorization_url);
    // ← ici le navigateur est fermé (deep link intercepté ou bouton "Annuler")
    // Le polling tourne encore et détectera le paiement si confirmé
  }, [initiatePayment, loadSubscription, stopAll, clearPaymentError]);

  // Lance au montage
  useEffect(() => {
    launch();
    return () => stopAll();
  }, []);

  // ── Rendu : Animation VIP ──────────────────────────────────────────────
  if (step === 'vip') {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <VipAnimation />
      </View>
    );
  }

  // ── Rendu : Initialisation ─────────────────────────────────────────────
  if (step === 'initiating') {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <PulseLoader color="#C9A84C" />
        <Text style={[s.msg, { color: colors.textSecondary, marginTop: 20 }]}>
          Connexion à Paystack…
        </Text>
      </View>
    );
  }

  // ── Rendu : Erreur / Timeout ───────────────────────────────────────────
  if (step === 'error' || step === 'timeout') {
    return (
      <View style={[s.centered, { backgroundColor: colors.background, gap: 16 }]}>
        <AppIcon icon={XCircle} size={64} color="#EF4444" strokeWidth={1.6} />
        <Text style={[s.title, { color: colors.text }]}>
          {step === 'timeout' ? 'Délai expiré' : 'Paiement échoué'}
        </Text>
        <Text style={[s.msg, { color: colors.textSecondary }]}>{error}</Text>
        {step === 'timeout' && (
          <Text style={[s.hint, { color: colors.textTertiary }]}>
            Si tu as été débité, ton abonnement sera activé dès que Paystack confirme.
          </Text>
        )}
        <View style={{ width: '100%', gap: 10, paddingHorizontal: 32, marginTop: 8 }}>
          <Button label="Réessayer" variant="gold" fullWidth onPress={launch} />
          <Button
            label="Contacter le support"
            variant="outline"
            fullWidth
            onPress={() => router.replace('/(app)/support')}
          />
          <Button
            label="Retour"
            variant="ghost"
            fullWidth
            onPress={() => router.replace('/(app)/(tabs)/home')}
          />
        </View>
      </View>
    );
  }

  // ── Rendu : En attente (polling) ───────────────────────────────────────
  return (
    <View style={[s.centered, { backgroundColor: colors.background, gap: 24 }]}>

      {/* Loader rotatif */}
      <RotatingCrown />

      <View style={{ alignItems: 'center', gap: 8 }}>
        <Text style={[s.title, { color: colors.text }]}>
          En attente de confirmation
        </Text>
        <Text style={[s.msg, { color: colors.textSecondary }]}>
          Complète le paiement dans {Platform.OS === 'web' ? 'le nouvel onglet' : 'le navigateur'}.{'\n'}
          L'activation sera automatique.
        </Text>
      </View>

      {/* Barre de progression + décompte */}
      <CountdownBar remaining={remaining} total={TIMEOUT_MS} />
      <Text style={[s.countdown, { color: colors.textTertiary }]}>
        Expire dans {formatTime(remaining)}
      </Text>

      {/* Réouvrir Paystack */}
      <TouchableOpacity
        onPress={() => authUrl && openPaystackUrl(authUrl)}
        style={s.reopenBtn}
      >
        <AppIcon icon={ExternalLink} size={16} color={colors.primary} strokeWidth={2.2} />
        <Text style={{ color: colors.primary, fontSize: 14 }}>Réouvrir Paystack</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { stopAll(); router.back(); }}>
        <Text style={{ color: colors.textTertiary, fontSize: 12, textDecorationLine: 'underline' }}>
          Annuler
        </Text>
      </TouchableOpacity>

    </View>
  );
}

/* ─── Sous-composants visuels ────────────────────────────────────────────── */

function RotatingCrown() {
  const { colors } = useTheme();
  const rot = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Rotation lente en boucle
    Animated.loop(
      Animated.timing(rot, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true }),
    ).start();
    // Pulse doux
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '15deg'] });

  return (
    <Animated.View
      style={{
        transform: [{ rotate }, { scale }],
        backgroundColor: 'rgba(201,168,76,0.12)',
        borderRadius: 50,
        padding: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(201,168,76,0.3)',
      }}
    >
      <AppIcon icon={Crown} size={52} color="#C9A84C" strokeWidth={1.8} />
    </Animated.View>
  );
}

function PulseLoader({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return <Animated.View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: color, opacity: anim }} />;
}

function CountdownBar({ remaining, total }: { remaining: number; total: number }) {
  const { colors } = useTheme();
  const pct = Math.max(0, remaining / total);
  const barColor = pct > 0.4 ? '#C9A84C' : pct > 0.15 ? '#F59E0B' : '#EF4444';

  return (
    <View style={{ width: '80%', height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: barColor, borderRadius: 3 }} />
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title:      { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  msg:        { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  hint:       { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  countdown:  { fontSize: 13, letterSpacing: 0.5 },
  reopenBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },

  /* VIP */
  vipWrap:    { alignItems: 'center', justifyContent: 'center', width: 260, height: 320 },
  crownCircle:{
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 2, borderColor: 'rgba(201,168,76,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 2, borderColor: '#C9A84C',
  },
  star:       { position: 'absolute', fontSize: 18, color: '#C9A84C' },
  vipTitle:   { fontSize: 22, fontWeight: '900', color: '#C9A84C', textAlign: 'center' },
  vipSub:     { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
