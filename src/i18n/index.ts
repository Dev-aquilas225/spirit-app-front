import { useAuthStore } from '../store/auth.store';
import fr, { Translations } from './fr';
import en from './en';

const TRANSLATIONS: Record<string, Translations> = { fr, en };

function resolveLanguage(language?: string): 'fr' | 'en' {
  return language === 'en' ? 'en' : 'fr';
}

/**
 * Hook i18n — s'abonne à user.language dans le store Zustand.
 * Tout composant qui appelle useI18n() se re-rend automatiquement
 * quand la langue change, sans provider supplémentaire.
 */
export function useI18n() {
  const language = useAuthStore((s) => resolveLanguage(s.user?.language));
  const t = TRANSLATIONS[language] ?? fr;
  return { t, language };
}

/** Accès hors hook (utilitaires, services) */
export function getTranslations(language?: string): Translations {
  return TRANSLATIONS[resolveLanguage(language)] ?? fr;
}
