import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { BookOpen, Brain, Flame, Heart, Moon, Music, RefreshCw, Sunrise, Sunset, X } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../../../src/theme';
import { usePremiumAccess } from '../../../../src/hooks/usePremiumAccess';
import { useDailyPrayers } from '../../../../src/hooks/useDailyPrayers';
import { DailyPrayer, PrayerMood } from '../../../../src/services/prayers.service';
import { Card } from '../../../../src/components/common/Card';
import { PremiumBanner } from '../../../../src/components/subscription/PremiumBanner';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { getArchivedPrayers } from '../../../../src/data/prayers.data';
import { Prayer, PrayerTime } from '../../../../src/types/content.types';

type Tab = 'today' | 'archive';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const PERIOD_ICONS: Record<'morning' | 'evening', LucideIcon> = {
  morning: Sunrise,
  evening: Sunset,
};
const PERIOD_LABELS: Record<'morning' | 'evening', string> = {
  morning: 'Matin',
  evening: 'Soir',
};

const MOOD_ICONS: Record<PrayerMood, LucideIcon> = {
  meditate: Brain,
  pray:     Heart,
  worship:  Music,
  fast:     Flame,
  read:     BookOpen,
};

/* ─── Modal de détail ──────────────────────────────────────────────────── */

function PrayerDetailModal({
  prayer,
  visible,
  onClose,
}: {
  prayer: DailyPrayer | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, spacing } = useTheme();
  if (!prayer) return null;

  const PeriodIcon = PERIOD_ICONS[prayer.period];
  const MoodIcon = prayer.mood ? MOOD_ICONS[prayer.mood] ?? Heart : Heart;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: 40 }}
        >
          {/* Header période */}
          <View style={[styles.modalHeader, { backgroundColor: colors.deepBlue ?? '#1A1A3E' }]}>
            <View style={styles.periodBadge}>
              <AppIcon icon={PeriodIcon} size={18} color="#C9A84C" strokeWidth={2.4} />
              <Text style={styles.periodLabel}>{PERIOD_LABELS[prayer.period]}</Text>
            </View>
            <Text style={styles.modalTheme}>{prayer.theme}</Text>
          </View>

          {/* Prière */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <AppIcon icon={Heart} size={16} color={colors.primary} strokeWidth={2.4} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Prière</Text>
            </View>
            <Text style={[styles.prayerText, { color: colors.text }]}>{prayer.prayerText}</Text>
          </View>

          {/* Verset */}
          <View style={[styles.section, { backgroundColor: colors.premiumBackground ?? '#FEF9EC', borderColor: '#C9A84C' }]}>
            <Text style={[styles.verseText, { color: colors.text }]}>« {prayer.verse} »</Text>
            <Text style={[styles.verseRef, { color: '#C9A84C' }]}>— {prayer.verseReference}</Text>
          </View>

          {/* Mood / pratique */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <AppIcon icon={MoodIcon} size={16} color={colors.primary} strokeWidth={2.4} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>{prayer.moodTitle}</Text>
            </View>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{prayer.moodDescription}</Text>
          </View>

          {/* Instruction de pratique */}
          <View style={[styles.practiceCard, { backgroundColor: colors.surfaceSecondary ?? colors.surface, borderLeftColor: colors.primary }]}>
            <Text style={[styles.practiceLabel, { color: colors.textTertiary ?? colors.textSecondary }]}>
              PRATIQUE DU JOUR
            </Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>{prayer.practiceInstruction}</Text>
          </View>

          {/* Fréquence quantique (optionnel) */}
          {prayer.quanticFrequency !== null && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.primary, marginBottom: 4 }]}>
                Fréquence quantique — {prayer.quanticFrequency} Hz
              </Text>
              {prayer.quanticDescription && (
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{prayer.quanticDescription}</Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* Bouton fermer */}
        <View style={[styles.closeRow, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <AppIcon icon={X} size={16} color={colors.text} strokeWidth={2.4} />
            <Text style={[styles.closeBtnLabel, { color: colors.text }]}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Carte prière du jour ─────────────────────────────────────────────── */

function DailyPrayerCard({
  prayer,
  onPress,
}: {
  prayer: DailyPrayer;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  const PeriodIcon = PERIOD_ICONS[prayer.period];

  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.sm }}>
      <View style={styles.cardRow}>
        <View style={[styles.iconWrap, { backgroundColor: prayer.period === 'morning' ? '#FFF7E0' : '#EDE9FF' }]}>
          <AppIcon
            icon={PeriodIcon}
            size={24}
            color={prayer.period === 'morning' ? '#C9A84C' : '#7C5CBF'}
            strokeWidth={2.4}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardPeriod, { color: colors.textSecondary }]}>
            {PERIOD_LABELS[prayer.period]}
          </Text>
          <Text style={[styles.cardTheme, { color: colors.text }]} numberOfLines={1}>
            {prayer.theme}
          </Text>
          <Text style={[styles.cardVerse, { color: colors.textTertiary ?? colors.textSecondary }]} numberOfLines={1}>
            {prayer.verseReference}
          </Text>
        </View>
        <View style={[styles.tapHint, { backgroundColor: colors.primary + '1A' }]}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>Lire</Text>
        </View>
      </View>
    </Card>
  );
}

/* ─── Carte archive (ancien format mock) ──────────────────────────────── */

const ARCHIVE_ICONS: Record<PrayerTime, LucideIcon> = {
  morning: Sunrise,
  evening: Sunset,
  night: Moon,
};
const ARCHIVE_LABELS: Record<PrayerTime, string> = {
  morning: 'Matin', evening: 'Soir', night: 'Nuit',
};

function ArchivePrayerCard({ prayer, isPremium }: { prayer: Prayer; isPremium: boolean }) {
  const { colors, spacing } = useTheme();
  const isLocked = prayer.access === 'premium' && !isPremium;
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      onPress={() => isLocked ? router.push('/(app)/subscription') : setExpanded(!expanded)}
      style={{ marginBottom: spacing.sm }}
    >
      <View style={styles.cardRow}>
        <AppIcon icon={ARCHIVE_ICONS[prayer.time]} size={26} color={colors.primary} strokeWidth={2.4} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.cardTheme, { color: colors.text }]}>{prayer.title}</Text>
          <Text style={[styles.cardPeriod, { color: colors.textSecondary }]}>
            {ARCHIVE_LABELS[prayer.time]}{prayer.duration ? ` • ${prayer.duration}` : ''}
          </Text>
        </View>
        {prayer.access === 'premium' && (
          <View style={[styles.premiumTag, { backgroundColor: '#C9A84C' }]}>
            <Text style={{ fontSize: 9, color: '#fff', fontWeight: '700' }}>PREMIUM</Text>
          </View>
        )}
      </View>
      {expanded && !isLocked && (
        <Text style={[{ color: colors.text, fontSize: 14, lineHeight: 24, fontStyle: 'italic', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }]}>
          {prayer.content}
        </Text>
      )}
    </Card>
  );
}

/* ─── Écran principal ──────────────────────────────────────────────────── */

export default function PrayersScreen() {
  const { colors, spacing } = useTheme();
  const { isPremium } = usePremiumAccess();
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [selectedPrayer, setSelectedPrayer] = useState<DailyPrayer | null>(null);

  const { list: dailyPrayers, isLoading, refresh } = useDailyPrayers();
  const archivedPrayers = getArchivedPrayers();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: colors.deepBlue ?? '#1A1A3E', paddingTop: 56, paddingHorizontal: spacing.base, paddingBottom: spacing.base },
      ]}>
        <Text style={styles.headerTitle}>Prières</Text>
        <Text style={styles.headerSubtitle}>Restez connecté à Dieu chaque jour</Text>
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
              {tab === 'today' ? "Aujourd'hui" : 'Archives'}
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
        {activeTab === 'today' ? (
          isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 64 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>
                Chargement des prières...
              </Text>
            </View>
          ) : dailyPrayers.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 64, gap: 12 }}>
              <AppIcon icon={Heart} size={48} color={colors.primary} strokeWidth={2} />
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Aucune prière pour aujourd'hui</Text>
              <TouchableOpacity onPress={refresh} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AppIcon icon={RefreshCw} size={16} color={colors.primary} strokeWidth={2.2} />
                <Text style={{ color: colors.primary, fontSize: 14 }}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            dailyPrayers.map((prayer) => (
              <DailyPrayerCard
                key={prayer.id}
                prayer={prayer}
                onPress={() => setSelectedPrayer(prayer)}
              />
            ))
          )
        ) : (
          archivedPrayers.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 64 }}>
              <AppIcon icon={Heart} size={48} color={colors.primary} strokeWidth={2} />
              <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 14 }}>Aucune archive</Text>
            </View>
          ) : (
            archivedPrayers.map((prayer) => (
              <ArchivePrayerCard key={prayer.id} prayer={prayer} isPremium={isPremium} />
            ))
          )
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

const styles = StyleSheet.create({
  header: {},
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 14, fontWeight: '600' },

  /* Card */
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardPeriod: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  cardTheme: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  cardVerse: { fontSize: 12, marginTop: 2 },
  tapHint: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  premiumTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },

  /* Modal */
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  modalHeader: {
    padding: 20,
    paddingTop: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  periodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  periodLabel: { color: '#C9A84C', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  modalTheme: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 26 },

  section: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  prayerText: { fontSize: 15, lineHeight: 28, fontStyle: 'italic' },
  verseText: { fontSize: 14, lineHeight: 24, fontStyle: 'italic', textAlign: 'center', marginBottom: 8 },
  verseRef: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  bodyText: { fontSize: 14, lineHeight: 22 },
  practiceCard: {
    borderLeftWidth: 3,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  practiceLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },

  closeRow: { borderTopWidth: 1, padding: 16, alignItems: 'center' },
  closeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 24, borderWidth: 1,
  },
  closeBtnLabel: { fontSize: 15, fontWeight: '600' },
});
