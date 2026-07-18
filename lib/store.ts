import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { INITIAL_ACTIVITY, SEED_ACTIVITY } from './mockData';
import type { ActivityDay, ContextId, EarningActivity } from './types';

const EVERYDAY_SOUNDS_TOTAL = 8;

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
  /** Everyday Sounds tasks completed so far (0–8), drives Home + Tasks progress. */
  everydaySoundsCompleted: number;
  /** Number of full labeling sessions finished this demo run. */
  sessionsCompleted: number;
  /** Recent earning activity, newest first. Session completions prepend here. */
  history: EarningActivity[];
  /** When on, hands-free mode uses a scripted voice sequence so the demo always works. */
  demoVoiceSim: boolean;
  /** Transient confirmation message shown in a global toast; null when hidden. */
  toast: string | null;
  hydrated: boolean;

  setOnboarded: (value: boolean) => void;
  selectContext: (id: ContextId) => void;
  completeSession: (result: SessionResult) => void;
  setDemoVoiceSim: (value: boolean) => void;
  resetDemo: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
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
  everydaySoundsCompleted: 0,
  sessionsCompleted: 0,
  history: SEED_ACTIVITY,
  demoVoiceSim: true,
  toast: null as string | null,
};

let historySeq = 0;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      hydrated: false,

      setOnboarded: (value) => set({ onboarded: value }),
      selectContext: (id) => set({ selectedContext: id }),
      completeSession: (result) =>
        set((state) => {
          // Guard against empty / negative results so progress can never go backwards
          // or double-count credits for a session that recorded nothing.
          const answered = Math.max(0, Math.floor(result.answered));
          if (answered === 0) return {};
          const credits = Math.max(0, Math.floor(result.creditsEarned));
          const correct = Math.min(answered, Math.max(0, Math.floor(result.correct)));

          const newCompleted = state.tasksCompleted + answered;
          const newQuality = Math.round(
            (state.qualityScore * state.tasksCompleted + (correct / answered) * 100 * answered) /
              newCompleted,
          );
          const nextActivity = state.activity.map((day, index) =>
            index === state.activity.length - 1 ? { ...day, credits: day.credits + credits } : day,
          );

          const isEverydaySounds = result.projectId === 'everyday-sounds';
          const everydaySoundsCompleted = isEverydaySounds
            ? Math.min(EVERYDAY_SOUNDS_TOTAL, state.everydaySoundsCompleted + answered)
            : state.everydaySoundsCompleted;

          historySeq += 1;
          const label = isEverydaySounds ? 'Everyday Sounds' : 'Labeling session';
          const entry: EarningActivity = {
            id: `session-${Date.now()}-${historySeq}`,
            label,
            credits,
            when: 'Just now',
            kind: 'session',
          };

          return {
            credits: state.credits + credits,
            tasksCompleted: newCompleted,
            todayCredits: state.todayCredits + credits,
            weekCredits: state.weekCredits + credits,
            qualityScore: newQuality,
            activity: nextActivity,
            everydaySoundsCompleted,
            sessionsCompleted: state.sessionsCompleted + 1,
            history: [entry, ...state.history].slice(0, 12),
          };
        }),
      resetDemo: () =>
        set({
          ...DEFAULTS,
          onboarded: false,
          toast: 'Demo reset — starting balance restored',
        }),
      setDemoVoiceSim: (value) => set({ demoVoiceSim: value }),
      showToast: (message) => set({ toast: message }),
      clearToast: () => set({ toast: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'labelgo-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Toast is transient UI state and must never rehydrate from storage.
      partialize: ({ toast: _toast, hydrated: _hydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export { EVERYDAY_SOUNDS_TOTAL };
