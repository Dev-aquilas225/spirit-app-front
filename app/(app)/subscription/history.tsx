/**
 * Historique des paiements — abonnements + achats de crédits
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { CircleCheck, CircleX, CreditCard, Crown, Hourglass, Zap } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { BackButton } from '../../../src/components/common/BackButton';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { formatDate, formatCurrency } from '../../../src/utils/helpers';
import { PaymentRecord } from '../../../src/types/subscription.types';

export default function PaymentHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  const { payments, loadSubscription } = useSubscription();

  useEffect(() => { loadSubscription(); }, [loadSubscription]);

  const statusConfig: Record<PaymentRecord['status'], { color: string; label: string; icon: LucideIcon }> = {
    success: { color: '#10B981', label: t.subscription.statusSuccess, icon: CircleCheck },
    failed:  { color: '#EF4444', label: t.subscription.statusFailed,  icon: CircleX },
    pending: { color: '#F59E0B', label: t.subscription.statusPending, icon: Hourglass },
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: (colors as any).deepBlue ?? '#1A1A3E', paddingTop: insets.top + 12 }]}>
        <BackButton variant="dark" style={{ alignSelf: 'flex-start' }} fallback="/subscription" />
        <Text style={styles.headerTitle}>{t.subscription.history}</Text>
      </View>

      {payments.length === 0 ? (
        <EmptyState
          icon={<AppIcon icon={CreditCard} size={48} color={colors.primary} strokeWidth={1.9} />}
          title={t.subscription.emptyPaymentsTitle}
          message={t.subscription.emptyPaymentsMsg}
        />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.base, gap: 8 }}
          renderItem={({ item }: { item: PaymentRecord }) => {
            const status = statusConfig[item.status];
            const isCredit = /cr.dit|recharge|starter|standard|premium/i.test(item.description);
            const typeIcon = isCredit ? Zap : Crown;
            const typeLabel = isCredit ? 'Crédits' : 'Abonnement';
            const typeColor = isCredit ? '#F59E0B' : colors.primary;
            return (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.topRow}>
                  <View style={[styles.typeBadge, { backgroundColor: typeColor + '18', borderColor: typeColor + '40' }]}>
                    <AppIcon icon={typeIcon} size={11} color={typeColor} strokeWidth={2.4} />
                    <Text style={[styles.typeBadgeText, { color: typeColor }]}>{typeLabel}</Text>
                  </View>
                  <View style={styles.statusRow}>
                    <AppIcon icon={status.icon} size={13} color={status.color} strokeWidth={2.6} />
                    <Text style={{ color: status.color, fontSize: 12, fontWeight: '600' }}>{status.label}</Text>
                  </View>
                </View>
                <Text style={{ fontWeight: '700', color: colors.text, fontSize: 14, marginBottom: 8 }} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.cardBody}>
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 16 }}>
                    {formatCurrency(item.amount)}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatDate(item.createdAt)}</Text>
                </View>
                {!!item.reference && (
                  <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 4 }}>
                    {t.subscription.referenceShort(item.reference)}
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header:        { padding: 16, paddingBottom: 20, gap: 12 },
  headerTitle:   { fontSize: 22, fontWeight: '800', color: '#fff' },
  card:          { padding: 14, borderRadius: 12, borderWidth: 1 },
  topRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  statusRow:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardBody:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
