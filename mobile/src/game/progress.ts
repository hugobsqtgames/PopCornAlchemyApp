/** Stars, the login calendar and the numbers of the statistics page. */
import type { Stats } from './achievements';
import type { GiftReward } from './codes';
import { CATEGORIES } from './rules';
import type { Category } from './types';

export type StarCount = 1 | 2 | 3;

/** Share of the bonus time that must be left for the speed star. */
export const FAST_ANSWER = 0.5;

/** 1 star for the answer, +1 with no clue and no mistake, +1 for a fast answer. */
export function starsFor({ clueUsed, mistakes, timeLeft }: { clueUsed: boolean; mistakes: number; timeLeft: number }): StarCount {
  let n = 1;
  if (!clueUsed && mistakes === 0) n++;
  if (timeLeft >= FAST_ANSWER) n++;
  return n as StarCount;
}

/** Most streak protections a player can hold. */
export const MAX_STREAK_SAVES = 2;

/** One gift per day the app is opened; the 7th is the big one, then it starts again. */
export const LOGIN_REWARDS: GiftReward[] = [
  { coins: 25 },
  { hints: 1 },
  { coins: 50 },
  { shields: 1 },
  { coins: 75 },
  { hints: 2 },
  { coins: 200, streakSaves: 1 },
];

export function canClaimLogin(lastClaim: string | null, today: string): boolean {
  return lastClaim !== today;
}

/** Days kept in the daily activity history (the best day is kept separately forever). */
export const ACTIVITY_DAYS = 120;

/** Adds one cleared level to `day`, forgetting days older than the history. */
export function addActivity(activity: Record<string, number>, day: string): Record<string, number> {
  const next = { ...activity, [day]: (activity[day] ?? 0) + 1 };
  const days = Object.keys(next).sort();
  for (const old of days.slice(0, Math.max(0, days.length - ACTIVITY_DAYS))) delete next[old];
  return next;
}

export interface CategoryStat {
  cat: Category;
  wins: number;
  tries: number;
  /** 0 to 1; null when the category was never played. */
  accuracy: number | null;
}

/** Accuracy per category (a save from before this page existed has wins but no tries). */
export function categoryStats(stats: Stats): CategoryStat[] {
  return CATEGORIES.map(({ id }) => {
    const wins = stats.cat[id] ?? 0;
    const tries = Math.max(stats.catTries[id] ?? 0, wins);
    return { cat: id, wins, tries, accuracy: tries ? wins / tries : null };
  });
}

/** The category with the most right answers, or null before the first one. */
export function favoriteCategory(stats: Stats): Category | null {
  let best: Category | null = null;
  for (const { id } of CATEGORIES) if ((stats.cat[id] ?? 0) > (best ? stats.cat[best] : 0)) best = id;
  return best;
}

/** "2 h 05", "12 min", "45 s". */
export function formatDuration(seconds: number): { h: number; m: number; s: number } {
  const t = Math.max(0, Math.floor(seconds));
  return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
}
