import { describe, expect, it, jest } from '@jest/globals';

import { mergeProfiles, sharedPart, type SharedProfile } from '../cloud-merge';
import { useProfile } from '../profile';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const base = (patch: Partial<SharedProfile> = {}): SharedProfile => ({ ...sharedPart(useProfile.getInitialState()), tutorialDone: true, ...patch });

describe('iCloud: merging two devices', () => {
  it('keeps every answer found and the best stars of both', () => {
    const iphone = base({ found: [1, 2], stars: { 1: 3, 2: 1 } });
    const ipad = base({ found: [2, 7], stars: { 2: 2, 7: 1 } });
    const m = mergeProfiles(iphone, 100, ipad, 200);
    expect([...m.found].sort((a, b) => a - b)).toEqual([1, 2, 7]);
    expect(m.stars).toEqual({ 1: 3, 2: 2, 7: 1 });
  });

  it('takes coins and items from the device that played last', () => {
    const iphone = base({ coins: 900, hints: 1 });
    const ipad = base({ coins: 300, hints: 8 });
    expect(mergeProfiles(iphone, 500, ipad, 200).coins).toBe(900);
    expect(mergeProfiles(iphone, 100, ipad, 200)).toMatchObject({ coins: 300, hints: 8 });
  });

  it('never loses a pack bought on the other device', () => {
    const iphone = base({ coins: 100, purchases: ['tx1#coins_1200'] });
    const ipad = base({ coins: 50, purchases: [] });
    // The iPad played last but never saw the iPhone purchase: its 1200 coins are added.
    const m = mergeProfiles(iphone, 100, ipad, 200);
    expect(m.coins).toBe(1250);
    expect(m.purchases).toContain('tx1#coins_1200');
    // Once both know it, merging again adds nothing.
    expect(mergeProfiles(m, 300, ipad, 200).coins).toBe(1250);
    expect(mergeProfiles(ipad, 100, m, 300).coins).toBe(1250);
  });

  it('keeps the no-ads pack and every trophy, theme and record', () => {
    const iphone = base({ noAds: true, achievements: ['a'], ownedThemes: ['popcorn', 'mint'], best: { classic: 50, chrono: 9 } });
    const ipad = base({ achievements: ['b'], ownedThemes: ['popcorn', 'retro'], best: { classic: 80 } });
    const m = mergeProfiles(iphone, 100, ipad, 200);
    expect(m.noAds).toBe(true);
    expect([...m.achievements].sort()).toEqual(['a', 'b']);
    expect([...m.ownedThemes].sort()).toEqual(['mint', 'popcorn', 'retro']);
    expect(m.best).toEqual({ classic: 80, chrono: 9 });
  });

  it('keeps the highest statistics', () => {
    const a = base();
    const b = base();
    a.stats = { ...a.stats, levels: 40, playSeconds: 10, cat: { ...a.stats.cat, movie: 5 } };
    b.stats = { ...b.stats, levels: 12, playSeconds: 99, cat: { ...b.stats.cat, anime: 3 } };
    const m = mergeProfiles(a, 100, b, 200);
    expect(m.stats).toMatchObject({ levels: 40, playSeconds: 99 });
    expect(m.stats.cat).toMatchObject({ movie: 5, anime: 3 });
  });

  it('follows the latest daily challenge and gift day, so nothing is taken twice', () => {
    const iphone = base({ dailyLast: '2026-09-27', dailyStreak: 4, loginLast: '2026-09-27', loginDay: 3 });
    const ipad = base({ dailyLast: '2026-09-20', dailyStreak: 9, loginLast: '2026-09-25', loginDay: 1 });
    // Even when the iPad played last, today's daily and today's gift stay taken.
    const m = mergeProfiles(iphone, 100, ipad, 200);
    expect(m).toMatchObject({ dailyLast: '2026-09-27', dailyStreak: 4, loginLast: '2026-09-27', loginDay: 3 });
  });

  it('gives the same result whichever device merges', () => {
    const iphone = base({ coins: 10, found: [1], dailyLast: '2026-09-26', dailyStreak: 2 });
    const ipad = base({ coins: 20, found: [3], dailyLast: '2026-09-27', dailyStreak: 3 });
    const a = mergeProfiles(iphone, 100, ipad, 200);
    const b = mergeProfiles(ipad, 200, iphone, 100);
    expect({ ...a, found: [...a.found].sort() }).toEqual({ ...b, found: [...b.found].sort() });
  });

  it('a new install never replaces real progress, even if it changed last', () => {
    const iphone = base({ coins: 4000 });
    iphone.stats = { ...iphone.stats, levels: 120 };
    const fresh = base({ coins: 100 });
    expect(mergeProfiles(iphone, 100, fresh, 999).coins).toBe(4000);
    expect(mergeProfiles(fresh, 999, iphone, 100).coins).toBe(4000);
  });

  it('a reset reaches the other device, but keeps what was paid for', () => {
    const iphone = base({ resetAt: 500, coins: 100, found: [], purchases: ['tx1#no_ads'], noAds: true });
    const ipad = base({ resetAt: 0, coins: 3000, found: [1, 2, 3], purchases: ['tx2#coins_500'] });
    const m = mergeProfiles(ipad, 900, iphone, 500);
    expect(m).toMatchObject({ resetAt: 500, coins: 100, found: [], noAds: true });
    expect([...m.purchases].sort()).toEqual(['tx1#no_ads', 'tx2#coins_500']);
    // Afterwards both sides know the reset: normal merging again.
    const later = mergeProfiles(m, 900, { ...m, found: [9] }, 1000);
    expect(later.found).toContain(9);
  });

  it('two devices from before iCloud: the most advanced one keeps its coins', () => {
    const iphone = base({ coins: 2500 });
    iphone.stats = { ...iphone.stats, levels: 90 };
    const ipad = base({ coins: 300 });
    ipad.stats = { ...ipad.stats, levels: 12 };
    expect(mergeProfiles(ipad, 0, iphone, 0).coins).toBe(2500);
    expect(mergeProfiles(iphone, 0, ipad, 0).coins).toBe(2500);
  });

  it('shares no device setting', () => {
    const shared = sharedPart({ ...useProfile.getInitialState(), sound: false });
    expect('sound' in shared).toBe(false);
    expect('lang' in shared).toBe(false);
    expect('coins' in shared).toBe(true);
  });
});
