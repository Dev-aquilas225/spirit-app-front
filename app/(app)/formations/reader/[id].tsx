import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, ArrowRight, Play, X } from 'lucide-react-native';
import { useI18n } from '../../../../src/i18n';
import { useTheme } from '../../../../src/theme';
import { getFormationsData } from '../../../../src/data/formations.data';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { useScreenProtection } from '../../../../src/hooks/useScreenProtection';

export default function FormationReaderScreen() {
  useScreenProtection(true); // Protège le contenu premium contre les captures
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const { t, language } = useI18n();
  const [currentLesson, setCurrentLesson] = useState(0);
  const formation = getFormationsData(language).find((f) => f.id === id);

  if (!formation) return null;
  const lesson = formation.lessons[currentLesson];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: 56 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <AppIcon icon={X} size={18} color={colors.primary} strokeWidth={2.6} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{formation.title}</Text>
          <Text style={{ color: colors.textTertiary, fontSize: 11 }}>
            {t.formations.lessonProgress(currentLesson + 1, formation.lessons.length)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${((currentLesson + 1) / formation.lessons.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        {/* Video placeholder */}
        <View style={[styles.videoPlayer, { backgroundColor: colors.deepBlue ?? '#1A1A3E' }]}>
          <AppIcon icon={Play} size={48} color="#fff" strokeWidth={1.8} />
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 }}>{lesson.duration}</Text>
        </View>

        <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
        <Text style={[styles.lessonContent, { color: colors.text }]}>{lesson.content}</Text>
        <Text style={[styles.lessonContent, { color: colors.text }]}>
          {`\n${t.formations.readerExtra}`}
        </Text>
      </ScrollView>

      {/* Nav buttons */}
      <View style={[styles.navRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          disabled={currentLesson === 0}
          onPress={() => setCurrentLesson(currentLesson - 1)}
          style={[styles.navBtn, { opacity: currentLesson === 0 ? 0.3 : 1, backgroundColor: colors.surfaceSecondary }]}
        >
          <View style={styles.navBtnContent}>
            <AppIcon icon={ArrowLeft} size={16} color={colors.text} strokeWidth={2.6} />
            <Text style={{ color: colors.text }}>{t.formations.previous}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={currentLesson === formation.lessons.length - 1}
          onPress={() => setCurrentLesson(currentLesson + 1)}
          style={[styles.navBtn, { opacity: currentLesson === formation.lessons.length - 1 ? 0.3 : 1, backgroundColor: colors.primary }]}
        >
          <View style={styles.navBtnContent}>
            <Text style={{ color: '#fff' }}>{t.formations.next}</Text>
            <AppIcon icon={ArrowRight} size={16} color="#fff" strokeWidth={2.6} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  progressBar: { height: 3 },
  progressFill: { height: 3 },
  videoPlayer: { height: 200, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  lessonTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  lessonContent: { fontSize: 15, lineHeight: 28 },
  navRow: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
  navBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  navBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
