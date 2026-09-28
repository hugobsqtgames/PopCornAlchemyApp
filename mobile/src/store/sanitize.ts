/**
 * Cleans a saved profile before the app uses it. Storage can hold anything: an older app
 * version, a write cut short by a crash or a full disk, a hand-edited backup. Every field
 * that does not have the expected shape falls back to its default, so a bad save can
 * never crash the app or show NaN.
 */
import { EMPTY_STATS, type Stats } from '@/game/achievements';
import { AVATARS, STYLES, THEMES, type ThemeId } from '@/game/catalog';
import { MAX_STREAK_SAVES } from '@/game/progress';
import { adventureIds, levelById } from '@/game/rules';
import type { Lang, Mode, RunSave } from '@/game/types';

import type { ProfileState, ReceivedChallenge } from './profile';
import { LANG_IDS } from '@/i18n/langs';

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const count = (v: unknown, fallback: number, max = 1e12) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : fallback;
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const strings = (v: unknown, ok: (s: string) => boolean = () => true) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && ok(x)))] : null;
const levelIds = (v: unknown, max: number) =>
  Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number' && !!levelById(x)).slice(0, max) : [];

const LANGS: Lang[] = LANG_IDS;
const THEME_IDS = THEMES.map((t) => t.id) as ThemeId[];
const MODES: Mode[] = ['classic', 'category', 'chrono', 'hardcore', 'daily', 'challenge', 'zen', 'tutorial', 'replay'];

/** A resumable run, or null when anything about it is off. */
export function cleanSave(v: unknown): RunSave | null {
  if (!isObj(v) || typeof v.mode !== 'string' || !MODES.includes(v.mode as Mode)) return null;
  if (!Array.isArray(v.ids) || v.ids.length === 0) return null;
  const ids = levelIds(v.ids, 1000);
  if (ids.length !== v.ids.length) return null;
  const index = count(v.index, -1);
  const lives = count(v.lives, -1, 4);
  if (index < 0 || index >= ids.length || lives < 1) return null;
  const save: RunSave = { mode: v.mode as Mode, ids, index, lives, score: count(v.score, 0), combo: count(v.combo, 0), continued: bool(v.continued, false) };
  if (typeof v.category === 'string') save.category = v.category as RunSave['category'];
  if (v.difficulty === 1 || v.difficulty === 2 || v.difficulty === 3) save.difficulty = v.difficulty;
  // A map run keeps its flag only with the map's own levels, so its progress stays right.
  if (v.adventure === true && save.difficulty && ids.join() === adventureIds(save.difficulty).join()) save.adventure = true;
  return save;
}

function cleanStats(v: unknown): Stats {
  const raw = isObj(v) ? v : {};
  const cat = isObj(raw.cat) ? raw.cat : {};
  const tries = isObj(raw.catTries) ? raw.catTries : {};
  const stats = { ...EMPTY_STATS, cat: { ...EMPTY_STATS.cat }, catTries: { ...EMPTY_STATS.catTries } };
  for (const k of Object.keys(EMPTY_STATS) as (keyof Stats)[]) {
    if (k !== 'cat' && k !== 'catTries') stats[k] = count(raw[k], 0);
  }
  for (const k of Object.keys(EMPTY_STATS.cat) as (keyof Stats['cat'])[]) {
    stats.cat[k] = count(cat[k], 0);
    // Never fewer tries than right answers (saves from before tries were counted start at 100 %).
    stats.catTries[k] = Math.max(count(tries[k], 0), stats.cat[k]);
  }
  return stats;
}

function cleanReceived(v: unknown): ReceivedChallenge[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(isObj)
    .map((r) => ({ ids: levelIds(r.ids, 10), score: count(r.score, 0, 1e9), name: typeof r.name === 'string' ? r.name : '?', receivedAt: typeof r.receivedAt === 'string' ? r.receivedAt : '' }))
    .filter((r) => r.ids.length > 0)
    .slice(0, 20);
}

/** Keeps what is valid in `saved`, takes the rest from `defaults`. */
export function sanitizeProfile(saved: unknown, defaults: ProfileState): ProfileState {
  const p = isObj(saved) ? saved : {};
  const d = defaults;
  const ownedThemes = strings(p.ownedThemes, (x) => THEME_IDS.includes(x as ThemeId)) as ThemeId[] | null;
  const ownedStyles = strings(p.ownedStyles, (x) => STYLES.includes(x));
  const ownedAvatars = strings(p.ownedAvatars, (x) => AVATARS.includes(x));
  const themes = [...new Set<ThemeId>(['popcorn', ...(ownedThemes ?? [])])];
  const styles = [...new Set(['🍿', ...(ownedStyles ?? [])])];
  const avatars = [...new Set(['🍿', ...(ownedAvatars ?? [])])];
  const best: ProfileState['best'] = {};
  if (isObj(p.best)) for (const m of MODES) if (typeof p.best[m] === 'number') best[m] = count(p.best[m], 0);
  const adv = isObj(p.adventure) ? p.adventure : {};
  const stars: ProfileState['stars'] = {};
  if (isObj(p.stars)) {
    for (const [k, v] of Object.entries(p.stars)) if (levelById(Number(k)) && (v === 1 || v === 2 || v === 3)) stars[k] = v;
  }
  const activity: Record<string, number> = {};
  if (isObj(p.activity)) for (const [k, v] of Object.entries(p.activity)) if (day(k)) activity[k] = count(v, 0);
  const bestDay = isObj(p.bestDay) && day(p.bestDay.day) ? { day: p.bestDay.day as string, levels: count(p.bestDay.levels, 0) } : null;
  const lastRun = isObj(p.lastRun) ? { ids: levelIds(p.lastRun.ids, 10), score: count(p.lastRun.score, 0) } : null;

  return {
    lang: LANGS.includes(p.lang as Lang) ? (p.lang as Lang) : null,
    tutorialDone: bool(p.tutorialDone, d.tutorialDone),
    name: typeof p.name === 'string' ? [...p.name].slice(0, 20).join('') : d.name,
    avatar: typeof p.avatar === 'string' && avatars.includes(p.avatar) ? p.avatar : '🍿',
    coins: count(p.coins, d.coins),
    hints: count(p.hints, d.hints),
    shields: count(p.shields, d.shields),
    skips: count(p.skips, d.skips),
    doubles: count(p.doubles, d.doubles),
    theme: themes.includes(p.theme as ThemeId) ? (p.theme as ThemeId) : 'popcorn',
    style: typeof p.style === 'string' && styles.includes(p.style) ? p.style : '🍿',
    ownedThemes: themes,
    ownedStyles: styles,
    ownedAvatars: avatars,
    sound: bool(p.sound, d.sound),
    music: bool(p.music, d.music),
    haptics: bool(p.haptics, d.haptics),
    reduceMotion: bool(p.reduceMotion, d.reduceMotion),
    reminder: bool(p.reminder, d.reminder),
    reminderAsked: bool(p.reminderAsked, d.reminderAsked),
    noAds: bool(p.noAds, d.noAds),
    resetAt: count(p.resetAt, 0),
    changedAt: count(p.changedAt, 0),
    purchases: (strings(p.purchases, (x) => x.length > 0 && x.length <= 200) ?? []).slice(-200),
    best,
    stats: cleanStats(p.stats),
    achievements: strings(p.achievements) ?? [],
    dailyLast: day(p.dailyLast),
    dailyStreak: count(p.dailyStreak, 0),
    dailyBestStreak: count(p.dailyBestStreak, 0),
    wheelLast: day(p.wheelLast),
    wheelBonusLast: day(p.wheelBonusLast),
    adsDay: day(p.adsDay),
    adsCount: count(p.adsCount, 0),
    save: cleanSave(p.save),
    lastRun: lastRun && lastRun.ids.length ? lastRun : null,
    received: cleanReceived(p.received),
    streakSaves: count(p.streakSaves, 0, MAX_STREAK_SAVES),
    adventure: {
      1: count(adv[1], 0, adventureIds(1).length),
      2: count(adv[2], 0, adventureIds(2).length),
      3: count(adv[3], 0, adventureIds(3).length),
    },
    found: [...new Set(levelIds(p.found, 1000))],
    stars,
    activity,
    bestDay,
    // A day number out of the 7-day calendar starts it over (never straight to the big gift).
    loginDay: typeof p.loginDay === 'number' && Number.isInteger(p.loginDay) && p.loginDay >= 0 && p.loginDay <= 6 ? p.loginDay : 0,
    loginLast: day(p.loginLast),
    voice: bool(p.voice, d.voice),
    redeemedCodes: strings(p.redeemedCodes) ?? [],
    happyMoments: count(p.happyMoments, 0),
    reviewAskedAt: day(p.reviewAskedAt),
  };
}
