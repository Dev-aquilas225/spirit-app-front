import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';

/**
 * Point d'entrée — redirige selon l'état d'auth :
 * - Authentifié → /home
 * - Non authentifié → /onboarding (inscription Google obligatoire)
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
    if (isAuthenticated) {
      router.replace('/home');
    } else {
      router.replace('/onboarding');
    }
  }, [isInitialized, isAuthenticated]);

  return null;
}
