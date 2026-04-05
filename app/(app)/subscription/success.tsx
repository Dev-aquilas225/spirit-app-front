import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Crown, PartyPopper } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { Button } from '../../../src/components/common/Button';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { formatDate, formatCurrency } from '../../../src/utils/helpers';

export default function PaymentSuccessScreen() {
  const { colors, spacing } = useTheme();
  const { subscription, pendingReference } = useSubscription();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        {/* Success icon */}
        <View style={styles.iconWrapper}>
          <AppIcon icon={PartyPopper} size={80} color="#C9A84C" strokeWidth={1.8} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Paiement réussi !</Text>
        <View style={styles.subtitleRow}>
          <AppIcon icon={Crown} size={18} color={colors.primary} strokeWidth={2.2} />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Bienvenue dans la famille Premium Oracle Plus
          </Text>
        </View>

        <Animated.View style={{ opacity: fadeAnim, width: '100%', marginTop: 24 }}>
          <View style={[styles.infoCard, { backgroundColor: colors.premiumBackground, borderColor: colors.premiumBorder }]}>
            <View style={styles.infoRow}>
              <Text style={{ color: colors.textSecondary }}>Montant</Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{formatCurrency(5000)}</Text>
            </View>
            {subscription && (
              <View style={styles.infoRow}>
                <Text style={{ color: colors.textSecondary }}>Expire le</Text>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{formatDate(subscription.expiryDate)}</Text>
              </View>
            )}
            {pendingReference && (
              <View style={styles.infoRow}>
                <Text style={{ color: colors.textSecondary }}>Référence</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{pendingReference}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>

      <View style={{ width: '100%', padding: spacing.xl, gap: spacing.md }}>
        <Button
          label="Commencer l'exploration"
          variant="gold"
          fullWidth
          size="lg"
          onPress={() => router.replace('/(app)/(tabs)/home')}
        />
        <Button
          label="Voir mon abonnement"
          variant="outline"
          fullWidth
          onPress={() => router.replace('/(app)/subscription')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingTop: 80 },
  content: { alignItems: 'center', paddingHorizontal: 32, flex: 1, justifyContent: 'center' },
  iconWrapper: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  subtitleRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  infoCard: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
