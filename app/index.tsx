import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';

/**
 * Écran d'entrée — Accès immédiat au dashboard.
 * L'utilisateur arrive directement sur le home sans login forcé.
 * La connexion est demandée uniquement au moment du paiement.
 */
export default function Index() {
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;
    router.replace('/(app)/(tabs)/home');
  }, [isInitialized]);

  return null;
}
