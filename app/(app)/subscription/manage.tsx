import React from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { ScreenWrapper } from '../../../src/components/common/ScreenWrapper';
import { BackButton } from '../../../src/components/common/BackButton';
import { Button } from '../../../src/components/common/Button';
import { GoldCard } from '../../../src/components/common/Card';
import { formatDate, formatCurrency } from '../../../src/utils/helpers';

export default function ManageSubscriptionScreen() {
  const { colors, spacing } = useTheme();
  const { subscription, cancelSubscription, isLoading } = useSubscription();

  function handleCancel() {
    Alert.alert(
      'Annuler l\'abonnement',
      'Vous perdrez tous vos accès premium à la date d\'expiration. Confirmez-vous ?',
      [
        { text: 'Non, garder', style: 'cancel' },
        {
          text: 'Annuler l\'abonnement',
          style: 'destructive',
          onPress: async () => {
            await cancelSubscription();
            Alert.alert('Abonnement annulé', 'Votre abonnement expirera à la date prévue.');
            router.back();
          },
        },
      ],
    );
  }

  if (!subscription) return null;

  return (
    <ScreenWrapper scrollable padded>
      <BackButton style={{ marginBottom: 24 }} />

      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 24 }}>
        Gérer l’abonnement
      </Text>

      <GoldCard style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 12, marginBottom: 12 }}>ABONNEMENT ACTUEL</Text>
        <View style={styles.row}>
          <Text style={{ color: colors.textSecondary }}>Statut</Text>
          <Text style={{ color: subscription.status === 'active' ? '#10B981' : '#EF4444', fontWeight: '600' }}>
            {subscription.status === 'active' ? '● Actif' : '● Annulé'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={{ color: colors.textSecondary }}>Début</Text>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{formatDate(subscription.startDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={{ color: colors.textSecondary }}>Expiration</Text>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{formatDate(subscription.expiryDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={{ color: colors.textSecondary }}>Montant</Text>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{formatCurrency(subscription.amount)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={{ color: colors.textSecondary }}>Renouvellement</Text>
          <Text style={{ color: subscription.autoRenew ? '#10B981' : colors.textSecondary, fontWeight: '600' }}>
            {subscription.autoRenew ? 'Automatique' : 'Désactivé'}
          </Text>
        </View>
      </GoldCard>

      <Button
        label="Renouveler maintenant"
        variant="gold"
        fullWidth
        style={{ marginBottom: spacing.md }}
        onPress={() => router.push('/(app)/subscription/payment')}
      />

      {subscription.status === 'active' && (
        <Button
          label="Annuler l'abonnement"
          variant="danger"
          fullWidth
          loading={isLoading}
          onPress={handleCancel}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
});
