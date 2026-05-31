import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { NotificationService } from '../services/notification.service';
import { StorageService } from '../services/storage.service';
import { STORAGE_KEYS } from '../utils/constants';

/** Résout l'URL cible depuis les données d'une notification cliquée */
function resolveNotifUrl(data?: Record<string, any>): string {
  if (!data) return '/dashboard';
  if (data.url) return data.url as string;
  // Mapping type → route
  const typeMap: Record<string, string> = {
    prayer:       '/prayers',
    consultation: '/consultation',
    subscription: '/subscription',
    formation:    '/formations',
    credits:      '/subscription',
    system:       '/dashboard',
  };
  return typeMap[data.type as string] ?? '/dashboard';
}

export function useNotifications() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    notificationListener.current = Notifications.addNotificationReceivedListener((_notification) => {
      // Notification reçue en premier plan — pas d'action nécessaire
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, any> | undefined;
      const target = resolveNotifUrl(data);
      try { router.push(target as any); } catch { /* navigation non disponible */ }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  async function enableNotifications(): Promise<boolean> {
    const granted = await NotificationService.requestPermissions();
    if (granted) {
      await NotificationService.scheduleDailyNotifications();
      await StorageService.set(STORAGE_KEYS.NOTIFICATIONS_ENABLED, true);

      // Enregistrer le token Expo Push sur le backend (natif uniquement)
      if (Platform.OS !== 'web') {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          const { http } = await import('../services/http.client');
          await http.post('/push/subscribe', { endpoint: tokenData.data, type: 'expo' }).catch(() => {});
        } catch { /* non bloquant */ }
      }
    }
    return granted;
  }

  async function disableNotifications(): Promise<void> {
    await NotificationService.cancelAllNotifications();
    await StorageService.set(STORAGE_KEYS.NOTIFICATIONS_ENABLED, false);
  }

  async function isEnabled(): Promise<boolean> {
    return (await StorageService.get<boolean>(STORAGE_KEYS.NOTIFICATIONS_ENABLED)) ?? false;
  }

  return {
    enableNotifications,
    disableNotifications,
    isEnabled,
    sendLocal: NotificationService.sendLocalNotification,
  };
}
