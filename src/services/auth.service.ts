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
    gender,                 // fourni depuis le store (stockage local)
    phone: u.phone,
    country: u.country ?? 'CI',
    language: u.language ?? 'fr',
    role: u.role === 'admin' ? 'free' : (u.subscriptionStatus === 'active' ? 'subscriber' : 'free'),
    avatar: u.avatar,
    createdAt: u.createdAt,
    referralCode: u.referralCode ?? '',
  };
}

export const AuthService = {
  /**
   * Tente d'inscrire un numéro.
   * - 201 → nouveau compte, OTP envoyé
   * - 409 → compte existant
   */
  async register(phone: string, firstName?: string, referralCode?: string): Promise<{ isNew: boolean; error?: string }> {
    try {
      await http.post('/auth/register', { phone, firstName, referralCode });
      return { isNew: true };
    } catch (e) {
      const err = e as ApiError;
      if (err.statusCode === 409) return { isNew: false };
      return { isNew: false, error: err.message };
    }
  },

  /** Renvoyer un OTP */
  async sendOtp(phone: string): Promise<ServiceResult<boolean>> {
    try {
      await http.post('/auth/send-otp', { phone });
      return { data: true };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /**
   * Vérifier l'OTP — retourne { setupToken, userId }.
   * Le setupToken est un JWT temporaire (10 min) utilisé pour set-pin.
   */
  async verifyOtp(phone: string, code: string): Promise<ServiceResult<{ setupToken: string; userId: string }>> {
    try {
      const data = await http.post<{ setupToken: string; userId: string }>('/auth/verify-otp', { phone, code });
      return { data: { setupToken: data.setupToken, userId: data.userId } };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /**
   * Définir le PIN — Authorization: Bearer <setupToken>
   * Retourne { accessToken, refreshToken }.
   */
  async setPin(pin: string, setupToken: string): Promise<ServiceResult<AuthTokens>> {
    try {
      const data = await http.post<any>('/auth/set-pin', { pin, confirmPin: pin }, setupToken);
      const tokens: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: mapApiUser(data.user ?? data),
      };
      await http.saveTokens(tokens.accessToken, tokens.refreshToken);
      await StorageService.set(STORAGE_KEYS.USER, tokens.user);
      return { data: tokens };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /** Connexion avec téléphone + PIN */
  async login(phone: string, pin: string): Promise<ServiceResult<AuthTokens>> {
    try {
      const data = await http.post<any>('/auth/login', { phone, pin });
      const tokens: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: mapApiUser(data.user ?? data),
      };
      await http.saveTokens(tokens.accessToken, tokens.refreshToken);
      await StorageService.set(STORAGE_KEYS.USER, tokens.user);
      return { data: tokens };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /** Envoyer OTP de réinitialisation */
  async forgotPassword(phone: string): Promise<ServiceResult<boolean>> {
    try {
      await http.post('/auth/forgot-password', { phone });
      return { data: true };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /** Réinitialiser le PIN avec OTP */
  async resetPassword(phone: string, otp: string, newPin: string): Promise<ServiceResult<boolean>> {
    try {
      await http.post('/auth/reset-password', { phone, otp, newPin });
      return { data: true };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /** Changer de PIN (connecté) */
  async changePin(oldPin: string, newPin: string): Promise<ServiceResult<boolean>> {
    try {
      await http.post('/auth/change-pin', { oldPin, newPin });
      return { data: true };
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
    email?: string;
    country?: string;
    avatar?: string;
    gender?: import('../types/auth.types').Gender;
  }): Promise<ServiceResult<User>> {
    try {
      // gender n'est pas dans le DTO backend → on l'extrait avant d'envoyer
      const { gender, ...apiUpdates } = updates;
      const data = await http.patch<any>('/users/me', apiUpdates);
      const user = mapApiUser(data, gender);
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
