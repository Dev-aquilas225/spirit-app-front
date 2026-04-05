import React from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { ScreenWrapper } from '../../../src/components/common/ScreenWrapper';
import { BackButton } from '../../../src/components/common/BackButton';
import { Button } from '../../../src/components/common/Button';
import { GoldCard } from '../../../src/components/common/Card';
import { formatDate, formatCurrency } from '../../../src/utils/helpers';

export default function ManageSubscriptionScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  const { subscription, cancelSubscription, isLoading } = useSubscription();

  function handleCancel() {
    Alert.alert(
      t.subscription.cancelConfirmTitle,
      t.subscription.cancelConfirmMsg,
      [
        { text: t.subscription.cancelKeep, style: 'cancel' },
        {
          text: t.common.cancel,
          style: 'destructive',
          onPress: async () => {
            await cancelSubscription();
            Alert.alert(t.subscription.cancelSuccessTitle, t.subscription.cancelSuccessMsg);
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
        {t.subscription.manage}
      </Text>

      <GoldCard style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 12, marginBottom: 12 }}>{t.subscription.mySubscription}</Text>
        <View style={styles.row}>
          <Text style={{ color: colors.textSecondary }}>{t.subscription.status}</Text>
          <Text style={{ color: subscription.status === 'active' ? '#10B981' : '#EF4444', fontWeight: '600' }}>
            {subscription.status === 'active' ? t.subscription.statusActive : '● Annulé'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={{ color: colors.textSecondary }}>{t.subscription.startDate}</Text>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{formatDate(subscription.startDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={{ color: colors.textSecondary }}>{t.subscription.expiresOn}</Text>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{formatDate(subscription.expiryDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={{ color: colors.textSecondary }}>{t.subscription.amount}</Text>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{formatCurrency(subscription.amount)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={{ color: colors.textSecondary }}>{t.subscription.renewal}</Text>
          <Text style={{ color: subscription.autoRenew ? '#10B981' : colors.textSecondary, fontWeight: '600' }}>
            {subscription.autoRenew ? t.subscription.renewalAuto : t.subscription.renewalDisabled}
          </Text>
        </View>
      </GoldCard>

      <Button
        label={t.subscription.renewNow}
        variant="gold"
        fullWidth
        style={{ marginBottom: spacing.md }}
        onPress={() => router.push('/(app)/subscription/payment')}
      />

      {subscription.status === 'active' && (
        <Button
          label={t.common.cancel}
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
