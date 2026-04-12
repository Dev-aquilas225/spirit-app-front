/**
 * Lecture des variables d'environnement publiques.
 *
 * Sur le web (prod), `window.__ENV__` est injecté au démarrage du conteneur
 * via entrypoint.sh (Docker/nginx) ou server.js (nixpacks), AVANT que le
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

export const Env = {
  API_BASE_URL: () => getEnv('EXPO_PUBLIC_API_BASE_URL', 'http://localhost:4200'),
};
