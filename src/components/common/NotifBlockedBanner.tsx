/**
 * NotifBlockedBanner — s'affiche si les notifications ne sont pas actives.
 * Sur web : tente de demander la permission directement via Notification.requestPermission().
 * Sur natif : ouvre les paramètres système (seule option après refus).
 */
import React, { useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell, X } from 'lucide-react-native';
import { AppIcon } from './AppIcon';

interface Props {
  visible: boolean;
  /** Appelé après activation réussie pour masquer la bannière */
  onEnabled?: () => void;
}

export function NotifBlockedBanner({ visible, onEnabled }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed) return null;

  async function handleActivate() {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !('Notification' in window)) return;

      const current = Notification.permission;

      if (current === 'denied') {
        // Déjà refusé définitivement — seuls les paramètres navigateur peuvent débloquer
        alert("Les notifications ont été bloquées. Cliquez sur l'icône 🔒 dans la barre d'adresse pour les réactiver.");
        return;
      }

      // 'default' — demander directement
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      // S'abonner au push VAPID si disponible
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const reg = await navigator.serviceWorker.ready;
          const vapidKey: string =
            ((window as any).__ENV__?.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '') ||
            (process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '');

          if (vapidKey) {
            const padding = '='.repeat((4 - (vapidKey.length % 4)) % 4);
            const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
            const rawData = atob(base64);
            const appServerKey = Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));

            let sub = await reg.pushManager.getSubscription();
            if (!sub) {
              sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: appServerKey as BufferSource,
              });
            }

            // Enregistrer côté backend
            const subJson = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
            const raw = localStorage.getItem('@spirit/auth_token');
            const token = raw ? JSON.parse(raw) : null;
            const apiBase =
              ((window as any).__ENV__?.EXPO_PUBLIC_API_BASE_URL ?? '') ||
              (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4200');
            await fetch(`${apiBase}/api/v1/push/subscribe`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(subJson),
            }).catch(() => null);
          }
        }
      } catch {
        // Silencieux — la permission est accordée même si le push échoue
      }

      onEnabled?.();
      setDismissed(true);
      return;
    }

    // Natif iOS / Android — ouvrir les paramètres système
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  return (
    <View style={s.banner}>
      <AppIcon icon={Bell} size={16} color="#F59E0B" strokeWidth={2.5} />
      <View style={{ flex: 1 }}>
        <Text style={s.title}>Notifications désactivées</Text>
        <Text style={s.sub}>Activez-les pour recevoir vos prières et rappels quotidiens.</Text>
      </View>
      <TouchableOpacity style={s.btn} onPress={handleActivate} activeOpacity={0.8}>
        <Text style={s.btnTxt}>Activer</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setDismissed(true)} style={s.close}>
        <AppIcon icon={X} size={14} color="rgba(245,158,11,0.7)" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,158,11,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: { fontSize: 12, fontWeight: '800', color: '#F59E0B' },
  sub:   { fontSize: 11, color: 'rgba(245,158,11,0.75)', marginTop: 1 },
  btn:   { backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnTxt:{ fontSize: 12, fontWeight: '800', color: '#1A1A3E' },
  close: { padding: 4 },
});
