import { create } from 'zustand';
import { User } from '../types/auth.types';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { STORAGE_KEYS } from '../utils/constants';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  /** Connexion avec téléphone + PIN */
  login: (phone: string, pin: string) => Promise<boolean>;
  /** Définir le PIN après vérification OTP (nouveau compte) */
  setPin: (pin: string, tempToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
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
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const session = await AuthService.restoreSession();
      if (session) {
        set({
          user: session.user,
          token: session.token,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
        });
      } else {
        set({ isInitialized: true, isLoading: false });
      }
    } catch {
      set({ isInitialized: true, isLoading: false });
    }
  },

  login: async (phone, pin) => {
    set({ isLoading: true, error: null });
    const result = await AuthService.login(phone, pin);
    if (result.error || !result.data) {
      set({ isLoading: false, error: result.error ?? 'Connexion échouée' });
      return false;
    }
    set({
      user: result.data.user,
      token: result.data.accessToken,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    return true;
  },

  setPin: async (pin, tempToken) => {
    set({ isLoading: true, error: null });
    const result = await AuthService.setPin(pin, tempToken);
    if (result.error || !result.data) {
      set({ isLoading: false, error: result.error ?? 'Erreur PIN' });
      return false;
    }
    set({
      user: result.data.user,
      token: result.data.accessToken,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    return true;
  },

  logout: async () => {
    set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
    await AuthService.logout();
  },

  updateUser: async (updates) => {
    const { user } = get();
    if (!user) return false;
    set({ isLoading: true });
    const result = await AuthService.updateProfile({
      firstName: (updates.name ?? user.name).split(' ')[0],
      lastName: (updates.name ?? user.name).split(' ').slice(1).join(' '),
      country: updates.country ?? user.country,
      avatar: updates.avatar,
    });
    if (result.error || !result.data) {
      set({ isLoading: false, error: result.error ?? 'Mise à jour échouée' });
      return false;
    }
    set({ user: result.data, isLoading: false });
    return true;
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
