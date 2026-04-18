import { create } from 'zustand';
import { Platform } from 'react-native';
import { User, Gender } from '../types/auth.types';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { STORAGE_KEYS } from '../utils/constants';

/** Re-planifie les notifications si l'utilisateur les avait activées */
async function restoreNotificationsIfNeeded(): Promise<void> {
  try {
    const enabled = await StorageService.get<boolean>(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    if (!enabled) return;
    // Import dynamique pour éviter les problèmes SSR / web
    if (Platform.OS === 'web') {
      const { NotificationService } = await import('../services/notification.service.web');
      await NotificationService.scheduleDailyNotifications();
    } else {
      const { NotificationService } = await import('../services/notification.service');
      await NotificationService.scheduleDailyNotifications();
    }
  } catch {
    // Silencieux — les notifications ne bloquent pas la session
  }
}

/** Profil considéré complet si firstName + lastName + genre sont renseignés */
export function isUserProfileComplete(user: User | null): boolean {
  if (!user) return false;
  return !!(user.firstName?.trim() && user.lastName?.trim() && user.gender);
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  /** Vrai si nom + prénom + genre sont tous renseignés */
  isProfileComplete: boolean;

  initialize: () => Promise<void>;
  loginWithTokens: (accessToken: string, refreshToken: string) => Promise<boolean>;
  /** Compléter le profil (nom, prénom, genre) — appelé depuis complete-profile.tsx */
  completeProfile: (firstName: string, lastName: string, gender: Gender) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  /** Changer la langue (stockage local uniquement) */
  setLanguage: (lang: import('../types/auth.types').Language) => Promise<void>;
  clearError: () => void;
  upgradeToSubscriber: () => void;
  downgradeToFree: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  isProfileComplete: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const session = await AuthService.restoreSession();
      if (session) {
        // Lire le genre et la langue stockés localement
        const gender   = await StorageService.get<Gender>(STORAGE_KEYS.USER_GENDER);
        const language = await StorageService.get<import('../types/auth.types').Language>(STORAGE_KEYS.LANGUAGE);
        const user: User = {
          ...session.user,
          gender: gender ?? undefined,
          language: language ?? session.user.language,
        };
        set({
          user,
          token: session.token,
          isAuthenticated: true,
          isProfileComplete: isUserProfileComplete(user),
          isInitialized: true,
          isLoading: false,
        });
        // Restaurer les notifications si l'utilisateur les avait activées
        restoreNotificationsIfNeeded();
      } else {
        set({ isInitialized: true, isLoading: false });
      }
    } catch {
      set({ isInitialized: true, isLoading: false });
    }
  },

  loginWithTokens: async (accessToken, refreshToken) => {
    set({ isLoading: true, error: null });
    const result = await AuthService.loginWithTokens(accessToken, refreshToken);
    if (result.error || !result.data) {
      set({ isLoading: false, error: result.error ?? 'Connexion échouée' });
      return false;
    }
    const gender = await StorageService.get<Gender>(STORAGE_KEYS.USER_GENDER);
    const user: User = { ...result.data.user, gender: gender ?? undefined };
    set({
      user,
      token: result.data.accessToken,
      isAuthenticated: true,
      isProfileComplete: isUserProfileComplete(user),
      isLoading: false,
      error: null,
    });
    return true;
  },

  completeProfile: async (firstName, lastName, gender) => {
    set({ isLoading: true, error: null });
    const result = await AuthService.updateProfile({ firstName, lastName, gender });
    if (result.error || !result.data) {
      set({ isLoading: false, error: result.error ?? 'Mise à jour échouée' });
      return false;
    }
    // Stocker le genre localement (non supporté par le backend)
    await StorageService.set(STORAGE_KEYS.USER_GENDER, gender);
    const user: User = { ...result.data, gender };
    set({
      user,
      isProfileComplete: true,
      isLoading: false,
      error: null,
    });
    return true;
  },

  logout: async () => {
    // Vider le state Zustand en premier (UI réagit immédiatement)
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isProfileComplete: false,
      isLoading: false,
      error: null,
    });
    // Puis vider tous les storages et appeler le backend
    await AuthService.logout();
  },

  updateUser: async (updates) => {
    const { user } = get();
    if (!user) return false;
    set({ isLoading: true });
    const result = await AuthService.updateProfile({
      firstName: updates.firstName ?? user.firstName,
      lastName: updates.lastName ?? user.lastName,
      country: updates.country ?? user.country,
      avatar: updates.avatar,
      gender: updates.gender ?? user.gender,
    });
    if (result.error || !result.data) {
      set({ isLoading: false, error: result.error ?? 'Mise à jour échouée' });
      return false;
    }
    const gender = updates.gender ?? user.gender;
    if (gender) await StorageService.set(STORAGE_KEYS.USER_GENDER, gender);
    const updated: User = { ...result.data, gender };
    set({ user: updated, isProfileComplete: isUserProfileComplete(updated), isLoading: false });
    return true;
  },

  setLanguage: async (lang) => {
    await StorageService.set(STORAGE_KEYS.LANGUAGE, lang);
    const { user } = get();
    if (user) {
      const updated = { ...user, language: lang };
      set({ user: updated });
      await StorageService.set(STORAGE_KEYS.USER, updated);
    }
  },

  clearError: () => set({ error: null }),

  upgradeToSubscriber: () => {
    const { user } = get();
    if (user) {
      const upgraded = { ...user, role: 'subscriber' as const };
      set({ user: upgraded });
      StorageService.set(STORAGE_KEYS.USER, upgraded);
    }
  },

  downgradeToFree: () => {
    const { user } = get();
    if (user) {
      const downgraded = { ...user, role: 'free' as const };
      set({ user: downgraded });
      StorageService.set(STORAGE_KEYS.USER, downgraded);
    }
  },
}));
