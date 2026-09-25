import { LEVELS } from './levels';
import { mulberry32, shuffle } from './random';
import type { Category, Level, Mode, RunConfig } from './types';

export const TIER_SIZE = 20;
export const GRID_SIZE = 20;
export const LIVES = 4;
export const DAILY_LENGTH = 10;
export const CHALLENGE_LENGTH = 5;
export const CHRONO_SECONDS = 60;
export const CHRONO_BONUS_SECONDS = 3;
export const CHRONO_PENALTY_SECONDS = 5;
export const FEVER_COMBO = 5;

export const PRICES = {
  hints5: 100,
  shield: 150,
  skip: 200,
  double: 250,
  avatar: 200,
  continue: 150,
} as const;

export const REWARDS = {
  tier: { coins: 50, hints: 3 },
  daily: { coins: 50, hints: 2 },
  classicVictory: 500,
  categoryVictory: 100,
  ad: 25,
  adsPerDay: 5,
} as const;

export const CATEGORIES: { id: Category; icon: string }[] = [
  { id: 'movie', icon: '🎬' },
  { id: 'series', icon: '📺' },
  { id: 'game', icon: '🎮' },
  { id: 'music', icon: '🎵' },
  { id: 'geo', icon: '🌍' },
  { id: 'brand', icon: '🏷️' },
  { id: 'nature', icon: '🌿' },
  { id: 'youtube', icon: '🎥' },
  { id: 'anime', icon: '🏮' },
  { id: 'food', icon: '🍕' },
];

const LEVEL_BY_ID = new Map(LEVELS.map((l) => [l.id, l]));

export function levelById(id: number): Level | undefined {
  return LEVEL_BY_ID.get(id);
}

export function levelsOfCategory(cat: Category): Level[] {
  return LEVELS.filter((l) => l.cat === cat);
}

/** Decoys shown next to the solution; any that are part of the solution are skipped. */
export const DECOYS = [
  '🔥', '💧', '⚡', '🌈', '💀', '🍕', '🚗', '🎮', '🎸', '👽', '🍔', '🍦', '🚀', '💎', '👑', '🎩',
  '👠', '🎻', '🎲', '🎯', '🎨', '🎭', '🎪', '🎫', '🎬', '🎤', '🎧', '🎷', '🎺', '🎹', '🥨', '🍩',
  '🍿', '🥤', '🛹', '🚲', '🛸', '🪐', '🐶', '🌵', '⚓', '🧲', '🎈', '🕶️',
];

/** Builds the 20 tiles for a level: its solution plus decoys, shuffled. */
export function buildGrid(level: Level, rng: () => number = Math.random): string[] {
  const used = new Set(level.sol);
  const decoys = shuffle(
    DECOYS.filter((e) => !used.has(e)),
    rng
  ).slice(0, GRID_SIZE - level.sol.length);
  return shuffle([...level.sol, ...decoys], rng);
}

/** True when the picked emojis are exactly the solution, in any order. */
export function isCorrect(picked: string[], solution: string[]): boolean {
  if (picked.length !== solution.length) return false;
  const a = [...picked].sort();
  const b = [...solution].sort();
  return a.every((e, i) => e === b[i]);
}

/** Level ids for a new run, in play order. */
export function buildRun(
  mode: Exclude<Mode, 'daily' | 'challenge'>,
  category?: Category,
  rng: () => number = Math.random
): RunConfig {
  if (mode === 'category' && category) {
    return { mode, category, ids: shuffle(levelsOfCategory(category), rng).map((l) => l.id) };
  }
  if (mode === 'chrono') {
    return { mode, ids: shuffle(LEVELS, rng).map((l) => l.id) };
  }
  // Classic and hardcore keep the difficulty curve: shuffle inside each tier only.
  const ids: number[] = [];
  for (let i = 0; i < LEVELS.length; i += TIER_SIZE) {
    ids.push(...shuffle(LEVELS.slice(i, i + TIER_SIZE), rng).map((l) => l.id));
  }
  return { mode, ids };
}

/** The same 10 levels for everybody on a given day. */
export function buildDaily(seed: number): RunConfig {
  return { mode: 'daily', ids: shuffle(LEVELS, mulberry32(seed)).slice(0, DAILY_LENGTH).map((l) => l.id) };
}

export function startLives(mode: Mode): number {
  if (mode === 'hardcore') return 1;
  if (mode === 'chrono') return 0;
  return LIVES;
}

/** Runs split into tiers of 20 get a break screen and fresh lives between tiers. */
export function hasTiers(mode: Mode): boolean {
  return mode === 'classic' || mode === 'hardcore' || mode === 'category';
}

export function tierOf(index: number): number {
  return Math.floor(index / TIER_SIZE);
}

/** Time allowed for the speed bonus of one level; it shrinks as the run goes on. */
export function bonusTimeMs(index: number): number {
  return Math.max(6000, 20000 - index * 60 - tierOf(index) * 800);
}

export interface ScoreInput {
  index: number;
  /** Share of the bonus time left, 0 to 1. */
  timeLeft: number;
  /** Combo including this answer. */
  combo: number;
  styleBonus: number;
}

export function isFever(combo: number): boolean {
  return combo >= FEVER_COMBO;
}

export function pointsFor({ index, timeLeft, combo, styleBonus }: ScoreInput): number {
  const base = 100 + 25 * tierOf(index) + Math.round(100 * clamp01(timeLeft));
  return Math.round(base * (isFever(combo) ? 2 : 1) * styleBonus);
}

export function coinsFor(opts: { timeLeft: number; combo: number; mode: Mode; double: boolean }): number {
  const base = 5 + Math.round(5 * clamp01(opts.timeLeft)) + Math.min(opts.combo, 5);
  return base * (opts.mode === 'hardcore' ? 2 : 1) * (opts.double ? 2 : 1);
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
