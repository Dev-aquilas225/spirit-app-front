/**
 * useForceNotifications — demande la permission push au démarrage
 * et détecte si les notifications sont désactivées à chaque reprise de l'app.
 *
 * Mobile/natif : planifie les notifications locales Expo (3x/jour).
 * Web : s'abonne au push VAPID et enregistre la subscription sur le backend.
 * Dans les deux cas : si la permission est refusée/révoquée, expose `notifBlocked`
 * pour afficher une bannière de rappel.
 */
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';
import { http } from '../services/http.client';
import { Env } from '../utils/env';

const ASKED_KEY   = '@spirit/push_asked_v2';
const BLOCKED_KEY = '@spirit/push_blocked';

/** Vérifie si les notifications sont actuellement bloquées */
async function checkBlocked(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'denied';
  }
  try {
    const Notifs = await import('expo-notifications');
    const perms = await Notifs.getPermissionsAsync() as any;
    // granted=false + canAskAgain=false → permission définitivement refusée
    return perms.granted === false && perms.canAskAgain === false;
  } catch {
    return false;
  }
}

export function useForceNotifications(isAuthenticated: boolean) {
  const [notifBlocked, setNotifBlocked] = useState(false);

  // Vérification initiale + à chaque retour au premier plan
  useEffect(() => {
    if (!isAuthenticated) return;

    async function verify() {
      const blocked = await checkBlocked();
      setNotifBlocked(blocked);
      await StorageService.set(BLOCKED_KEY, blocked);
    }

    verify();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') verify();
    });
    return () => sub.remove();
  }, [isAuthenticated]);

  // Demande initiale de permission (une seule fois)
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
          }
          await StorageService.set(ASKED_KEY, true);
          setNotifBlocked(!granted);
        } else {
          // ── Web : Push VAPID ───────────────────────────────────────────────
          if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

          const permission = await Notification.requestPermission();
          await StorageService.set(ASKED_KEY, true);

          if (permission !== 'granted') {
            setNotifBlocked(permission === 'denied');
            return;
          }

          const reg = await navigator.serviceWorker.ready;

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

          const subJson = sub.toJSON() as {
            endpoint: string;
            keys: { p256dh: string; auth: string };
          };
          await http.post('/push/subscribe', subJson).catch(() => null);
          setNotifBlocked(false);
        }
      } catch {
        // Silencieux — ne jamais bloquer l'app
      }
    }

    ask();
  }, [isAuthenticated]);

  return { notifBlocked };
}

/** Convertit une clé VAPID base64url en Uint8Array pour PushManager.subscribe */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
