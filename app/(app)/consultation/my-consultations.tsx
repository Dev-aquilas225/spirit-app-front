import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { Calendar, Check, CircleCheck, CircleX, Hourglass } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { BackButton } from '../../../src/components/common/BackButton';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { StorageService } from '../../../src/services/storage.service';
import { useAuth } from '../../../src/hooks/useAuth';
import { Consultation } from '../../../src/types/content.types';
import { formatDate } from '../../../src/utils/helpers';

const STATUS_CONFIG: Record<Consultation['status'], { color: string; label: string; icon: LucideIcon }> = {
  pending: { color: '#F59E0B', label: 'En attente', icon: Hourglass },
  confirmed: { color: '#3B82F6', label: 'Confirmé', icon: CircleCheck },
  completed: { color: '#10B981', label: 'Terminé', icon: Check },
  cancelled: { color: '#EF4444', label: 'Annulé', icon: CircleX },
};

export default function MyConsultationsScreen() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  useEffect(() => {
    async function load() {
      const all = await StorageService.get<Consultation[]>('consultations') ?? [];
      setConsultations(all.filter((c) => c.userId === user?.id));
    }
    load();
  }, [user?.id]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.deepBlue ?? '#1A1A3E', paddingTop: 56 }]}>
        <BackButton variant="dark" style={{ marginBottom: 12, alignSelf: 'flex-start' }} />
        <Text style={styles.headerTitle}>Mes consultations</Text>
      </View>

      {consultations.length === 0 ? (
        <EmptyState
          icon={<AppIcon icon={Calendar} size={48} color={colors.primary} strokeWidth={1.9} />}
          title="Aucune consultation"
          message="Vous n'avez pas encore fait de demande de consultation."
          actionLabel="Demander une consultation"
          onAction={() => router.push('/(app)/consultation/form')}
        />
      ) : (
        <FlatList
          data={consultations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.base, gap: 10 }}
          renderItem={({ item }) => {
            const status = STATUS_CONFIG[item.status];
            return (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{item.topic}</Text>
                  <View style={styles.statusRow}>
                    <AppIcon icon={status.icon} size={14} color={status.color} strokeWidth={2.6} />
                    <Text style={{ color: status.color, fontSize: 12, fontWeight: '600' }}>{status.label}</Text>
                  </View>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6 }} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 8 }}>
                  Demandé le {formatDate(item.createdAt)}
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
  header: { padding: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  card: { padding: 14, borderRadius: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
