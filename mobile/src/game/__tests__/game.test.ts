import { describe, expect, it } from '@jest/globals';

import { ACHIEVEMENTS, EMPTY_STATS, newlyUnlocked } from '../achievements';
import { currentStreak, dayKey, daysBetween, nextStreak } from '../dates';
import { LEVELS } from '../levels';
import { mulberry32 } from '../random';
import {
  buildDaily,
  buildGrid,
  buildRun,
  coinsFor,
  GRID_SIZE,
  isCorrect,
  levelById,
  pointsFor,
  TIER_SIZE,
} from '../rules';
import { pickSlice, SLICE_DEG, spinRotation, WHEEL } from '../wheel';

describe('levels', () => {
  it('has 200 levels with unique ids and names in 3 languages', () => {
    expect(LEVELS).toHaveLength(200);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(200);
    for (const l of LEVELS) {
      expect(l.name.fr && l.name.en && l.name.es).toBeTruthy();
      expect(l.sol.length).toBeGreaterThanOrEqual(2);
      expect(l.sol.length).toBeLessThanOrEqual(5);
    }
  });

  it('gets harder: solutions never shrink along the list', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].sol.length).toBeGreaterThanOrEqual(LEVELS[i - 1].sol.length);
    }
  });
});

describe('grid', () => {
  it('always has 20 tiles containing the full solution', () => {
    const rng = mulberry32(42);
    for (const level of LEVELS) {
      const grid = buildGrid(level, rng);
      expect(grid).toHaveLength(GRID_SIZE);
      const left = [...grid];
      for (const e of level.sol) {
        const i = left.indexOf(e);
        expect(i).toBeGreaterThanOrEqual(0);
        left.splice(i, 1);
      }
    }
  });

  it('accepts the solution in any order and nothing else', () => {
    expect(isCorrect(['🧊', '🚢'], ['🚢', '🧊'])).toBe(true);
    expect(isCorrect(['🍝', '🇮🇹'], ['🍝', '🍝', '🇮🇹'])).toBe(false);
    expect(isCorrect(['🍝', '🍝', '🇮🇹'], ['🍝', '🍝', '🇮🇹'])).toBe(true);
    expect(isCorrect(['🚢', '🔥'], ['🚢', '🧊'])).toBe(false);
  });
});

describe('runs', () => {
  it('classic keeps every level inside its tier', () => {
    const run = buildRun('classic', undefined, mulberry32(1));
    expect(run.ids).toHaveLength(200);
    run.ids.forEach((id, i) => {
      const tier = Math.floor(LEVELS.findIndex((l) => l.id === id) / TIER_SIZE);
      expect(tier).toBe(Math.floor(i / TIER_SIZE));
    });
  });

  it('category runs only contain that category', () => {
    const run = buildRun('category', 'anime');
    expect(run.ids.length).toBeGreaterThan(0);
    expect(run.ids.every((id) => levelById(id)?.cat === 'anime')).toBe(true);
  });

  it('daily is the same for everybody on the same day and differs the next day', () => {
    expect(buildDaily(20260925).ids).toEqual(buildDaily(20260925).ids);
    expect(buildDaily(20260925).ids).not.toEqual(buildDaily(20260926).ids);
    expect(buildDaily(20260925).ids).toHaveLength(10);
  });
});

describe('score and coins', () => {
  it('rewards speed, tiers and fever', () => {
    const slow = pointsFor({ index: 0, timeLeft: 0, combo: 1, styleBonus: 1 });
    const fast = pointsFor({ index: 0, timeLeft: 1, combo: 1, styleBonus: 1 });
    const fever = pointsFor({ index: 0, timeLeft: 1, combo: 5, styleBonus: 1 });
    const later = pointsFor({ index: 40, timeLeft: 1, combo: 1, styleBonus: 1 });
    expect(slow).toBe(100);
    expect(fast).toBe(200);
    expect(fever).toBe(400);
    expect(later).toBe(250);
  });

  it('gives 5 to 15 coins per level, doubled in hardcore and with a doubler', () => {
    expect(coinsFor({ timeLeft: 0, combo: 0, mode: 'classic', double: false })).toBe(5);
    expect(coinsFor({ timeLeft: 1, combo: 9, mode: 'classic', double: false })).toBe(15);
    expect(coinsFor({ timeLeft: 1, combo: 9, mode: 'hardcore', double: true })).toBe(60);
  });
});

describe('daily streak', () => {
  it('uses local days', () => {
    expect(dayKey(new Date(2026, 8, 25, 23, 59))).toBe('2026-09-25');
    expect(daysBetween('2026-09-30', '2026-10-01')).toBe(1);
  });

  it('grows on consecutive days and restarts after a gap', () => {
    expect(nextStreak(null, '2026-09-25', 0)).toBe(1);
    expect(nextStreak('2026-09-24', '2026-09-25', 4)).toBe(5);
    expect(nextStreak('2026-09-25', '2026-09-25', 4)).toBe(4);
    expect(nextStreak('2026-09-22', '2026-09-25', 4)).toBe(1);
    expect(currentStreak('2026-09-24', '2026-09-25', 4)).toBe(4);
    expect(currentStreak('2026-09-23', '2026-09-25', 4)).toBe(0);
  });
});

describe('wheel', () => {
  it('stops the chosen slice under the pointer', () => {
    WHEEL.forEach((_, i) => {
      const r = spinRotation(i) % 360;
      expect((r + i * SLICE_DEG) % 360).toBe(0);
    });
    const counts = WHEEL.map(() => 0);
    const rng = mulberry32(7);
    for (let i = 0; i < 2000; i++) counts[pickSlice(rng)]++;
    expect(counts.every((c) => c > 0)).toBe(true);
  });
});

describe('achievements', () => {
  it('has unique ids and valid parents', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    expect(ids.size).toBe(ACHIEVEMENTS.length);
    ACHIEVEMENTS.forEach((a) => a.parent && expect(ids.has(a.parent)).toBe(true));
  });

  it('unlocks only what was just reached', () => {
    const ctx = { stats: { ...EMPTY_STATS, levels: 10, bestCombo: 5 }, coins: 0, streak: 0, themesOwned: 1 };
    expect(newlyUnlocked(ctx, [])).toEqual(['first_fusion', 'level_10', 'combo_5']);
    expect(newlyUnlocked(ctx, ['first_fusion', 'level_10'])).toEqual(['combo_5']);
  });
});
