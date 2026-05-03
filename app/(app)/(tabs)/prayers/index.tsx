import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import {
  BookOpen, Brain, ChevronLeft, ChevronRight,
  Flame, Heart, Moon, Music, RefreshCw, Sunrise, Sunset, X,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useI18n } from '../../../../src/i18n';
import { useTheme } from '../../../../src/theme';
import { usePremiumAccess } from '../../../../src/hooks/usePremiumAccess';
import { useDailyPrayers } from '../../../../src/hooks/useDailyPrayers';
import { DailyPrayer, DailyPrayers, PrayerMood, PrayersService } from '../../../../src/services/prayers.service';
import { Card } from '../../../../src/components/common/Card';
import { PremiumBanner } from '../../../../src/components/subscription/PremiumBanner';
import { PremiumGuard } from '../../../../src/components/auth/PremiumGuard';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { formatDate, formatMonthYear, getWeekdayShortNames } from '../../../../src/utils/helpers';

type Tab = 'today' | 'archive';

/* ─── Constantes ───────────────────────────────────────────────────────────── */

const PERIOD_ICONS: Record<'morning' | 'evening', LucideIcon> = { morning: Sunrise, evening: Sunset };
// PERIOD_LABELS are now sourced from t.prayers.morning / t.prayers.evening via useI18n() in each component
const MOOD_ICONS: Record<PrayerMood, LucideIcon> = {
  meditate: Brain, pray: Heart, worship: Music, fast: Flame, read: BookOpen,
};

/* ─── Helpers date ─────────────────────────────────────────────────────────── */

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function todayYMD(): string {
  return toYMD(new Date());
}

/* ─── Modal de détail ──────────────────────────────────────────────────────── */

function PrayerDetailModal({
  prayer, visible, onClose,
}: {
  prayer: DailyPrayer | null; visible: boolean; onClose: () => void;
}) {
  const { colors, spacing, isDark } = useTheme();
  const { t } = useI18n();
  if (!prayer) return null;

  const PeriodIcon = PERIOD_ICONS[prayer.period];
  const MoodIcon = prayer.mood ? (MOOD_ICONS[prayer.mood] ?? Heart) : Heart;
  const periodLabels: Record<'morning' | 'evening', string> = { morning: t.prayers.morning, evening: t.prayers.evening };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: 40 }}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.deepBlue ?? '#1A1A3E' }]}>
            <View style={styles.periodBadge}>
              <AppIcon icon={PeriodIcon} size={18} color="#C9A84C" strokeWidth={2.4} />
              <Text style={styles.periodLabel}>{periodLabels[prayer.period]}</Text>
              <Text style={styles.periodDate}>{prayer.date}</Text>
            </View>
            <Text style={styles.modalTheme}>{prayer.theme}</Text>
          </View>

          {/* Prière */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <AppIcon icon={Heart} size={16} color={colors.primary} strokeWidth={2.4} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t.prayers.sectionPrayer}</Text>
            </View>
            <Text style={[styles.prayerText, { color: colors.text }]}>{prayer.prayerText}</Text>
          </View>

          {/* Verset */}
          <View style={[styles.section, {
            backgroundColor: isDark ? 'rgba(201,168,76,0.10)' : '#FEF9EC',
            borderColor: '#C9A84C',
          }]}>
            <Text style={[styles.verseText, { color: isDark ? '#F5E6C0' : '#5C3D00' }]}>« {prayer.verse} »</Text>
            <Text style={[styles.verseRef, { color: '#C9A84C' }]}>— {prayer.verseReference}</Text>
          </View>

          {/* Mood */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <AppIcon icon={MoodIcon} size={16} color={colors.primary} strokeWidth={2.4} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>{prayer.moodTitle}</Text>
            </View>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{prayer.moodDescription}</Text>
          </View>

          {/* Pratique */}
          <View style={[styles.practiceCard, { backgroundColor: colors.surfaceSecondary ?? colors.surface, borderLeftColor: colors.primary }]}>
            <Text style={[styles.practiceLabel, { color: colors.textTertiary ?? colors.textSecondary }]}>{t.prayers.practiceLabel}</Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>{prayer.practiceInstruction}</Text>
          </View>

          {/* Fréquence quantique */}
          {prayer.quanticFrequency !== null && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.primary, marginBottom: 4 }]}>
                {t.prayers.quanticFreq(prayer.quanticFrequency!)}
              </Text>
              {prayer.quanticDescription && (
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{prayer.quanticDescription}</Text>
              )}
            </View>
          )}
        </ScrollView>

        <View style={[styles.closeRow, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <AppIcon icon={X} size={16} color={colors.text} strokeWidth={2.4} />
            <Text style={[styles.closeBtnLabel, { color: colors.text }]}>{t.common.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Carte prière ─────────────────────────────────────────────────────────── */

function DailyPrayerCard({ prayer, onPress }: { prayer: DailyPrayer; onPress: () => void }) {
  const { colors, spacing, isDark } = useTheme();
  const { t } = useI18n();
  const periodLabels: Record<'morning' | 'evening', string> = { morning: t.prayers.morning, evening: t.prayers.evening };
  const PeriodIcon = PERIOD_ICONS[prayer.period];

  const iconBgMorning = isDark ? 'rgba(201,168,76,0.18)' : '#FFF7E0';
  const iconBgEvening = isDark ? 'rgba(124,92,191,0.20)' : '#EDE9FF';

  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.sm }}>
      <View style={styles.cardRow}>
        <View style={[styles.iconWrap, { backgroundColor: prayer.period === 'morning' ? iconBgMorning : iconBgEvening }]}>
          <AppIcon
            icon={PeriodIcon} size={24}
            color={prayer.period === 'morning' ? '#C9A84C' : '#9B7FD4'}
            strokeWidth={2.4}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardPeriod, { color: colors.textSecondary }]}>{periodLabels[prayer.period]}</Text>
          <Text style={[styles.cardTheme, { color: colors.text }]} numberOfLines={1}>{prayer.theme}</Text>
          <Text style={[styles.cardVerse, { color: colors.textTertiary ?? colors.textSecondary }]} numberOfLines={1}>
            {prayer.verseReference}
          </Text>
        </View>
        <View style={[styles.tapHint, { backgroundColor: colors.primary + '1A' }]}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>{t.common.read}</Text>
        </View>
      </View>
    </Card>
  );
}

/* ─── Calendrier de sélection ──────────────────────────────────────────────── */

function DatePicker({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (ymd: string) => void;
}) {
  const { colors } = useTheme();
  const { language } = useI18n();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (isCurrentMonth) return; // pas de futur
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Jours du mois (début lundi)
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Décalage : lundi=0, ... dimanche=6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Compléter à multiple de 7
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Navigation mois */}
      <View style={styles.calNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
          <AppIcon icon={ChevronLeft} size={20} color={colors.text} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={[styles.calTitle, { color: colors.text }]}>
          {formatMonthYear(new Date(viewYear, viewMonth, 1), language)}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={[styles.calNavBtn, isCurrentMonth && { opacity: 0.3 }]} disabled={isCurrentMonth}>
          <AppIcon icon={ChevronRight} size={20} color={colors.text} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {/* En-têtes jours */}
      <View style={styles.calRow}>
        {getWeekdayShortNames(language).map(d => (
          <Text key={d} style={[styles.calDayHeader, { color: colors.textSecondary }]}>{d}</Text>
        ))}
      </View>

      {/* Grille */}
      {Array.from({ length: cells.length / 7 }, (_, week) => (
        <View key={week} style={styles.calRow}>
          {cells.slice(week * 7, week * 7 + 7).map((day, col) => {
            if (!day) return <View key={col} style={styles.calCell} />;

            const cellDate = new Date(viewYear, viewMonth, day);
            cellDate.setHours(0, 0, 0, 0);
            const ymd = toYMD(cellDate);
            const isToday = ymd === todayYMD();
            const isFuture = cellDate >= today;
            const isSelected = ymd === selected;

            return (
              <TouchableOpacity
                key={col}
                style={styles.calCell}
                onPress={() => !isFuture && onSelect(ymd)}
                disabled={isFuture}
              >
                <View style={[
                  styles.calDayInner,
                  isSelected && { backgroundColor: colors.primary },
                  isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.primary },
                ]}>
                  <Text style={[
                    styles.calDayText,
                    { color: isFuture ? colors.border : isSelected ? '#fff' : colors.text },
                  ]}>
                    {day}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/* ─── Écran principal ──────────────────────────────────────────────────────── */

export default function PrayersScreen() {
  const { colors, spacing } = useTheme();
  const { isPremium } = usePremiumAccess();
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [selectedPrayer, setSelectedPrayer] = useState<DailyPrayer | null>(null);

  // Aujourd'hui
  const { list: dailyPrayers, isLoading, refresh } = useDailyPrayers();

  // Archive
  const [archiveDate, setArchiveDate] = useState<string | null>(null);
  const [archiveData, setArchiveData] = useState<DailyPrayers | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const fetchArchive = useCallback(async (ymd: string) => {
    setArchiveDate(ymd);
    setArchiveLoading(true);
    setArchiveError(null);
    setArchiveData(null);
    const result = await PrayersService.getByDate(ymd);
    if (!result.morning && !result.evening) {
      setArchiveError(t.prayers.noArchive);
    } else {
      setArchiveData(result);
    }
    setArchiveLoading(false);
  }, []);

  const archivePrayers = archiveData
    ? [archiveData.morning, archiveData.evening].filter((p): p is DailyPrayer => p !== null)
    : [];

  // Formatage date affichée
  function formatDisplayDate(ymd: string) {
    return formatDate(ymd, language);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.deepBlue ?? '#1A1A3E', paddingTop: 56, paddingHorizontal: spacing.base, paddingBottom: spacing.base }]}>
        <Text style={styles.headerTitle}>{t.prayers.title}</Text>
        <Text style={styles.headerSubtitle}>{t.prayers.subtitle}</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['today', 'archive'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary }]}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
              {tab === 'today' ? t.prayers.tabToday : t.prayers.tabArchive}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.base, paddingBottom: 32 }}
        refreshControl={
          activeTab === 'today'
            ? <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />
            : undefined
        }
      >
        {/* ── Onglet Aujourd'hui ── */}
        {activeTab === 'today' && (
          isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 64 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>{t.prayers.loading}</Text>
            </View>
          ) : dailyPrayers.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 64, gap: 12 }}>
              <AppIcon icon={Heart} size={48} color={colors.primary} strokeWidth={2} />
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{t.prayers.empty}</Text>
              <TouchableOpacity onPress={refresh} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AppIcon icon={RefreshCw} size={16} color={colors.primary} strokeWidth={2.2} />
                <Text style={{ color: colors.primary, fontSize: 14 }}>{t.common.retry}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            dailyPrayers.map((prayer) => (
              <DailyPrayerCard key={prayer.id} prayer={prayer} onPress={() => setSelectedPrayer(prayer)} />
            ))
          )
        )}

        {/* ── Onglet Archives ── */}
        {activeTab === 'archive' && !isPremium && (
          <PremiumGuard inline featureName="Historique des prières">{null}</PremiumGuard>
        )}
        {activeTab === 'archive' && isPremium && (
          <View>
            <Text style={[styles.archiveHint, { color: colors.textSecondary }]}>
              {t.prayers.archiveHint}
            </Text>

            {/* Calendrier */}
            <View style={[styles.calCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <DatePicker selected={archiveDate} onSelect={fetchArchive} />
            </View>

            {/* Résultats */}
            {archiveLoading && (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 13 }}>
                  {t.prayers.loadingArchive(archiveDate ? formatDisplayDate(archiveDate) : '')}
                </Text>
              </View>
            )}

            {archiveError && !archiveLoading && (
              <View style={[styles.archiveEmpty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <AppIcon icon={Moon} size={32} color={colors.textSecondary} strokeWidth={2} />
                <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                  {archiveError}
                </Text>
              </View>
            )}

            {!archiveLoading && !archiveError && archivePrayers.length > 0 && (
              <View>
                <View style={styles.archiveDateBanner}>
                  <Text style={[styles.archiveDateLabel, { color: colors.text }]}>
                    {t.prayers.prayerOf(formatDisplayDate(archiveDate!))}
                  </Text>
                </View>
                {archivePrayers.map((prayer) => (
                  <DailyPrayerCard key={prayer.id} prayer={prayer} onPress={() => setSelectedPrayer(prayer)} />
                ))}
              </View>
            )}

            {!archiveDate && !archiveLoading && (
              <View style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
                <AppIcon icon={Sunrise} size={36} color={colors.border} strokeWidth={2} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                  {t.prayers.noDateSelected}
                </Text>
              </View>
            )}
          </View>
        )}

        {!isPremium && (
          <View style={{ marginTop: 16 }}>
            <PremiumBanner compact />
          </View>
        )}
      </ScrollView>

      {/* Modal détail */}
      <PrayerDetailModal
        prayer={selectedPrayer}
        visible={selectedPrayer !== null}
        onClose={() => setSelectedPrayer(null)}
      />
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  header: {},
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 14, fontWeight: '600' },

  /* Cards */
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardPeriod: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  cardTheme: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  cardVerse: { fontSize: 12, marginTop: 2 },
  tapHint: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },

  /* Archive */
  archiveHint: { fontSize: 13, textAlign: 'center', marginBottom: 14, lineHeight: 20 },
  calCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16 },
  archiveDateBanner: { marginBottom: 10 },
  archiveDateLabel: { fontSize: 15, fontWeight: '700' },
  archiveEmpty: {
    borderRadius: 14, borderWidth: 1, padding: 24,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },

  /* Calendrier */
  calNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calNavBtn: { padding: 6 },
  calTitle: { fontSize: 15, fontWeight: '700' },
  calRow: { flexDirection: 'row', marginBottom: 4 },
  calDayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  calCell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  calDayInner: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  calDayText: { fontSize: 13, fontWeight: '500' },

  /* Modal */
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', overflow: 'hidden' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  modalHeader: { padding: 20, paddingTop: 16, alignItems: 'center', marginBottom: 16 },
  periodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap', justifyContent: 'center' },
  periodLabel: { color: '#C9A84C', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  periodDate: { color: 'rgba(201,168,76,0.7)', fontSize: 11 },
  modalTheme: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 26 },
  section: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  prayerText: { fontSize: 15, lineHeight: 28, fontStyle: 'italic' },
  verseText: { fontSize: 14, lineHeight: 24, fontStyle: 'italic', textAlign: 'center', marginBottom: 8 },
  verseRef: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  bodyText: { fontSize: 14, lineHeight: 22 },
  practiceCard: { borderLeftWidth: 3, borderRadius: 10, padding: 14, marginBottom: 12 },
  practiceLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  closeRow: { borderTopWidth: 1, padding: 16, alignItems: 'center' },
  closeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 1 },
  closeBtnLabel: { fontSize: 15, fontWeight: '600' },
});
