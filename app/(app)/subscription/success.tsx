/**
 * Écran de succès après paiement.
 * Distingue pack crédits (starter/standard/premium) vs abonnement.
 * Le param `plan` est passé par payment.tsx pour éviter toute ambiguïté.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Crown, PartyPopper, Zap } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { Button } from '../../../src/components/common/Button';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { useAuthStore } from '../../../src/store/auth.store';
import { useCreditsStore } from '../../../src/store/credits.store';
import { CREDIT_PACKS } from '../../../src/store/credits.store';
import { formatDate, formatCurrency } from '../../../src/utils/helpers';

// Montants FCFA par plan (source de vérité locale — ne dépend pas du backend)
const PLAN_AMOUNTS: Record<string, number> = {
  starter: 500, standard: 1000, premium: 2500,
  weekly_plus: 3000, monthly: 8000, yearly: 15000,
};

export default function PaymentSuccessScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  const { subscription, pendingReference, loadSubscription } = useSubscription();
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const fetchBalance = useCreditsStore((s) => s.fetchBalance);
  const credits = useCreditsStore((s) => s.credits);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const { reference, plan } = useLocalSearchParams<{ reference?: string; plan?: string }>();

  // Détecter le type de paiement depuis le param `plan`
  const isCreditPack = ['starter', 'standard', 'premium'].includes(plan ?? '');
  const creditPack   = CREDIT_PACKS.find((p) => p.id === plan);
  const amount       = PLAN_AMOUNTS[plan ?? ''] ?? 0;

  useEffect(() => {
    Promise.all([refreshUser(), loadSubscription(), fetchBalance()]).catch(() => {});
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>

        {/* Icône */}
        <View style={styles.iconWrapper}>
          <AppIcon icon={PartyPopper} size={80} color="#C9A84C" strokeWidth={1.8} />
        </View>

        {/* Titre */}
        <Text style={[styles.title, { color: colors.text }]}>
          Paiement réussi !
        </Text>

        {/* Sous-titre adapté au type */}
        <View style={styles.subtitleRow}>
          <AppIcon
            icon={isCreditPack ? Zap : Crown}
            size={18}
            color={colors.primary}
            strokeWidth={2.2}
          />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isCreditPack
              ? `+${creditPack?.credits?.toLocaleString() ?? '?'} crédits ajoutés à votre compte`
              : 'Bienvenue dans la famille Premium Oracle Plus'}
          </Text>
        </View>

        {/* Carte d'infos */}
        <Animated.View style={{ opacity: fadeAnim, width: '100%', marginTop: 24 }}>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

            {/* Montant */}
            <View style={styles.infoRow}>
              <Text style={{ color: colors.textSecondary }}>Montant payé</Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {amount > 0 ? formatCurrency(amount) : '—'}
              </Text>
            </View>

            {/* Crédits : solde actuel */}
            {isCreditPack && (
              <View style={styles.infoRow}>
                <Text style={{ color: colors.textSecondary }}>Solde actuel</Text>
                <Text style={{ color: colors.primary, fontWeight: '800' }}>
                  {credits.toLocaleString()} crédits
                </Text>
              </View>
            )}

            {/* Abonnement : date d'expiration */}
            {!isCreditPack && subscription?.expiryDate && (
              <View style={styles.infoRow}>
                <Text style={{ color: colors.textSecondary }}>Expire le</Text>
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {formatDate(subscription.expiryDate)}
                </Text>
              </View>
            )}

            {/* Référence */}
            {(reference || pendingReference) && (
              <View style={styles.infoRow}>
                <Text style={{ color: colors.textSecondary }}>Référence</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 11 }}>
                  {reference || pendingReference}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>

      {/* Boutons */}
      <View style={{ width: '100%', padding: spacing.xl, gap: spacing.md }}>
        <Button
          label="Commencer l'exploration"
          variant="gold"
          fullWidth
          size="lg"
          onPress={() => router.replace('/dashboard')}
        />
        <Button
          label={isCreditPack ? 'Voir mes crédits' : 'Voir mon abonnement'}
          variant="outline"
          fullWidth
          onPress={() => router.replace(isCreditPack ? '/subscription?tab=credits' : '/subscription')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingTop: 80 },
  content:     { alignItems: 'center', paddingHorizontal: 32, flex: 1, justifyContent: 'center' },
  iconWrapper: { marginBottom: 24 },
  title:       { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle:    { fontSize: 15, textAlign: 'center', lineHeight: 24, flex: 1 },
  subtitleRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  infoCard:    { padding: 16, borderRadius: 12, borderWidth: 1, gap: 10 },
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
