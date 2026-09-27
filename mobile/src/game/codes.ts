/**
 * Gift codes to share in videos. To add one: add a line below and publish an update.
 * Codes are case-insensitive, work once per device, and stop working after `until` (optional).
 */
export interface GiftReward {
  coins?: number;
  hints?: number;
  shields?: number;
  skips?: number;
  /** Streak protections for the daily challenge. */
  streakSaves?: number;
}

export const GIFT_CODES: { code: string; reward: GiftReward; until?: string }[] = [
  { code: 'POPCORN500', reward: { coins: 500 } },
  { code: 'BIENVENUE', reward: { coins: 300, hints: 5 } },
  { code: 'TIKTOK', reward: { hints: 3, skips: 1 } },
];

/** Upper case, no spaces or dashes: "pop corn-500" and "POPCORN500" are the same code. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]+/g, '');
}

export type RedeemResult = { ok: true; code: string; reward: GiftReward } | { ok: false; reason: 'unknown' | 'used' };

/** Checks a code without changing anything; `today` is a YYYY-MM-DD day key. */
export function checkCode(input: string, used: readonly string[], today: string): RedeemResult {
  const code = normalizeCode(input);
  const found = GIFT_CODES.find((c) => c.code === code && (!c.until || today <= c.until));
  if (!found) return { ok: false, reason: 'unknown' };
  if (used.includes(code)) return { ok: false, reason: 'used' };
  return { ok: true, code, reward: found.reward };
}

/** "500 💰 · 5 💡" */
export function rewardText(r: GiftReward): string {
  return [
    r.coins && `${r.coins} 💰`,
    r.hints && `${r.hints} 💡`,
    r.shields && `${r.shields} 🛡️`,
    r.skips && `${r.skips} ⏭️`,
    r.streakSaves && `${r.streakSaves} 🧊`,
  ]
    .filter(Boolean)
    .join(' · ');
}
