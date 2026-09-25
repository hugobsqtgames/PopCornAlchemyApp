import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ACHIEVEMENTS, EMPTY_STATS, newlyUnlocked, type Stats } from '@/game/achievements';
import type { ThemeId } from '@/game/catalog';
import { currentStreak, dayKey, nextStreak } from '@/game/dates';
import { REWARDS } from '@/game/rules';
import type { Lang, Mode, RunSave } from '@/game/types';

export type Item = 'hints' | 'shields' | 'skips' | 'doubles';

export interface ReceivedChallenge {
  ids: number[];
  score: number;
  name: string;
  receivedAt: string;
}

export interface ProfileState {
  lang: Lang | null;
  tutorialDone: boolean;
  name: string;
  avatar: string;
  coins: number;
  hints: number;
  shields: number;
  skips: number;
  doubles: number;
  theme: ThemeId;
  style: string;
  ownedThemes: ThemeId[];
  ownedStyles: string[];
  ownedAvatars: string[];
  sound: boolean;
  haptics: boolean;
  noAds: boolean;
  best: Partial<Record<Mode, number>>;
  stats: Stats;
  achievements: string[];
  /** Daily challenge: last day it was finished and the streak. */
  dailyLast: string | null;
  dailyStreak: number;
  dailyBestStreak: number;
  wheelLast: string | null;
  wheelBonusLast: string | null;
  adsDay: string | null;
  adsCount: number;
  save: RunSave | null;
  /** Last levels cleared, used to build a challenge for a friend. */
  lastRun: { ids: number[]; score: number } | null;
  received: ReceivedChallenge[];
}

interface ProfileActions {
  set: (patch: Partial<ProfileState>) => void;
  addCoins: (n: number) => void;
  /** Spends coins if there are enough; returns false otherwise. */
  spend: (n: number) => boolean;
  addItem: (item: Item, n: number) => void;
  /** Uses one item if available; returns false otherwise. */
  useItem: (item: Item) => boolean;
  bumpStats: (patch: Partial<Omit<Stats, 'cat'>> & { cat?: Partial<Stats['cat']> }, mode?: 'add' | 'max') => void;
  setBest: (mode: Mode, score: number) => boolean;
  /** Returns the achievements that just got unlocked. */
  checkAchievements: () => string[];
  finishDaily: () => { rewarded: boolean; chest: boolean };
  streak: () => number;
  adsLeft: () => number;
  countAd: () => void;
  reset: () => void;
}

const INITIAL: ProfileState = {
  lang: null,
  tutorialDone: false,
  name: '',
  avatar: '🍿',
  coins: 0,
  hints: 3,
  shields: 0,
  skips: 0,
  doubles: 0,
  theme: 'popcorn',
  style: '🍿',
  ownedThemes: ['popcorn'],
  ownedStyles: ['🍿'],
  ownedAvatars: ['🍿'],
  sound: true,
  haptics: true,
  noAds: false,
  best: {},
  stats: EMPTY_STATS,
  achievements: [],
  dailyLast: null,
  dailyStreak: 0,
  dailyBestStreak: 0,
  wheelLast: null,
  wheelBonusLast: null,
  adsDay: null,
  adsCount: 0,
  save: null,
  lastRun: null,
  received: [],
};

export const useProfile = create<ProfileState & ProfileActions>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      set: (patch) => set(patch),
      addCoins: (n) =>
        set((s) => ({ coins: s.coins + n, stats: { ...s.stats, coinsEarned: s.stats.coinsEarned + Math.max(0, n) } })),
      spend: (n) => {
        if (get().coins < n) return false;
        set((s) => ({ coins: s.coins - n }));
        return true;
      },
      addItem: (item, n) => set((s) => ({ [item]: s[item] + n }) as Partial<ProfileState>),
      useItem: (item) => {
        if (get()[item] <= 0) return false;
        set((s) => ({ [item]: s[item] - 1 }) as Partial<ProfileState>);
        return true;
      },
      bumpStats: (patch, mode = 'add') =>
        set((s) => {
          const stats = { ...s.stats, cat: { ...s.stats.cat } };
          for (const [k, v] of Object.entries(patch)) {
            if (k === 'cat' || typeof v !== 'number') continue;
            const key = k as keyof Omit<Stats, 'cat'>;
            stats[key] = mode === 'max' ? Math.max(stats[key], v) : stats[key] + v;
          }
          for (const [k, v] of Object.entries(patch.cat ?? {})) {
            const key = k as keyof Stats['cat'];
            stats.cat[key] += v ?? 0;
          }
          return { stats };
        }),
      setBest: (mode, score) => {
        const prev = get().best[mode] ?? 0;
        if (score <= prev) return false;
        set((s) => ({ best: { ...s.best, [mode]: score } }));
        return prev > 0;
      },
      checkAchievements: () => {
        const s = get();
        const fresh = newlyUnlocked(
          { stats: s.stats, coins: s.coins, streak: s.streak(), themesOwned: s.ownedThemes.length },
          s.achievements
        );
        if (fresh.length) set({ achievements: [...s.achievements, ...fresh] });
        return fresh;
      },
      finishDaily: () => {
        const s = get();
        const today = dayKey();
        if (s.dailyLast === today) return { rewarded: false, chest: false };
        const streak = nextStreak(s.dailyLast, today, s.dailyStreak);
        const chest = streak > 0 && streak % 7 === 0;
        set({
          dailyLast: today,
          dailyStreak: streak,
          dailyBestStreak: Math.max(s.dailyBestStreak, streak),
          hints: s.hints + REWARDS.daily.hints,
        });
        get().addCoins(REWARDS.daily.coins + (chest ? 300 : 0));
        get().bumpStats({ daily: 1 });
        return { rewarded: true, chest };
      },
      streak: () => {
        const s = get();
        return currentStreak(s.dailyLast, dayKey(), s.dailyStreak);
      },
      adsLeft: () => {
        const s = get();
        return s.adsDay === dayKey() ? Math.max(0, REWARDS.adsPerDay - s.adsCount) : REWARDS.adsPerDay;
      },
      countAd: () =>
        set((s) => {
          const today = dayKey();
          return { adsDay: today, adsCount: s.adsDay === today ? s.adsCount + 1 : 1 };
        }),
      reset: () => set({ ...INITIAL, lang: get().lang, tutorialDone: true }),
    }),
    {
      name: 'popcorn-profile',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => {
        const out: Partial<ProfileState> = {};
        for (const k of Object.keys(INITIAL) as (keyof ProfileState)[]) {
          (out as Record<string, unknown>)[k] = s[k];
        }
        return out;
      },
      merge: (saved, current) => {
        const p = (saved ?? {}) as Partial<ProfileState>;
        return {
          ...current,
          ...p,
          stats: { ...EMPTY_STATS, ...p.stats, cat: { ...EMPTY_STATS.cat, ...p.stats?.cat } },
        };
      },
    }
  )
);

export const ACHIEVEMENT_COUNT = ACHIEVEMENTS.length;
