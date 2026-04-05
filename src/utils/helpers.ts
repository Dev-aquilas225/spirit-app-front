import { SUBSCRIPTION_PERIOD_DAYS } from './constants';

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function generateReferralCode(name: string): string {
  return `SPIRIT-${name.slice(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export function generatePaymentReference(): string {
  return `SPR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function getSubscriptionExpiryDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + SUBSCRIPTION_PERIOD_DAYS);
  return date.toISOString();
}

export function isSubscriptionActive(expiryDate: string | null | undefined): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) > new Date();
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function formatDate(dateString: string, locale = 'fr-FR'): string {
  return new Date(dateString).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number, currency = 'FCFA'): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function simulateApiDelay(ms = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function maskPhoneNumber(phone: string): string {
  if (phone.length < 4) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-2);
}
