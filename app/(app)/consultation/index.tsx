import { Redirect } from 'expo-router';
import { PremiumGuard } from '../../../src/components/auth/PremiumGuard';
import { usePremiumAccess } from '../../../src/hooks/usePremiumAccess';

// La section Consultation & Orientation ouvre directement le chat avec le Prophète Georges
// (chatType: 'consultation' — prompt Prophète Georges complet)
export default function ConsultationIndex() {
  const { isPremium } = usePremiumAccess();
  if (!isPremium) {
    return <PremiumGuard featureName="Consultation">{null}</PremiumGuard>;
  }
  return <Redirect href="/(app)/consultation/chat" />;
}
