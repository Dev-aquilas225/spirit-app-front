import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { CircleCheck, CircleX, CreditCard, Hourglass } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { BackButton } from '../../../src/components/common/BackButton';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { formatDate, formatCurrency } from '../../../src/utils/helpers';
import { PaymentRecord } from '../../../src/types/subscription.types';

export default function PaymentHistoryScreen() {
  const { colors, spacing } = useTheme();
  const { payments, loadSubscription } = useSubscription();

  useEffect(() => { loadSubscription(); }, [loadSubscription]);

  const statusConfig: Record<PaymentRecord['status'], { color: string; label: string; icon: LucideIcon }> = {
    success: { color: '#10B981', label: 'Réussi', icon: CircleCheck },
    failed: { color: '#EF4444', label: 'Échoué', icon: CircleX },
    pending: { color: '#F59E0B', label: 'En attente', icon: Hourglass },
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.deepBlue ?? '#1A1A3E', paddingTop: 56 }]}>
        <BackButton variant="dark" style={{ alignSelf: 'flex-start' }} />
        <Text style={styles.headerTitle}>Historique paiements</Text>
      </View>

      {payments.length === 0 ? (
        <EmptyState
          icon={<AppIcon icon={CreditCard} size={48} color={colors.primary} strokeWidth={1.9} />}
          title="Aucun paiement"
          message="Votre historique de paiements apparaîtra ici."
        />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.base, gap: 8 }}
          renderItem={({ item }: { item: PaymentRecord }) => {
            const status = statusConfig[item.status];
            return (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>{item.description}</Text>
                  <View style={styles.statusRow}>
                    <AppIcon icon={status.icon} size={14} color={status.color} strokeWidth={2.6} />
                    <Text style={{ color: status.color, fontSize: 13, fontWeight: '600' }}>{status.label}</Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 16 }}>
                    {formatCurrency(item.amount)}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 4 }}>
                  Réf: {item.reference}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 20, gap: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  card: { padding: 14, borderRadius: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
