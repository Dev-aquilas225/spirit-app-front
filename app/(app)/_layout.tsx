import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useSubscriptionStore } from '../../src/store/subscription.store';
import { useAuthStore } from '../../src/store/auth.store';
import { useCreditsStore } from '../../src/store/credits.store';
import { useForceNotifications } from '../../src/hooks/useForceNotifications';

/**
 * App Layout — Guard d'authentification global.
 * Tout accès à /(app)/* sans être connecté redirige vers /onboarding.
 */
export default function AppLayout() {
  const loadSubscription = useSubscriptionStore((s) => s.loadSubscription);
  const daysUntilExpiry  = useSubscriptionStore((s) => s.daysUntilExpiry);
  const isActive         = useSubscriptionStore((s) => s.isActive);
  const isAuthenticated  = useAuthStore((s) => s.isAuthenticated);
  const isInitialized    = useAuthStore((s) => s.isInitialized);
  const initCredits      = useCreditsStore((s) => s.init);

  // Forcer la demande de permission push dès la connexion
  useForceNotifications(isAuthenticated);

  // Bloquer l'accès à toute la zone app si non authentifié
  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, isInitialized]);

  useEffect(() => {
    loadSubscription();
    // Charger le solde de crédits depuis le backend (2000 à l'inscription)
    initCredits();
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
      animationDuration: 220,
      gestureEnabled: true,
    }}>
      {/* Tabs principaux */}
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />

      {/* Auth post-login */}
      <Stack.Screen name="complete-profile" options={{ gestureEnabled: false }} />

      {/* Services spirituels */}
      <Stack.Screen name="dreams/index" />
      <Stack.Screen name="futur/index" />
      <Stack.Screen name="prayer-program/index" />
      <Stack.Screen name="prophet/index" />
      <Stack.Screen name="accompagnements/index" />
      <Stack.Screen name="accompagnements/[id]" />
      <Stack.Screen name="accompagnements/chat" />

      {/* Consultation */}
      <Stack.Screen name="consultation/index" />
      <Stack.Screen name="consultation/chat" />
      <Stack.Screen name="consultation/form" />
      <Stack.Screen name="consultation/my-consultations" />

      {/* Abonnement & Paiement */}
      <Stack.Screen name="subscription/index" />
      <Stack.Screen name="subscription/payment" />
      <Stack.Screen name="subscription/callback" options={{ gestureEnabled: false }} />
      <Stack.Screen name="subscription/success" options={{ gestureEnabled: false }} />
      <Stack.Screen name="subscription/failure" />
      <Stack.Screen name="subscription/history" />
      <Stack.Screen name="subscription/manage" />
      <Stack.Screen name="subscription/admin" />

      {/* Partage viral */}
      <Stack.Screen name="viral-share/index" />

      {/* Formations & Bibliothèque */}
      <Stack.Screen name="formations/index" />
      <Stack.Screen name="formations/[id]" />
      <Stack.Screen name="formations/reader/[id]" />
      <Stack.Screen name="formations/admin" />
      <Stack.Screen name="library/reader" />
      <Stack.Screen name="books/admin" />

      {/* Compte & Paramètres */}
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="referral/index" />
      <Stack.Screen name="support/index" />
      <Stack.Screen name="legal/terms" />
      <Stack.Screen name="legal/privacy" />

      {/* Admin */}
      <Stack.Screen name="admin/index" />
      <Stack.Screen name="admin/users" />
      <Stack.Screen name="admin/ai-settings" />
      <Stack.Screen name="admin/books" />
      <Stack.Screen name="admin/credits" />
      <Stack.Screen name="admin/notifications" />
      <Stack.Screen name="admin/viral-shares" />
      <Stack.Screen name="push/admin" />
      {/* Série */}
      <Stack.Screen name="serie/prayer" />
    </Stack>
  );
}

/**
 * Notification de rappel d'expiration d'abonnement.
 * Web : Service Worker push avec vibration. Natif : Expo local notification.
 */
async function schedulePwaNotification(daysLeft: number) {
  const title = '⏳ Oracle Plus — Abonnement bientôt expiré';
  const body  = daysLeft === 1
    ? 'Votre abonnement expire demain. Renouvelez maintenant pour garder votre accès illimité.'
    : `Votre abonnement expire dans ${daysLeft} jours. Renouvelez pour continuer à profiter d'Oracle Plus.`;

  try {
    // ── Natif (iOS / Android) ──────────────────────────────────────────────
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      const { default: Notifs } = await import('expo-notifications');
      await Notifs.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: (Notifs as any).AndroidNotificationPriority?.HIGH,
          data: { url: '/subscription' },
        },
        trigger: null,
      });
      return;
    }

    // ── Web PWA ────────────────────────────────────────────────────────────
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') return;

    const options: NotificationOptions = {
      body,
      icon: '/icon-192.png',
      badge: '/favicon.png',
      tag: 'expiry-reminder',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: '/subscription' },
      actions: [
        { action: 'renew', title: 'Renouveler maintenant' },
        { action: 'dismiss', title: 'Plus tard' },
      ],
    } as any;

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  } catch {
    // Silencieux — ne jamais bloquer l'app
  }
}
