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
  | 'food';

export interface Level {
  id: number;
  cat: Category;
  /** Emojis to combine; order does not matter, duplicates do. */
  sol: string[];
  name: Record<Lang, string>;
}

/** classic = adventure through all tiers; category = one category; daily/challenge = fixed list. */
export type Mode = 'classic' | 'category' | 'chrono' | 'hardcore' | 'daily' | 'challenge';

export interface RunConfig {
  mode: Mode;
  category?: Category;
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
