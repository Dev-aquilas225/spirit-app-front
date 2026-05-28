/**
 * useForceNotifications — demande la permission push au démarrage.
 *
 * Mobile/natif : planifie les notifications locales Expo (3x/jour).
 * Web : s'abonne au push VAPID et enregistre la subscription sur le backend
 *       pour recevoir les notifications automatiques toutes les 5h.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';
import { http } from '../services/http.client';
import { Env } from '../utils/env';

const ASKED_KEY = '@spirit/push_asked_v2';

export function useForceNotifications(isAuthenticated: boolean) {
  useEffect(() => {
    if (!isAuthenticated) return;

    async function ask() {
      try {
        const alreadyDone = await StorageService.get<boolean>(ASKED_KEY);
        if (alreadyDone) return;

        // Délai pour ne pas bloquer le rendu initial
        await new Promise((r) => setTimeout(r, 2500));

        if (Platform.OS !== 'web') {
          // ── Natif (iOS / Android) ──────────────────────────────────────────
          const granted = await NotificationService.requestPermissions();
          if (granted) {
            await NotificationService.scheduleDailyNotifications();
            await StorageService.set(ASKED_KEY, true);
          }
        } else {
          // ── Web : Push VAPID ───────────────────────────────────────────────
          if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;

          const reg = await navigator.serviceWorker.ready;

          // Clé publique VAPID depuis env runtime
          const vapidPublicKey: string =
            Env.VAPID_PUBLIC_KEY?.() ??
            (typeof window !== 'undefined'
              ? (window as any).__ENV__?.EXPO_PUBLIC_VAPID_PUBLIC_KEY
              : '') ??
            '';

          if (!vapidPublicKey) return;

          const appServerKey = urlBase64ToUint8Array(vapidPublicKey);

          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: appServerKey as BufferSource,
            });
          }

          // Enregistrer la subscription sur le backend
          const subJson = sub.toJSON() as {
            endpoint: string;
            keys: { p256dh: string; auth: string };
          };
          await http.post('/push/subscribe', subJson).catch(() => null);

          await StorageService.set(ASKED_KEY, true);
        }
      } catch {
        // Silencieux — ne jamais bloquer l'app
      }
    }

    ask();
  }, [isAuthenticated]);
}

/** Convertit une clé VAPID base64url en Uint8Array pour PushManager.subscribe */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
