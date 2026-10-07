import { ACHIEVEMENTS } from '@/game/achievements';
import type { Lang } from '@/game/types';
import { ACHIEVEMENT_TEXT } from '@/i18n/achievements';
import { PACKS, STRINGS } from '@/i18n/strings';
import { useProfile } from '@/store/profile';
import { useUi } from '@/store/ui';
import { langOf } from '@/i18n/device';

import { play } from './feedback';

type AchKey = keyof (typeof ACHIEVEMENT_TEXT)['fr'];

export function achievementText(id: string, lang: Lang) {
  const dict = (lang === 'fr' || lang === 'en' || lang === 'es' ? ACHIEVEMENT_TEXT[lang] : { ...ACHIEVEMENT_TEXT.en, ...PACKS[lang].achievements }) as Record<AchKey, string>;
  return {
    title: dict[`ach_${id}` as AchKey] ?? id,
    desc: dict[`ach_${id}_desc` as AchKey] ?? '',
  };
}

/** Unlocks newly reached achievements and shows a toast for each. */
export function checkAchievements() {
  const fresh = useProfile.getState().checkAchievements();
  if (!fresh.length) return;
  const lang = langOf(useProfile.getState().lang);
  play('win');
  for (const id of fresh) {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    useUi.getState().toast(a?.icon ?? '🏆', STRINGS[lang].trophy_toast, `${achievementText(id, lang).title} · +1 🧰`);
  }
}
