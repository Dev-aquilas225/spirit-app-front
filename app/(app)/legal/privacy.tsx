import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useI18n } from '../../../src/i18n';
import { useTheme } from '../../../src/theme';
import { BackButton } from '../../../src/components/common/BackButton';

export default function PrivacyScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.surface, paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <BackButton style={{ marginBottom: 8 }} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{t.legal.privacyTitle}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.base }}>
        {t.legal.privacySections.map((section) => (
          <View key={section.title} style={{ marginBottom: 20 }}>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15, marginBottom: 6 }}>{section.title}</Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>{section.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
