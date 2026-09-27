import type { Stats } from '@/game/achievements';
import { packGoods } from '@/game/catalog';
import { ACTIVITY_DAYS } from '@/game/progress';

import type { ProfileState } from './profile';

/** Settings that belong to one device (an iPad can stay silent), never shared through iCloud. */
export const LOCAL_ONLY = [
  'lang',
  'sound',
  'music',
  'haptics',
  'reduceMotion',
  'voice',
  'reminder',
  'reminderAsked',
  'happyMoments',
  'reviewAskedAt',
  'changedAt',
] as const satisfies readonly (keyof ProfileState)[];

export type SharedProfile = Omit<ProfileState, (typeof LOCAL_ONLY)[number]>;

/** The part of the profile that goes to iCloud. */
export function sharedPart(p: ProfileState): SharedProfile {
  const out: Partial<ProfileState> = { ...p };
  for (const k of LOCAL_ONLY) delete out[k];
  return out as SharedProfile;
}

const union = <T>(...lists: T[][]) => [...new Set(lists.flat())];
const day = (d: string | null) => d ?? '';

/** Highest value for each key of two records. */
function maxOf<K extends string>(a: Partial<Record<K, number>>, b: Partial<Record<K, number>>): Record<K, number> {
  const out = { ...a } as Record<K, number>;
  for (const [k, v] of Object.entries(b) as [K, number][]) out[k] = Math.max(out[k] ?? 0, v ?? 0);
  return out;
}

/**
 * Merges the progress of two devices (this one and the copy in iCloud) without losing any:
 * - what only grows is combined: answers found, best stars, trophies, records, statistics,
 *   themes and avatars owned, gift codes, purchases;
 * - what goes up and down (coins, hints, the run in progress, the chosen theme…) comes from the
 *   device that played last, plus any App Store pack bought on the other one that it never saw;
 * - dated things (daily challenge, wheel, gift calendar) follow the most recent date, so a gift
 *   or a daily reward can never be taken twice by switching devices.
 * `localAt` and `remoteAt` are when each side last changed (Date.now()).
 */
export function mergeProfiles(local: SharedProfile, localAt: number, remote: SharedProfile, remoteAt: number): SharedProfile {
  // A reset one side has not applied yet wins: the other side's progress is from before it.
  // What was paid for with real money is never lost.
  if (local.resetAt !== remote.resetAt) {
    const reset = local.resetAt > remote.resetAt ? local : remote;
    return { ...reset, noAds: local.noAds || remote.noAds, purchases: union(reset.purchases, local.purchases, remote.purchases).slice(-200) };
  }
  // Same date (two devices that both played before iCloud existed): the most advanced one wins.
  let newer = remoteAt === localAt ? (remote.stats.levels > local.stats.levels ? remote : local) : remoteAt > localAt ? remote : local;
  // A device that has not cleared a single level yet (a new install) never wins over real progress.
  if (newer.stats.levels === 0 && (newer === remote ? local : remote).stats.levels > 0) newer = newer === remote ? local : remote;
  const older = newer === remote ? local : remote;

  // Packs bought on the older device that the newer one never heard of: their coins are added.
  const seen = new Set(newer.purchases.map((p) => p.split('#')[0]));
  let missedCoins = 0;
  for (const entry of older.purchases) {
    const [tx, pack] = entry.split('#');
    if (seen.has(tx)) continue;
    const goods = packGoods(pack ?? '');
    if (goods && !(goods.noAds && newer.noAds)) missedCoins += goods.coins;
  }

  const byDate = (pick: (p: SharedProfile) => string | null, tie: (a: SharedProfile, b: SharedProfile) => SharedProfile) => {
    const a = day(pick(local));
    const b = day(pick(remote));
    return a === b ? tie(local, remote) : a > b ? local : remote;
  };
  const daily = byDate(
    (p) => p.dailyLast,
    (a, b) => (a.dailyStreak >= b.dailyStreak ? a : b)
  );
  const login = byDate(
    (p) => p.loginLast,
    (a, b) => (a.loginDay >= b.loginDay ? a : b)
  );
  const ads = byDate(
    (p) => p.adsDay,
    (a, b) => (a.adsCount >= b.adsCount ? a : b)
  );

  const activity = maxOf(local.activity, remote.activity);
  for (const old of Object.keys(activity).sort().slice(0, Math.max(0, Object.keys(activity).length - ACTIVITY_DAYS))) delete activity[old];
  const bestDay =
    !local.bestDay || !remote.bestDay
      ? (local.bestDay ?? remote.bestDay)
      : remote.bestDay.levels > local.bestDay.levels
        ? remote.bestDay
        : local.bestDay;

  const stats: Stats = { ...newer.stats, cat: maxOf(local.stats.cat, remote.stats.cat), catTries: maxOf(local.stats.catTries, remote.stats.catTries) };
  for (const k of Object.keys(stats) as (keyof Stats)[]) {
    if (k !== 'cat' && k !== 'catTries') stats[k] = Math.max(local.stats[k] ?? 0, remote.stats[k] ?? 0);
  }

  const stars = { ...local.stars };
  for (const [id, n] of Object.entries(remote.stars)) stars[id] = Math.max(stars[id] ?? 0, n) as typeof n;

  return {
    ...newer,
    coins: newer.coins + missedCoins,
    tutorialDone: local.tutorialDone || remote.tutorialDone,
    noAds: local.noAds || remote.noAds,
    purchases: union(newer.purchases, older.purchases).slice(-200),
    ownedThemes: union(newer.ownedThemes, older.ownedThemes),
    ownedStyles: union(newer.ownedStyles, older.ownedStyles),
    ownedAvatars: union(newer.ownedAvatars, older.ownedAvatars),
    achievements: union(newer.achievements, older.achievements),
    redeemedCodes: union(newer.redeemedCodes, older.redeemedCodes),
    found: union(newer.found, older.found),
    stars,
    best: maxOf(local.best, remote.best),
    stats,
    activity,
    bestDay,
    dailyLast: daily.dailyLast,
    dailyStreak: daily.dailyStreak,
    dailyBestStreak: Math.max(local.dailyBestStreak, remote.dailyBestStreak),
    loginLast: login.loginLast,
    loginDay: login.loginDay,
    adsDay: ads.adsDay,
    adsCount: ads.adsCount,
    wheelLast: byDate((p) => p.wheelLast, (a) => a).wheelLast,
    wheelBonusLast: byDate((p) => p.wheelBonusLast, (a) => a).wheelBonusLast,
  };
}
