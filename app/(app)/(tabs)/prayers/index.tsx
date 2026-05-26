import { useEffect } from 'react';
import { router } from 'expo-router';

export default function PrayersTab() {
  useEffect(() => {
    router.replace('/prayer-program');
  }, []);

  return null;
}
