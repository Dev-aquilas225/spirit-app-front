import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Bell, Moon, Sun, Sunrise, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { useNotifications } from '../../../src/hooks/useNotifications';
import { ScreenWrapper } from '../../../src/components/common/ScreenWrapper';
import { Card } from '../../../src/components/common/Card';
import { BackButton } from '../../../src/components/common/BackButton';
import { AppIcon } from '../../../src/components/common/AppIcon';

const REMINDERS = [
  { hour: 5,  minute: 45, icon: Sunrise, label: 'Prière du matin',                  sub: 'Tous les jours à 05h45' },
  { hour: 13, minute: 0,  icon: Sun,     label: 'Message de réconfort',              sub: 'Tous les jours à 13h00' },
  { hour: 21, minute: 0,  icon: Moon,    label: 'Prière du soir',                    sub: 'Tous les jours à 21h00' },
];

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { enableNotifications, disableNotifications, isEnabled } = useNotifications();
  const [enabled, setEnabled]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => { isEnabled().then(setEnabled); }, []);

  async function handleToggle(value: boolean) {
    setLoading(true);
    setFeedback(null);
    try {
      if (value) {
        // Web : demander permission + s'abonner au push VAPID
        if (Platform.OS === 'web') {
          if (typeof Notification === 'undefined') {
            setFeedback({ type: 'err', msg: 'Notifications non supportées sur ce navigateur.' });
            setLoading(false); return;
          }
          if (Notification.permission === 'denied') {
            setFeedback({ type: 'err', msg: 'Notifications bloquées. Autorisez-les dans les paramètres du navigateur (icône 🔒 dans la barre d\'adresse).' });
            setLoading(false); return;
          }
        }
        const granted = await enableNotifications();
        setEnabled(granted);
        setFeedback(granted
          ? { type: 'ok', msg: 'Notifications activées ! Vous recevrez vos rappels quotidiens.' }
          : { type: 'err', msg: 'Permission refusée. Autorisez les notifications dans les paramètres.' }
        );
      } else {
        await disableNotifications();
        setEnabled(false);
        setFeedback({ type: 'ok', msg: 'Notifications désactivées.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'err', msg: e?.message ?? 'Erreur lors de la modification.' });
    }
    setLoading(false);
  }

  // Test : envoyer une notification immédiate
  async function handleTest() {
    setLoading(true);
    setFeedback(null);
    try {
      if (Platform.OS === 'web') {
        if (Notification.permission !== 'granted') {
          setFeedback({ type: 'err', msg: 'Activez d\'abord les notifications.' });
          setLoading(false); return;
        }
        const reg = await navigator.serviceWorker?.ready;
        await reg?.showNotification('Oracle Plus — Test', {
          body: 'Vos notifications fonctionnent correctement ! 🙏',
          icon: '/icon-192.png',
          badge: '/favicon.png',
          vibrate: [200, 100, 200],
          tag: `test-${Date.now()}`,
        } as any);
        setFeedback({ type: 'ok', msg: 'Notification de test envoyée !' });
      } else {
        const { sendLocal } = useNotifications();
        // sendLocal est une fonction statique
        const Notifs = require('expo-notifications');
        await Notifs.scheduleNotificationAsync({
          content: { title: 'Oracle Plus — Test', body: 'Vos notifications fonctionnent ! 🙏', sound: true },
          trigger: null,
        });
        setFeedback({ type: 'ok', msg: 'Notification de test envoyée !' });
      }
    } catch (e: any) {
      setFeedback({ type: 'err', msg: e?.message ?? 'Erreur lors du test.' });
    }
    setLoading(false);
  }

  return (
    <ScreenWrapper scrollable padded>
      <BackButton style={{ marginBottom: 24 }} fallback="/profile" />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <AppIcon icon={Bell} size={22} color={colors.text} strokeWidth={2.4} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>Notifications</Text>
      </View>

      {/* Toggle principal */}
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>
              Activer les notifications
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 3, lineHeight: 18 }}>
              Recevez vos rappels de prière, messages de réconfort et alertes Oracle Plus
            </Text>
          </View>
          {loading
            ? <ActivityIndicator color={colors.primary} />
            : <Switch
                value={enabled}
                onValueChange={handleToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
          }
        </View>
      </Card>

      {/* Feedback */}
      {feedback && (
        <View style={[s.feedback, {
          backgroundColor: feedback.type === 'ok' ? '#10B98115' : '#EF444415',
          borderColor: feedback.type === 'ok' ? '#10B98140' : '#EF444440',
        }]}>
          <AppIcon
            icon={feedback.type === 'ok' ? CheckCircle : AlertCircle}
            size={16}
            color={feedback.type === 'ok' ? '#10B981' : '#EF4444'}
            strokeWidth={2.2}
          />
          <Text style={{ color: feedback.type === 'ok' ? '#10B981' : '#EF4444', fontSize: 13, flex: 1, lineHeight: 18 }}>
            {feedback.msg}
          </Text>
        </View>
      )}

      {/* Programme des rappels */}
      <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: 8, fontSize: 15 }}>
        Programme des rappels quotidiens
      </Text>

      {REMINDERS.map((r) => (
        <View key={r.hour} style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[s.iconWrap, { backgroundColor: colors.primary + '18' }]}>
            <AppIcon icon={r.icon} size={18} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>{r.label}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{r.sub}</Text>
          </View>
          <View style={[s.dot, { backgroundColor: enabled ? '#10B981' : colors.border }]} />
        </View>
      ))}

      {/* Bouton test */}
      <TouchableOpacity
        style={[s.testBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handleTest}
        disabled={loading}
        activeOpacity={0.8}
      >
        <AppIcon icon={Bell} size={16} color={colors.primary} strokeWidth={2.2} />
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
          Envoyer une notification de test
        </Text>
      </TouchableOpacity>

      {/* Info navigateur web */}
      {Platform.OS === 'web' && (
        <View style={[s.info, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
            💡 <Text style={{ fontWeight: '700' }}>Sur mobile :</Text> installez l'application (bouton "Ajouter à l'écran d'accueil") pour recevoir les notifications même quand l'app est fermée.
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dot:      { width: 10, height: 10, borderRadius: 5 },
  testBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  info:     { padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 12 },
});
