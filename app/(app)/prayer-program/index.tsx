import { useEffect } from 'react';
import { router } from 'expo-router';

/** Redirige vers l'onglet Prière dans le BottomTab */
export default function PrayerProgramRedirect() {
  useEffect(() => {
    router.replace('/(app)/(tabs)/prayers');
  }, []);
  return null;
}
