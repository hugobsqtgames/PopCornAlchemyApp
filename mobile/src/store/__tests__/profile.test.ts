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
  state().set({ lang: 'fr', tutorialDone: true, coins: 0, dailyLast: null, dailyStreak: 0, adsDay: null, adsCount: 0, noAds: false, purchases: [] });
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
    // One wooden chest per trophy.
    expect(state().chests.wood).toBe(2);
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

  it('gives a gold chest every 7 days', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    state().set({ dailyLast: dayKey(yesterday), dailyStreak: 6 });
    expect(state().finishDaily().chest).toBe(true);
    expect(state().coins).toBe(REWARDS.daily.coins);
    expect(state().chests.gold).toBe(1);
  });
});

describe('chests and the coin doubler', () => {
  it('opens a chest once: rewards given, chest gone', () => {
    state().addChest('wood', 2);
    const coins = state().coins;
    const got = state().openChest('wood');
    expect(got?.[0]).toMatchObject({ kind: 'coins' });
    expect(state().coins).toBe(coins + (got?.[0] as { amount: number }).amount);
    expect(state().chests.wood).toBe(1);
    expect(state().openChest('gold')).toBeNull();
  });

  it('a legendary chest unlocks a theme the player did not have', () => {
    state().addChest('legend');
    const got = state().openChest('legend') ?? [];
    const theme = got.find((r) => r.kind === 'theme');
    expect(theme).toBeDefined();
    expect(state().ownedThemes).toContain((theme as { id: string }).id);
  });

  it('a doubler lasts 25 levels', () => {
    state().addItem('doubles', 1);
    expect(state().startDouble()).toBe(true);
    expect(state().doubleLevels).toBe(25);
    expect(state().doubles).toBe(0);
    expect(state().startDouble()).toBe(false);
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
      { lang: 'xx', coins: 'lots', hints: -3, stats: 'x', achievements: 'nope', theme: 'rainbow', style: 42, best: { classic: NaN, chrono: 30 }, received: {}, ownedThemes: null, avatar: null, dailyLast: 123, name: '🦊'.repeat(40) },
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
    expect(state().coins).toBe(15);
    expect(state().claimLogin()).toBeNull();
    state().set({ loginDay: 6, loginLast: '2000-01-01' });
    state().claimLogin();
    expect(state().streakSaves).toBe(1);
    // The 7th day: a wooden chest.
    expect(state().chests.wood).toBe(1);
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

describe('App Store purchases', () => {
  it('pays a pack once, by App Store id or short id', () => {
    const c0 = state().coins;
    expect(state().grantPurchase('t1', 'com.hugobsqt.popcornalchemy.coins_1200')).toBe('granted');
    expect(state().coins).toBe(c0 + 1200);
    // The same transaction replayed at the next launch pays nothing.
    expect(state().grantPurchase('t1', 'com.hugobsqt.popcornalchemy.coins_1200')).toBe('duplicate');
    expect(state().grantPurchase('t2', 'coins_500')).toBe('granted');
    expect(state().coins).toBe(c0 + 1700);
  });

  it('ignores products this version does not sell', () => {
    const c0 = state().coins;
    expect(state().grantPurchase('t3', 'com.hugobsqt.popcornalchemy.mystery')).toBe('unknown');
    expect(state().coins).toBe(c0);
  });

  it('gives the no-ads pack coins only once, and keeps it after a reset', () => {
    const c0 = state().coins;
    expect(state().grantPurchase('t4', 'com.hugobsqt.popcornalchemy.no_ads')).toBe('granted');
    expect(state().noAds).toBe(true);
    expect(state().coins).toBe(c0 + 1000);
    expect(state().grantPurchase('t5', 'com.hugobsqt.popcornalchemy.no_ads')).toBe('duplicate');
    expect(state().coins).toBe(c0 + 1000);
    state().reset();
    expect(state().noAds).toBe(true);
    expect(state().purchases).toContain('t4#no_ads');
  });

  it('repairs a damaged purchase list', () => {
    const p = sanitizeProfile({ purchases: ['a', 'a', 3, '', 'x'.repeat(500), 'b'] }, useProfile.getInitialState());
    expect(p.purchases).toEqual(['a', 'b']);
  });
});

describe('adventure map progress', () => {
  it('only goes forward, never past the end, and survives damaged saves', () => {
    state().reachAdventure(1, 5);
    state().reachAdventure(1, 3);
    expect(state().adventure[1]).toBe(5);
    state().reachAdventure(3, 99999);
    expect(state().adventure[3]).toBe(70);
    const p = sanitizeProfile({ adventure: { 1: -4, 2: 'x', 3: 1e9 } }, useProfile.getInitialState());
    expect(p.adventure).toEqual({ 1: 0, 2: 0, 3: 70 });
  });

  it('keeps the map flag of a saved run only with the map levels', () => {
    const { adventureIds } = jest.requireActual<typeof import('@/game/rules')>('@/game/rules');
    const ids = adventureIds(2);
    const good = cleanSave({ mode: 'classic', difficulty: 2, adventure: true, ids, index: 3, lives: 2, score: 10, combo: 0, continued: false });
    expect(good?.adventure).toBe(true);
    const shuffled = cleanSave({ mode: 'classic', difficulty: 2, adventure: true, ids: [...ids].reverse(), index: 3, lives: 2, score: 10, combo: 0, continued: false });
    expect(shuffled?.adventure).toBeUndefined();
  });
});
