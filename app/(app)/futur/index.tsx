import { useEffect } from 'react';
import { router } from 'expo-router';

/** Redirige vers l'onglet Voyance dans le BottomTab */
export default function FuturRedirect() {
  useEffect(() => {
    router.replace('/(app)/(tabs)/ai');
  }, []);
  return null;
}
