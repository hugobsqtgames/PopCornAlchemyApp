import { ACHIEVEMENTS } from '@/game/achievements';
import { ACHIEVEMENT_TEXT } from '@/i18n/achievements';
import { STRINGS } from '@/i18n/strings';
import { useProfile } from '@/store/profile';
import { useUi } from '@/store/ui';

import { play } from './feedback';

type AchKey = keyof (typeof ACHIEVEMENT_TEXT)['fr'];

export function achievementText(id: string, lang: 'fr' | 'en' | 'es') {
  const dict = ACHIEVEMENT_TEXT[lang] as Record<AchKey, string>;
  return {
    title: dict[`ach_${id}` as AchKey] ?? id,
    desc: dict[`ach_${id}_desc` as AchKey] ?? '',
  };
}

/** Unlocks newly reached achievements and shows a toast for each. */
export function checkAchievements() {
  const fresh = useProfile.getState().checkAchievements();
  if (!fresh.length) return;
  const lang = useProfile.getState().lang ?? 'fr';
  play('win');
  for (const id of fresh) {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    useUi.getState().toast(a?.icon ?? '🏆', STRINGS[lang].trophy_toast, achievementText(id, lang).title);
  }
}
