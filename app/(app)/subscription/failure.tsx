import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CircleX } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { Button } from '../../../src/components/common/Button';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useSubscription } from '../../../src/hooks/useSubscription';

export default function PaymentFailureScreen() {
  const { colors, spacing } = useTheme();
  const { paymentError, clearPaymentError } = useSubscription();

  function handleRetry() {
    clearPaymentError();
    router.replace('/(app)/subscription/payment');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={{ marginBottom: 24 }}>
          <AppIcon icon={CircleX} size={80} color="#EF4444" strokeWidth={1.8} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Paiement échoué</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {paymentError ?? 'Une erreur est survenue lors du paiement. Veuillez réessayer.'}
        </Text>

        <View style={[styles.helpCard, { backgroundColor: colors.surfaceSecondary, borderRadius: 12 }]}>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8 }}>Causes possibles :</Text>
          {['Solde insuffisant', 'Numéro incorrect', 'Connexion instable', 'Transaction refusée'].map((cause) => (
            <Text key={cause} style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>• {cause}</Text>
          ))}
        </View>
      </View>

      <View style={{ width: '100%', padding: spacing.xl, gap: spacing.md }}>
        <Button label="Réessayer" variant="gold" fullWidth size="lg" onPress={handleRetry} />
        <Button label="Retour" variant="ghost" fullWidth onPress={() => router.replace('/(app)/subscription')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingTop: 80 },
  content: { alignItems: 'center', paddingHorizontal: 32, flex: 1, justifyContent: 'center', gap: 16 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  helpCard: { padding: 16, width: '100%', marginTop: 8 },
});
