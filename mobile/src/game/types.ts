export type Lang = 'fr' | 'en' | 'es';

export type Category =
  | 'movie'
  | 'series'
  | 'game'
  | 'music'
  | 'geo'
  | 'brand'
  | 'nature'
  | 'youtube'
  | 'anime'
  | 'food'
  | 'sport'
  | 'job'
  | 'tale'
  | 'home'
  | 'party'
  | 'place';

/** 1 easy, 2 medium, 3 hard. */
export type Difficulty = 1 | 2 | 3;

export interface Level {
  id: number;
  cat: Category;
  d: Difficulty;
  /** Emojis to combine; order does not matter, duplicates do. */
  sol: string[];
  name: Record<Lang, string>;
}

/** classic = adventure through all tiers; category = one category; daily/challenge = fixed list;
 * zen = no clock, no lives; tutorial = the guided first level; replay = one level again from the
 * Pop-Cornédex, for more stars (no lives, no coins). */
export type Mode = 'classic' | 'category' | 'chrono' | 'hardcore' | 'daily' | 'challenge' | 'zen' | 'tutorial' | 'replay';

export interface RunConfig {
  mode: Mode;
  category?: Category;
  /** Classic adventure only; runs saved before 1.1 have none. */
  difficulty?: Difficulty;
  /** Played from the adventure map: the levels are the map's, and its progress is kept level by level. */
  adventure?: boolean;
  /** A replayed level opened from the adventure map (its "back" button returns there). */
  origin?: 'map';
  /** Level ids in play order. */
  ids: number[];
  /** Score to beat, for challenges. */
  target?: number;
  challenger?: string;
}

/** What gets saved so a run can be resumed later. */
export interface RunSave extends RunConfig {
  index: number;
  lives: number;
  score: number;
  combo: number;
  continued: boolean;
}
