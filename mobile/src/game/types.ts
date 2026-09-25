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

/** classic = adventure through all tiers; category = one category; daily/challenge = fixed list. */
export type Mode = 'classic' | 'category' | 'chrono' | 'hardcore' | 'daily' | 'challenge';

export interface RunConfig {
  mode: Mode;
  category?: Category;
  /** Classic adventure only; runs saved before 1.1 have none. */
  difficulty?: Difficulty;
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
