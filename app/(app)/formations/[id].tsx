import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { BookOpen, Calendar, GraduationCap, Play } from 'lucide-react-native';
import { useI18n } from '../../../src/i18n';
import { useTheme } from '../../../src/theme';
import { getFormationsData } from '../../../src/data/formations.data';
import { Button } from '../../../src/components/common/Button';
import { BackButton } from '../../../src/components/common/BackButton';
import { AppIcon } from '../../../src/components/common/AppIcon';

export default function FormationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const { t, language } = useI18n();
  const formation = getFormationsData(language).find((f) => f.id === id);

  if (!formation) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.deepBlue ?? '#1A1A3E', paddingTop: 56 }]}>
        <BackButton variant="dark" style={{ marginBottom: 16 }} fallback="/(app)/formations"/>
        <View style={styles.thumbnail}>
          <AppIcon icon={GraduationCap} size={56} color="#C9A84C" strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>{formation.title}</Text>
        <Text style={styles.instructor}>{formation.instructor}</Text>
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <View style={styles.badgeRow}>
              <AppIcon icon={Calendar} size={14} color="rgba(255,255,255,0.7)" strokeWidth={2.4} />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{formation.duration}</Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <View style={styles.badgeRow}>
              <AppIcon icon={BookOpen} size={14} color="rgba(255,255,255,0.7)" strokeWidth={2.4} />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{t.formations.lessons(formation.lessons.length)}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.base }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 10 }}>{t.formations.about}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 24, marginBottom: 24 }}>
          {formation.description}
        </Text>

        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
          {t.formations.programme(formation.lessons.length)}
        </Text>

        {formation.lessons.map((lesson, idx) => (
          <TouchableOpacity
            key={lesson.id}
            onPress={() => router.push(`/(app)/formations/reader/${formation.id}`)}
            style={[styles.lessonRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.lessonNum, { backgroundColor: colors.primary }]}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{idx + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>{lesson.title}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{lesson.duration}</Text>
            </View>
            <AppIcon icon={Play} size={18} color={colors.textTertiary} strokeWidth={2.2} />
          </TouchableOpacity>
        ))}

        <Button
          label={t.formations.start}
          variant="gold"
          fullWidth
          size="lg"
          style={{ marginTop: 24 }}
          onPress={() => router.push(`/(app)/formations/reader/${formation.id}`)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 24, paddingBottom: 28, alignItems: 'center' },
  thumbnail: { width: 100, height: 100, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  instructor: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  lessonNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
