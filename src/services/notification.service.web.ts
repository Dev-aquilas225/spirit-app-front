/**
 * Notification Service — Web Push via VAPID
 * Les notifications sont envoyées par le backend (NestJS) à 6h et 18h.
 * Le Service Worker les affiche via l'événement 'push'.
 *
 * Flow :
 *  1. requestPermissions()         → demande la permission Notification
 *  2. scheduleDailyNotifications() → s'abonne au push + enregistre la subscription
 *     côté backend (POST /push/subscribe)
 *  3. Backend envoie les push à 6h et 18h via cron + web-push
 *  4. SW reçoit l'événement 'push' → showNotification()
 */

const API_BASE = `${process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4200'}/api/v1`;
const VAPID_PUBLIC_KEY =
  process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ??
  'BKTtn0UqR8p4hYnDIuNZIbSQ7EQjQuczKSGB6YTCcdMrIlGm0inM14fhL2KGufB9Mihr1SOEzWIJJDlwwHr7lC4';

/** Convertit une clé VAPID base64url en Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window)) return false;

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    return permission === 'granted';
  },

  async scheduleDailyNotifications(): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      // 1. Récupérer le Service Worker actif
      const registration = await navigator.serviceWorker.ready;

      // 2. Vérifier si on est déjà abonné
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        // Déjà abonné — on s'assure que le backend est bien notifié
        await NotificationService._registerWithBackend(existing);
        console.log('[Push] Déjà abonné, subscription confirmée côté backend');
        return;
      }

      // 3. S'abonner
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // 4. Enregistrer la subscription côté backend
      await NotificationService._registerWithBackend(subscription);
      console.log('[Push] Abonnement web push enregistré');
    } catch (err) {
      console.error('[Push] Échec de l\'abonnement web push:', err);
    }
  },

  async _registerWithBackend(subscription: PushSubscription): Promise<void> {
    try {
      const json = subscription.toJSON();
      await fetch(`${API_BASE}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: json.keys?.p256dh ?? '',
            auth: json.keys?.auth ?? '',
          },
        }),
      });
    } catch (err) {
      console.error('[Push] Échec enregistrement backend:', err);
    }
  },

  async cancelAllNotifications(): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Notifier le backend avant de se désabonner
        await fetch(`${API_BASE}/push/unsubscribe`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
        console.log('[Push] Désabonnement effectué');
      }
    } catch (err) {
      console.error('[Push] Échec désabonnement:', err);
    }
  },

  async sendLocalNotification(title: string, body: string): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/favicon.png',
        });
      } catch {
        // Fallback Notification API directe
        new Notification(title, { body, icon: '/icon-192.png' });
      }
    }
  },

  async getScheduledNotifications(): Promise<[]> {
    return [];
  },
};
