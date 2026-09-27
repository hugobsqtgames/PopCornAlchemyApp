export type Prize =
  | { kind: 'coins'; amount: number }
  | { kind: 'hints'; amount: number }
  | { kind: 'shield' }
  | { kind: 'gift' };

/** Clockwise from the top. No empty slice. */
export const WHEEL: { icon: string; label: string; prize: Prize; weight: number }[] = [
  { icon: '💎', label: '500', prize: { kind: 'coins', amount: 500 }, weight: 2 },
  { icon: '💰', label: '25', prize: { kind: 'coins', amount: 25 }, weight: 22 },
  { icon: '💡', label: '×1', prize: { kind: 'hints', amount: 1 }, weight: 18 },
  { icon: '💰', label: '50', prize: { kind: 'coins', amount: 50 }, weight: 18 },
  { icon: '🛡️', label: '×1', prize: { kind: 'shield' }, weight: 10 },
  { icon: '💰', label: '100', prize: { kind: 'coins', amount: 100 }, weight: 10 },
  { icon: '💡', label: '×3', prize: { kind: 'hints', amount: 3 }, weight: 12 },
  { icon: '🎁', label: '?', prize: { kind: 'gift' }, weight: 8 },
];

export const SLICE_DEG = 360 / WHEEL.length;

export function pickSlice(rng: () => number = Math.random): number {
  const total = WHEEL.reduce((s, w) => s + w.weight, 0);
  let r = rng() * total;
  for (let i = 0; i < WHEEL.length; i++) {
    r -= WHEEL[i].weight;
    if (r < 0) return i;
  }
  return WHEEL.length - 1;
}

/** Final rotation (degrees) that stops slice `index` under the top pointer after a few turns. */
export function spinRotation(index: number, turns = 6): number {
  return turns * 360 + (360 - index * SLICE_DEG) % 360;
}

/** What the surprise gift turns into. */
export function openGift(rng: () => number = Math.random): Prize {
  const r = rng();
  if (r < 0.34) return { kind: 'shield' };
  if (r < 0.67) return { kind: 'hints', amount: 5 };
  return { kind: 'coins', amount: 200 };
}

/**
 * When the pointer crosses each slice edge during a spin from `from` to `to` degrees with an
 * ease-out-cubic curve (value = 1 - (1 - t)³), in ms. Ticks closer than 45 ms are merged,
 * and only ticks at least 90 ms apart also vibrate.
 */
export function tickTimes(from: number, to: number, duration: number): { at: number; strong: boolean }[] {
  const out: { at: number; strong: boolean }[] = [];
  let last = -Infinity;
  for (let k = Math.ceil((from + SLICE_DEG / 2) / SLICE_DEG); k * SLICE_DEG - SLICE_DEG / 2 <= to; k++) {
    const f = (k * SLICE_DEG - SLICE_DEG / 2 - from) / (to - from);
    if (f <= 0) continue;
    const at = Math.round((1 - Math.cbrt(1 - f)) * duration);
    if (at - last < 45) continue;
    out.push({ at, strong: at - last >= 90 });
    last = at;
  }
  return out;
}
