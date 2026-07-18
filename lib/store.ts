import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { INITIAL_ACTIVITY } from './mockData';
import type { ActivityDay, ContextId } from './types';

interface SessionResult {
  projectId: string;
  answered: number;
  correct: number;
  creditsEarned: number;
}

interface AppState {
  onboarded: boolean;
  credits: number;
  qualityScore: number;
  streak: number;
  tasksCompleted: number;
  todayCredits: number;
  weekCredits: number;
  activity: ActivityDay[];
  selectedContext: ContextId;
  /** When on, hands-free mode uses a scripted voice sequence so the demo always works. */
  demoVoiceSim: boolean;
  hydrated: boolean;

  setOnboarded: (value: boolean) => void;
  selectContext: (id: ContextId) => void;
  completeSession: (result: SessionResult) => void;
  setDemoVoiceSim: (value: boolean) => void;
  resetDemo: () => void;
  setHydrated: () => void;
}

const DEFAULTS = {
  onboarded: false,
  credits: 126,
  qualityScore: 96,
  streak: 4,
  tasksCompleted: 31,
  todayCredits: 32,
  weekCredits: 126,
  activity: INITIAL_ACTIVITY,
  selectedContext: 'waiting' as ContextId,
  demoVoiceSim: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      hydrated: false,

      setOnboarded: (value) => set({ onboarded: value }),
      selectContext: (id) => set({ selectedContext: id }),
      completeSession: (result) =>
        set((state) => {
          const newCompleted = state.tasksCompleted + result.answered;
          const newQuality =
            result.answered > 0
              ? Math.round(
                  (state.qualityScore * state.tasksCompleted +
                    (result.correct / result.answered) * 100 * result.answered) /
                    newCompleted,
                )
              : state.qualityScore;
          const nextActivity = state.activity.map((day, index) =>
            index === state.activity.length - 1
              ? { ...day, credits: day.credits + result.creditsEarned }
              : day,
          );
          return {
            credits: state.credits + result.creditsEarned,
            tasksCompleted: newCompleted,
            todayCredits: state.todayCredits + result.creditsEarned,
            weekCredits: state.weekCredits + result.creditsEarned,
            qualityScore: newQuality,
            activity: nextActivity,
          };
        }),
      resetDemo: () => set({ ...DEFAULTS, onboarded: true }),
      setDemoVoiceSim: (value) => set({ demoVoiceSim: value }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'labelgo-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
