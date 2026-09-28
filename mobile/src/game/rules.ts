import { LEVELS } from './levels';
import { mulberry32, shuffle } from './random';
import type { Category, Difficulty, Level, Mode, RunConfig } from './types';

export const TIER_SIZE = 20;
export const GRID_SIZE = 20;
export const LIVES = 4;
export const DAILY_LENGTH = 10;
export const CHALLENGE_LENGTH = 5;
export const CHRONO_SECONDS = 60;
export const CHRONO_BONUS_SECONDS = 3;
export const CHRONO_PENALTY_SECONDS = 5;
export const FEVER_COMBO = 5;
/** How long the answer stays on screen after a missed or skipped level. */
export const REVEAL_MS = 2200;
/** Zen has no lives: the answer shows after this many wrong tries on the same level. */
export const ZEN_TRIES = 3;
/** Decoys taken off the grid by the cheaper clue. */
export const DECOYS_REMOVED = 5;

export const PRICES = {
  hints5: 100,
  shield: 150,
  skip: 200,
  double: 250,
  /** A streak freeze for the daily challenge (at most 2 held). */
  streakSave: 250,
  avatar: 200,
  continue: 150,
  /** Taking 5 wrong emojis off the grid, paid in coins during a level. */
  removeDecoys: 15,
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
  { id: 'food', icon: '🍕' },
  { id: 'nature', icon: '🌿' },
  { id: 'geo', icon: '🌍' },
  { id: 'place', icon: '🗺️' },
  { id: 'sport', icon: '⚽' },
  { id: 'job', icon: '👷' },
  { id: 'tale', icon: '🧚' },
  { id: 'home', icon: '🏠' },
  { id: 'party', icon: '🎉' },
  { id: 'brand', icon: '🏷️' },
  { id: 'game', icon: '🎮' },
  { id: 'music', icon: '🎵' },
  { id: 'anime', icon: '🏮' },
  { id: 'youtube', icon: '🎥' },
];

export const DIFFICULTIES: Difficulty[] = [1, 2, 3];

const LEVEL_BY_ID = new Map(LEVELS.map((l) => [l.id, l]));

export function levelById(id: number): Level | undefined {
  return LEVEL_BY_ID.get(id);
}

export function levelsOfCategory(cat: Category): Level[] {
  return LEVELS.filter((l) => l.cat === cat);
}

export function levelsOfDifficulty(d: Difficulty): Level[] {
  return LEVELS.filter((l) => l.d === d);
}

/** Shuffles inside each group of `size` levels, so the order still goes from easy to hard. */
function curve(levels: Level[], size: number, rng: () => number): number[] {
  const ids: number[] = [];
  for (let i = 0; i < levels.length; i += size) ids.push(...shuffle(levels.slice(i, i + size), rng).map((l) => l.id));
  return ids;
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

/** Picks `count` decoys to take off the grid: never part of the answer, picked, or already gone. */
export function decoysToRemove(
  grid: readonly string[],
  solution: readonly string[],
  picked: readonly number[],
  removed: readonly number[],
  count = DECOYS_REMOVED,
  rng: () => number = Math.random
): number[] {
  const candidates = grid
    .map((_, i) => i)
    .filter((i) => !solution.includes(grid[i]) && !picked.includes(i) && !removed.includes(i));
  return shuffle(candidates, rng).slice(0, count);
}

/** Shuffles the tiles; picked and removed tiles follow their emoji to its new place. */
export function shuffleGrid(
  grid: readonly string[],
  picked: readonly number[],
  removed: readonly number[],
  rng: () => number = Math.random
): { grid: string[]; picked: number[]; removed: number[] } {
  const order = shuffle(grid.map((_, i) => i), rng);
  const where = (old: number) => order.indexOf(old);
  return { grid: order.map((i) => grid[i]), picked: picked.map(where), removed: removed.map(where) };
}

/** True when the picked emojis are exactly the solution, in any order. */
export function isCorrect(picked: string[], solution: string[]): boolean {
  if (picked.length !== solution.length) return false;
  const a = [...picked].sort();
  const b = [...solution].sort();
  return a.every((e, i) => e === b[i]);
}

const ADVENTURES = new Map<Difficulty, number[]>();
/**
 * The adventure of one difficulty, as drawn on the map: always the same levels in the same
 * order (easy to hard, shuffled once inside each tier with a fixed seed).
 */
export function adventureIds(d: Difficulty): number[] {
  let ids = ADVENTURES.get(d);
  if (!ids) {
    ids = curve(levelsOfDifficulty(d), TIER_SIZE, mulberry32(1000 + d));
    ADVENTURES.set(d, ids);
  }
  return ids;
}

/** Level ids for a new run, in play order. */
export function buildRun(
  mode: Exclude<Mode, 'daily' | 'challenge' | 'tutorial' | 'replay'>,
  options: { category?: Category; difficulty?: Difficulty } = {},
  rng: () => number = Math.random
): RunConfig {
  const { category, difficulty } = options;
  if (mode === 'category' && category) {
    // Easy levels of the category first, then medium, then hard.
    const ids = DIFFICULTIES.flatMap((d) => shuffle(levelsOfCategory(category).filter((l) => l.d === d), rng).map((l) => l.id));
    return { mode, category, ids };
  }
  if (mode === 'chrono' || mode === 'zen') {
    // Against the clock, or just relaxing: easy and medium levels only.
    return { mode, ids: shuffle(LEVELS.filter((l) => l.d < 3), rng).map((l) => l.id) };
  }
  if (mode === 'classic' && difficulty) {
    return { mode, difficulty, ids: curve(levelsOfDifficulty(difficulty), TIER_SIZE, rng) };
  }
  // Hardcore (and old classic runs) go through every level, from easy to hard, tier by tier.
  return { mode, ids: curve(LEVELS, TIER_SIZE, rng) };
}

/** The same 10 levels for everybody on a given day: 4 easy, 4 medium, 2 hard. */
export function buildDaily(seed: number): RunConfig {
  const rng = mulberry32(seed);
  const pick = (d: Difficulty, n: number) => shuffle(levelsOfDifficulty(d), rng).slice(0, n).map((l) => l.id);
  return { mode: 'daily', ids: [...pick(1, 4), ...pick(2, 4), ...pick(3, DAILY_LENGTH - 8)] };
}

export function startLives(mode: Mode): number {
  if (mode === 'hardcore') return 1;
  if (mode === 'chrono' || mode === 'replay' || isRelaxed(mode)) return 0;
  return LIVES;
}

/** Zen and the guided first level: no clock and no lives. */
export function isRelaxed(mode: Mode): boolean {
  return mode === 'zen' || mode === 'tutorial';
}

/**
 * Runs that can be left and resumed from the home screen. Chrono (the clock would restart),
 * the daily challenge, friend challenges and zen always start over, so they never
 * replace the saved adventure.
 */
export function canSave(mode: Mode): boolean {
  return mode === 'classic' || mode === 'category' || mode === 'hardcore';
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
