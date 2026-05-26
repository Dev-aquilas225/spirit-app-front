import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { useAuthStore }  from '../src/store/auth.store';
import { useThemeStore } from '../src/store/theme.store';
import { PWAInstallBanner } from '../src/components/common/PWAInstallBanner';
import { NudgeToast } from '../src/components/common/NudgeToast';
import { useSmartNudges } from '../src/hooks/useSmartNudges';

/**
 * Root Layout — Point d'entrée de l'application.
 * • Initialise la session auth et le thème.
 * • Enregistre le Service Worker sur web.
 * • Affiche le bandeau PWA d'installation en haut de chaque écran web.
 */
function NudgeLayer() {
  useSmartNudges();
  return <NudgeToast />;
}

export default function RootLayout() {
  // initialize() est lancé depuis index.tsx (splash) pour éviter le double appel.
  // On initialise uniquement le thème ici.
  const initializeTheme = useThemeStore((s) => s.initialize);
  const initializeAuth  = useAuthStore((s) => s.initialize);
  const language = useAuthStore((s) => s.user?.language ?? 'fr');

  useEffect(() => {
    initializeTheme();
    // Appel de secours : si l'utilisateur arrive directement sur une route profonde
    // sans passer par le splash, initialize() doit quand même être appelé.
    initializeAuth().catch(() => {});
  }, []);

  // Enregistrement du Service Worker + rechargement automatique lors d'une mise à jour
  useEffect(() => {
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .catch(() => {
          // Silencieux si SW indisponible en développement
        });

      // Recharger automatiquement quand le nouveau SW prend le contrôle
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_UPDATED') {
          window.location.reload();
        }
      });
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#1A1A3E' }}>
      <SafeAreaProvider>
        <PWAInstallBanner />
        {/* Smart nudges — non-blocking behavioral toasts */}
        <NudgeLayer />

        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 300,
            // Fond uniforme pendant les transitions — évite l'éclair bleu/blanc
            contentStyle: { backgroundColor: '#1A1A3E' },
          }}
        >
          <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: '#1A1A3E' } }} />
          <Stack.Screen name="(auth)" options={{ contentStyle: { backgroundColor: '#1A1A3E' } }} />
          <Stack.Screen name="(app)" options={{ contentStyle: { backgroundColor: '#1A1A3E' } }} />
          <Stack.Screen name="auth" options={{ contentStyle: { backgroundColor: '#1A1A3E' } }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
