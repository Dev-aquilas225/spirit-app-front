import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle, ExternalLink, XCircle } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { Button } from '../../../src/components/common/Button';

type Step = 'initiating' | 'waiting' | 'verifying' | 'error';

/**
 * Ouvre l'URL de paiement Paystack.
 * - Sur web/PWA : window.open(_blank) pour ne pas détruire l'app
 * - Sur mobile natif : Linking.openURL (ouvre le navigateur système)
 */
async function openPaystackUrl(url: string) {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const { Linking } = await import('react-native');
  await Linking.openURL(url);
}

export default function PaymentScreen() {
  const { colors } = useTheme();
  const { initiatePayment, verifyPayment, isProcessingPayment, paymentError, clearPaymentError } = useSubscription();

  const [step, setStep]           = useState<Step>('initiating');
  const [reference, setReference] = useState<string | null>(null);
  const [authUrl, setAuthUrl]     = useState<string | null>(null);

  // Lance Paystack automatiquement dès le montage
  useEffect(() => {
    launch();
  }, []);

  async function launch() {
    clearPaymentError();
    setStep('initiating');
    const result = await initiatePayment('monthly');
    if (!result) {
      setStep('error');
      return;
    }
    setReference(result.reference);
    setAuthUrl(result.authorization_url);
    setStep('waiting');
    await openPaystackUrl(result.authorization_url);
  }

  async function handleVerify() {
    if (!reference) return;
    setStep('verifying');
    const success = await verifyPayment(reference);
    if (success) {
      router.replace('/(app)/subscription/success');
    } else {
      router.push('/(app)/subscription/failure');
    }
  }

  // ── Chargement / lancement ────────────────────────────────────────────────
  if (step === 'initiating') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#C9A84C" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Connexion à Paystack…
        </Text>
      </View>
    );
  }

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <AppIcon icon={XCircle} size={56} color="#EF4444" strokeWidth={1.8} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Paiement indisponible</Text>
        <Text style={[styles.errorMsg, { color: colors.textSecondary }]}>
          {paymentError ?? 'Une erreur est survenue. Réessaie.'}
        </Text>
        <Button label="Réessayer" variant="gold" onPress={launch} style={{ marginTop: 24, minWidth: 180 }} />
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.textTertiary, fontSize: 13, textDecorationLine: 'underline' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── En attente de paiement / vérification ─────────────────────────────────
  return (
    <View style={[styles.centered, { backgroundColor: colors.background, gap: 20 }]}>

      {step === 'verifying' ? (
        <>
          <ActivityIndicator size="large" color="#C9A84C" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Vérification du paiement…
          </Text>
        </>
      ) : (
        <>
          <AppIcon icon={CheckCircle} size={64} color="#C9A84C" strokeWidth={1.6} />

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={[styles.waitTitle, { color: colors.text }]}>
              Paystack est ouvert
            </Text>
            <Text style={[styles.waitSub, { color: colors.textSecondary }]}>
              {Platform.OS === 'web'
                ? 'Complète le paiement dans le nouvel onglet,\npuis reviens ici pour confirmer.'
                : 'Complète le paiement dans le navigateur,\npuis reviens ici pour confirmer.'}
            </Text>
          </View>

          <Button
            label="J'ai payé — Confirmer"
            variant="gold"
            fullWidth
            size="lg"
            onPress={handleVerify}
            style={{ maxWidth: 320 }}
          />

          <TouchableOpacity
            onPress={() => authUrl && openPaystackUrl(authUrl)}
            style={styles.reopenBtn}
          >
            <AppIcon icon={ExternalLink} size={16} color={colors.primary} strokeWidth={2.2} />
            <Text style={{ color: colors.primary, fontSize: 14 }}>Réouvrir Paystack</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 4 }}>
            <Text style={{ color: colors.textTertiary, fontSize: 12, textDecorationLine: 'underline' }}>
              Annuler
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 16, fontSize: 15, textAlign: 'center' },
  errorTitle: { fontSize: 20, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  errorMsg: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: 8 },
  waitTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  waitSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  reopenBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
});
