/**
 * Paystack Callback — Oracle Plus
 * Paystack redirige ici après paiement : /subscription/callback?reference=ORP-xxx
 * Cette page vérifie le paiement, rafraîchit le profil et redirige vers /subscription/success
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { Button } from '../../../src/components/common/Button';
import { PaymentService } from '../../../src/services/payment.service';
import { useAuthStore } from '../../../src/store/auth.store';
import { useSubscriptionStore } from '../../../src/store/subscription.store';
import { useCreditsStore } from '../../../src/store/credits.store';

type Step = 'verifying' | 'success' | 'error';

export default function PaystackCallbackScreen() {
  const { colors } = useTheme();
  const { reference, trxref } = useLocalSearchParams<{ reference?: string; trxref?: string }>();
  const ref = (reference || trxref || '').toString();
  const [step, setStep] = useState<Step>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  const refreshUser       = useAuthStore((s) => s.refreshUser);
  const loadSubscription  = useSubscriptionStore((s) => s.loadSubscription);
  const fetchBalance      = useCreditsStore((s) => s.fetchBalance);

  useEffect(() => {
    if (!ref) { setStep('error'); setErrorMsg('Référence manquante'); return; }
    // NE PAS écrire localStorage ici — seulement après vérification backend réussie
    verify();
  }, [ref]);

  async function verify() {
    try {
      let plan = '';
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        try { plan = localStorage.getItem('paystack_plan') ?? ''; } catch {}
      }

      const CREDIT_PACKS = ['starter', 'standard', 'premium'];
      const isCreditPack = CREDIT_PACKS.includes(plan);

      let verified = false;
      const MAX_ATTEMPTS = 20;   // 20 × 5s = 100s max
      const DELAY_MS     = 5000;

      for (let i = 0; i < MAX_ATTEMPTS && !verified; i++) {
        // 1. Vérification principale
        try {
          const res = isCreditPack
            ? await PaymentService.verifyCreditPayment(ref)
            : await PaymentService.verifyPayment(ref);
          if (res?.success) { verified = true; break; }
        } catch {}

        // 2. Fallback statut DB — valide l'accès même si verify échoue
        try {
          const { status } = await PaymentService.getStatus(ref);
          if (status === 'active' || status === 'success') { verified = true; break; }
          if (status === 'failed' || status === 'cancelled') {
            setStep('error');
            setErrorMsg('Paiement refusé. Aucun montant n\'a été débité.');
            return;
          }
        } catch {}

        if (i < MAX_ATTEMPTS - 1) await new Promise(r => setTimeout(r, DELAY_MS));
      }

      if (!verified) {
        // Dernière chance : getStatus seul
        try {
          const { status } = await PaymentService.getStatus(ref);
          if (status === 'active' || status === 'success') verified = true;
        } catch {}
      }

      if (!verified) {
        // Paiement non confirmé mais peut-être en cours côté Paystack
        // → activer quand même si le backend a enregistré la référence
        setStep('error');
        setErrorMsg('Vérification en attente. Si vous avez été débité, votre accès sera activé automatiquement. Contactez le support si le problème persiste.');
        return;
      }

      // Rafraîchir immédiatement + retry après 4s (délai traitement backend Paystack)
      if (isCreditPack) {
        await Promise.all([fetchBalance(), refreshUser()]).catch(() => {});
        setTimeout(() => fetchBalance().catch(() => {}), 4000);
      } else {
        await Promise.all([refreshUser(), loadSubscription(), fetchBalance()]).catch(() => {});
        setTimeout(async () => {
          await Promise.all([loadSubscription(), fetchBalance()]).catch(() => {});
        }, 4000);
      }

      // Signaler à payment.tsx (si ouvert) que la vérification backend a réussi
      // NOTE : on écrit APRÈS vérification — jamais avant
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('paystack_verified', JSON.stringify({ reference: ref, ts: Date.now() }));
        } catch {}
      }

      setStep('success');
      const successUrl = plan
        ? `/subscription/success?reference=${ref}&plan=${plan}`
        : `/subscription/success?reference=${ref}`;
      setTimeout(() => router.replace(successUrl as any), 1500);
    } catch {
      setStep('error');
      setErrorMsg('Impossible de vérifier le paiement. Vérifiez votre connexion.');
    }
  }

  if (step === 'verifying') return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[s.title, { color: colors.text, marginTop: 24 }]}>Vérification du paiement…</Text>
      <Text style={[s.sub, { color: colors.textTertiary }]}>Merci de patienter quelques secondes</Text>
    </View>
  );

  if (step === 'error') return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <AppIcon icon={XCircle} size={64} color="#EF4444" strokeWidth={1.5} />
      <Text style={[s.title, { color: colors.text }]}>Problème de vérification</Text>
      <Text style={[s.sub, { color: colors.textTertiary }]}>{errorMsg}</Text>
      <Text style={[s.sub, { color: colors.textTertiary, marginTop: 8 }]}>
        Si vous avez été débité, contactez le support.{'\n'}Votre accès sera activé manuellement.
      </Text>
      <View style={{ width: '100%', paddingHorizontal: 32, gap: 10, marginTop: 24 }}>
        <Button label="Retour à l'accueil" variant="gold" fullWidth onPress={() => router.replace('/dashboard')} />
        <Button label="Contacter le support" variant="outline" fullWidth onPress={() => router.replace('/support')} />
      </View>
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={s.iconWrap}>
        <AppIcon icon={CheckCircle} size={64} color="#10B981" strokeWidth={1.5} />
      </View>
      <Text style={[s.title, { color: colors.text }]}>Paiement confirmé !</Text>
      <Text style={[s.sub, { color: colors.textTertiary }]}>Votre accès est activé. Redirection…</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  iconWrap:{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  sub:     { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
