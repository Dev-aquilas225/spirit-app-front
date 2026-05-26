import { useEffect } from 'react';
import { router } from 'expo-router';

// Redirige directement vers le chat de consultation
export default function ConsultationIndex() {
  useEffect(() => {
    router.replace('/consultation/chat');
  }, []);
  return null;
}
