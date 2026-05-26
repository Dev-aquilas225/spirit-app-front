import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';

/**
 * Point d'entrée — attend que l'auth soit initialisée avant de rediriger.
 * Évite le flash de la page home avant que le splash ne s'affiche.
 */
export default function Index() {
  const isInitialized  = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initialize     = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize().catch(() => {});
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated) {
      router.replace('/home');
    } else {
      router.replace('/home'); // home gère le splash + login modal
    }
  }, [isInitialized, isAuthenticated]);

  // Écran noir pendant l'init — même couleur que le fond app
  return null;
}
