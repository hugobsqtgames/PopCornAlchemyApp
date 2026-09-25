import type { Category } from './types';

export interface Stats {
  levels: number;
  coinsEarned: number;
  daily: number;
  spins: number;
  hintsUsed: number;
  shieldsUsed: number;
  skipsUsed: number;
  doublesUsed: number;
  fevers: number;
  bestCombo: number;
  /** Highest tier reached in the classic adventure (1–10). */
  bestTier: number;
  victories: number;
  /** Longest run of cleared levels in hardcore. */
  bestHardcore: number;
  cat: Record<Category, number>;
}

export const EMPTY_STATS: Stats = {
  levels: 0,
  coinsEarned: 0,
  daily: 0,
  spins: 0,
  hintsUsed: 0,
  shieldsUsed: 0,
  skipsUsed: 0,
  doublesUsed: 0,
  fevers: 0,
  bestCombo: 0,
  bestTier: 0,
  victories: 0,
  bestHardcore: 0,
  cat: {
    movie: 0, series: 0, game: 0, music: 0, geo: 0, brand: 0, nature: 0, youtube: 0, anime: 0, food: 0,
    sport: 0, job: 0, tale: 0, home: 0, party: 0, place: 0,
  },
};

export interface AchievementContext {
  stats: Stats;
  coins: number;
  streak: number;
  themesOwned: number;
}

export type AchievementGroup = 'progress' | 'combo' | 'collection';

export interface Achievement {
  id: string;
  icon: string;
  /** Position in the trophy tree grid. */
  x: number;
  y: number;
  parent?: string;
  group: AchievementGroup;
  done: (c: AchievementContext) => boolean;
}

const lvl = (n: number) => (c: AchievementContext) => c.stats.levels >= n;
const combo = (n: number) => (c: AchievementContext) => c.stats.bestCombo >= n;
const coins = (n: number) => (c: AchievementContext) => c.coins >= n;
const streak = (n: number) => (c: AchievementContext) => c.streak >= n;
const cat = (k: Category) => (c: AchievementContext) => c.stats.cat[k] >= 20;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_fusion', icon: '🧪', x: 0, y: 0, group: 'progress', done: lvl(1) },
  { id: 'level_10', icon: '🥉', x: 1, y: 0, parent: 'first_fusion', group: 'progress', done: lvl(10) },
  { id: 'level_50', icon: '🥈', x: 2, y: 0, parent: 'level_10', group: 'progress', done: lvl(50) },
  { id: 'level_100', icon: '🥇', x: 3, y: 0, parent: 'level_50', group: 'progress', done: lvl(100) },
  { id: 'level_250', icon: '👑', x: 4, y: 0, parent: 'level_100', group: 'progress', done: lvl(250) },
  { id: 'level_500', icon: '💎', x: 5, y: 0, parent: 'level_250', group: 'progress', done: lvl(500) },
  { id: 'tier_5', icon: '🏆', x: 2, y: 1, parent: 'level_10', group: 'progress', done: (c) => c.stats.bestTier >= 5 },
  { id: 'tier_10', icon: '🗺️', x: 3, y: 1, parent: 'tier_5', group: 'progress', done: (c) => c.stats.bestTier >= 10 },
  { id: 'victory', icon: '🏅', x: 4, y: 1, parent: 'tier_10', group: 'progress', done: (c) => c.stats.victories >= 1 },
  { id: 'hardcore', icon: '💀', x: 5, y: 1, parent: 'victory', group: 'progress', done: (c) => c.stats.bestHardcore >= 20 },
  { id: 'combo_5', icon: '🔥', x: 1, y: -1, parent: 'first_fusion', group: 'combo', done: combo(5) },
  { id: 'combo_10', icon: '⚡', x: 2, y: -1, parent: 'combo_5', group: 'combo', done: combo(10) },
  { id: 'combo_20', icon: '💥', x: 3, y: -1, parent: 'combo_10', group: 'combo', done: combo(20) },
  { id: 'combo_50', icon: '☄️', x: 4, y: -1, parent: 'combo_20', group: 'combo', done: combo(50) },
  { id: 'combo_100', icon: '🎆', x: 5, y: -1, parent: 'combo_50', group: 'combo', done: combo(100) },
  { id: 'rich', icon: '💰', x: 1, y: 2, parent: 'first_fusion', group: 'collection', done: coins(1000) },
  { id: 'millionaire', icon: '💵', x: 2, y: 2, parent: 'rich', group: 'collection', done: coins(5000) },
  { id: 'billionaire', icon: '🏦', x: 3, y: 2, parent: 'millionaire', group: 'collection', done: coins(10000) },
  { id: 'trillionaire', icon: '🤑', x: 4, y: 2, parent: 'billionaire', group: 'collection', done: coins(50000) },
  { id: 'daily_streak_3', icon: '📅', x: 1, y: -2, parent: 'first_fusion', group: 'progress', done: streak(3) },
  { id: 'daily_streak_7', icon: '🌟', x: 2, y: -2, parent: 'daily_streak_3', group: 'progress', done: streak(7) },
  { id: 'daily_streak_30', icon: '🗓️', x: 3, y: -2, parent: 'daily_streak_7', group: 'progress', done: streak(30) },
  { id: 'daily_streak_100', icon: '🏛️', x: 4, y: -2, parent: 'daily_streak_30', group: 'progress', done: streak(100) },
  { id: 'hint_user', icon: '💡', x: 0, y: -3, parent: 'first_fusion', group: 'combo', done: (c) => c.stats.hintsUsed >= 50 },
  { id: 'lucky_spin', icon: '🎡', x: 0, y: 3, parent: 'first_fusion', group: 'collection', done: (c) => c.stats.spins >= 10 },
  { id: 'shield_user', icon: '🛡️', x: 1, y: 3, parent: 'lucky_spin', group: 'combo', done: (c) => c.stats.shieldsUsed >= 20 },
  { id: 'skip_user', icon: '⏭️', x: 2, y: 3, parent: 'shield_user', group: 'combo', done: (c) => c.stats.skipsUsed >= 10 },
  { id: 'double_user', icon: '✨', x: 3, y: 3, parent: 'skip_user', group: 'combo', done: (c) => c.stats.doublesUsed >= 10 },
  { id: 'fever_master', icon: '🌡️', x: 4, y: 3, parent: 'double_user', group: 'combo', done: (c) => c.stats.fevers >= 50 },
  { id: 'skin_collector', icon: '🎨', x: 0, y: 4, parent: 'lucky_spin', group: 'collection', done: (c) => c.themesOwned >= 5 },
  { id: 'movie_buff', icon: '🎬', x: 1, y: 4, parent: 'skin_collector', group: 'collection', done: cat('movie') },
  { id: 'music_lover', icon: '🎵', x: 2, y: 4, parent: 'movie_buff', group: 'collection', done: cat('music') },
  { id: 'series_fan', icon: '📺', x: 3, y: 4, parent: 'music_lover', group: 'collection', done: cat('series') },
  { id: 'gamer', icon: '🎮', x: 4, y: 4, parent: 'series_fan', group: 'collection', done: cat('game') },
  { id: 'traveler', icon: '✈️', x: 5, y: 4, parent: 'gamer', group: 'collection', done: cat('geo') },
  { id: 'nature_expert', icon: '🐘', x: 6, y: 4, parent: 'traveler', group: 'collection', done: cat('nature') },
  { id: 'brand_expert', icon: '🏷️', x: 7, y: 4, parent: 'nature_expert', group: 'collection', done: cat('brand') },
  { id: 'yt_expert', icon: '🎥', x: 8, y: 4, parent: 'brand_expert', group: 'collection', done: cat('youtube') },
  { id: 'anime_expert', icon: '🏮', x: 9, y: 4, parent: 'yt_expert', group: 'collection', done: cat('anime') },
  { id: 'food_expert', icon: '🍕', x: 1, y: 5, parent: 'movie_buff', group: 'collection', done: cat('food') },
  { id: 'sport_expert', icon: '⚽', x: 2, y: 5, parent: 'food_expert', group: 'collection', done: cat('sport') },
  { id: 'job_expert', icon: '👷', x: 3, y: 5, parent: 'sport_expert', group: 'collection', done: cat('job') },
  { id: 'tale_expert', icon: '🧚', x: 4, y: 5, parent: 'job_expert', group: 'collection', done: cat('tale') },
  { id: 'home_expert', icon: '🏠', x: 5, y: 5, parent: 'tale_expert', group: 'collection', done: cat('home') },
  { id: 'party_expert', icon: '🎉', x: 6, y: 5, parent: 'home_expert', group: 'collection', done: cat('party') },
  { id: 'place_expert', icon: '🗺️', x: 7, y: 5, parent: 'party_expert', group: 'collection', done: cat('place') },
];

/** Ids of achievements reached now that were not unlocked before. */
export function newlyUnlocked(ctx: AchievementContext, unlocked: readonly string[]): string[] {
  return ACHIEVEMENTS.filter((a) => !unlocked.includes(a.id) && a.done(ctx)).map((a) => a.id);
}
