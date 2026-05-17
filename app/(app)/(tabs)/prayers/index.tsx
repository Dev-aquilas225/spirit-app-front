import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  Alert,
} from 'react-native';

import * as Clipboard from 'expo-clipboard';

import { router } from 'expo-router';

import {
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  Moon,
  Music,
  RefreshCw,
  Sunrise,
  Sunset,
  X,
  Copy,
} from 'lucide-react-native';

import type { LucideIcon } from 'lucide-react-native';

import { useI18n } from '../../../../src/i18n';
import { useTheme } from '../../../../src/theme';
import { usePremiumAccess } from '../../../../src/hooks/usePremiumAccess';
import { useDailyPrayers } from '../../../../src/hooks/useDailyPrayers';

import {
  DailyPrayer,
  DailyPrayers,
  PrayerMood,
  PrayersService,
} from '../../../../src/services/prayers.service';

import { Card } from '../../../../src/components/common/Card';
import { PremiumBanner } from '../../../../src/components/subscription/PremiumBanner';
import { PremiumGuard } from '../../../../src/components/auth/PremiumGuard';
import { AppIcon } from '../../../../src/components/common/AppIcon';

import {
  formatDate,
  formatMonthYear,
  getWeekdayShortNames,
} from '../../../../src/utils/helpers';

type Tab = 'today' | 'archive';

/* ─── Constantes ───────────────────────────────────────── */

const PERIOD_ICONS: Record < 'morning' | 'evening', LucideIcon > = {
  morning: Sunrise,
  evening: Sunset,
};

const MOOD_ICONS: Record < PrayerMood, LucideIcon > = {
  meditate: Brain,
  pray: Heart,
  worship: Music,
  fast: Flame,
  read: BookOpen,
};

/* ─── Helpers date ─────────────────────────────────────── */

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayYMD(): string {
  return toYMD(new Date());
}

/* ─── Modal détail ─────────────────────────────────────── */

function PrayerDetailModal({
  prayer,
  visible,
  onClose,
}: {
  prayer: DailyPrayer | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, spacing, isDark } = useTheme();
  const { t } = useI18n();
  
  if (!prayer) return null;
  
  const PeriodIcon = PERIOD_ICONS[prayer.period];
  
  const MoodIcon = prayer.mood ?
    MOOD_ICONS[prayer.mood] ?? Heart :
    Heart;
  
  const periodLabels: Record < 'morning' | 'evening', string > = {
    morning: t.prayers.morning,
    evening: t.prayers.evening,
  };
  
  /* ─── Copier la prière ─────────────────────────────── */
  
  const handleCopyPrayer = async () => {
    try {
      const textToCopy =
        `${prayer.theme}

« ${prayer.verse} » (${prayer.verseReference})

🙏 PRIÈRE :
${prayer.prayerText}

💡 ACTION PRATIQUE :
${prayer.practiceInstruction}`;
      
      await Clipboard.setStringAsync(textToCopy);
      
      Alert.alert(
        'Copié !',
        'La prière a été copiée dans le presse-papiers.'
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible de copier le texte.'
      );
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      />

      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.background },
        ]}
      >
        <View
          style={[
            styles.handle,
            { backgroundColor: colors.border },
          ]}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.base,
            paddingBottom: 40,
          }}
        >
          {/* Header */}

          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor:
                  colors.deepBlue ?? '#1A1A3E',
              },
            ]}
          >
            <View style={styles.periodBadge}>
              <AppIcon
                icon={PeriodIcon}
                size={18}
                color="#C9A84C"
                strokeWidth={2.4}
              />

              <Text style={styles.periodLabel}>
                {periodLabels[prayer.period]}
              </Text>

              <Text style={styles.periodDate}>
                {prayer.date}
              </Text>
            </View>

            <Text style={styles.modalTheme}>
              {prayer.theme}
            </Text>
          </View>

          {/* Prière */}

          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <View style={styles.sectionTitleRow}>
                <AppIcon
                  icon={Heart}
                  size={16}
                  color={colors.primary}
                  strokeWidth={2.4}
                />

                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.primary },
                  ]}
                >
                  {t.prayers.sectionPrayer}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleCopyPrayer}
                style={[
                  styles.copyIconBtn,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <AppIcon
                  icon={Copy}
                  size={14}
                  color={colors.primary}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.prayerText,
                { color: colors.text },
              ]}
            >
              {prayer.prayerText}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ─── IMPORTANT ─────────────────────────────────────────

Installe aussi le package :

npm install expo-clipboard

ou

npx expo install expo-clipboard

──────────────────────────────────────────────────────── */