import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as ExpoNotifications from 'expo-notifications';
import { Bell, BellOff, CheckCircle, Moon, Sunrise, Sunset } from 'lucide-react-native';
import { AppIcon } from '../../src/components/common/AppIcon';
import { StorageService } from '../../src/services/storage.service';
import { STORAGE_KEYS } from '../../src/utils/constants';

async function requestPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (!('Notification' in window)) return false;
      if (Notification.permission === 'granted') return true;
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
    // Native iOS / Android
    const { status: existing } = await ExpoNotifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await ExpoNotifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

const REMINDERS = [
  { icon: Sunrise, time: '08:00',      label: 'Prière du matin' },
  { icon: Bell,    time: '13:00',      label: 'Message spirituel du jour' },
  { icon: Sunset,  time: '21:00',      label: 'Prière du soir' },
  { icon: Moon,    time: 'Chaque jour', label: 'Guidance & rappels' },
];

export default function EnableNotificationsScreen() {
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(false);

  async function handleEnable() {
    setLoading(true);
    const ok = await requestPermission();
    await StorageService.set(STORAGE_KEYS.NOTIFICATIONS_ASKED, true);
    await StorageService.set(STORAGE_KEYS.NOTIFICATIONS_ENABLED, ok);
    setLoading(false);
    if (ok) {
      setGranted(true);
      setTimeout(() => router.replace('/(auth)/login'), 1400);
    } else {
      router.replace('/(auth)/login');
    }
  }

  async function handleSkip() {
    await StorageService.set(STORAGE_KEYS.NOTIFICATIONS_ASKED, true);
    router.replace('/(auth)/login');
  }

  // ─── Écran de confirmation ────────────────────────────────────────────────
  if (granted) {
    return (
      <View style={[s.container, { justifyContent: 'center' }]}>
        <AppIcon icon={CheckCircle} size={80} color="#C9A84C" strokeWidth={1.4} />
        <Text style={[s.title, { marginTop: 24 }]}>Notifications activées !</Text>
        <Text style={s.subtitle}>
          Vous recevrez vos prières et messages spirituels chaque jour.
        </Text>
      </View>
    );
  }

  // ─── Écran principal ──────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      {/* Étoiles décoratives */}
      {[...Array(12)].map((_, i) => (
        <View
          key={i}
          style={[
            s.star,
            { top: (i * 61) % 750, left: (i * 89) % 370, opacity: 0.08 + (i % 4) * 0.05 },
          ]}
        />
      ))}

      {/* Icône cloche */}
      <View style={s.bellWrap}>
        <AppIcon icon={Bell} size={54} color="#C9A84C" strokeWidth={1.6} />
      </View>

      <Text style={s.title}>Ne manquez rien !</Text>
      <Text style={s.subtitle}>
        Activez les notifications pour recevoir vos prières et messages spirituels quotidiens.
      </Text>

      {/* Aperçu des rappels */}
      <View style={s.remindersBox}>
        {REMINDERS.map((item, idx) => (
          <View
            key={item.label}
            style={[s.reminderRow, idx === REMINDERS.length - 1 && { borderBottomWidth: 0 }]}
          >
            <View style={s.reminderIcon}>
              <AppIcon icon={item.icon} size={15} color="#C9A84C" strokeWidth={2.2} />
            </View>
            <Text style={s.reminderLabel}>{item.label}</Text>
            <Text style={s.reminderTime}>{item.time}</Text>
          </View>
        ))}
      </View>

      {/* CTA principal */}
      <TouchableOpacity
        style={s.btnPrimary}
        onPress={handleEnable}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <AppIcon icon={Bell} size={18} color="#fff" strokeWidth={2.4} />
            <Text style={s.btnPrimaryText}>Activer les notifications</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Lien secondaire */}
      <TouchableOpacity style={s.btnSkip} onPress={handleSkip} activeOpacity={0.7}>
        <AppIcon icon={BellOff} size={14} color="rgba(255,255,255,0.3)" strokeWidth={2} />
        <Text style={s.btnSkipText}>Plus tard</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D2B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  bellWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(201,168,76,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#C9A84C',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.62)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  remindersBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.14)',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  reminderIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderLabel: {
    flex: 1,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '500',
  },
  reminderTime: {
    color: '#C9A84C',
    fontSize: 12,
    fontWeight: '700',
  },
  btnPrimary: {
    width: '100%',
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  btnSkip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  btnSkipText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
  },
});
