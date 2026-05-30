/**
 * Série Spirituelle — Programme de prière 21 jours
 * Chaque jour : une prière longue avec 10 déclarations
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CheckCircle2, ChevronRight, Flame, Heart, Lock, Sparkles } from 'lucide-react-native';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { useTheme } from '../../../../src/theme';
import { useAccess } from '../../../../src/hooks/useAccess';
import { DAILY_PRAYERS_FR } from '../../../../src/data/messages.data';

// Calcule le jour courant dans le programme (1-based, cycle sur 21)
function getProgramDay(): number {
  const start = new Date('2024-01-01').getTime();
  const diff = Math.floor((Date.now() - start) / 86400000);
  return (diff % 21) + 1;
}

const PROGRAM_DAYS = 21;

function DayCard({
  day,
  prayer,
  isToday,
  isUnlocked,
  index,
}: {
  day: number;
  prayer: (typeof DAILY_PRAYERS_FR)[number];
  isToday: boolean;
  isUnlocked: boolean;
  index: number;
}) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 40,
      tension: 60,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    if (!isUnlocked) {
      // Jours 4-21 : abonnement actif requis
      router.push('/subscription' as any);
      return;
    }
    router.push({
      pathname: '/(app)/serie/prayer',
      params: { day: String(day), index: String(index) },
    } as any);
  };

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { scale: anim },
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
        ],
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={isUnlocked ? 0.8 : 0.6}
        style={[
          st.dayCard,
          {
            backgroundColor: isToday
              ? colors.primary + '18'
              : !isUnlocked
              ? colors.border + '30'
              : colors.surface,
            borderColor: isToday
              ? colors.primary + '60'
              : !isUnlocked
              ? colors.border
              : colors.border,
            opacity: isUnlocked ? 1 : 0.7,
          },
        ]}
      >
        {/* Numéro du jour */}
        <View
          style={[
            st.dayNum,
            {
              backgroundColor: isToday
                ? colors.primary
                : isUnlocked
                ? colors.primary + '20'
                : colors.border + '60',
            },
          ]}
        >
          <Text
            style={[
              st.dayNumTxt,
              { color: isToday ? '#fff' : isUnlocked ? colors.primary : colors.textTertiary },
            ]}
          >
            {day}
          </Text>
        </View>

        {/* Contenu */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 13, fontWeight: '800', color: colors.text, lineHeight: 18 }}
            numberOfLines={1}
          >
            {prayer.title}
          </Text>
          <Text
            style={{ fontSize: 11, color: colors.textSecondary, marginTop: 3, lineHeight: 16 }}
            numberOfLines={2}
          >
            {prayer.intro}
          </Text>
          <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700', marginTop: 5 }}>
            {prayer.declarations.length} déclarations · {prayer.verseRef}
          </Text>
        </View>

        {/* Icône droite */}
        {isUnlocked ? (
          isToday ? (
            <AppIcon icon={Flame} size={20} color={colors.primary} strokeWidth={2} />
          ) : (
            <AppIcon icon={ChevronRight} size={18} color={colors.textTertiary} strokeWidth={2} />
          )
        ) : (
          <View style={{ alignItems: 'center', gap: 3 }}>
            <AppIcon icon={Lock} size={16} color={colors.textTertiary} strokeWidth={2} />
            <Text style={{ fontSize: 8, fontWeight: '700', color: colors.textTertiary, textAlign: 'center' }}>
              Abonné
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SerieScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { hasSubscription } = useAccess();
  const today = getProgramDay();

  // Jours 1-3 : gratuits. Jours 4-21 : abonnement actif obligatoire.
  const FREE_DAYS = 3;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          st.header,
          { backgroundColor: colors.surface, paddingTop: insets.top + 14, borderBottomColor: colors.border },
        ]}
      >
        <View style={st.headerOrb} />
        <View style={st.headerRow}>
          <View style={[st.headerIcon, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '30' }]}>
            <AppIcon icon={Sparkles} size={20} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Série 21 Jours</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              Programme de prière prophétique
            </Text>
          </View>
          {/* Jour actuel */}
          <View style={[st.todayBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
            <AppIcon icon={Flame} size={13} color={colors.primary} strokeWidth={2.2} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>Jour {today}</Text>
          </View>
        </View>

        {/* Barre de progression */}
        <View style={[st.progressWrap, { backgroundColor: colors.border + '60' }]}>
          <View
            style={[
              st.progressFill,
              { backgroundColor: colors.primary, width: `${(today / PROGRAM_DAYS) * 100}%` as any },
            ]}
          />
        </View>
        <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 6, textAlign: 'center' }}>
          {today}/{PROGRAM_DAYS} jours complétés
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info accès */}
        {!hasSubscription && (
          <TouchableOpacity
            style={[st.premiumBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '40' }]}
            onPress={() => router.push('/subscription' as any)}
            activeOpacity={0.85}
          >
            <AppIcon icon={Lock} size={16} color={colors.primary} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800' }}>
                Jours 4–21 verrouillés
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                Un abonnement actif est requis pour accéder aux jours 4 à 21.
              </Text>
            </View>
            <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#fff' }}>S'abonner</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Liste des 21 jours */}
        {Array.from({ length: PROGRAM_DAYS }, (_, i) => {
          const day = i + 1;
          const prayerIndex = i % DAILY_PRAYERS_FR.length;
          const prayer = DAILY_PRAYERS_FR[prayerIndex];
          const isToday = day === today;
          const isUnlocked = hasSubscription || day <= FREE_DAYS;
          return (
            <DayCard
              key={day}
              day={day}
              prayer={prayer}
              isToday={isToday}
              isUnlocked={isUnlocked}
              index={i}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  headerOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(201,168,76,0.06)',
    top: -60,
    right: -40,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  progressWrap: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  dayNum: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumTxt: { fontSize: 15, fontWeight: '900' },
});
