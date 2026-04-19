import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { AuthGuard } from '../../src/components/auth/AuthGuard';
import { useSubscriptionStore } from '../../src/store/subscription.store';

/**
 * App Layout — Toutes les routes sous (app) sont protégées par AuthGuard.
 * Vérifie l'expiration de l'abonnement et envoie une notification 7 jours avant.
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
    // Envoyer une notification locale si l'abonnement expire dans ≤ 7 jours
    if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
      scheduleExpiryNotification(daysUntilExpiry);
    }
  }, [isActive, daysUntilExpiry]);

  return (
    <AuthGuard>
      <Stack screenOptions={{
        headerShown: false,
        animation: 'ios',
        animationDuration: 320,
        gestureEnabled: true,
      }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade', animationDuration: 300, gestureEnabled: false }} />
        <Stack.Screen name="complete-profile" options={{ animation: 'fade', animationDuration: 350, gestureEnabled: false }} />
        {/* Push screens — slide from right */}
        <Stack.Screen name="consultation/index" />
        <Stack.Screen name="consultation/my-consultations" />
        <Stack.Screen name="formations/index" />
        <Stack.Screen name="formations/[id]" />
        <Stack.Screen name="formations/reader/[id]" />
        <Stack.Screen name="dreams/index" />
        <Stack.Screen name="prayer-program/index" options={{ animation: 'slide_from_right', animationDuration: 320 }} />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="referral/index" />
        <Stack.Screen name="support/index" />
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="legal/privacy" />
        <Stack.Screen name="accompagnements/index" />
        <Stack.Screen name="accompagnements/[id]" />
        <Stack.Screen name="prophet/index" />
        {/* Modales — slide from bottom */}
        <Stack.Screen name="consultation/form" options={{ animation: 'slide_from_bottom', animationDuration: 350 }} />
        <Stack.Screen name="subscription/index" options={{ animation: 'slide_from_bottom', animationDuration: 380 }} />
        <Stack.Screen name="subscription/payment" options={{ animation: 'slide_from_bottom', animationDuration: 350 }} />
        <Stack.Screen name="subscription/success" options={{ animation: 'fade', animationDuration: 400 }} />
        <Stack.Screen name="subscription/failure" options={{ animation: 'fade', animationDuration: 400 }} />
        <Stack.Screen name="subscription/history" options={{ animation: 'slide_from_bottom', animationDuration: 350 }} />
        <Stack.Screen name="subscription/manage" options={{ animation: 'slide_from_bottom', animationDuration: 350 }} />
      </Stack>
    </AuthGuard>
  );
}

async function scheduleExpiryNotification(daysLeft: number) {
  try {
    if (Platform.OS === 'web') {
      if (Notification.permission === 'granted') {
        new Notification('Oracle Plus — Abonnement', {
          body: `Votre abonnement Premium expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}. Renouvelez pour ne pas perdre vos accès.`,
          icon: '/icon.png',
        });
      }
      return;
    }
    const Notifications = (await import('expo-notifications')).default;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Oracle Plus — Abonnement',
        body: `Votre abonnement Premium expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}. Renouvelez pour ne pas perdre vos accès.`,
        data: { screen: '/(app)/subscription' },
      },
      trigger: null, // immédiat
    });
  } catch {}
}
