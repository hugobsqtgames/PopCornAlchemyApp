import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { dayKey } from '@/game/dates';
import { REWARDS } from '@/game/rules';

import { useProfile } from '../profile';
import { cleanSave, sanitizeProfile } from '../sanitize';

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
    expect(state().finishDaily()).toEqual({ rewarded: true, chest: false, saved: 0 });
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

describe('damaged saves', () => {
  const INITIAL = { ...useProfile.getInitialState() };

  it('replaces every wrong value with its default', () => {
    const p = sanitizeProfile(
      { lang: 'de', coins: 'lots', hints: -3, stats: 'x', achievements: 'nope', theme: 'rainbow', style: 42, best: { classic: NaN, chrono: 30 }, received: {}, ownedThemes: null, avatar: null, dailyLast: 123, name: '🦊'.repeat(40) },
      INITIAL
    );
    expect(p.lang).toBeNull();
    expect(p.coins).toBe(INITIAL.coins);
    expect(p.hints).toBe(0);
    expect(p.stats.levels).toBe(0);
    expect(p.achievements).toEqual([]);
    expect(p.theme).toBe('popcorn');
    expect(p.style).toBe('🍿');
    expect(p.best).toEqual({ classic: 0, chrono: 30 });
    expect(p.received).toEqual([]);
    expect(p.ownedThemes).toEqual(['popcorn']);
    expect(p.dailyLast).toBeNull();
    expect([...p.name]).toHaveLength(20);
  });

  it('repairs the Pop-Cornédex, calendar and statistics', () => {
    const p = sanitizeProfile(
      { found: [1, 1, 'x', 99999, 2], stars: { 1: 7, 2: 2, abc: 3 }, loginDay: 99, streakSaves: 50, stats: { cat: { movie: 5 }, catTries: { movie: 2 } } },
      INITIAL
    );
    expect(p.found).toEqual([1, 2]);
    expect(p.stars).toEqual({ 2: 2 });
    expect(p.loginDay).toBe(0);
    expect(p.streakSaves).toBe(2);
    // Never fewer tries than right answers: older saves start at 100 %.
    expect(p.stats.catTries.movie).toBe(5);
  });

  it('drops a saved run that points outside its levels', () => {
    expect(cleanSave({ mode: 'classic', ids: [1, 5], index: 9, lives: 4, score: 0, combo: 0, continued: false })).toBeNull();
    expect(cleanSave({ mode: 'classic', ids: [1, 999999], index: 0, lives: 4 })).toBeNull();
    expect(cleanSave({ mode: 'classic', ids: [1, 5], index: 1, lives: 0 })).toBeNull();
    expect(cleanSave({ mode: 'classic', difficulty: 2, ids: [1, 5], index: 1, lives: 3, score: 40, combo: 2, continued: true })).toEqual({
      mode: 'classic',
      difficulty: 2,
      ids: [1, 5],
      index: 1,
      lives: 3,
      score: 40,
      combo: 2,
      continued: true,
    });
  });

  it('keeps a good save as it is', () => {
    state().addCoins(123);
    state().set({ theme: 'mint', ownedThemes: ['popcorn', 'mint'], name: 'Léa' });
    const saved = JSON.parse(JSON.stringify(state()));
    const p = sanitizeProfile(saved, INITIAL);
    expect(p.coins).toBe(123);
    expect(p.theme).toBe('mint');
    expect(p.name).toBe('Léa');
  });
});

describe('Pop-Cornédex, calendar and streak protection', () => {
  it('records finds and keeps the best stars', () => {
    expect(state().recordSolve(1, 2)).toBe(true);
    expect(state().recordSolve(1, 1)).toBe(false);
    expect(state().stars['1']).toBe(2);
    state().recordSolve(1, 3);
    expect(state().stars['1']).toBe(3);
    expect(state().found).toEqual([1]);
    expect(state().bestDay?.levels).toBe(3);
  });

  it('gives one calendar gift a day, in order', () => {
    state().set({ loginDay: 0, loginLast: null });
    const first = state().claimLogin();
    expect(first?.day).toBe(0);
    expect(state().coins).toBe(25);
    expect(state().claimLogin()).toBeNull();
    state().set({ loginDay: 6, loginLast: '2000-01-01' });
    state().claimLogin();
    expect(state().streakSaves).toBe(1);
    expect(state().loginDay).toBe(0);
  });

  it('uses a protection for a missed day of the daily challenge', () => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    state().set({ dailyLast: dayKey(d), dailyStreak: 5, streakSaves: 2 });
    expect(state().streak()).toBe(5);
    const r = state().finishDaily();
    expect(r.saved).toBe(1);
    expect(state().dailyStreak).toBe(6);
    expect(state().streakSaves).toBe(1);
  });

  it('never holds more than 2 protections', () => {
    state().addItem('streakSaves', 5);
    expect(state().streakSaves).toBe(2);
  });
});
