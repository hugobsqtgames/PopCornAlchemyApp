/** Local calendar day as "YYYY-MM-DD" (the web version wrongly used UTC). */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole days from `from` to `to` (both "YYYY-MM-DD"). */
export function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** Seed for the daily challenge: YYYYMMDD as a number. */
export function daySeed(key: string): number {
  return Number(key.replaceAll('-', ''));
}

/** Streak after finishing the daily challenge on `today`. */
export function nextStreak(lastDay: string | null, today: string, streak: number): number {
  if (!lastDay) return 1;
  const gap = daysBetween(lastDay, today);
  if (gap <= 0) return streak;
  return gap === 1 ? streak + 1 : 1;
}

/** Streak to display: it is lost once a whole day was skipped. */
export function currentStreak(lastDay: string | null, today: string, streak: number): number {
  if (!lastDay) return 0;
  return daysBetween(lastDay, today) <= 1 ? streak : 0;
}

/** Milliseconds until local midnight. */
export function msUntilTomorrow(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}
