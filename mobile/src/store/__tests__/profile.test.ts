import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { dayKey } from '@/game/dates';
import { REWARDS } from '@/game/rules';

import { useProfile } from '../profile';

// jest.mock calls are hoisted above the imports.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const state = () => useProfile.getState();

beforeEach(() => {
  state().reset();
  state().set({ lang: 'fr', tutorialDone: true, coins: 0, dailyLast: null, dailyStreak: 0, adsDay: null, adsCount: 0 });
});

describe('coins and items', () => {
  it('only spends what the player has', () => {
    state().addCoins(100);
    expect(state().spend(150)).toBe(false);
    expect(state().coins).toBe(100);
    expect(state().spend(60)).toBe(true);
    expect(state().coins).toBe(40);
  });

  it('counts earned coins in the stats, not spent ones', () => {
    state().addCoins(100);
    state().spend(50);
    expect(state().stats.coinsEarned).toBe(100);
  });

  it('uses items one at a time and never below zero', () => {
    expect(state().hints).toBe(3);
    expect(state().useItem('shields')).toBe(false);
    state().addItem('shields', 1);
    expect(state().useItem('shields')).toBe(true);
    expect(state().shields).toBe(0);
  });
});

describe('stats and records', () => {
  it('adds or keeps the max', () => {
    state().bumpStats({ levels: 2, cat: { anime: 1 } });
    state().bumpStats({ bestCombo: 7 }, 'max');
    state().bumpStats({ bestCombo: 3 }, 'max');
    expect(state().stats.levels).toBe(2);
    expect(state().stats.cat.anime).toBe(1);
    expect(state().stats.bestCombo).toBe(7);
  });

  it('reports a new record only when an older one is beaten', () => {
    expect(state().setBest('classic', 1000)).toBe(false);
    expect(state().setBest('classic', 800)).toBe(false);
    expect(state().setBest('classic', 1200)).toBe(true);
    expect(state().best.classic).toBe(1200);
  });

  it('unlocks achievements once', () => {
    state().bumpStats({ levels: 10 });
    expect(state().checkAchievements()).toEqual(['first_fusion', 'level_10']);
    expect(state().checkAchievements()).toEqual([]);
  });
});

describe('daily challenge', () => {
  it('rewards once a day and grows the streak', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    state().set({ dailyLast: dayKey(yesterday), dailyStreak: 2 });
    expect(state().finishDaily()).toEqual({ rewarded: true, chest: false });
    expect(state().coins).toBe(REWARDS.daily.coins);
    expect(state().dailyStreak).toBe(3);
    expect(state().streak()).toBe(3);
    expect(state().finishDaily().rewarded).toBe(false);
    expect(state().coins).toBe(REWARDS.daily.coins);
  });

  it('opens the chest every 7 days', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    state().set({ dailyLast: dayKey(yesterday), dailyStreak: 6 });
    expect(state().finishDaily().chest).toBe(true);
    expect(state().coins).toBe(REWARDS.daily.coins + 300);
  });
});

describe('ads and reset', () => {
  it('limits free coin ads per day', () => {
    for (let i = 0; i < REWARDS.adsPerDay; i++) state().countAd();
    expect(state().adsLeft()).toBe(0);
  });

  it('reset keeps the language but clears progress', () => {
    state().addCoins(500);
    state().set({ lang: 'es', theme: 'mint', ownedThemes: ['popcorn', 'mint'] });
    state().reset();
    expect(state().lang).toBe('es');
    expect(state().coins).toBe(0);
    expect(state().theme).toBe('popcorn');
    expect(state().tutorialDone).toBe(true);
  });
});
