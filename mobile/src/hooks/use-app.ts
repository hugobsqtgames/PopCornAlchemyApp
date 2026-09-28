import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, Platform, useColorScheme, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Lang, Level } from '@/game/types';
import { langOf } from '@/i18n/device';
import { STRINGS, type StringKey } from '@/i18n/strings';
import { useProfile } from '@/store/profile';
import { paletteFor } from '@/theme/palettes';

export type TFunction = (key: StringKey, vars?: Record<string, string | number>) => string;

/** Formats a number the French way: 12 450. */
export function fmt(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** The language in use: the player's choice, or the phone's. */
export function useLang(): Lang {
  return langOf(useProfile((s) => s.lang));
}

export function useT(): TFunction {
  const lang = useLang();
  return useCallback(
    (key, vars) => {
      // "{n}" strings have a "_one" variant for the singular.
      const one = vars?.n === 1 ? (`${key}_one` as StringKey) : null;
      let s: string = (one && STRINGS[lang][one]) || (STRINGS[lang][key] ?? STRINGS.fr[key] ?? key);
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, typeof v === 'number' ? fmt(v) : v);
      return s;
    },
    [lang]
  );
}

export function useLevelName(): (level: Level) => string {
  const lang = useLang();
  return useCallback((level) => level.name[lang], [lang]);
}

export function usePalette() {
  const theme = useProfile((s) => s.theme);
  const scheme = useColorScheme();
  return paletteFor(theme, scheme === 'dark');
}

/**
 * Screen size helpers. Phones stay single-column; a wide screen (iPad, mostly)
 * switches to two columns. `compact` is the iPhone SE class of height.
 */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tablet = Math.min(width, height) >= 700;
  return {
    width,
    height,
    insets,
    wide: width >= 900,
    tablet,
    /** Top padding of tab screens: on iPad (and web) the tab bar sits at the top. */
    tabTop: insets.top + (tablet || Platform.OS === 'web' ? 64 : 0),
    compact: height < 720,
  };
}

/** True when the player turned on "Reduce motion" in the game or in the iPhone settings. */
export function useReduceMotion(): boolean {
  const mine = useProfile((s) => s.reduceMotion);
  const [system, setSystem] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setSystem)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystem);
    return () => sub.remove();
  }, []);
  return mine || system;
}

/**
 * The current time, refreshed every minute and when the app comes back: screens that show
 * "today" (daily challenge, wheel, countdowns) turn to the next day at midnight on their own.
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 60_000);
    const sub = AppState.addEventListener('change', (st) => st === 'active' && tick());
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);
  return now;
}
