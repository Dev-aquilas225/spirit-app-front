/**
 * Notification Service — Expo Notifications + Firebase simulation
 * En production : configurer Firebase Cloud Messaging.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getTranslations } from '../i18n';
import { StorageService } from './storage.service';
import { NOTIFICATION_TIMES, STORAGE_KEYS } from '../utils/constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async scheduleDailyNotifications(): Promise<void> {
    // Annuler les anciennes notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const hasPermission = await NotificationService.requestPermissions();
    if (!hasPermission) return;

    const language = (await StorageService.get<string>(STORAGE_KEYS.LANGUAGE)) ?? 'fr';
    const t = getTranslations(language);

    const notificationContents = [
      {
        title: t.notifications.pushMorningTitle,
        body: t.notifications.pushMorningBody,
      },
      {
        title: t.notifications.pushMiddayTitle,
        body: t.notifications.pushMiddayBody,
      },
      {
        title: t.notifications.pushEveningTitle,
        body: t.notifications.pushEveningBody,
      },
    ];

    for (let i = 0; i < NOTIFICATION_TIMES.length; i++) {
      const { hour, minute } = NOTIFICATION_TIMES[i];
      const content = notificationContents[i];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    }
  },

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async sendLocalNotification(title: string, body: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  },

  async getScheduledNotifications() {
    return Notifications.getAllScheduledNotificationsAsync();
  },
};
