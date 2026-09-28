import { describe, expect, it } from '@jest/globals';

import { LEVELS } from '@/game/levels';
import { WORLDS } from '@/game/worlds';

import { ACHIEVEMENT_TEXT } from '../achievements';
import { pluralForm } from '../langs';
import { PACKS, STRINGS, type StringKey } from '../strings';

const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const worldNames = Object.values(WORLDS).flatMap((list) => list.map((w) => w.name.en));

describe.each(Object.entries(PACKS))('language %s', (lang, pack) => {
  it('translates every interface text, with the same {placeholders}', () => {
    for (const key of Object.keys(STRINGS.en) as StringKey[]) {
      const text = pack.strings[key];
      expect(typeof text === 'string' && text.trim().length > 0 ? key : `${key} missing`).toBe(key);
      expect([key, holes(text)]).toEqual([key, holes(STRINGS.en[key])]);
    }
  });
  it('keeps the placeholders in plural variants and has no unknown keys', () => {
    for (const [key, text] of Object.entries(pack.strings)) {
      const base = key.replace(/_(one|few)$/, '') as StringKey;
      expect([key, key in STRINGS.en || base in STRINGS.en]).toEqual([key, true]);
      expect([key, holes(text)]).toEqual([key, holes(STRINGS.en[base])]);
    }
  });
  it('names every level and every world', () => {
    for (const l of LEVELS) expect([l.id, (pack.levels[String(l.id)] ?? '').trim().length > 0]).toEqual([l.id, true]);
    for (const n of worldNames) expect([n, (pack.worlds[n] ?? '').trim().length > 0]).toEqual([n, true]);
  });
  it('never gives two levels the same answer', () => {
    const seen = new Map<string, number>();
    for (const [id, name] of Object.entries(pack.levels)) {
      const key = name.toLocaleLowerCase(lang);
      expect([id, seen.get(key) ?? null]).toEqual([id, null]);
      seen.set(key, Number(id));
    }
  });
  it('names and describes every trophy', () => {
    for (const key of Object.keys(ACHIEVEMENT_TEXT.en)) expect([key, (pack.achievements[key] ?? '').trim().length > 0]).toEqual([key, true]);
  });
});

describe('plural forms', () => {
  it('follows each language grammar', () => {
    expect([1, 2, 5, 21, 22, 25, 11, 12].map((n) => pluralForm('ru', n))).toEqual(['one', 'few', null, 'one', 'few', null, null, null]);
    expect([1, 2, 5, 21, 22, 12].map((n) => pluralForm('pl', n))).toEqual(['one', 'few', null, null, 'few', null]);
    expect([0, 1, 2].map((n) => pluralForm('en', n))).toEqual([null, 'one', null]);
    expect([0, 1, 2].map((n) => pluralForm('pt', n))).toEqual(['one', 'one', null]);
    expect([1, 2].map((n) => pluralForm('ja', n))).toEqual([null, null]);
  });
});
