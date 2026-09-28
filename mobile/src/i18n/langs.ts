import type { Lang } from '@/game/types';

/** Every language of the app, in the order of the language screen. */
export const LANGS: { id: Lang; flag: string; name: string }[] = [
  { id: 'fr', flag: '🇫🇷', name: 'Français' },
  { id: 'en', flag: '🇬🇧', name: 'English' },
  { id: 'es', flag: '🇪🇸', name: 'Español' },
  { id: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { id: 'it', flag: '🇮🇹', name: 'Italiano' },
  { id: 'pt', flag: '🇧🇷', name: 'Português (Brasil)' },
  { id: 'nl', flag: '🇳🇱', name: 'Nederlands' },
  { id: 'pl', flag: '🇵🇱', name: 'Polski' },
  { id: 'tr', flag: '🇹🇷', name: 'Türkçe' },
  { id: 'ru', flag: '🇷🇺', name: 'Русский' },
  { id: 'ja', flag: '🇯🇵', name: '日本語' },
  { id: 'ko', flag: '🇰🇷', name: '한국어' },
  { id: 'zh', flag: '🇨🇳', name: '简体中文' },
];

export const LANG_IDS: Lang[] = LANGS.map((l) => l.id);

export const LANG_NAMES = Object.fromEntries(LANGS.map((l) => [l.id, l.name])) as Record<Lang, string>;

/**
 * Which plural form a number takes. Most languages only have "one" (singular) and the plain form;
 * Russian and Polish also have "few" (2, 3, 4, 22…). Strings add `_one` / `_few` variants.
 */
export function pluralForm(lang: Lang, n: number): 'one' | 'few' | null {
  const i = Math.abs(Math.trunc(n));
  if (i !== Math.abs(n)) return null;
  const d10 = i % 10;
  const d100 = i % 100;
  switch (lang) {
    case 'ru':
      if (d10 === 1 && d100 !== 11) return 'one';
      return d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14) ? 'few' : null;
    case 'pl':
      if (i === 1) return 'one';
      return d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14) ? 'few' : null;
    case 'ja':
    case 'ko':
    case 'zh':
    case 'tr':
      return null;
    case 'pt':
      // Brazilian Portuguese: 0 and 1 are singular.
      return i === 0 || i === 1 ? 'one' : null;
    default:
      return i === 1 ? 'one' : null;
  }
}
