import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationService } from '../services/notification.service';
import { StorageService } from '../services/storage.service';
import { STORAGE_KEYS } from '../utils/constants';

export function useNotifications() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Écouter les notifications reçues en premier plan
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification reçue:', notification.request.content.title);
    });

    // Écouter les interactions avec les notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification cliquée:', response.notification.request.content.title);
      // TODO: naviguer vers l'écran approprié selon le type de notification
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
