import { getLocales } from 'expo-localization';

import type { Lang } from '@/game/types';

import { LANG_IDS } from './langs';

const SPOKEN: readonly Lang[] = LANG_IDS;

/**
 * The language the app speaks when the player has not picked one: the first of the phone's
 * languages the app knows, in the phone's order of preference, and English for everyone else.
 * (Chinese is simplified Chinese for every script and region.)
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
