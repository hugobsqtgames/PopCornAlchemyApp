/**
 * Chests (version 1.1): won by playing, never bought. What is inside is drawn when the chest is
 * opened. Three kinds: wood (every tier), gold (every 5 tiers, 7 days of daily challenge),
 * legendary (end of an adventure).
 */
import { AVATARS, STYLES, THEMES, type ThemeId } from './catalog';

export type ChestKind = 'wood' | 'gold' | 'legend';
export const CHEST_KINDS: readonly ChestKind[] = ['wood', 'gold', 'legend'];

export type ChestItem = 'hints' | 'shields' | 'skips' | 'doubles' | 'streakSaves';

export type ChestReward =
  | { kind: 'coins'; amount: number }
  | { kind: 'item'; item: ChestItem; amount: number }
  | { kind: 'theme'; id: ThemeId }
  | { kind: 'style'; id: string }
  | { kind: 'avatar'; id: string };

/** What the player already has, so a chest never gives a cosmetic twice. */
export interface Owned {
  themes: readonly string[];
  styles: readonly string[];
  avatars: readonly string[];
  /** Streak protections held, and the most that can be held. */
  streakSaves: number;
  maxStreakSaves: number;
}

const int = (rng: () => number, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
function weighted<T>(rng: () => number, options: [T, number][]): T {
  const total = options.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of options) {
    r -= w;
    if (r < 0) return v;
  }
  return options[options.length - 1][0];
}
const pickOne = <T>(rng: () => number, list: readonly T[]): T | undefined => (list.length ? list[Math.floor(rng() * list.length)] : undefined);

/** Coins in each kind of chest (shown as "between … and …"). */
export const CHEST_COINS: Record<ChestKind, [number, number]> = {
  wood: [30, 60],
  gold: [120, 200],
  legend: [400, 600],
};

/** The rewards of one chest, the best one last (it is revealed last). */
export function rollChest(kind: ChestKind, owned: Owned, rng: () => number = Math.random): ChestReward[] {
  const out: ChestReward[] = [{ kind: 'coins', amount: int(rng, ...CHEST_COINS[kind]) }];
  const freeThemes = THEMES.map((th) => th.id).filter((id) => !owned.themes.includes(id));
  const freeStyles = STYLES.filter((s) => !owned.styles.includes(s));
  const freeAvatars = AVATARS.filter((a) => !owned.avatars.includes(a));
  const saveRoom = owned.streakSaves < owned.maxStreakSaves;

  if (kind === 'wood') {
    out.push(
      weighted<ChestReward>(rng, [
        [{ kind: 'item', item: 'hints', amount: 2 }, 45],
        [{ kind: 'item', item: 'shields', amount: 1 }, 20],
        [{ kind: 'item', item: 'skips', amount: 1 }, 20],
        [{ kind: 'item', item: 'doubles', amount: 1 }, 15],
      ]),
    );
    return out;
  }

  if (kind === 'gold') {
    out.push({ kind: 'item', item: 'hints', amount: 3 });
    const pool: ChestItem[] = ['shields', 'skips', 'doubles', ...(saveRoom ? (['streakSaves'] as const) : [])];
    for (let i = 0; i < 2; i++) {
      const item = pool.splice(Math.floor(rng() * pool.length), 1)[0];
      out.push({ kind: 'item', item, amount: 1 });
    }
    const avatar = rng() < 0.2 ? pickOne(rng, freeAvatars) : undefined;
    if (avatar) out.push({ kind: 'avatar', id: avatar });
    return out;
  }

  // Legendary: plenty of everything, and always something new to wear.
  out.push({ kind: 'item', item: 'hints', amount: 5 }, { kind: 'item', item: 'shields', amount: 1 }, { kind: 'item', item: 'skips', amount: 1 });
  const theme = pickOne(rng, freeThemes.filter((id) => id !== 'popcorn'));
  const style = theme ? undefined : pickOne(rng, freeStyles);
  const avatar = theme || style ? undefined : pickOne(rng, freeAvatars);
  if (theme) out.push({ kind: 'theme', id: theme });
  else if (style) out.push({ kind: 'style', id: style });
  else if (avatar) out.push({ kind: 'avatar', id: avatar });
  else out[0] = { kind: 'coins', amount: (out[0] as { amount: number }).amount + 400 };
  return out;
}

/** The chest given at the end of tier `tier` (1 = the first 20 levels). */
export function tierChest(tier: number): ChestKind {
  return tier % 5 === 0 ? 'gold' : 'wood';
}
