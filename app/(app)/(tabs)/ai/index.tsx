import { useEffect } from 'react';
import { router } from 'expo-router';

export default function AITab() {
  useEffect(() => {
    router.replace('/futur');
  }, []);

  return null;
}
