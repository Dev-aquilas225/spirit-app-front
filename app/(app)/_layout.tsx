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
