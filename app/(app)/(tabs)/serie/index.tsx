/**
 * Série Spirituelle — Oracle Plus
 *
 * Programme de prière couvrant tous les jours du mois courant.
 * Chaque jour : une prière à réciter à haute voix, matin ET soir.
 * Jours 1-3 : gratuits. Reste du mois : abonnement actif requis.
 * Le contenu varie chaque mois (rotation sur les prières disponibles).
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight, Flame, Lock, Moon, Sparkles, Sun } from 'lucide-react-native';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { useTheme } from '../../../../src/theme';
import { useAccess } from '../../../../src/hooks/useAccess';
import { DAILY_PRAYERS_FR } from '../../../../src/data/messages.data';

function getDaysInCurrentMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}
function getTodayDayOfMonth(): number { return new Date().getDate(); }
function getMonthName(): string {
  return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}
function getPrayerIndex(dayIndex: number): number {
  const monthOffset = new Date().getMonth() * 3;
  return (dayIndex + monthOffset) % DAILY_PRAYERS_FR.length;
}

const FREE_DAYS = 3;

function DayCard({ day, isToday, isUnlocked, prayerIndex, animIndex }: {
  day: number; isToday: boolean; isUnlocked: boolean; prayerIndex: number; animIndex: number;
}) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const prayer = DAILY_PRAYERS_FR[prayerIndex];
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: Math.min(animIndex * 30, 600), tension: 60, friction: 9, useNativeDriver: true }).start();
  }, []);
  function handlePress() {
    if (!isUnlocked) { router.push('/subscription' as any); return; }
    router.push({ pathname: '/(app)/serie/prayer', params: { day: String(day), index: String(prayerIndex) } } as any);
  }
  return (
    <Animated.View style={{ opacity: anim, transform: [{ scale: anim }, { translateY: anim.interpolate({ inputRange: [0,1], outputRange: [12,0] }) }] }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={isUnlocked ? 0.8 : 0.6}
        style={[st.dayCard, {
          backgroundColor: isToday ? colors.primary+'18' : !isUnlocked ? colors.border+'20' : colors.surface,
          borderColor: isToday ? colors.primary+'60' : colors.border,
          opacity: isUnlocked ? 1 : 0.65,
        }]}>
        <View style={[st.dayNum, { backgroundColor: isToday ? colors.primary : isUnlocked ? colors.primary+'20' : colors.border+'50' }]}>
          <Text style={[st.dayNumTxt, { color: isToday ? '#fff' : isUnlocked ? colors.primary : colors.textTertiary }]}>{day}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, lineHeight: 18 }} numberOfLines={1}>{prayer.title}</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2, lineHeight: 15 }} numberOfLines={2}>{prayer.intro}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 5 }}>
            <View style={st.sessionBadge}>
              <AppIcon icon={Sun} size={10} color="#F59E0B" strokeWidth={2.5} />
              <Text style={[st.sessionTxt, { color: '#F59E0B' }]}>Matin</Text>
            </View>
            <View style={st.sessionBadge}>
              <AppIcon icon={Moon} size={10} color="#818CF8" strokeWidth={2.5} />
              <Text style={[st.sessionTxt, { color: '#818CF8' }]}>Soir</Text>
            </View>
            <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>{prayer.declarations.length} déclarations</Text>
          </View>
        </View>
        {isUnlocked
          ? isToday
            ? <AppIcon icon={Flame} size={20} color={colors.primary} strokeWidth={2} />
            : <AppIcon icon={ChevronRight} size={18} color={colors.textTertiary} strokeWidth={2} />
          : <View style={{ alignItems: 'center', gap: 2 }}>
              <AppIcon icon={Lock} size={15} color={colors.textTertiary} strokeWidth={2} />
              <Text style={{ fontSize: 8, fontWeight: '700', color: colors.textTertiary }}>Abonné</Text>
            </View>
        }
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SerieScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { hasSubscription } = useAccess();
  const daysInMonth = getDaysInCurrentMonth();
  const todayDay    = getTodayDayOfMonth();
  const monthName   = getMonthName();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[st.header, { backgroundColor: colors.surface, paddingTop: insets.top + 14, borderBottomColor: colors.border }]}>
        <View style={st.headerOrb} />
        <View style={st.headerRow}>
          <View style={[st.headerIcon, { backgroundColor: colors.primary+'20', borderColor: colors.primary+'30' }]}>
            <AppIcon icon={Sparkles} size={20} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Série du mois</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' }}>
              {monthName} · {daysInMonth} jours de prière
            </Text>
          </View>
          <View style={[st.todayBadge, { backgroundColor: colors.primary+'18', borderColor: colors.primary+'40' }]}>
            <AppIcon icon={Flame} size={13} color={colors.primary} strokeWidth={2.2} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>Jour {todayDay}</Text>
          </View>
        </View>
        <View style={[st.progressWrap, { backgroundColor: colors.border+'60' }]}>
          <View style={[st.progressFill, { backgroundColor: colors.primary, width: `${(todayDay / daysInMonth) * 100}%` as any }]} />
        </View>
        <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 6, textAlign: 'center' }}>
          {todayDay}/{daysInMonth} jours complétés ce mois
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
        <View style={[st.instructionBox, { backgroundColor: colors.primary+'10', borderColor: colors.primary+'30' }]}>
          <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800', marginBottom: 4 }}>📖 Comment utiliser cette série</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 19 }}>
            Chaque jour, récitez la prière du jour{" "}
            <Text style={{ fontWeight: '700', color: colors.primary }}>à haute voix</Text>, dans un esprit de prière,{" "}
            <Text style={{ fontWeight: '700', color: '#F59E0B' }}>le matin</Text> au réveil et{" "}
            <Text style={{ fontWeight: '700', color: '#818CF8' }}>le soir</Text> avant de dormir. Déclarez chaque point avec foi et conviction.
          </Text>
        </View>

        {!hasSubscription && (
          <TouchableOpacity style={[st.premiumBanner, { backgroundColor: colors.primary+'12', borderColor: colors.primary+'40' }]}
            onPress={() => router.push('/subscription' as any)} activeOpacity={0.85}>
            <AppIcon icon={Lock} size={16} color={colors.primary} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800' }}>Jours 4–{daysInMonth} verrouillés</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Un abonnement actif déverrouille tout le mois.</Text>
            </View>
            <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#fff' }}>S'abonner</Text>
            </View>
          </TouchableOpacity>
        )}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          return (
            <DayCard key={day} day={day} isToday={day === todayDay}
              isUnlocked={hasSubscription || day <= FREE_DAYS}
              prayerIndex={getPrayerIndex(i)} animIndex={i} />
          );
        })}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  header:         { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, overflow: 'hidden', position: 'relative' },
  headerOrb:      { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(201,168,76,0.06)', top: -60, right: -40 },
  headerRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  headerIcon:     { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  todayBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  progressWrap:   { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 3 },
  instructionBox: { borderRadius: 14, borderWidth: 1, padding: 14 },
  premiumBanner:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  dayCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  dayNum:         { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dayNumTxt:      { fontSize: 15, fontWeight: '900' },
  sessionBadge:   { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  sessionTxt:     { fontSize: 9, fontWeight: '700' },
});
