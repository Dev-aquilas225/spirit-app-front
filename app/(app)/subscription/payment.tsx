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
import { useSubscriptionStore } from '../../../src/store/subscription.store';
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

/**
 * Étapes du flux de paiement :
 *  confirm   → l'utilisateur voit le récapitulatif + bandeau partenaire
 *  initiating → appel backend en cours
 *  waiting   → Paystack ouvert, polling actif
 *  partner   → paiement détecté, OBLIGATOIRE : l'utilisateur confirme avoir vu le nom marchand
 *  vip       → animation de succès
 *  timeout / error → cas d'erreur
 */
type Step = 'confirm' | 'initiating' | 'waiting' | 'partner' | 'vip' | 'timeout' | 'error';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
async function openPaystackUrl(url: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Ouvrir dans un nouvel onglet — préserve le polling dans l'onglet courant
    // et fonctionne en navigation privée (pas de dépendance au localStorage inter-onglets)
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      // Popup bloqué — fallback même onglet
      window.location.href = url;
    }
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

  const [step, setStep]         = useState<Step>('confirm');
  const [reference, setRef]     = useState<string | null>(null);
  const [authUrl, setAuthUrl]   = useState<string | null>(null);
  const [remaining, setRemaining] = useState(TIMEOUT_MS);
  const [error, setError]       = useState<string | null>(null);
  // Référence gardée pour la confirmation partenaire
  const pendingRef = useRef<string | null>(null);

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

    const isCreditPack = ['starter', 'standard', 'premium'].includes(plan);
    let successCalled = false; // garde-fou contre les appels multiples

    async function handleSuccess(ref: string) {
      if (successCalled) return;
      successCalled = true;
      stopAll();
      cleanupListeners();
      try { if (Platform.OS !== 'web') await WebBrowser.dismissBrowser(); } catch {}
      // Rafraîchir immédiatement puis poller jusqu'à ce que le backend ait traité
      if (isCreditPack) {
        const balanceBefore = useCreditsStore.getState().credits;
        await fetchBalance().catch(() => {});
        // Poller jusqu'à 30s pour détecter l'augmentation du solde (délai webhook Paystack)
        let attempts = 0;
        const pollBalance = setInterval(async () => {
          attempts++;
          await fetchBalance().catch(() => {});
          const newBalance = useCreditsStore.getState().credits;
          if (newBalance > balanceBefore || attempts >= 10) {
            clearInterval(pollBalance);
          }
        }, 3000);
      } else {
        await Promise.all([loadSubscription(), refreshUser(), fetchBalance()]).catch(() => {});
        // Poller jusqu'à ce que isActive soit true
        let attempts = 0;
        const pollSub = setInterval(async () => {
          attempts++;
          await Promise.all([loadSubscription(), fetchBalance()]).catch(() => {});
          if (useSubscriptionStore.getState().isActive || attempts >= 10) {
            clearInterval(pollSub);
          }
        }, 3000);
      }
      fbPurchase(plan, PLAN_AMOUNTS[plan] ?? 0);
      // Étape obligatoire : afficher la page partenaire avant de valider
      pendingRef.current = ref;
      setStep('partner');
    }

    // Nettoyage des listeners web — stocké pour pouvoir les supprimer
    let onVisible: (() => void) | null = null;
    function cleanupListeners() {
      if (Platform.OS === 'web' && typeof document !== 'undefined' && onVisible) {
        document.removeEventListener('visibilitychange', onVisible);
        window.removeEventListener('focus', onVisible);
        onVisible = null;
      }
    }

    const payRef = result!.reference;

    // Vérification unique (verify + fallback getStatus)
    async function checkOnce(): Promise<boolean> {
      try {
        const verified = isCreditPack
          ? await PaymentService.verifyCreditPayment(payRef)
          : await PaymentService.verifyPayment(payRef);
        if (verified?.success) return true;
      } catch {}
      // Fallback statut DB
      try {
        const { status } = await PaymentService.getStatus(payRef);
        if (status === 'active' || status === 'success') return true;
        if (status === 'failed' || status === 'cancelled') {
          stopAll();
          cleanupListeners();
          try { if (Platform.OS !== 'web') await WebBrowser.dismissBrowser(); } catch {}
          setError('Le paiement n\'a pas abouti.');
          setStep('error');
        }
      } catch {}
      return false;
    }

    pollRef.current = setInterval(async () => {
      const ok = await checkOnce();
      if (ok) await handleSuccess(payRef);
    }, POLL_INTERVAL_MS);

    timerRef.current = setInterval(async () => {
      const elapsed = Date.now() - startedAt.current;
      const rem     = TIMEOUT_MS - elapsed;
      setRemaining(rem);

      if (rem <= 0) {
        stopAll();
        // Dernière vérification forcée avant d'afficher le timeout
        const ok = await checkOnce();
        if (ok) { await handleSuccess(payRef); return; }
        cleanupListeners();
        setError('Délai de 10 minutes dépassé. Si tu as été débité, ton accès sera activé automatiquement sous peu.');
        setStep('timeout');
      }
    }, 1_000);

    // Sur web : vérifier immédiatement quand l'utilisateur revient sur l'onglet
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      onVisible = async () => {
        if (document.visibilityState !== 'visible') return;
        // callback.tsx écrit 'paystack_verified' SEULEMENT après vérification backend réussie
        // On re-vérifie quand même avec le backend pour éviter toute manipulation locale
        const stored = localStorage.getItem('paystack_verified');
        if (stored) {
          try {
            const { reference: verifiedRef, ts } = JSON.parse(stored);
            const age = Date.now() - (ts ?? 0);
            // Valide seulement si la référence correspond ET récente (< 10 min)
            if (verifiedRef === payRef && age < 10 * 60 * 1000) {
              localStorage.removeItem('paystack_verified');
              // Re-vérifier avec le backend — ne jamais faire confiance au localStorage seul
              const ok = await checkOnce();
              if (ok) { await handleSuccess(payRef); return; }
            }
          } catch {}
        }
        const ok = await checkOnce();
        if (ok) await handleSuccess(payRef);
      };
      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('focus', onVisible);
    }

    // Sauvegarder le plan pour que callback.tsx puisse le passer à success.tsx
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try { localStorage.setItem('paystack_plan', plan); } catch {}
    }

    await openPaystackUrl(result.authorization_url);
  }, [initiatePayment, loadSubscription, stopAll, clearPaymentError]);

  // Confirmation partenaire → déclenche l'animation VIP puis redirige
  function confirmPartner() {
    const ref = pendingRef.current;
    if (!ref) return;
    setStep('vip');
    setTimeout(() => router.replace(`/subscription/success?reference=${ref}&plan=${plan}` as any), VIP_DISPLAY_MS);
  }

  // Ne lance PAS automatiquement — l'utilisateur confirme d'abord
  useEffect(() => {
    return () => stopAll();
  }, []);

  // ── Écran de confirmation ──────────────────────────────────────────────
  // Montants en FCFA pour le Pixel Facebook
  const PLAN_AMOUNTS: Record<string, number> = {
    starter: 500, standard: 1000, premium: 2500,  // prix FCFA (pas crédits)
    weekly_plus: 3000, monthly: 8000, yearly: 15000,
  };

  const planLabels: Record<string, { name: string; price: string; desc: string }> = {
    starter:     { name: 'Pack Départ',       price: '500 FCFA',   desc: '500 crédits (500 mots)' },
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

        {/* Bandeau partenaire financier */}
        <View style={s.partnerBanner}>
          <Text style={s.partnerIcon}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.partnerTitle}>Paiement sécurisé</Text>
            <Text style={s.partnerText}>
              Sur votre relevé bancaire, la transaction apparaîtra sous le nom{' '}
              <Text style={s.partnerName}>universdeslivres.squares</Text>
              {' '}— notre partenaire financier agréé.
            </Text>
          </View>
        </View>

        <View style={{ width: '100%', gap: 12 }}>
          <Button label="Payer maintenant" variant="gold" fullWidth onPress={launch} />
          <Button label="Annuler" variant="ghost" fullWidth onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  // ── Étape partenaire financier (obligatoire avant validation) ─────────────
  if (step === 'partner') {
    const isCreditPack = ['starter', 'standard', 'premium'].includes(plan);
    return (
      <View style={[s.centered, { backgroundColor: colors.background, gap: 0, paddingHorizontal: 28 }]}>
        {/* Icône sécurité */}
        <View style={s.partnerIconCircle}>
          <Text style={{ fontSize: 40 }}>🔒</Text>
        </View>

        <Text style={[s.title, { color: colors.text, marginTop: 20, marginBottom: 8 }]}>
          Paiement reçu !
        </Text>
        <Text style={[s.msg, { color: colors.textSecondary, marginBottom: 28 }]}>
          Votre paiement a bien été traité. Avant de continuer, veuillez noter l'information suivante :
        </Text>

        {/* Encadré nom marchand */}
        <View style={s.merchantBox}>
          <Text style={s.merchantLabel}>Nom marchand sur votre relevé</Text>
          <Text style={s.merchantName}>universdeslivres.squares</Text>
          <View style={s.merchantDivider} />
          <Text style={s.merchantDesc}>
            Ce nom correspond à notre partenaire financier agréé qui traite les paiements pour Oracle Plus.
            Si vous voyez ce nom sur votre relevé bancaire ou carte, c'est tout à fait normal — il s'agit bien de votre achat Oracle Plus.
          </Text>
        </View>

        {/* Détail de la transaction */}
        <View style={[s.txRow, { borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Plan</Text>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{planInfo.name}</Text>
        </View>
        <View style={[s.txRow, { borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Montant</Text>
          <Text style={{ color: '#C9A84C', fontWeight: '800', fontSize: 13 }}>{planInfo.price}</Text>
        </View>
        <View style={[s.txRow, { borderColor: colors.border, borderBottomWidth: 0 }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Type</Text>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
            {isCreditPack ? 'Pack de crédits' : 'Abonnement'}
          </Text>
        </View>

        {/* Bouton de confirmation */}
        <TouchableOpacity style={s.confirmBtn} onPress={confirmPartner} activeOpacity={0.85}>
          <Text style={s.confirmBtnTxt}>J'ai compris — Accéder à mon compte</Text>
        </TouchableOpacity>

        <Text style={[s.hint, { color: colors.textTertiary, marginTop: 12 }]}>
          En cas de doute, contactez notre support.
        </Text>
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

      {/* Rappel partenaire financier */}
      <View style={[s.partnerBanner, { marginHorizontal: 32 }]}>
        <Text style={s.partnerIcon}>🔒</Text>
        <Text style={[s.partnerText, { flex: 1 }]}>
          La transaction apparaîtra sous{' '}
          <Text style={s.partnerName}>universdeslivres.squares</Text>
          {' '}sur votre relevé — c'est normal, c'est notre partenaire financier.
        </Text>
      </View>

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
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title:         { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  msg:           { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  hint:          { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  countdown:     { fontSize: 13, letterSpacing: 0.5 },
  reopenBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  vipWrap:       { alignItems: 'center', justifyContent: 'center', width: 260, height: 320 },
  crownCircle:   { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 2, borderColor: 'rgba(201,168,76,0.4)', alignItems: 'center', justifyContent: 'center' },
  ring:          { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 2, borderColor: '#C9A84C' },
  star:          { position: 'absolute', fontSize: 18, color: '#C9A84C' },
  vipTitle:      { fontSize: 22, fontWeight: '900', color: '#C9A84C', textAlign: 'center' },
  vipSub:        { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  // Bandeau partenaire financier (écrans confirm + waiting)
  partnerBanner:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', borderRadius: 12, padding: 12, width: '100%' },
  partnerIcon:       { fontSize: 16, marginTop: 1 },
  partnerTitle:      { fontSize: 12, fontWeight: '700', color: '#10B981', marginBottom: 2 },
  partnerText:       { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },
  partnerName:       { fontWeight: '700', color: '#10B981' },
  // Écran partenaire obligatoire (step === 'partner')
  partnerIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.3)', alignItems: 'center', justifyContent: 'center' },
  merchantBox:       { width: '100%', backgroundColor: 'rgba(201,168,76,0.08)', borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.3)', borderRadius: 16, padding: 18, marginBottom: 12 },
  merchantLabel:     { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  merchantName:      { fontSize: 20, fontWeight: '900', color: '#C9A84C', letterSpacing: 0.5, marginBottom: 12 },
  merchantDivider:   { height: 1, backgroundColor: 'rgba(201,168,76,0.2)', marginBottom: 12 },
  merchantDesc:      { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  txRow:             { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  confirmBtn:        { width: '100%', backgroundColor: '#C9A84C', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  confirmBtnTxt:     { color: '#fff', fontSize: 16, fontWeight: '800' },
});
