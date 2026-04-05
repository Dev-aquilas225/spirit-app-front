import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { router } from 'expo-router';
import { Crown, ExternalLink, Lock } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { useI18n } from '../../../src/i18n';
import { Button } from '../../../src/components/common/Button';
import { BackButton } from '../../../src/components/common/BackButton';
import { Card } from '../../../src/components/common/Card';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { formatCurrency } from '../../../src/utils/helpers';

type Step = 'select' | 'waiting' | 'verifying';

export default function PaymentScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  const { initiatePayment, verifyPayment, isProcessingPayment, isLoading, paymentError, clearPaymentError } = useSubscription();

  const [step, setStep] = useState<Step>('select');
  const [reference, setReference] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  async function handleInitiate() {
    clearPaymentError();
    const result = await initiatePayment('monthly');
    if (!result) return;

    setReference(result.reference);
    setAuthUrl(result.authorization_url);
    setStep('waiting');

    await Linking.openURL(result.authorization_url);
  }

  async function handleVerify() {
    if (!reference) return;
    setStep('verifying');
    const success = await verifyPayment(reference);
    if (success) {
      router.replace('/(app)/subscription/success');
    } else {
      router.push('/(app)/subscription/failure');
    }
  }

  function handleReopenPaystack() {
    if (authUrl) {
      Linking.openURL(authUrl);
    }
  }

  const isWorking = isProcessingPayment || isLoading || step === 'verifying';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.deepBlue ?? '#1A1A3E', paddingTop: 56 }]}>
        <BackButton variant="dark" style={{ marginBottom: 16, alignSelf: 'flex-start' }} />
        <AppIcon icon={Crown} size={40} color="#C9A84C" strokeWidth={1.8} />
        <Text style={styles.headerTitle}>{t.subscription.payTitle}</Text>
        <Text style={styles.headerSubtitle}>{t.subscription.paySubtitle}</Text>
        <View style={styles.amountBadge}>
          <Text style={styles.amount}>{formatCurrency(5000)}</Text>
        </View>
      </View>

      <View style={{ padding: spacing.base, gap: spacing.lg }}>
        {paymentError && (
          <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.errorText}>{paymentError}</Text>
          </View>
        )}

        {/* Récapitulatif */}
        <Card>
          <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 12 }}>{t.subscription.payRecap}</Text>
          <View style={styles.summaryRow}>
            <Text style={{ color: colors.textSecondary }}>{t.subscription.payItem}</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{t.subscription.price}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: colors.textSecondary }}>{t.subscription.payDuration}</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{t.subscription.pay30days}</Text>
          </View>
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 8 }]}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{t.subscription.payTotal}</Text>
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 16 }}>{t.subscription.price}</Text>
          </View>
        </Card>

        {step === 'select' && (
          <>
            <Button
              label={isProcessingPayment ? t.subscription.payInitializing : t.subscription.payWithPaystack}
              variant="gold"
              fullWidth
              size="lg"
              loading={isProcessingPayment}
              onPress={handleInitiate}
            />
            <View style={styles.secureRow}>
              <AppIcon icon={Lock} size={14} color={colors.textTertiary} strokeWidth={2.6} />
              <Text style={{ color: colors.textTertiary, fontSize: 11, textAlign: 'center' }}>
                {t.subscription.paySecure}
              </Text>
            </View>
          </>
        )}

        {(step === 'waiting' || step === 'verifying') && (
          <View style={{ gap: spacing.md }}>
            <View style={[styles.infoBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <AppIcon icon={ExternalLink} size={18} color={colors.primary} strokeWidth={2.2} />
              <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 20 }}>
                {t.subscription.payOpenedInfo}
              </Text>
            </View>

            <Button
              label={step === 'verifying' ? t.subscription.payVerifying : t.subscription.payDone}
              variant="gold"
              fullWidth
              size="lg"
              loading={step === 'verifying'}
              onPress={handleVerify}
            />

            <TouchableOpacity style={styles.reopenBtn} onPress={handleReopenPaystack} disabled={isWorking}>
              <AppIcon icon={ExternalLink} size={16} color={colors.primary} strokeWidth={2.2} />
              <Text style={{ color: colors.primary, fontSize: 14 }}>{t.subscription.payReopen}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep('select')} disabled={isWorking}>
              <Text style={{ color: colors.textTertiary, fontSize: 13, textDecorationLine: 'underline' }}>
                {t.subscription.payRetry}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 24, paddingBottom: 32, alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  amountBadge: { marginTop: 8, backgroundColor: 'rgba(201,168,76,0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#C9A84C' },
  amount: { fontSize: 24, fontWeight: '800', color: '#C9A84C' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  errorBanner: { padding: 12, borderRadius: 8 },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 6 },
  reopenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
});
