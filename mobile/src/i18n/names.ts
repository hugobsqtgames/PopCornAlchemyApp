import type { BaseLang, Lang, Level } from '@/game/types';
import type { World } from '@/game/worlds';

import { PACKS } from './strings';

const isBase = (lang: Lang): lang is BaseLang => lang === 'fr' || lang === 'en' || lang === 'es';

/** A level's answer in a language (English if a translation were ever missing). */
export function levelName(level: Level, lang: Lang): string {
  if (isBase(lang)) return level.name[lang];
  return PACKS[lang].levels[String(level.id)] ?? level.name.en;
}

/** A world's name in a language. */
export function worldName(world: World, lang: Lang): string {
  if (isBase(lang)) return world.name[lang];
  return PACKS[lang].worlds[world.name.en] ?? world.name.en;
}
