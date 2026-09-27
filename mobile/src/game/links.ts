/**
 * Reading what comes from outside the app: challenge links and screen parameters.
 * A link can be edited by anyone, so every value is checked and bounded.
 */
import { CATEGORIES, levelById } from './rules';
import type { Category } from './types';

/** Longest challenge a link can carry, and highest score it can claim. */
export const MAX_CHALLENGE_LEVELS = 10;
export const MAX_SCORE = 10_000_000;
export const MAX_NAME = 20;

type Param = string | string[] | undefined;

/** Router params can be repeated (?a=1&a=2): keep the first one. */
export function one(v: Param): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Known level ids from "1,5,12", without duplicates, at most `max`. */
export function parseLevelIds(v: Param, max = MAX_CHALLENGE_LEVELS): number[] {
  const ids = (one(v) ?? '')
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((id) => Number.isInteger(id) && !!levelById(id));
  return [...new Set(ids)].slice(0, max);
}

/** A whole number between 0 and `max`; anything else is 0. */
export function parseScore(v: Param, max = MAX_SCORE): number {
  const n = Number(one(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.floor(n))) : 0;
}

/** A display name: trimmed, at most 20 characters (emojis are never cut in half), or "?". */
export function parseName(v: Param): string {
  const name = (one(v) ?? '').replace(/\s+/g, ' ').trim();
  return name ? [...name].slice(0, MAX_NAME).join('') : '?';
}

export function parseCategory(v: Param): Category | undefined {
  const c = one(v);
  return CATEGORIES.some((x) => x.id === c) ? (c as Category) : undefined;
}

/** Longest incoming link accepted; a challenge link is well under 200 characters. */
export const MAX_LINK = 600;

function decodeSafely(v: string): string {
  try {
    return decodeURIComponent(v.replace(/\+/g, ' '));
  } catch {
    return '';
  }
}

/**
 * Rewrites a link opened from outside the app (a shared challenge) before the router reads it.
 * Only challenge links go further, rebuilt from checked values and cleanly encoded: a crafted
 * link (malformed or huge percent-encoding, unknown screen) just opens the home screen.
 */
export function safeIncomingPath(path: string): string {
  if (typeof path !== 'string' || path.length > MAX_LINK) return '/';
  const match = /^(?:[a-z][a-z0-9+.-]*:\/\/)?\/*([^?#]*)(?:\?([^#]*))?/i.exec(path);
  const screen = (match?.[1] ?? '').replace(/\/+$/, '');
  if (screen !== 'defier') return '/';
  const query: Record<string, string> = {};
  for (const part of (match?.[2] ?? '').split('&')) {
    const [k, v = ''] = part.split('=');
    if ((k === 'l' || k === 's' || k === 'n') && !(k in query)) query[k] = decodeSafely(v);
  }
  const ids = parseLevelIds(query.l);
  if (!ids.length) return '/defier';
  const q = `l=${ids.join(',')}&s=${parseScore(query.s)}&n=${encodeURIComponent(parseName(query.n))}`;
  return `/defier?${q}`;
}
