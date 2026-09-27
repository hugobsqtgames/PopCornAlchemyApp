import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';

import { ACHIEVEMENTS, EMPTY_STATS, newlyUnlocked, type Stats } from '@/game/achievements';
import { packGoods, type ThemeId } from '@/game/catalog';
import type { GiftReward } from '@/game/codes';
import { currentStreak, dayKey, nextStreakWithSaves } from '@/game/dates';
import { addActivity, canClaimLogin, LOGIN_REWARDS, MAX_STREAK_SAVES, type StarCount } from '@/game/progress';
import { REWARDS } from '@/game/rules';
import type { Lang, Mode, RunSave } from '@/game/types';

import { sanitizeProfile } from './sanitize';

export type Item = 'hints' | 'shields' | 'skips' | 'doubles' | 'streakSaves';

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
  music: boolean;
  haptics: boolean;
  /** Fewer animations, on top of the iPhone's own Reduce Motion setting. */
  reduceMotion: boolean;
  /** Daily challenge reminder at 6 pm, and whether the player was already asked for it. */
  reminder: boolean;
  reminderAsked: boolean;
  noAds: boolean;
  /** App Store transactions already paid out, so a replayed one never pays twice (kept on reset). */
  purchases: string[];
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
  /** Streak protections for the daily challenge (at most MAX_STREAK_SAVES). */
  streakSaves: number;
  /** Levels ever solved (the Pop-Cornédex) and the best stars of each, by level id. */
  found: number[];
  stars: Record<string, StarCount>;
  /** Levels cleared per day (recent days) and the best day ever. */
  activity: Record<string, number>;
  bestDay: { day: string; levels: number } | null;
  /** Login calendar: next gift (0 to 6) and the last day one was taken. */
  loginDay: number;
  loginLast: string | null;
  /** Announcer voice ("COMBO!", "FEVER!"). */
  voice: boolean;
  /** Gift codes already used on this device (kept on reset). */
  redeemedCodes: string[];
  /** Wins and cleared tiers, to ask for a rating at a happy moment; last time it was asked. */
  happyMoments: number;
  reviewAskedAt: string | null;
}

interface ProfileActions {
  set: (patch: Partial<ProfileState>) => void;
  addCoins: (n: number) => void;
  /** Spends coins if there are enough; returns false otherwise. */
  spend: (n: number) => boolean;
  addItem: (item: Item, n: number) => void;
  /** Uses one item if available; returns false otherwise. */
  useItem: (item: Item) => boolean;
  bumpStats: (
    patch: Partial<Omit<Stats, 'cat' | 'catTries'>> & { cat?: Partial<Stats['cat']>; catTries?: Partial<Stats['catTries']> },
    mode?: 'add' | 'max'
  ) => void;
  /** A level was solved: Pop-Cornédex, best stars, daily activity. Returns true on a first find. */
  recordSolve: (levelId: number, stars: StarCount) => boolean;
  /** Takes today's calendar gift; null when it was already taken today. */
  claimLogin: () => { reward: GiftReward; day: number } | null;
  setBest: (mode: Mode, score: number) => boolean;
  /** Returns the achievements that just got unlocked. */
  checkAchievements: () => string[];
  finishDaily: () => { rewarded: boolean; chest: boolean; saved: number };
  streak: () => number;
  adsLeft: () => number;
  countAd: () => void;
  /**
   * Pays out an App Store purchase once: 'granted', 'duplicate' (already paid, or the
   * no-ads pack bought again) or 'unknown' (a product this version does not sell).
   */
  grantPurchase: (transactionId: string, product: string) => 'granted' | 'duplicate' | 'unknown';
  reset: () => void;
}

/** Transactions remembered to avoid paying one twice. */
const MAX_PURCHASES = 200;

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
  music: true,
  haptics: true,
  reduceMotion: false,
  reminder: false,
  reminderAsked: false,
  noAds: false,
  purchases: [],
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
  streakSaves: 0,
  found: [],
  stars: {},
  activity: {},
  bestDay: null,
  loginDay: 0,
  loginLast: null,
  voice: true,
  redeemedCodes: [],
  happyMoments: 0,
  reviewAskedAt: null,
};

/**
 * AsyncStorage behind a guard: an unreadable save reads as "no save" instead of throwing
 * (which would leave the app on its splash screen), and a failed write (full disk) is ignored.
 */
const storage: PersistStorage<Partial<ProfileState>> = {
  getItem: async (name) => {
    try {
      const raw = await AsyncStorage.getItem(name);
      const value = raw ? JSON.parse(raw) : null;
      return value && typeof value === 'object' ? value : null;
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, JSON.stringify(value));
    } catch {
      // Nothing to do: the next change will try again.
    }
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // Same.
    }
  },
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
      addItem: (item, n) =>
        set((s) => ({ [item]: item === 'streakSaves' ? Math.min(MAX_STREAK_SAVES, s[item] + n) : s[item] + n }) as Partial<ProfileState>),
      useItem: (item) => {
        if (get()[item] <= 0) return false;
        set((s) => ({ [item]: s[item] - 1 }) as Partial<ProfileState>);
        return true;
      },
      bumpStats: (patch, mode = 'add') =>
        set((s) => {
          const stats = { ...s.stats, cat: { ...s.stats.cat }, catTries: { ...s.stats.catTries } };
          for (const [k, v] of Object.entries(patch)) {
            if (k === 'cat' || k === 'catTries' || typeof v !== 'number') continue;
            const key = k as keyof Omit<Stats, 'cat' | 'catTries'>;
            stats[key] = mode === 'max' ? Math.max(stats[key], v) : stats[key] + v;
          }
          for (const [k, v] of Object.entries(patch.cat ?? {})) stats.cat[k as keyof Stats['cat']] += v ?? 0;
          for (const [k, v] of Object.entries(patch.catTries ?? {})) stats.catTries[k as keyof Stats['catTries']] += v ?? 0;
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
        if (s.dailyLast === today) return { rewarded: false, chest: false, saved: 0 };
        // Missed days are covered by streak protections when there are enough.
        const { streak, used } = nextStreakWithSaves(s.dailyLast, today, s.dailyStreak, s.streakSaves);
        const chest = streak > 0 && streak % 7 === 0;
        set({
          streakSaves: s.streakSaves - used,
          dailyLast: today,
          dailyStreak: streak,
          dailyBestStreak: Math.max(s.dailyBestStreak, streak),
          hints: s.hints + REWARDS.daily.hints,
        });
        get().addCoins(REWARDS.daily.coins + (chest ? 300 : 0));
        get().bumpStats({ daily: 1 });
        return { rewarded: true, chest, saved: used };
      },
      streak: () => {
        const s = get();
        return currentStreak(s.dailyLast, dayKey(), s.dailyStreak, s.streakSaves);
      },
      recordSolve: (levelId, stars) => {
        const s = get();
        const key = String(levelId);
        const first = !s.found.includes(levelId);
        const today = dayKey();
        const todayCount = (s.activity[today] ?? 0) + 1;
        set({
          found: first ? [...s.found, levelId] : s.found,
          stars: stars > (s.stars[key] ?? 0) ? { ...s.stars, [key]: stars } : s.stars,
          activity: addActivity(s.activity, today),
          bestDay: !s.bestDay || todayCount > s.bestDay.levels ? { day: today, levels: todayCount } : s.bestDay,
        });
        return first;
      },
      claimLogin: () => {
        const s = get();
        const today = dayKey();
        if (!canClaimLogin(s.loginLast, today)) return null;
        const day = s.loginDay % LOGIN_REWARDS.length;
        const reward = LOGIN_REWARDS[day];
        set({ loginLast: today, loginDay: (day + 1) % LOGIN_REWARDS.length });
        if (reward.coins) get().addCoins(reward.coins);
        if (reward.hints) get().addItem('hints', reward.hints);
        if (reward.shields) get().addItem('shields', reward.shields);
        if (reward.skips) get().addItem('skips', reward.skips);
        if (reward.streakSaves) get().addItem('streakSaves', reward.streakSaves);
        return { reward, day };
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
      grantPurchase: (transactionId, product) => {
        const s = get();
        const goods = packGoods(product);
        if (!goods) return 'unknown';
        if (s.purchases.includes(transactionId)) return 'duplicate';
        const purchases = [...s.purchases, transactionId].slice(-MAX_PURCHASES);
        // The no-ads pack is bought once: restoring it again gives no second 1 000 coins.
        if (goods.noAds && s.noAds) {
          set({ purchases });
          return 'duplicate';
        }
        set({ coins: s.coins + goods.coins, noAds: s.noAds || goods.noAds, purchases });
        return 'granted';
      },
      // Settings, purchases, used gift codes and the rating request survive a reset.
      reset: () => {
        const s = get();
        set({
          ...INITIAL,
          lang: s.lang,
          tutorialDone: true,
          sound: s.sound,
          music: s.music,
          haptics: s.haptics,
          reduceMotion: s.reduceMotion,
          reminder: s.reminder,
          reminderAsked: s.reminderAsked,
          voice: s.voice,
          // Kept so a reset cannot be used to take today's calendar gift twice.
          loginDay: s.loginDay,
          loginLast: s.loginLast,
          redeemedCodes: s.redeemedCodes,
          // Paid for with real money: never lost.
          noAds: s.noAds,
          purchases: s.purchases,
          happyMoments: s.happyMoments,
          reviewAskedAt: s.reviewAskedAt,
        });
      },
    }),
    {
      name: 'popcorn-profile',
      version: 1,
      storage,
      // Any older shape is cleaned by `merge` below.
      migrate: (saved) => saved as Partial<ProfileState>,
      partialize: (s) => {
        const out: Partial<ProfileState> = {};
        for (const k of Object.keys(INITIAL) as (keyof ProfileState)[]) {
          (out as Record<string, unknown>)[k] = s[k];
        }
        return out;
      },
      merge: (saved, current) => ({ ...current, ...sanitizeProfile(saved, INITIAL) }),
    }
  )
);

export const ACHIEVEMENT_COUNT = ACHIEVEMENTS.length;
