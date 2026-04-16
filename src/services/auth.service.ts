/**
 * Auth Service — Oracle Plus API
 */
import { User } from '../types/auth.types';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../utils/constants';
import { http, ApiError } from './http.client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ServiceResult<T> {
  data?: T;
  error?: string;
}

function mapApiUser(u: any, gender?: import('../types/auth.types').Gender): User {
  return {
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Utilisateur',
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    gender,
    email: u.email ?? '',
    country: u.country ?? 'CI',
    language: u.language ?? 'fr',
    role: u.role === 'admin' ? 'free' : (u.subscriptionStatus === 'active' ? 'subscriber' : 'free'),
    avatar: u.avatar,
    createdAt: u.createdAt,
    referralCode: u.referralCode ?? '',
  };
}

export const AuthService = {
  /** Envoyer un magic link par email (inscription ou connexion) */
  async sendMagicLink(email: string): Promise<ServiceResult<boolean>> {
    try {
      await http.post('/auth/send-magic-link', { email });
      return { data: true };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /**
   * Vérifier un magic link token (appelé depuis la page /auth/verify-magic-link).
   * Le backend valide le token et retourne les tokens JWT.
   */
  async verifyMagicLink(token: string): Promise<ServiceResult<AuthTokens>> {
    try {
      const data = await http.get<any>(`/auth/verify-magic-link?token=${encodeURIComponent(token)}`);
      const user = mapApiUser(data.user);
      await http.saveTokens(data.accessToken, data.refreshToken);
      await StorageService.set(STORAGE_KEYS.USER, user);
      return { data: { accessToken: data.accessToken, refreshToken: data.refreshToken, user } };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /**
   * Authentifier l'utilisateur avec les tokens reçus via deep link.
   * Sauvegarde les tokens et récupère le profil.
   */
  async loginWithTokens(accessToken: string, refreshToken: string): Promise<ServiceResult<AuthTokens>> {
    try {
      await http.saveTokens(accessToken, refreshToken);
      const data = await http.get<any>('/users/me');
      const user = mapApiUser(data);
      await StorageService.set(STORAGE_KEYS.USER, user);
      return { data: { accessToken, refreshToken, user } };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /** Déconnexion */
  async logout(): Promise<void> {
    try { await http.post('/auth/logout'); } catch {}
    await StorageService.multiRemove([STORAGE_KEYS.AUTH_TOKEN, 'refresh_token', STORAGE_KEYS.USER]);
  },

  /** Récupérer le profil utilisateur */
  async getProfile(): Promise<ServiceResult<User>> {
    try {
      const data = await http.get<any>('/users/me');
      const user = mapApiUser(data);
      await StorageService.set(STORAGE_KEYS.USER, user);
      return { data: user };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /** Mettre à jour le profil */
  async updateProfile(updates: {
    firstName?: string;
    lastName?: string;
    country?: string;
    avatar?: string;
    gender?: import('../types/auth.types').Gender;
  }): Promise<ServiceResult<User>> {
    try {
      const { gender, ...rest } = updates;
      const apiUpdates = gender ? { ...rest, gender } : rest;
      const data = await http.patch<any>('/users/me', apiUpdates);
      const user = mapApiUser(data, gender ?? data.gender);
      await StorageService.set(STORAGE_KEYS.USER, user);
      return { data: user };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /** Restaurer la session depuis le stockage local */
  async restoreSession(): Promise<{ user: User; token: string } | null> {
    const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const user  = await StorageService.get<User>(STORAGE_KEYS.USER);
    if (!token || !user) return null;
    return { token, user };
  },

  /** Supprimer le compte */
  async deleteAccount(): Promise<ServiceResult<boolean>> {
    try {
      await http.delete('/users/me');
      return { data: true };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },
};
