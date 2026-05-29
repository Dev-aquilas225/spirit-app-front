/**
 * Lecture des variables d'environnement publiques.
 *
 * Sur le web (prod), `window.__ENV__` est injecté au démarrage du conteneur
 * via entrypoint.sh (Docker/nginx) AVANT que le
 * bundle JS ne soit évalué.
 *
 * Sur natif (iOS/Android) ou en dev, Metro injecte `process.env.EXPO_PUBLIC_*`
 * à la compilation → le fallback process.env prend le relais.
 */
function getEnv(key: string, fallback = ''): string {
  if (typeof window !== 'undefined') {
    const runtime = (window as unknown as Record<string, Record<string, string>>).__ENV__;
    if (runtime?.[key]) return runtime[key];
  }
  // Metro remplace statiquement process.env.EXPO_PUBLIC_* au build
  return (process.env as Record<string, string | undefined>)[key] ?? fallback;
}

// Emails admin hardcodés en fallback si la variable d'env n'est pas injectée
const HARDCODED_ADMIN_EMAILS = ['tchingankonggeorges@gmail.com'];

export const Env = {
  API_BASE_URL: () => getEnv('EXPO_PUBLIC_API_BASE_URL', 'http://localhost:4200'),
  GOOGLE_CLIENT_ID_WEB: () => getEnv('EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB', ''),
  VAPID_PUBLIC_KEY: () => getEnv('EXPO_PUBLIC_VAPID_PUBLIC_KEY', ''),
  ADMIN_EMAILS: () => {
    const fromEnv = getEnv('EXPO_PUBLIC_ADMIN_EMAIL', '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    // Fusionner env + hardcodé pour garantir l'accès même sans variable runtime
    return Array.from(new Set([...fromEnv, ...HARDCODED_ADMIN_EMAILS]));
  },
};
