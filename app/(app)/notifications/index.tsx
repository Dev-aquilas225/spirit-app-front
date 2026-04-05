import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Bell, Moon, Sun, Sunrise } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { useNotifications } from '../../../src/hooks/useNotifications';
import { ScreenWrapper } from '../../../src/components/common/ScreenWrapper';
import { Card } from '../../../src/components/common/Card';
import { BackButton } from '../../../src/components/common/BackButton';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { NOTIFICATION_TIMES } from '../../../src/utils/constants';

export default function NotificationsScreen() {
  const { colors, spacing } = useTheme();
  const { enableNotifications, disableNotifications, isEnabled } = useNotifications();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

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
      <BackButton style={{ marginBottom: 24 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <AppIcon icon={Bell} size={22} color={colors.text} strokeWidth={2.4} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>Notifications</Text>
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: colors.text, fontSize: 15 }}>Activer les notifications</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              Recevez vos prières et messages quotidiens
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

      <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 12 }}>Horaires des rappels</Text>

      {NOTIFICATION_TIMES.map((time) => (
        <View key={time.label} style={[styles.timeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ marginRight: 12 }}>
            <AppIcon
              icon={time.hour === 8 ? Sunrise : time.hour === 13 ? Sun : Moon}
              size={20}
              color={colors.primary}
              strokeWidth={2.4}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: colors.text }}>{time.label}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {time.hour.toString().padStart(2, '0')}:{time.minute.toString().padStart(2, '0')} chaque jour
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
