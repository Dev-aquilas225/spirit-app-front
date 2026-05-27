import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';

/**
 * Point d'entrée — affiche le splash 5s puis redirige selon l'état d'auth.
 * Le splash gère lui-même la redirection vers /onboarding.
 * Si l'utilisateur est déjà authentifié, on saute le splash et on va directement à /home.
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
      // Utilisateur déjà connecté → home directement
      router.replace('/dashboard');
    } else {
      // Nouvel utilisateur → splash (qui redirige vers /onboarding après 5s)
      router.replace('/splash');
    }
  }, [isInitialized, isAuthenticated]);

  return null;
}
