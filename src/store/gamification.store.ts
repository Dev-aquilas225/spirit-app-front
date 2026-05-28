/**
 * Gamification store — niveaux, badges, missions, série de connexion
 */
import { create } from 'zustand';
import { StorageService } from '../services/storage.service';

const KEY_STREAK   = '@oracle/streak';
const KEY_XP       = '@oracle/xp';
const KEY_BADGES   = '@oracle/badges';
const KEY_MISSIONS = '@oracle/missions_done';
const KEY_LAST     = '@oracle/last_login';

export const LEVELS = [
  { level: 1, name: 'Chercheur',      minXp: 0,    color: '#9CA3AF' },
  { level: 2, name: 'Disciple',       minXp: 200,  color: '#60A5FA' },
  { level: 3, name: 'Intercesseur',   minXp: 500,  color: '#34D399' },
  { level: 4, name: 'Prophète',       minXp: 1000, color: '#A78BFA' },
  { level: 5, name: 'Apôtre',         minXp: 2000, color: '#F59E0B' },
  { level: 6, name: 'Patriarche',     minXp: 4000, color: '#C9A84C' },
] as const;

export const BADGES = [
  { id: 'first_prayer',    label: 'Première Prière',    icon: '🙏', xp: 50  },
  { id: 'streak_3',        label: '3 jours de suite',   icon: '🔥', xp: 100 },
  { id: 'streak_7',        label: 'Semaine sainte',      icon: '⭐', xp: 200 },
  { id: 'streak_30',       label: 'Mois béni',           icon: '👑', xp: 500 },
  { id: 'first_dream',     label: 'Premier Rêve',        icon: '🌙', xp: 50  },
  { id: 'first_consult',   label: 'Première Voyance',    icon: '🔮', xp: 50  },
  { id: 'book_reader',     label: 'Lecteur Spirituel',   icon: '📖', xp: 100 },
  { id: 'ai_explorer',     label: 'Explorateur Spirituel', icon: '🔮', xp: 75  },
  { id: 'referral',        label: 'Ambassadeur',         icon: '🤝', xp: 150 },
] as const;

export type BadgeId = typeof BADGES[number]['id'];

export const DAILY_MISSIONS = [
  { id: 'read_prayer',   label: 'Lire la prière du jour',       xp: 30,  icon: '🙏' },
  { id: 'open_app',      label: 'Ouvrir l\'application',        xp: 10,  icon: '📱' },
  { id: 'ai_question',   label: 'Consulter Oracle',             xp: 40,  icon: '💬' },
  { id: 'read_book',     label: 'Lire un livre spirituel',      xp: 50,  icon: '📖' },
  { id: 'share_app',     label: 'Partager Oracle Plus',         xp: 60,  icon: '🤝' },
] as const;

export type MissionId = typeof DAILY_MISSIONS[number]['id'];

export function getLevelFromXp(xp: number) {
  const sorted = [...LEVELS].reverse();
  return sorted.find(l => xp >= l.minXp) ?? LEVELS[0];
}

export function getNextLevel(xp: number) {
  const current = getLevelFromXp(xp);
  return LEVELS.find(l => l.level === current.level + 1) ?? null;
}

export function getXpProgress(xp: number): number {
  const current = getLevelFromXp(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const range = next.minXp - current.minXp;
  const progress = xp - current.minXp;
  return Math.min(100, Math.round((progress / range) * 100));
}

interface GamificationState {
  xp: number;
  streak: number;
  earnedBadges: BadgeId[];
  completedMissions: MissionId[];
  isLoaded: boolean;

  init: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  checkStreak: () => Promise<void>;
  earnBadge: (id: BadgeId) => Promise<void>;
  completeMission: (id: MissionId) => Promise<void>;
  resetDailyMissions: () => Promise<void>;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  xp: 0,
  streak: 0,
  earnedBadges: [],
  completedMissions: [],
  isLoaded: false,

  init: async () => {
    const [xp, streak, badges, missions] = await Promise.all([
      StorageService.get<number>(KEY_XP),
      StorageService.get<number>(KEY_STREAK),
      StorageService.get<BadgeId[]>(KEY_BADGES),
      StorageService.get<MissionId[]>(KEY_MISSIONS),
    ]);
    set({
      xp: xp ?? 0,
      streak: streak ?? 0,
      earnedBadges: badges ?? [],
      completedMissions: missions ?? [],
      isLoaded: true,
    });
    await get().checkStreak();
    // Mission "open_app" auto-complétée chaque jour
    await get().completeMission('open_app');
  },

  addXp: async (amount) => {
    const next = get().xp + amount;
    set({ xp: next });
    await StorageService.set(KEY_XP, next);
  },

  checkStreak: async () => {
    const last = await StorageService.get<string>(KEY_LAST);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (last === today) return; // déjà compté aujourd'hui

    let newStreak = get().streak;
    if (last === yesterday) {
      newStreak += 1;
    } else if (last !== today) {
      newStreak = 1; // série cassée
    }

    set({ streak: newStreak });
    await StorageService.set(KEY_STREAK, newStreak);
    await StorageService.set(KEY_LAST, today);

    // Badges de série
    if (newStreak >= 3)  await get().earnBadge('streak_3');
    if (newStreak >= 7)  await get().earnBadge('streak_7');
    if (newStreak >= 30) await get().earnBadge('streak_30');
  },

  earnBadge: async (id) => {
    if (get().earnedBadges.includes(id)) return;
    const badge = BADGES.find(b => b.id === id);
    const next = [...get().earnedBadges, id];
    set({ earnedBadges: next });
    await StorageService.set(KEY_BADGES, next);
    if (badge) await get().addXp(badge.xp);
  },

  completeMission: async (id) => {
    if (get().completedMissions.includes(id)) return;
    const mission = DAILY_MISSIONS.find(m => m.id === id);
    const next = [...get().completedMissions, id];
    set({ completedMissions: next });
    await StorageService.set(KEY_MISSIONS, next);
    if (mission) await get().addXp(mission.xp);
  },

  resetDailyMissions: async () => {
    set({ completedMissions: [] });
    await StorageService.set(KEY_MISSIONS, []);
  },
}));
