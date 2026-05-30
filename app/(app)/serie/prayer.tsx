/**
 * Lecture d'une prière de la série 21 jours
 */
import React, { useRef } from 'react';
import {
  Animated, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, Flame, Heart } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useTheme } from '../../../src/theme';
import { DAILY_PRAYERS_FR } from '../../../src/data/messages.data';

export default function SeriePrayerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { day, index } = useLocalSearchParams<{ day: string; index: string }>();

  // L'index passé en paramètre est déjà calculé avec l'offset du jour dans serie/index.tsx
  const prayerIndex = parseInt(index ?? '0', 10) % DAILY_PRAYERS_FR.length;
  const prayer = DAILY_PRAYERS_FR[prayerIndex];
  const dayNum = parseInt(day ?? '1', 10);

  if (!prayer) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          st.header,
          { backgroundColor: colors.surface, paddingTop: insets.top + 12, borderBottomColor: colors.border },
        ]}
      >
        <View style={st.headerOrb} />
        <View style={st.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[st.backBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}
          >
            <AppIcon icon={ArrowLeft} size={18} color={colors.primary} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppIcon icon={Flame} size={14} color={colors.primary} strokeWidth={2.2} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Jour {dayNum} · Série 21 Jours
              </Text>
            </View>
            <Text style={{ fontSize: 17, fontWeight: '900', color: colors.text, marginTop: 4 }}>
              {prayer.title}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AppIcon icon={Heart} size={14} color='#F472B6' strokeWidth={2.5} />
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#F472B6', letterSpacing: 2, textTransform: 'uppercase' }}>
              Introduction
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 24, fontStyle: 'italic' }}>
            {prayer.intro}
          </Text>
        </View>

        {/* Déclarations */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <View style={[st.sectionAccent, { backgroundColor: colors.primary }]} />
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
              {prayer.declarations.length} Déclarations de Foi
            </Text>
          </View>
          {prayer.declarations.map((decl, i) => (
            <View
              key={i}
              style={[st.declCard, { backgroundColor: colors.primary + '0D', borderColor: colors.primary + '30' }]}
            >
              <View style={[st.declNum, { backgroundColor: colors.primary }]}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#fff' }}>{i + 1}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 13, color: colors.text, lineHeight: 22, fontWeight: '600' }}>
                {decl}
              </Text>
            </View>
          ))}
        </View>

        {/* Clôture */}
        <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AppIcon icon={CheckCircle2} size={14} color='#10B981' strokeWidth={2.5} />
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#10B981', letterSpacing: 2, textTransform: 'uppercase' }}>
              Clôture
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 24, fontStyle: 'italic' }}>
            {prayer.closing}
          </Text>
        </View>

        {/* Verset */}
        <View style={[st.verseCard, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}>
          <Text style={{ fontSize: 13, color: colors.text, lineHeight: 22, fontStyle: 'italic', textAlign: 'center' }}>
            « {prayer.verse} »
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary, marginTop: 8, textAlign: 'center' }}>
            — {prayer.verseRef}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  headerOrb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(201,168,76,0.06)',
    top: -50,
    right: -30,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 2,
  },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2 },
  declCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  declNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  verseCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
});
