import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { useAuthStore }  from '../src/store/auth.store';
import { useThemeStore } from '../src/store/theme.store';
import { PWAInstallBanner } from '../src/components/common/PWAInstallBanner';

/**
 * Root Layout — Point d'entrée de l'application.
 * • Initialise la session auth et le thème.
 * • Enregistre le Service Worker sur web.
 * • Affiche le bandeau PWA d'installation en haut de chaque écran web.
 */
export default function RootLayout() {
  const initializeAuth  = useAuthStore((s) => s.initialize);
  const initializeTheme = useThemeStore((s) => s.initialize);
  const language = useAuthStore((s) => s.user?.language ?? 'fr');

  useEffect(() => {
    initializeAuth();
    initializeTheme();
  }, []);

  // Enregistrement du Service Worker (fallback JS si +html.tsx n'est pas actif en dev)
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
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Bandeau PWA — affiché uniquement sur web quand l'app est installable */}
        <PWAInstallBanner />

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="auth" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
