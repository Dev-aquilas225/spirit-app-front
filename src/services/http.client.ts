/**
 * HTTP Client — Oracle Plus
 * Gère les appels API avec JWT Bearer, refresh automatique et gestion d'erreurs.
 */
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../utils/constants';

const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4200') + '/api/v1';

export interface ApiError {
  statusCode: number;
  message: string;
}

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function getAccessToken(): Promise<string | null> {
  return StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
}

async function getRefreshToken(): Promise<string | null> {
  return StorageService.get<string>('refresh_token');
}

async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    StorageService.set(STORAGE_KEYS.AUTH_TOKEN, accessToken),
    StorageService.set('refresh_token', refreshToken),
  ]);
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
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
  const token = options.token ?? (await getAccessToken());
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Token expiré → refresh
  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await tryRefresh();
      isRefreshing = false;
      refreshQueue.forEach((cb) => cb(newToken ?? ''));
      refreshQueue = [];

      if (!newToken) {
        // Refresh échoué → déconnecter
        await StorageService.multiRemove([STORAGE_KEYS.AUTH_TOKEN, 'refresh_token', STORAGE_KEYS.USER]);
        throw { statusCode: 401, message: 'Session expirée' } as ApiError;
      }

      // Rejouer la requête avec le nouveau token
      return request<T>(path, { ...options, token: newToken });
    } else {
      // En attente du refresh en cours
      return new Promise<T>((resolve, reject) => {
        refreshQueue.push(async (newToken) => {
          if (!newToken) return reject({ statusCode: 401, message: 'Session expirée' });
          try { resolve(await request<T>(path, { ...options, token: newToken })); }
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
  patch:  <T>(path: string, body?: unknown, token?: string) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, token }),
  delete: <T>(path: string, token?: string) => request<T>(path, { method: 'DELETE', token }),
  saveTokens,
  getRefreshToken,
};
