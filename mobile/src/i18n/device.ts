import { getLocales } from 'expo-localization';

import type { Lang } from '@/game/types';

const SPOKEN: readonly Lang[] = ['fr', 'en', 'es'];

/**
 * The language the app speaks when the player has not picked one: the first of the phone's
 * languages the app knows, in the phone's order of preference, and English for everyone else.
 */
export function deviceLang(): Lang {
  try {
    for (const locale of getLocales()) {
      const code = locale.languageCode as Lang | null;
      if (code && SPOKEN.includes(code)) return code;
    }
  } catch {
    // No locale information: English.
  }
  return 'en';
}

/** The language in use: the player's choice, or the phone's (null = follow the phone). */
export function langOf(picked: Lang | null | undefined): Lang {
  return picked ?? deviceLang();
}
