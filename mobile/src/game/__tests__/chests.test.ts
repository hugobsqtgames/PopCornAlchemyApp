import { describe, expect, it } from '@jest/globals';

import { AVATARS, STYLES, THEMES } from '../catalog';
import { CHEST_COINS, isMapChest, rollChest, surpriseChest, tierChest, type ChestReward, type Owned } from '../chests';

const fresh: Owned = { themes: ['popcorn'], styles: ['🍿'], avatars: ['🍿'], streakSaves: 0, maxStreakSaves: 2 };
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const coinsOf = (r: ChestReward[]) => (r[0].kind === 'coins' ? r[0].amount : -1);

describe('chests', () => {
  it('give coins in their range, coins first', () => {
    for (const kind of ['wood', 'gold', 'legend'] as const) {
      for (let i = 1; i < 300; i++) {
        const r = rollChest(kind, fresh, rng(i));
        expect(coinsOf(r)).toBeGreaterThanOrEqual(CHEST_COINS[kind][0]);
        expect(coinsOf(r)).toBeLessThanOrEqual(CHEST_COINS[kind][1]);
      }
    }
  });

  it('wood: coins and one item', () => {
    const r = rollChest('wood', fresh, rng(3));
    expect(r).toHaveLength(2);
    expect(r[1].kind).toBe('item');
  });

  it('gold: hints and two different items, never a streak protection when full', () => {
    for (let i = 1; i < 300; i++) {
      const r = rollChest('gold', { ...fresh, streakSaves: 2 }, rng(i));
      const items = r.filter((x) => x.kind === 'item').map((x) => (x as { item: string }).item);
      expect(items[0]).toBe('hints');
      expect(new Set(items.slice(1)).size).toBe(2);
      expect(items).not.toContain('streakSaves');
    }
  });

  it('legendary: always something new to wear, never one already owned', () => {
    const allThemes = THEMES.map((t) => t.id);
    expect(rollChest('legend', fresh, rng(5)).some((x) => x.kind === 'theme')).toBe(true);
    const noThemes = { ...fresh, themes: allThemes };
    const r = rollChest('legend', noThemes, rng(5));
    const style = r.find((x) => x.kind === 'style') as { id: string };
    expect(style).toBeDefined();
    expect(fresh.styles).not.toContain(style.id);
    // Everything owned: extra coins instead.
    const all = { ...fresh, themes: allThemes, styles: [...STYLES], avatars: [...AVATARS] };
    const rich = rollChest('legend', all, rng(5));
    expect(rich.every((x) => x.kind === 'coins' || x.kind === 'item')).toBe(true);
    expect(coinsOf(rich)).toBeGreaterThanOrEqual(CHEST_COINS.legend[0] + 400);
  });

  it('a chest in the middle of each world of the map, and rare surprises', () => {
    expect([0, 8, 9, 10, 19, 29, 49].map(isMapChest)).toEqual([false, false, true, false, false, true, true]);
    expect(surpriseChest(() => 0.01)).toBe(true);
    expect(surpriseChest(() => 0.5)).toBe(false);
  });

  it('a gold chest every 5 tiers, wood otherwise', () => {
    expect([1, 2, 3, 4, 5, 6, 10].map(tierChest)).toEqual(['wood', 'wood', 'wood', 'wood', 'gold', 'wood', 'gold']);
  });
});
