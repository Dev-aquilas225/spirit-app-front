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

    // Écrire dans localStorage pour que payment.tsx le lise si l'onglet est encore ouvert
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem('paystack_result', JSON.stringify({ reference: ref, status: 'success' }));
    }

    verify();
  }, [ref]);

  async function verify() {
    try {
      // Récupérer le plan depuis localStorage (écrit par payment.tsx avant redirection)
      let plan = '';
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        try { plan = localStorage.getItem('paystack_plan') ?? ''; } catch {}
      }

      const CREDIT_PACKS = ['starter', 'standard', 'premium'];
      const isCreditPack = CREDIT_PACKS.includes(plan);

      let verified = false;
      let attempts = 0;

      while (attempts < 10 && !verified) {
        attempts++;

        if (isCreditPack) {
          // Crédits : vérifier sans activer l'abonnement
          const res = await PaymentService.verifyCreditPayment(ref).catch(() => null);
          if (res?.success) { verified = true; break; }
        } else {
          // Abonnement : vérification standard
          const res = await PaymentService.verifyPayment(ref).catch(() => null);
          if (res?.success) { verified = true; break; }
        }

        // Fallback statut DB
        const status = await PaymentService.getStatus(ref).catch(() => null);
        if (status?.status === 'active' || status?.status === 'success') {
          verified = true; break;
        }
        if (status?.status === 'failed') {
          setStep('error');
          setErrorMsg('Paiement refusé par Paystack');
          return;
        }
        await new Promise(r => setTimeout(r, 3000));
      }

      if (!verified) {
        setStep('error');
        setErrorMsg('Vérification expirée. Si vous avez été débité, contactez le support.');
        return;
      }

      // Rafraîchir selon le type
      if (isCreditPack) {
        // Crédits : rafraîchir solde uniquement, ne pas toucher à l'abonnement
        await Promise.all([fetchBalance(), refreshUser()]).catch(() => {});
      } else {
        // Abonnement : tout rafraîchir
        await Promise.all([refreshUser(), loadSubscription(), fetchBalance()]).catch(() => {});
      }

      setStep('success');
      const successUrl = plan
        ? `/subscription/success?reference=${ref}&plan=${plan}`
        : `/subscription/success?reference=${ref}`;
      setTimeout(() => router.replace(successUrl as any), 2000);
    } catch {
      setStep('error');
      setErrorMsg('Impossible de vérifier le paiement');
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
