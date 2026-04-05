import { router } from 'expo-router';
import { KeyRound, Smartphone } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { AppIcon } from '../../src/components/common/AppIcon';
import { BackButton } from '../../src/components/common/BackButton';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { ScreenWrapper } from '../../src/components/common/ScreenWrapper';
import { useI18n } from '../../src/i18n';
import { AuthService } from '../../src/services/auth.service';
import { useTheme } from '../../src/theme';
import { validatePhone } from '../../src/utils/validators';

export default function ForgotPasswordScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    const err = validatePhone(phone);
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);
    await AuthService.forgotPassword(phone);
    setLoading(false);
    // Rediriger directement vers l'écran OTP en mode réinitialisation
    router.push({ pathname: '/(auth)/otp', params: { phone, mode: 'reset' } });
  }

  return (
    <ScreenWrapper scrollable padded>
      <BackButton style={{ marginBottom: 32 }} />

      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <AppIcon icon={KeyRound} size={48} color={colors.primary} strokeWidth={1.8} />
      </View>

      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
        {t.auth.forgotTitle}
      </Text>
      <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 14, marginBottom: 32 }}>
        {t.auth.forgotSubtitle}
      </Text>

      <Input
        label={t.auth.phoneLabel}
        placeholder="+225 07 00 00 00 00"
        value={phone}
        onChangeText={(v) => { setPhone(v); setError(null); }}
        keyboardType="phone-pad"
        error={error}
        leftIcon={<AppIcon icon={Smartphone} size={18} color={colors.textSecondary} strokeWidth={2.2} />}
      />

      <Button
        label={t.auth.sendCode}
        variant="gold"
        fullWidth
        size="lg"
        loading={loading}
        onPress={handleSend}
        style={{ marginTop: 24 }}
      />
    </ScreenWrapper>
  );
}
