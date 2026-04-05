import { useAuthStore } from '../store/auth.store';
import type { Language } from '../types/auth.types';
import { SUBSCRIPTION_PERIOD_DAYS } from './constants';

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  ar: 'ar',
};

export function getCurrentLanguage(): Language {
  return useAuthStore.getState().user?.language ?? 'fr';
}

export function resolveLocale(languageOrLocale?: string): string {
  if (!languageOrLocale) {
    return LOCALE_BY_LANGUAGE[getCurrentLanguage()];
  }

  if (languageOrLocale.includes('-')) {
    return languageOrLocale;
  }

  return LOCALE_BY_LANGUAGE[languageOrLocale as Language] ?? LOCALE_BY_LANGUAGE.fr;
}

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

export function formatDate(dateString: string, languageOrLocale?: string): string {
  return new Date(dateString).toLocaleDateString(resolveLocale(languageOrLocale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(dateString: string, languageOrLocale?: string): string {
  return new Date(dateString).toLocaleTimeString(resolveLocale(languageOrLocale), {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number, currency = 'FCFA', languageOrLocale?: string): string {
  return `${amount.toLocaleString(resolveLocale(languageOrLocale))} ${currency}`;
}

export function formatMonthYear(date: Date, languageOrLocale?: string): string {
  return new Intl.DateTimeFormat(resolveLocale(languageOrLocale), {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getWeekdayShortNames(languageOrLocale?: string): string[] {
  const formatter = new Intl.DateTimeFormat(resolveLocale(languageOrLocale), {
    weekday: 'short',
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(2024, 0, 1 + index));
    return formatter.format(date);
  });
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
