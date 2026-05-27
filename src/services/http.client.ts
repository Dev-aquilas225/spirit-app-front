/**
 * HTTP Client — Oracle Plus
 * Gère les appels API avec JWT Bearer, refresh automatique et gestion d'erreurs.
 */
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../utils/constants';
import { Env } from '../utils/env';

// Eval au moment de l'appel (pas au module load) pour que window.__ENV__ soit dispo
function baseUrl(): string {
  const base = Env.API_BASE_URL();
  // Fallback explicite si env non chargé
  const url = base || 'https://api.oracle-plus.online';
  return url.replace(/\/api\/v1$/, '') + '/api/v1';
}

export interface ApiError {
  statusCode: number;
  message: string;
}

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function getAccessToken(): Promise<string | null> {
  return StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
}

async function getLanguage(): Promise<string> {
  const storedLanguage = await StorageService.get<string>(STORAGE_KEYS.LANGUAGE);
  if (storedLanguage) {
    return storedLanguage;
  }

  const storedUser = await StorageService.get<{ language?: string }>(STORAGE_KEYS.USER);
  return storedUser?.language ?? 'fr';
}

async function getRefreshToken(): Promise<string | null> {
  return StorageService.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
}

async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    StorageService.set(STORAGE_KEYS.AUTH_TOKEN, accessToken),
    StorageService.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${baseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.accessToken && data.refreshToken) {
      await saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  // Timeout 15s + gestion offline
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  options = { ...options, signal: controller.signal };

  const token = options.token ?? (await getAccessToken());
  const language = await getLanguage();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': language,
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, { ...options, headers });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && err.name === 'AbortError';
    throw {
      statusCode: isAbort ? 408 : 0,
      message: isAbort ? 'Délai dépassé. Vérifiez votre connexion.' : 'Impossible de joindre le serveur. Vérifiez votre connexion.',
    } as ApiError;
  }
  clearTimeout(timeoutId);

  // Token expiré → refresh
  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await tryRefresh();
      isRefreshing = false;
      refreshQueue.forEach((cb) => cb(newToken ?? ''));
      refreshQueue = [];

      if (!newToken) {
        // Refresh échoué → vider le storage silencieusement
        await StorageService.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, STORAGE_KEYS.USER]);
        // Rejouer sans token — les routes publiques passeront,
        // les routes protégées retourneront 401 avec le message du backend
        const retryController = new AbortController();
        const retryTimeout = setTimeout(() => retryController.abort(), 15000);
        let retryRes: Response;
        try {
          retryRes = await fetch(`${baseUrl()}${path}`, {
            ...options,
            signal: retryController.signal,
            headers: {
              'Content-Type': 'application/json',
              ...(options.headers as Record<string, string>),
            },
          });
        } catch (err: unknown) {
          clearTimeout(retryTimeout);
          const isAbort = err instanceof Error && err.name === 'AbortError';
          throw {
            statusCode: isAbort ? 408 : 0,
            message: isAbort ? 'Délai dépassé. Vérifiez votre connexion.' : 'Impossible de joindre le serveur.',
          } as ApiError;
        }
        clearTimeout(retryTimeout);
        if (!retryRes.ok) {
          const body = await retryRes.json().catch(() => ({}));
          throw { statusCode: retryRes.status, message: body?.message ?? `Erreur ${retryRes.status}` } as ApiError;
        }
        if (retryRes.status === 204) return undefined as unknown as T;
        return retryRes.json() as Promise<T>;
      }

      // Rejouer la requête avec le nouveau token
      return request<T>(path, { ...options, token: newToken });
    } else {
      // En attente du refresh en cours
      return new Promise<T>((resolve, reject) => {
        refreshQueue.push(async (newToken) => {
          try { resolve(await request<T>(path, { ...options, token: newToken || '' })); }
          catch (e) { reject(e); }
        });
      });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw { statusCode: res.status, message: body?.message ?? `Erreur ${res.status}` } as ApiError;
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

export const http = {
  get:    <T>(path: string, token?: string) => request<T>(path, { method: 'GET', token }),
  post:   <T>(path: string, body?: unknown, token?: string) => request<T>(path, { method: 'POST',  body: body ? JSON.stringify(body) : undefined, token }),
  put:    <T>(path: string, body?: unknown, token?: string) => request<T>(path, { method: 'PUT',   body: body ? JSON.stringify(body) : undefined, token }),
  patch:  <T>(path: string, body?: unknown, token?: string) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, token }),
  delete: <T>(path: string, token?: string) => request<T>(path, { method: 'DELETE', token }),
  saveTokens,
  getRefreshToken,
  /** Télécharge un fichier binaire (PDF…) avec auth JWT → ArrayBuffer */
  getRaw: async (path: string): Promise<ArrayBuffer> => {
    const token = await getAccessToken();
    const headers: Record<string, string> = { Accept: 'application/pdf' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl()}${path}`, { method: 'GET', headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.arrayBuffer();
  },
  /** Upload multipart/form-data avec auth JWT */
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const token = await getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl()}${path}`, { method: 'POST', headers, body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error((err.message as string) || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  },
};
