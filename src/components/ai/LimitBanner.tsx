import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ban, TriangleAlert } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { FREE_AI_DAILY_LIMIT } from '../../utils/constants';
import { AppIcon } from '../common/AppIcon';

interface LimitBannerProps {
  remaining: number;
  limitReached: boolean;
}

export function LimitBanner({ remaining, limitReached }: LimitBannerProps) {
  const { colors, spacing, borderRadius: br } = useTheme();

  if (limitReached) {
    return (
      <View style={[styles.banner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderRadius: br.md, margin: spacing.md }]}>
        <AppIcon icon={Ban} size={20} color="#DC2626" strokeWidth={2.4} />
        <View style={styles.textArea}>
          <Text style={[styles.title, { color: '#DC2626' }]}>Limite atteinte</Text>
          <Text style={[styles.desc, { color: '#7F1D1D' }]}>
            Vous avez utilisé vos {FREE_AI_DAILY_LIMIT} questions du jour. Revenez demain ou abonnez-vous.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(app)/subscription')}
          style={[styles.btn, { backgroundColor: '#C9A84C' }]}
        >
          <Text style={styles.btnText}>Premium</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (remaining <= FREE_AI_DAILY_LIMIT) {
    return (
      <View style={[styles.banner, { backgroundColor: colors.premiumBackground, borderColor: colors.premiumBorder, borderRadius: br.md, margin: spacing.md }]}>
        <AppIcon icon={TriangleAlert} size={20} color={colors.primary} strokeWidth={2.4} />
        <Text style={[styles.desc, { color: colors.textSecondary, flex: 1 }]}>
          Il vous reste <Text style={{ fontWeight: '700', color: colors.primary }}>{remaining} question{remaining > 1 ? 's' : ''}</Text> aujourd’hui (utilisateur gratuit).
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  textArea: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700' },
  desc: { fontSize: 12, marginTop: 2 },
  btn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
