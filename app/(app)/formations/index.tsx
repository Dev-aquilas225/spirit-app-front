import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { BookOpen, Calendar, GraduationCap } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { PremiumGuard } from '../../../src/components/auth/PremiumGuard';
import { FORMATIONS_DATA } from '../../../src/data/formations.data';
import { BackButton } from '../../../src/components/common/BackButton';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { Formation, FormationLevel } from '../../../src/types/content.types';

const LEVEL_LABELS: Record<FormationLevel, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

const LEVEL_COLORS: Record<FormationLevel, string> = {
  beginner: '#10B981',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
};

function FormationCard({ formation }: { formation: Formation }) {
  const { colors, borderRadius: br, shadows } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/formations/${formation.id}`)}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: br.xl, ...shadows.md }]}
    >
      <View style={[styles.thumbnail, { backgroundColor: colors.surfaceSecondary, borderRadius: br.lg }]}>
        <AppIcon icon={GraduationCap} size={48} color={colors.primary} strokeWidth={1.9} />
      </View>
      <View style={styles.info}>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
          <View style={[styles.tag, { backgroundColor: LEVEL_COLORS[formation.level] + '20', borderColor: LEVEL_COLORS[formation.level] }]}>
            <Text style={{ fontSize: 10, color: LEVEL_COLORS[formation.level], fontWeight: '700' }}>
              {LEVEL_LABELS[formation.level]}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>{formation.category}</Text>
          </View>
        </View>
        <Text style={[styles.formationTitle, { color: colors.text }]} numberOfLines={2}>{formation.title}</Text>
        <Text style={[styles.instructor, { color: colors.textSecondary }]}>{formation.instructor}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <View style={styles.metaRow}>
            <AppIcon icon={Calendar} size={14} color={colors.textTertiary} strokeWidth={2.4} />
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{formation.duration}</Text>
          </View>
          <View style={styles.metaRow}>
            <AppIcon icon={BookOpen} size={14} color={colors.textTertiary} strokeWidth={2.4} />
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{formation.lessons.length} leçons</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function FormationsContent() {
  const { colors, spacing } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.deepBlue ?? '#1A1A3E', paddingTop: 56 }]}>
        <BackButton variant="dark" style={{ marginBottom: 12 }} />
        <View style={styles.headerTitleRow}>
          <AppIcon icon={GraduationCap} size={20} color="#fff" strokeWidth={2.4} />
          <Text style={styles.headerTitle}>Formations</Text>
        </View>
        <Text style={styles.headerSubtitle}>{FORMATIONS_DATA.length} formations spirituelles</Text>
      </View>
      <FlatList
        data={FORMATIONS_DATA}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.base, gap: 16 }}
        renderItem={({ item }) => <FormationCard formation={item} />}
      />
    </View>
  );
}

export default function FormationsScreen() {
  return (
    <PremiumGuard featureName="Formations">
      <FormationsContent />
    </PremiumGuard>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 20 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  card: { borderWidth: 1, overflow: 'hidden' },
  thumbnail: { height: 160, alignItems: 'center', justifyContent: 'center' },
  info: { padding: 14 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  formationTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  instructor: { fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
