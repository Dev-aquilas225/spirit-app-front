import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useI18n } from '../../i18n';
import { usePremiumAccess } from '../../hooks/usePremiumAccess';
import { useTheme } from '../../theme';
import { Button } from '../common/Button';
import { AppIcon } from '../common/AppIcon';
import { GoldCard } from '../common/Card';

interface PremiumGuardProps {
  children: React.ReactNode;
  /**
   * Si true, affiche un bloc "premium requis" inline
   * plutôt qu'un écran plein.
   */
  inline?: boolean;
  featureName?: string;
}

/**
 * PremiumGuard — Protège les contenus réservés aux abonnés.
 *
 * Usage :
 * ```tsx
 * <PremiumGuard featureName="Bibliothèque">
 *   <BookList />
 * </PremiumGuard>
 * ```
 */
export function PremiumGuard({ children, inline = false, featureName }: PremiumGuardProps) {
  const { isPremium } = usePremiumAccess();
  const { colors, spacing } = useTheme();
  const { t } = useI18n();

  if (isPremium) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <GoldCard style={{ margin: spacing.base }}>
        <View style={styles.lockIcon}>
          <AppIcon icon={Lock} size={32} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {t.premiumGuard.inlineTitle(featureName)}
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          {t.premiumGuard.inlineDesc}
        </Text>
        <Button
          label={t.premiumGuard.inlineCta}
          variant="gold"
          fullWidth
          style={{ marginTop: spacing.md }}
          onPress={() => router.push('/(app)/subscription')}
        />
      </GoldCard>
    );
  }

  return (
    <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
      <View style={styles.bigLock}>
        <AppIcon icon={Lock} size={64} color={colors.primary} strokeWidth={1.8} />
      </View>
      <Text style={[styles.title, { color: colors.text, fontSize: 22, textAlign: 'center' }]}>
        {t.premiumGuard.fullTitle(featureName)}
      </Text>
      <Text style={[styles.desc, { color: colors.textSecondary, textAlign: 'center', marginHorizontal: 32 }]}>
        {t.premiumGuard.fullDesc}
      </Text>
      <View style={{ marginTop: 24, width: '80%' }}>
        <Button
          label={t.premiumGuard.discover}
          variant="gold"
          fullWidth
          onPress={() => router.push('/(app)/subscription')}
        />
        <Button
          label={t.common.back}
          variant="ghost"
          fullWidth
          style={{ marginTop: 12 }}
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockIcon: { alignItems: 'center', marginBottom: 8 },
  bigLock: { marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  desc: { fontSize: 14, lineHeight: 22, marginBottom: 4 },
});
