import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Bell, Moon, Sun, Sunrise } from 'lucide-react-native';
import { useI18n } from '../../../src/i18n';
import { useTheme } from '../../../src/theme';
import { useNotifications } from '../../../src/hooks/useNotifications';
import { ScreenWrapper } from '../../../src/components/common/ScreenWrapper';
import { Card } from '../../../src/components/common/Card';
import { BackButton } from '../../../src/components/common/BackButton';
import { AppIcon } from '../../../src/components/common/AppIcon';

export default function NotificationsScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  const { enableNotifications, disableNotifications, isEnabled } = useNotifications();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // CORRECTION : Libellés personnalisés pour correspondre exactement à tes demandes
  const reminderLabels = [
    "Prière du matin",
    "Message de réconfort pour la journée",
    "Prière du soir",
  ];

  // CORRECTION : Heures exactes demandées (05h45, 13h00, 21h00)
  const PWA_TIMES = [
    { hour: 5, minute: 45, icon: Sunrise },
    { hour: 13, minute: 0, icon: Sun },
    { hour: 21, minute: 0, icon: Moon },
  ];

  useEffect(() => {
    isEnabled().then(setEnabled);
  }, [isEnabled]);

  async function handleToggle(value: boolean) {
    setLoading(true);
    if (value) {
      const granted = await enableNotifications();
      setEnabled(granted);
    } else {
      await disableNotifications();
      setEnabled(false);
    }
    setLoading(false);
  }

  return (
    <ScreenWrapper scrollable padded>
      <BackButton style={{ marginBottom: 24 }} fallback="/profile"/>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <AppIcon icon={Bell} size={22} color={colors.text} strokeWidth={2.4} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{t.notifications.title}</Text>
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: colors.text, fontSize: 15 }}>{t.notifications.toggleLabel}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              {t.notifications.toggleDesc}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            disabled={loading}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={enabled ? '#fff' : colors.textTertiary}
          />
        </View>
      </Card>

      <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 12 }}>Programme des rappels</Text>

      {PWA_TIMES.map((time, index) => (
        <View key={`${time.hour}-${time.minute}`} style={[styles.timeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ marginRight: 12 }}>
            <AppIcon
              icon={time.icon}
              size={20}
              color={colors.primary}
              strokeWidth={2.4}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: colors.text }}>{reminderLabels[index]}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              Tous les jours à {time.hour.toString().padStart(2, '0')}h{time.minute.toString().padStart(2, '0')}
            </Text>
          </View>
          <View style={[styles.dot, { backgroundColor: enabled ? '#10B981' : colors.border }]} />
        </View>
      ))}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  timeRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
