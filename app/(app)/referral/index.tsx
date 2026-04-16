import React from 'react';
import { Alert, Platform, Share, StyleSheet, Text, View } from 'react-native';
import { Gift } from 'lucide-react-native';
import { useI18n } from '../../../src/i18n';
import { useTheme } from '../../../src/theme';
import { useAuth } from '../../../src/hooks/useAuth';
import { ScreenWrapper } from '../../../src/components/common/ScreenWrapper';
import { BackButton } from '../../../src/components/common/BackButton';
import { GoldCard } from '../../../src/components/common/Card';
import { Button } from '../../../src/components/common/Button';
import { AppIcon } from '../../../src/components/common/AppIcon';

export default function ReferralScreen() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const { t } = useI18n();

  const appUrl = process.env.EXPO_PUBLIC_APP_URL ?? 'https://oracleplus.app';

  async function handleShare() {
    const code = user?.referralCode ?? '';
    const message = t.referral.shareMsg(code, appUrl);
    await Share.share({ message });
  }

  async function handleCopy() {
    const code = user?.referralCode ?? '';
    if (!code) return;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(code);
      Alert.alert(t.referral.copiedTitle, t.referral.copiedMsg);
      return;
    }

    await Share.share({ message: code });
    Alert.alert(t.referral.copiedTitle, t.referral.copiedMsg);
  }

  return (
    <ScreenWrapper scrollable padded>
      <BackButton style={{ marginBottom: 24 }} />

      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <View style={{ marginBottom: 16 }}>
          <AppIcon icon={Gift} size={64} color={colors.primary} strokeWidth={1.8} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
          {t.referral.title}
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 14, lineHeight: 22 }}>
          {t.referral.subtitle}
        </Text>
      </View>

      <GoldCard style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: '#C9A84C', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
          {t.referral.codeTitle}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: 2 }}>
            {user?.referralCode}
          </Text>
          <Button label={t.referral.copy} variant="outline" size="sm" onPress={handleCopy} />
        </View>
      </GoldCard>

      <Button
        label={t.referral.share}
        variant="gold"
        fullWidth
        size="lg"
        onPress={handleShare}
      />

      <View style={{ marginTop: 32, gap: spacing.md }}>
        <Text style={{ fontWeight: '700', color: colors.text, fontSize: 16 }}>{t.referral.howTitle}</Text>
        {[
          { step: '1', text: t.referral.step1 },
          { step: '2', text: t.referral.step2 },
          { step: '3', text: t.referral.step3 },
        ].map((item) => (
          <View key={item.step} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{item.step}</Text>
            </View>
            <Text style={{ color: colors.textSecondary, flex: 1, lineHeight: 22 }}>{item.text}</Text>
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
