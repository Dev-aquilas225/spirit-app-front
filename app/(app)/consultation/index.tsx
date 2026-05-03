import { Redirect } from 'expo-router';

// La section Consultation & Orientation ouvre directement le chat avec le Prophète Georges
// (chatType: 'consultation' — prompt Prophète Georges complet)
export default function ConsultationIndex() {
  return <Redirect href="/(app)/consultation/chat" />;
}
