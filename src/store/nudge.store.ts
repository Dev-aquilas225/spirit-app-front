/**
 * Nudge store — state for smart behavioral nudges
 * Keeps the current nudge message and visibility flag.
 */
import { create } from 'zustand';

interface NudgeState {
  visible: boolean;
  message: string;
  route: string;
  nudgeIndex: number;
  showNudge: (message: string, route: string) => void;
  hideNudge: () => void;
  incrementIndex: () => void;
}

export const useNudgeStore = create<NudgeState>((set, get) => ({
  visible: false,
  message: '',
  route: '',
  nudgeIndex: 0,

  showNudge: (message, route) => set({ visible: true, message, route }),
  hideNudge: () => set({ visible: false }),
  incrementIndex: () => set({ nudgeIndex: get().nudgeIndex + 1 }),
}));
