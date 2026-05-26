import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useSubscriptionStore } from '../../src/store/subscription.store';

/**
 * App Layout — Version PWA Web
 * Gère les routes et planifie le test de rappel quotidien pour les navigateurs mobiles.
 */
export default function AppLayout() {
  const loadSubscription = useSubscriptionStore((s) => s.loadSubscription);
  const daysUntilExpiry  = useSubscriptionStore((s) => s.daysUntilExpiry);
  const isActive         = useSubscriptionStore((s) => s.isActive);

  useEffect(() => {
    loadSubscription();
  }, []);

  useEffect(() => {
    if (!isActive) return;
    
    // Déclenchement automatique chaque jour si l'abonnement expire dans ≤ 7 jours
    if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
      schedulePwaNotification(daysUntilExpiry);
    }
  }, [isActive, daysUntilExpiry]);

  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'fade',
      gestureEnabled: true,
      contentStyle: { backgroundColor: '#1A1A3E' },
    }}>
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      <Stack.Screen name="complete-profile" options={{ gestureEnabled: false }} />
      <Stack.Screen name="consultation/index" />
      <Stack.Screen name="consultation/my-consultations" />
      <Stack.Screen name="formations/index" />
      <Stack.Screen name="formations/[id]" />
      <Stack.Screen name="formations/reader/[id]" />
      <Stack.Screen name="formations/admin" />
      <Stack.Screen name="push/admin" />
      <Stack.Screen name="dreams/index" />
      <Stack.Screen name="prayer-program/index" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="referral/index" />
      <Stack.Screen name="support/index" />
      <Stack.Screen name="legal/terms" />
      <Stack.Screen name="legal/privacy" />
      <Stack.Screen name="accompagnements/index" />
      <Stack.Screen name="accompagnements/[id]" />
      <Stack.Screen name="prophet/index" />
      <Stack.Screen name="consultation/form" />
      <Stack.Screen name="subscription/index" />
      <Stack.Screen name="subscription/payment" />
      <Stack.Screen name="subscription/success" />
      <Stack.Screen name="subscription/failure" />
      <Stack.Screen name="subscription/history" />
      <Stack.Screen name="subscription/manage" />
      <Stack.Screen name="missions/index" />
      <Stack.Screen name="admin/index" />
      <Stack.Screen name="admin/users" />
      <Stack.Screen name="admin/ai-settings" />
      <Stack.Screen name="admin/books" />
      <Stack.Screen name="admin/notifications" />
    </Stack>
  );
}

/**
 * Envoie la notification au format PWA Web (Vibration + Son système gérés par le navigateur)
 */
async function schedulePwaNotification(daysLeft: number) {
  try {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;

    // 1. Demander la permission à l'utilisateur si ce n'est pas déjà fait
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const titleText = 'Oracle Plus — Test de rappel';
      const bodyText = `Test de rappel : Renouveler votre abonnement. Votre abonnement expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}.`;

      // 2. Utiliser le Service Worker de la PWA pour envoyer une vraie notification système en arrière-plan
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          registration.showNotification(titleText, {
            body: bodyText,
            icon: '/icon.png',
            badge: '/badge.png',
            tag: 'expiry-reminder-daily',
          } as NotificationOptions);
          return;
        }
      }

      // Fallback si le Service Worker n'est pas encore prêt sur le navigateur
      new Notification(titleText, { body: bodyText, icon: '/icon.png' });
    }
  } catch (error) {
    console.log("Les notifications PWA ne sont pas pleinement supportées sur ce navigateur.");
  }
}
