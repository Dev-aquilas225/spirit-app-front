import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import {
  Briefcase, Calendar, GraduationCap, Heart, Home, Lock, Shield, Sparkles, Star, Users,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { useTheme } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/auth.store';

interface Programme {
  id: string;
  icon: LucideIcon;
  color: string;
  title: string;
  description: string;
  days: number;
  premium: boolean;
}

const PROGRAMMES: Programme[] = [
  {
    id: 'foyer',
    icon: Home,
    color: '#C9A84C',
    title: 'Foyer & Mariage',
    description: 'Restauration, unité et paix dans votre famille',
    days: 7,
    premium: false,
  },
  {
    id: 'enfants',
    icon: Users,
    color: '#7C3AED',
    title: 'Suivi des enfants',
    description: 'Protection, réussite scolaire et santé spirituelle',
    days: 7,
    premium: false,
  },
  {
    id: 'projets',
    icon: Star,
    color: '#0EA5E9',
    title: 'Projets & Réussite',
    description: 'Décollage de vos projets avec la grâce divine',
    days: 7,
    premium: false,
  },
  {
    id: 'travail',
    icon: Briefcase,
    color: '#10B981',
    title: 'Travail & Finances',
    description: 'Percée professionnelle et abondance financière',
    days: 7,
    premium: false,
  },
  {
    id: 'concours',
    icon: GraduationCap,
    color: '#F59E0B',
    title: 'Concours & Examens',
    description: 'Faveur divine pour vos épreuves et compétitions',
    days: 7,
    premium: false,
  },
  {
    id: 'addictions',
    icon: Shield,
    color: '#EF4444',
    title: 'Délivrance & Addictions',
    description: 'Libération et restauration intérieure profonde',
    days: 7,
    premium: true,
  },
  {
    id: 'sante',
    icon: Heart,
    color: '#EC4899',
    title: 'Guérison & Santé',
    description: 'Prière de guérison et rétablissement complet',
    days: 7,
    premium: true,
  },
];

export default function AccomppagnementsScreen() {
  const { colors, spacing } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.role === 'subscriber' || user?.role === 'admin';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: '#1A1A3E' }]}>
        <BackButton variant="dark" style={{ marginBottom: 12 }} fallback="/(app)/(tabs)/home"/>
        <Text style={s.headerTitle}>Accompagnements spirituels</Text>
        <Text style={s.headerSub}>
          Programmes de 7 jours avec suivi quotidien et 5 questions incluses
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.base, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge gratuit */}
        <View style={[s.freeBadge, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
          <AppIcon icon={Sparkles} size={14} color={colors.textSecondary} strokeWidth={2} />
          <Text style={{ color: colors.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 }}>
            Les 5 premiers programmes sont accessibles gratuitement · Abonnez-vous pour tout débloquer
          </Text>
        </View>

        {PROGRAMMES.map((prog) => {
          const locked = prog.premium && !isPremium;
          return (
            <TouchableOpacity
              key={prog.id}
              style={[
                s.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
                locked && { opacity: 0.6 },
              ]}
              activeOpacity={0.82}
              onPress={() => {
                if (locked) {
                  router.push('/(app)/subscription');
                  return;
                }
                router.push({ pathname: '/(app)/accompagnements/chat', params: { programme: prog.title, id: prog.id } });
              }}
            >
              <View style={[s.iconWrap, { backgroundColor: prog.color + '20' }]}>
                <AppIcon icon={prog.icon} size={24} color={prog.color} strokeWidth={2} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={s.titleRow}>
                  <Text style={[s.cardTitle, { color: colors.text }]}>{prog.title}</Text>
                  {prog.premium && (
                    <View style={[s.premiumTag, { backgroundColor: '#C9A84C20', borderColor: '#C9A84C' }]}>
                      <Text style={{ color: '#C9A84C', fontSize: 10, fontWeight: '700' }}>VIP</Text>
                    </View>
                  )}
                </View>
                <Text style={[s.cardDesc, { color: colors.textSecondary }]}>{prog.description}</Text>
                <View style={s.metaRow}>
                  <AppIcon icon={Calendar} size={12} color={colors.textTertiary} strokeWidth={2} />
                  <Text style={[s.meta, { color: colors.textTertiary }]}>{prog.days} jours  ·  5 questions incluses</Text>
                </View>
              </View>

              {locked
                ? <AppIcon icon={Lock} size={18} color={colors.textTertiary} strokeWidth={2} />
                : <Text style={{ color: colors.textTertiary, fontSize: 20, fontWeight: '300' }}>›</Text>
              }
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  freeBadge: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  premiumTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 11,
  },
});
