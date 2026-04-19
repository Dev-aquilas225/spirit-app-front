/**
 * formations/[id].tsx
 *
 * Cet écran n'est plus utilisé directement : la vue détail est désormais
 * gérée inline dans formations/index.tsx (pattern identique à la bibliothèque).
 *
 * On redirige immédiatement vers l'index pour éviter tout accès orphelin
 * (lien partagé, deep link, historique web...).
 */
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function FormationDetailRedirect() {
  useEffect(() => {
    router.replace('/(app)/formations');
  }, []);

  return null;
}
