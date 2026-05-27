/**
 * useApiError — converts ApiError to a user-friendly message.
 *
 * statusCode 0   → no network
 * statusCode 408 → timeout
 * otherwise      → backend message
 */
import { Alert, Platform } from 'react-native';
import { ApiError } from '../services/http.client';

export function getApiErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return 'Une erreur est survenue.';
  const e = err as Partial<ApiError>;
  if (e.statusCode === 0)   return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  if (e.statusCode === 408) return 'Délai dépassé. Vérifiez votre connexion et réessayez.';
  return e.message ?? 'Une erreur est survenue.';
}

/** Show an Alert with the appropriate message for any API error. */
export function showApiError(err: unknown, title = 'Erreur'): void {
  const message = getApiErrorMessage(err);
  if (Platform.OS === 'web') {
    // On web, Alert.alert works but can be jarring — use console as fallback
    Alert.alert(title, message);
  } else {
    Alert.alert(title, message);
  }
}

/** Returns true if the error is a network/offline error (statusCode 0 or 408). */
export function isNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Partial<ApiError>;
  return e.statusCode === 0 || e.statusCode === 408;
}
