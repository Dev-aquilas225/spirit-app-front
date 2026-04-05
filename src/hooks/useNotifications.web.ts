import { NotificationService } from '../services/notification.service';
import { StorageService } from '../services/storage.service';
import { STORAGE_KEYS } from '../utils/constants';

export function useNotifications() {
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

