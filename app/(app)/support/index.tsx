import React from 'react';
import { View, Text, Linking } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Mail, MessageCircle, Phone } from 'lucide-react-native';
import { useI18n } from '../../../src/i18n';
import { useTheme } from '../../../src/theme';
import { ScreenWrapper } from '../../../src/components/common/ScreenWrapper';
import { Card } from '../../../src/components/common/Card';
import { BackButton } from '../../../src/components/common/BackButton';
import { AppIcon } from '../../../src/components/common/AppIcon';

export default function SupportScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  const supportOptions = [
    { icon: Mail, label: t.support.email, value: 'tchingankonggeorges@gmail.com', action: () => Linking.openURL('mailto:chingankonggeorges@gmail.com') },
    { icon: Phone, label: 'Telegram', value: '+225 05 04 67 38 29', action: () => Linking.openURL('https://t.me/+2250504673829') },
    { icon: MessageCircle, label: t.support.liveChat, value: t.support.available, action: () => {} },
  ] satisfies { icon: LucideIcon; label: string; value: string; action: () => void }[];

  return (
    <ScreenWrapper scrollable padded>
      <BackButton style={{ marginBottom: 24 }} fallback="/(app)/(tabs)/profile"/>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <AppIcon icon={MessageCircle} size={22} color={colors.text} strokeWidth={2.4} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{t.support.title}</Text>
      </View>

      <View style={{ gap: spacing.lg }}>
        {/* Contact options */}
        <View>
          <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 12 }}>{t.support.contactUs}</Text>
          {supportOptions.map((opt) => (
            <Card key={opt.label} onPress={opt.action} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <AppIcon icon={opt.icon} size={22} color={colors.primary} strokeWidth={2.2} />
                <View>
                  <Text style={{ fontWeight: '600', color: colors.text }}>{opt.label}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{opt.value}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* FAQ */}
        <View>
          <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 12 }}>{t.support.faqTitle}</Text>
          {t.support.faq.map((item) => (
            <Card key={item.q} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 6 }}>{item.q}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{item.a}</Text>
            </Card>
          ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}
