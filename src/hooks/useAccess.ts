/**
 * useAccess — contrôle d'accès unifié pour les services IA
 *
 * Règles :
 * - Admin → accès total, crédits jamais consommés
 * - Abonnement actif → accès illimité aux services IA, crédits NON consommés
 * - Sans abonnement → freemium, crédits consommés par action (1 crédit = 1 mot)
 *
 * ⚠️  L'abonnement NE donne PAS accès à la Librairie.
 *     Les livres s'achètent séparément via LibrairieService (Paystack direct).
 *     1 FCFA = 1 crédit = 1 mot généré par ChatGPT.
 */
import { useAuthStore } from '../store/auth.store';
import { useSubscriptionStore } from '../store/subscription.store';
import { useCreditsStore, CreditAction, CREDIT_COSTS } from '../store/credits.store';

export function useAccess() {
  const user = useAuthStore((s) => s.user);
  const isSubActive = useSubscriptionStore((s) => s.isActive);
  const credits = useCreditsStore((s) => s.credits);
  const canAfford = useCreditsStore((s) => s.canAfford);

  const isAdmin = user?.role === 'admin';
  // Source de vérité : isSubActive du store (vérifie status === 'active' ET date d'expiration)
  // Le role 'subscriber' seul ne suffit pas — il peut rester après expiration ou être mis par erreur
  const hasSubscription = isAdmin || isSubActive;

  /**
   * Returns true if the user can perform the action.
   * Subscribers bypass credit check entirely.
   * For AI chat actions, only 1 credit minimum is required (billed per word after response).
   */
  const canPerform = (action: CreditAction): boolean => {
    if (hasSubscription) return true;
    // Chat actions: minimum 20 crédits requis (backend bloque en dessous)
    const chatActions: CreditAction[] = ['ai_chat', 'prophetic_consultation', 'prayer_generation'];
    if (chatActions.includes(action)) return credits >= 20;
    return canAfford(action);
  };

  /**
   * Cost to display in UI (0 for subscribers).
   */
  const displayCost = (action: CreditAction): number => {
    if (hasSubscription) return 0;
    return CREDIT_COSTS[action];
  };

  return {
    isAdmin,
    hasSubscription,
    isFreemium: !hasSubscription,
    credits,
    canPerform,
    displayCost,
  };
}
