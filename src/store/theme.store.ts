import { create } from 'zustand';
import { StorageService } from '../services/storage.service';
import { STORAGE_KEYS } from '../utils/constants';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
  mode: ThemeMode;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggle: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: 'system',
  isInitialized: false,

  initialize: async () => {
    const stored = await StorageService.get<ThemeMode>(STORAGE_KEYS.THEME);
    set({
      mode: stored ?? 'system',
      isInitialized: true,
    });
  },

  setMode: async (mode) => {
    set({ mode });
    await StorageService.set(STORAGE_KEYS.THEME, mode);
  },

  toggle: async () => {
    const { mode, setMode } = get();
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    await setMode(next);
  },
}));
