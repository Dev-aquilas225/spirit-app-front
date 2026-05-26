/**
 * DailyChallenge — Carte de missions quotidiennes sur la home
 * Affiche les missions du jour avec progression et XP.
 */
import React, { useEffect } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Circle, Flame, Star } from 'lucide-react-native';
import { AppIcon } from '../common/AppIcon';
import { useTheme } from '../../theme';
import { DAILY_MISSIONS, getLevelFromXp, getXpProgress, useGamificationStore } from '../../store/gamification.store';

export function DailyChallenge() {
  const { colors } = useTheme();
  const { xp, streak, completedMissions, completeMission, isLoaded } = useGamificationStore();

  const level    = getLevelFromXp(xp);
  const progress = getXpProgress(xp);
  const done     = completedMissions.length;
  const total    = DAILY_MISSIONS.length;

  if (!isLoaded) return null;

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <Text style={[st.title, { color: colors.text }]}>Défis du jour</Text>
          <Text style={[st.sub, { color: colors.textSecondary }]}>
            {done}/{total} accomplis
          </Text>
        </View>
        <View style={st.headerRight}>
          {streak > 0 && (
            <View style={[st.streakBadge, { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' }]}>
              <AppIcon icon={Flame} size={13} color="#F59E0B" strokeWidth={2} />
              <Text style={st.streakTxt}>{streak}j</Text>
            </View>
          )}
          <View style={[st.levelBadge, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '40' }]}>
            <AppIcon icon={Star} size={13} color={colors.primary} strokeWidth={2} />
            <Text style={[st.levelTxt, { color: colors.primary }]}>Niv.{level.level}</Text>
          </View>
        </View>
      </View>

      {/* XP Progress bar */}
      <View style={[st.barBg, { backgroundColor: colors.border }]}>
        <View style={[st.barFill, { width: `${progress}%` as any, backgroundColor: colors.primary }]} />
      </View>
      <Text style={[st.xpTxt, { color: colors.textTertiary }]}>{xp} XP · {level.name}</Text>

      {/* Missions */}
      <View style={st.missions}>
        {DAILY_MISSIONS.map((m) => {
          const done = completedMissions.includes(m.id);
          return (
            <Pressable
              key={m.id}
              style={[st.mission, { borderColor: done ? colors.primary + '40' : colors.border, backgroundColor: done ? colors.primaryPale : 'transparent' }]}
              onPress={() => !done && completeMission(m.id)}
            >
              <Text style={st.missionIcon}>{m.icon}</Text>
              <Text style={[st.missionLabel, { color: done ? colors.primary : colors.text, flex: 1 }]} numberOfLines={1}>
                {m.label}
              </Text>
              <View style={st.missionRight}>
                <Text style={[st.missionXp, { color: colors.textTertiary }]}>+{m.xp}xp</Text>
                <AppIcon
                  icon={done ? CheckCircle2 : Circle}
                  size={18}
                  color={done ? colors.primary : colors.textTertiary}
                  strokeWidth={2}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card:        { borderRadius: 20, borderWidth: 1, padding: 18, gap: 12,
                 ...Platform.select({ web: { boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 } }) },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft:  { gap: 2 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  title:       { fontSize: 16, fontWeight: '800' },
  sub:         { fontSize: 12 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  streakTxt:   { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
  levelBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  levelTxt:    { fontSize: 12, fontWeight: '700' },
  barBg:       { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill:     { height: 6, borderRadius: 3 },
  xpTxt:       { fontSize: 11, textAlign: 'right', marginTop: -4 },
  missions:    { gap: 8 },
  mission:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  missionIcon: { fontSize: 18 },
  missionLabel:{ fontSize: 13, fontWeight: '600' },
  missionRight:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  missionXp:   { fontSize: 11, fontWeight: '600' },
});
