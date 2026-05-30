/**
 * Facebook Pixel — Oracle Plus
 * Pixel ID : 136534062330794
 *
 * Utilisation :
 *   import { fbTrack } from '../utils/fbpixel';
 *   fbTrack('InitiateCheckout', { value: 3000, currency: 'XAF', content_name: 'weekly_plus' });
 *
 * Ne crée aucun conflit avec le backend — appels purement côté client (web uniquement).
 * Sur mobile natif (iOS/Android), les appels sont silencieusement ignorés.
 */

import { Platform } from 'react-native';

const PIXEL_ID = '136534062330794';

/** Vérifie que fbq est disponible (web uniquement) */
function fbq(...args: unknown[]): void {
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (typeof w.fbq !== 'function') return;
  w.fbq(...args);
}

/** Événement générique */
export function fbTrack(event: string, params?: Record<string, unknown>): void {
  fbq('track', event, params);
}

/** Événement personnalisé */
export function fbTrackCustom(event: string, params?: Record<string, unknown>): void {
  fbq('trackCustom', event, params);
}

// ─── Événements standards Oracle Plus ────────────────────────────────────────

/**
 * Déclenché quand l'utilisateur clique sur "Payer maintenant" dans PaymentScreen.
 * @param plan  Identifiant du plan (ex: 'weekly_plus', 'starter')
 * @param amount Montant en FCFA (ex: 3000)
 */
export function fbInitiateCheckout(plan: string, amount: number): void {
  fbTrack('InitiateCheckout', {
    content_name:     plan,
    content_category: plan.includes('starter') || plan.includes('standard') || plan.includes('premium')
      ? 'credit_pack'
      : 'subscription',
    value:    amount,
    currency: 'XAF',
    num_items: 1,
  });
}

/**
 * Déclenché quand le paiement est confirmé (étape 'vip' dans PaymentScreen).
 */
export function fbPurchase(plan: string, amount: number): void {
  fbTrack('Purchase', {
    content_name: plan,
    value:        amount,
    currency:     'XAF',
  });
}

/**
 * Déclenché à l'inscription d'un nouvel utilisateur.
 */
export function fbCompleteRegistration(): void {
  fbTrack('CompleteRegistration');
}

/**
 * Déclenché quand l'utilisateur consulte la page boutique.
 */
export function fbViewContent(contentName: string): void {
  fbTrack('ViewContent', { content_name: contentName });
}
