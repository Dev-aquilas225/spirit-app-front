import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';
import { StorageService } from '../src/services/storage.service';
import { STORAGE_KEYS } from '../src/utils/constants';

/**
 * Point d'entrée — attend que l'auth soit initialisée, puis :
 * - Si onboarding jamais vu → /onboarding
 * - Si authentifié → /home
 * - Sinon → /home (LoginModal s'affiche si besoin)
 */
export default function Index() {
  const isInitialized   = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initialize      = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize().catch(() => {});
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    redirect();
  }, [isInitialized, isAuthenticated]);

  async function redirect() {
    const onboardingDone = await StorageService.get<boolean>(STORAGE_KEYS.ONBOARDING_DONE);
    if (!onboardingDone && !isAuthenticated) {
      router.replace('/onboarding');
    } else {
      router.replace('/home');
    }
  }

  return null;
}
