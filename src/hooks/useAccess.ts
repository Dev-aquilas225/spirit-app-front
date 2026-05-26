/**
 * useAccess — unified access control hook
 *
 * Logic:
 * - Admin → always full access
 * - Active subscription → full access, credits NOT consumed
 * - No subscription → freemium, credits consumed per action
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
  // subscriber role OR active subscription from store
  const hasSubscription = isAdmin || user?.role === 'subscriber' || isSubActive;

  /**
   * Returns true if the user can perform the action.
   * Subscribers bypass credit check entirely.
   */
  const canPerform = (action: CreditAction): boolean => {
    if (hasSubscription) return true;
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
