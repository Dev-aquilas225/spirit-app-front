/**
 * Notification Service — Stub Web
 * expo-notifications ne fonctionne pas sur web (pas de localStorage SSR).
 * Les notifications web passent par le Service Worker (public/service-worker.js).
 */

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  async scheduleDailyNotifications(): Promise<void> {
    // Sur web, les notifications sont gérées par le Service Worker
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    console.log('[NotificationService] Web : notifications gérées par SW');
  },

  async cancelAllNotifications(): Promise<void> {
    // Pas d'API de suppression directe des notifs planifiées sur web
  },

  async sendLocalNotification(title: string, body: string): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/assets/images/icon.png' });
    }
  },

  async getScheduledNotifications(): Promise<[]> {
    return [];
  },
};
