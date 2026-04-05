import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';
import { StorageService } from '../src/services/storage.service';
import { STORAGE_KEYS } from '../src/utils/constants';

/**
 * Écran d'entrée — Redirige vers :
 * - (auth)/splash si première visite
 * - (auth)/login si non connecté
 * - (app)/home si connecté
 */
export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;

    async function redirect() {
      if (isAuthenticated) {
        router.replace('/(app)/(tabs)/home');
        return;
      }

      const onboardingDone = await StorageService.get<boolean>(STORAGE_KEYS.ONBOARDING_DONE);
      if (!onboardingDone) {
        router.replace('/(auth)/splash');
      } else {
        router.replace('/(auth)/login');
      }
    }

    redirect();
  }, [isInitialized, isAuthenticated]);

  return null;
}
