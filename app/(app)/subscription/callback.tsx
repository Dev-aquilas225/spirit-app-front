/**
 * Paystack Callback Page
 *
 * Paystack redirige l'utilisateur ici après le paiement :
 *   https://bo.oracle-plus.online/subscription/callback?reference=ORP-xxx&trxref=ORP-xxx
 *
 * Cette page lit la référence dans les query params, appelle verifyPayment()
 * et redirige vers success ou failure selon le résultat.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { Button } from '../../../src/components/common/Button';

type Status = 'verifying' | 'success' | 'error';

export default function PaystackCallbackScreen() {
  const { colors } = useTheme();
  const { verifyPayment, paymentError } = useSubscription();
  const params = useLocalSearchParams<{ reference?: string; trxref?: string }>();

  const [status, setStatus] = useState<Status>('verifying');

  useEffect(() => {
    const reference = params.reference ?? params.trxref;
    if (reference) {
      verify(reference);
    } else {
      setStatus('error');
    }
  }, []);

  async function verify(reference: string) {
    setStatus('verifying');
    const success = await verifyPayment(reference);
    if (success) {
      setStatus('success');
      // Courte pause pour montrer le checkmark avant de naviguer
      setTimeout(() => router.replace('/(app)/subscription/success'), 800);
    } else {
      setStatus('error');
    }
  }

  // ── Vérification en cours ────────────────────────────────────────────────
  if (status === 'verifying') {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#C9A84C" />
        <Text style={[s.msg, { color: colors.textSecondary }]}>
          Vérification du paiement…
        </Text>
      </View>
    );
  }

  // ── Succès (flash rapide) ───────────────────────────────────────────────
  if (status === 'success') {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <AppIcon icon={CheckCircle} size={72} color="#10B981" strokeWidth={1.6} />
        <Text style={[s.msg, { color: colors.text, fontWeight: '700', marginTop: 16 }]}>
          Paiement confirmé !
        </Text>
      </View>
    );
  }

  // ── Erreur ────────────────────────────────────────────────────────────────
  return (
    <View style={[s.centered, { backgroundColor: colors.background, gap: 16 }]}>
      <AppIcon icon={XCircle} size={64} color="#EF4444" strokeWidth={1.6} />
      <Text style={[s.title, { color: colors.text }]}>Vérification échouée</Text>
      <Text style={[s.msg, { color: colors.textSecondary }]}>
        {paymentError ?? 'Impossible de confirmer le paiement.'}
      </Text>
      <Text style={[s.hint, { color: colors.textTertiary }]}>
        Si tu as été débité, contacte le support — ton abonnement sera activé manuellement.
      </Text>
      <View style={{ width: '100%', gap: 10, paddingHorizontal: 32, marginTop: 8 }}>
        <Button
          label="Contacter le support"
          variant="gold"
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

const s = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  msg: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  hint: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
