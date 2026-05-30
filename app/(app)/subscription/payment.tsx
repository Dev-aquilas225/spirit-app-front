/**
 * PaymentScreen — Oracle Plus (Corrigé)
 *
 * Flux :
 * 1. Initie le paiement → récupère l'authorization_url Paystack
 * 2. Démarre le polling (toutes les 4s) et le décompte AVANT d'ouvrir le navigateur
 * 3. Ouvre Paystack dans un navigateur in-app via WebBrowser.openAuthSessionAsync
 * 4. Le polling détecte l'activation → ferme le navigateur → animation VIP → page succès
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
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Crown, ExternalLink, XCircle } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { useAuthStore } from '../../../src/store/auth.store';
import { useCreditsStore } from '../../../src/store/credits.store';
import { PaymentService } from '../../../src/services/payment.service';
import { fbInitiateCheckout, fbPurchase } from '../../../src/utils/fbpixel';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { Button } from '../../../src/components/common/Button';

/* ─── Constantes ─────────────────────────────────────────────────────────── */
const POLL_INTERVAL_MS  = 4_000;   
const TIMEOUT_MS        = 10 * 60 * 1000; 
const VIP_DISPLAY_MS    = 2_800;   

type Step = 'confirm' | 'initiating' | 'waiting' | 'vip' | 'timeout' | 'error';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
async function openPaystackUrl(url: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Redirection dans le même onglet — window.open est bloqué par les navigateurs
    // mobiles quand appelé hors d'un gestionnaire d'événement synchrone.
    window.location.href = url;
    return;
  }
  try {
    await WebBrowser.openAuthSessionAsync(url, 'oracleplus://');
  } catch {
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
  const crown    = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const ring     = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;
  const stars    = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.spring(crown, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(textFade, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.parallel([
        Animated.timing(ring, { toValue: 1.8, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
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
      <Animated.View style={[s.ring, { transform: [{ scale: ring }], opacity: ringOpacity }]} />
      <Animated.View style={{ transform: [{ scale: crown }] }}>
        <View style={s.crownCircle}>
          <AppIcon icon={Crown} size={64} color="#C9A84C" strokeWidth={1.6} />
        </View>
      </Animated.View>
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
  const { plan: planParam } = useLocalSearchParams<{ plan?: string }>();
  // Fallback : lire depuis window.location.search si useLocalSearchParams retourne undefined (SPA web)
  const planRaw = planParam
    ?? (Platform.OS === 'web' && typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('plan') ?? ''
        : '');
  // Accepter tous les plans valides : crédits ET abonnements
  const VALID_PLANS = ['starter', 'standard', 'premium', 'weekly_plus', 'monthly', 'yearly'];
  const plan = (VALID_PLANS.includes(planRaw) ? planRaw : 'monthly') as string;
  const { initiatePayment, paymentError, clearPaymentError, loadSubscription } = useSubscription();
  const refreshUser    = useAuthStore((s) => s.refreshUser);
  const fetchBalance    = useCreditsStore((s) => s.fetchBalance);
  const purchaseCredits = useCreditsStore((s) => s.purchase);

  const [step, setStep]         = useState<Step>('confirm');
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

  const launch = useCallback(async () => {
    stopAll();
    clearPaymentError();
    setError(null);
    setStep('initiating');
    setRemaining(TIMEOUT_MS);

    // Pixel : InitiateCheckout dès le clic sur Payer
    fbInitiateCheckout(plan, PLAN_AMOUNTS[plan] ?? 0);

    const result = await initiatePayment(plan);
    if (!result) {
      setError(paymentError ?? 'Impossible d\'initier le paiement.');
      setStep('error');
      return;
    }

    setRef(result.reference);
    setAuthUrl(result.authorization_url);
    setStep('waiting');
    startedAt.current = Date.now();

    pollRef.current = setInterval(async () => {
      // Appeler verifyPayment() qui vérifie avec Paystack ET active le service
      const verified = await PaymentService.verifyPayment(result.reference).catch(() => null);

      if (verified?.success) {
        stopAll();
        try { if (Platform.OS !== 'web') await WebBrowser.dismissBrowser(); } catch {}
        // Pour les packs crédits : créditer explicitement via /credits/purchase
        const isCreditPack = ['starter','standard','premium'].includes(plan);
        if (isCreditPack) {
          await purchaseCredits(plan, result.reference);
        }
        await Promise.all([loadSubscription(), refreshUser(), fetchBalance()]);
        // Pixel : Purchase confirmé
        fbPurchase(plan, PLAN_AMOUNTS[plan] ?? 0);
        setStep('vip');
        setTimeout(() => router.replace(`/subscription/success?reference=${result.reference}` as any), VIP_DISPLAY_MS);
        return;
      }

      // Fallback : vérifier le statut en DB si verifyPayment échoue
      const { status } = await PaymentService.getStatus(result.reference).catch(() => ({ status: 'pending' as const }));
      if (status === 'active' || status === 'success') {
        stopAll();
        try { if (Platform.OS !== 'web') await WebBrowser.dismissBrowser(); } catch {}
        const isCreditPack = ['starter','standard','premium'].includes(plan);
        if (isCreditPack) {
          await purchaseCredits(plan, result.reference);
        }
        await Promise.all([loadSubscription(), refreshUser(), fetchBalance()]);
        // Pixel : Purchase confirmé (fallback)
        fbPurchase(plan, PLAN_AMOUNTS[plan] ?? 0);
        setStep('vip');
        setTimeout(() => router.replace(`/subscription/success?reference=${result.reference}` as any), VIP_DISPLAY_MS);
        return;
      }

      if (status === 'failed' || status === 'cancelled') {
        stopAll();
        try { if (Platform.OS !== 'web') await WebBrowser.dismissBrowser(); } catch {}
        setError('Le paiement n\'a pas abouti.');
        setStep('error');
      }
    }, POLL_INTERVAL_MS);

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

    // Sur web : quand l'utilisateur revient sur l'onglet (après iOS redirect),
    // vérifier immédiatement le statut via localStorage (écrit par callback.tsx)
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const onVisible = async () => {
        if (document.visibilityState !== 'visible') return;
        // Lire le résultat écrit par la page callback
        const stored = localStorage.getItem('paystack_result');
        if (stored) {
          try {
            const { reference: ref, status: st } = JSON.parse(stored);
            if (ref === result.reference && (st === 'success' || st === 'active')) {
              localStorage.removeItem('paystack_result');
              stopAll();
              await Promise.all([loadSubscription(), refreshUser(), fetchBalance()]);
              setStep('vip');
              setTimeout(() => router.replace('/subscription/success'), VIP_DISPLAY_MS);
              return;
            }
          } catch {}
        }
        // Sinon forcer un verify immédiat
        const vr = await PaymentService.verifyPayment(result.reference).catch(() => null);
        if (vr?.success) {
          stopAll();
          await Promise.all([loadSubscription(), refreshUser(), fetchBalance()]);
          setStep('vip');
          setTimeout(() => router.replace(`/subscription/success?reference=${result.reference}` as any), VIP_DISPLAY_MS);
        }
      };
      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('focus', onVisible);
    }

    await openPaystackUrl(result.authorization_url);
  }, [initiatePayment, loadSubscription, stopAll, clearPaymentError]);

  // Ne lance PAS automatiquement — l'utilisateur confirme d'abord
  useEffect(() => {
    return () => stopAll();
  }, []);

  // ── Écran de confirmation ──────────────────────────────────────────────
  // Montants en FCFA pour le Pixel Facebook
  const PLAN_AMOUNTS: Record<string, number> = {
    starter: 500, standard: 1000, premium: 2500,
    weekly_plus: 3000, monthly: 8000, yearly: 15000,
  };

  const planLabels: Record<string, { name: string; price: string; desc: string }> = {
    starter:     { name: 'Pack Départ',       price: '500 FCFA',   desc: '500 crédits' },
    standard:    { name: 'Pack Standard',     price: '1 000 FCFA', desc: '2 000 crédits · ⭐ Populaire' },
    premium:     { name: 'Pack Premium',      price: '2 500 FCFA', desc: '5 000 crédits · 🏆 Meilleure valeur' },
    weekly_plus: { name: 'Hebdomadaire Plus', price: '3 000 FCFA', desc: '7 jours d\'accès illimité' },
    monthly:     { name: 'Mensuel',           price: '8 000 FCFA', desc: '30 jours d\'accès illimité' },
    yearly:      { name: 'Annuel',            price: '15 000 FCFA',desc: '365 jours d\'accès illimité' },
  };
  const planInfo = planLabels[plan] ?? planLabels['monthly'];

  if (step === 'confirm') {
    return (
      <View style={[s.centered, { backgroundColor: colors.background, gap: 24, paddingHorizontal: 32 }]}>
        <View style={{ backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 50, padding: 20, borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.3)' }}>
          <AppIcon icon={Crown} size={52} color="#C9A84C" strokeWidth={1.8} />
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={[s.title, { color: colors.text }]}>{planInfo.name}</Text>
          <Text style={[{ fontSize: 28, fontWeight: '900', color: '#C9A84C' }]}>{planInfo.price}</Text>
          <Text style={[s.msg, { color: colors.textSecondary }]}>{planInfo.desc}</Text>
        </View>
        <View style={{ width: '100%', gap: 12 }}>
          <Button label="Payer maintenant" variant="gold" fullWidth onPress={launch} />
          <Button label="Annuler" variant="ghost" fullWidth onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  if (step === 'vip') {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <VipAnimation />
      </View>
    );
  }

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
          <Button label="Contacter le support" variant="outline" fullWidth onPress={() => router.replace('/support')} />
          <Button label="Retour" variant="ghost" fullWidth onPress={() => router.replace('/dashboard')} />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.centered, { backgroundColor: colors.background, gap: 24 }]}>
      <RotatingCrown />
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Text style={[s.title, { color: colors.text }]}>En attente de confirmation</Text>
        <Text style={[s.msg, { color: colors.textSecondary }]}>
          Complète le paiement dans {Platform.OS === 'web' ? 'le nouvel onglet' : 'le navigateur'}.{'\n'}
          L'activation sera automatique.
        </Text>
      </View>
      <CountdownBar remaining={remaining} total={TIMEOUT_MS} />
      <Text style={[s.countdown, { color: colors.textTertiary }]}>Expire dans {formatTime(remaining)}</Text>
      <TouchableOpacity onPress={() => authUrl && openPaystackUrl(authUrl)} style={s.reopenBtn}>
        <AppIcon icon={ExternalLink} size={16} color={colors.primary} strokeWidth={2.2} />
        <Text style={{ color: colors.primary, fontSize: 14 }}>Réouvrir Paystack</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { stopAll(); router.back(); }}>
        <Text style={{ color: colors.textTertiary, fontSize: 12, textDecorationLine: 'underline' }}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Sous-composants visuels ────────────────────────────────────────────── */
function RotatingCrown() {
  const rot = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(rot, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '15deg'] });

  return (
    <Animated.View style={{ transform: [{ rotate }, { scale }], backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 50, padding: 20, borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.3)' }}>
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

const s = StyleSheet.create({
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title:      { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  msg:        { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  hint:       { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  countdown:  { fontSize: 13, letterSpacing: 0.5 },
  reopenBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  vipWrap:    { alignItems: 'center', justifyContent: 'center', width: 260, height: 320 },
  crownCircle:{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 2, borderColor: 'rgba(201,168,76,0.4)', alignItems: 'center', justifyContent: 'center' },
  ring:       { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 2, borderColor: '#C9A84C' },
  star:       { position: 'absolute', fontSize: 18, color: '#C9A84C' },
  vipTitle:   { fontSize: 22, fontWeight: '900', color: '#C9A84C', textAlign: 'center' },
  vipSub:     { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
