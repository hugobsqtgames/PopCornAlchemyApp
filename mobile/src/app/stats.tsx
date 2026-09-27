import { ScrollView, View } from 'react-native';

import { Stars } from '@/components/game/board';
import { Bar, Card, Emoji, Header, Screen, Section, Txt } from '@/components/ui';
import { LEVELS } from '@/game/levels';
import { categoryStats, favoriteCategory, formatDuration } from '@/game/progress';
import { CATEGORIES } from '@/game/rules';
import { fmt, useLayout, usePalette, useT } from '@/hooks/use-app';
import { useProfile } from '@/store/profile';

/** "2 h 05", "12 min", "45 s". */
function durationText(seconds: number) {
  const { h, m, s } = formatDuration(seconds);
  if (h) return `${h} h ${String(m).padStart(2, '0')}`;
  if (m) return `${m} min`;
  return `${s} s`;
}

/** "27 septembre 2026" in the player's language, from a "2026-09-27" day key. */
function dayText(day: string, lang: string) {
  const [y, m, d] = day.split('-').map(Number);
  try {
    return new Date(y, m - 1, d).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return `${d}/${m}/${y}`;
  }
}

const pct = (x: number) => `${Math.round(x * 100)} %`;

export default function Statistiques() {
  const p = usePalette();
  const t = useT();
  const { insets, tablet } = useLayout();
  const s = useProfile();
  const lang = s.lang ?? 'fr';
  const perCat = categoryStats(s.stats);
  const wins = perCat.reduce((a, c) => a + c.wins, 0);
  const tries = perCat.reduce((a, c) => a + c.tries, 0);
  const fav = favoriteCategory(s.stats);
  const favCat = CATEGORIES.find((c) => c.id === fav);
  const starTotal = Object.values(s.stars).reduce<number>((a, n) => a + n, 0);

  const big = [
    { icon: '⏱️', label: t('st_time'), value: durationText(s.stats.playSeconds) },
    { icon: '🎯', label: t('st_accuracy'), value: tries ? pct(wins / tries) : '—' },
    { icon: favCat?.icon ?? '❔', label: t('st_favorite'), value: favCat ? t(`cat_${favCat.id}`) : '—' },
    {
      icon: '📅',
      label: t('st_best_day'),
      value: s.bestDay ? t('st_best_day_value', { n: s.bestDay.levels, d: dayText(s.bestDay.day, lang) }) : '—',
    },
  ];
  const small = [
    { label: t('stat_levels'), value: fmt(s.stats.levels) },
    { label: t('st_stars'), value: `${fmt(starTotal)} ★` },
    { label: t('dex'), value: `${s.found.length}/${LEVELS.length}` },
    { label: t('stat_combo'), value: `×${s.stats.bestCombo}` },
  ];
  const half = tablet ? '49.2%' : '48.8%';

  return (
    <Screen>
      <Header title={t('stats')} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
        <View style={{ width: '100%', maxWidth: tablet ? 760 : undefined, alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 8 }}>
            {big.map((b) => (
              <Card key={b.label} style={{ width: half, padding: 12, gap: 6, borderRadius: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Emoji size={16}>{b.icon}</Emoji>
                  <Txt size={12} weight="semibold" color={p.muted} lines={1} style={{ flex: 1 }}>
                    {b.label}
                  </Txt>
                </View>
                <Txt size={17} weight="heavy" lines={2}>
                  {b.value}
                </Txt>
              </Card>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8 }}>
            {small.map((b) => (
              <Card key={b.label} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', gap: 2, borderRadius: 14 }}>
                <Txt size={15} weight="heavy" lines={1}>
                  {b.value}
                </Txt>
                <Txt size={11} weight="semibold" color={p.muted} center lines={1}>
                  {b.label}
                </Txt>
              </Card>
            ))}
          </View>
          <Section>{t('st_by_cat')}</Section>
          <Card style={{ marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 6 }}>
            {perCat.map((c, i) => {
              const info = CATEGORIES.find((x) => x.id === c.cat);
              return (
                <View
                  key={c.cat}
                  accessible
                  accessibilityLabel={`${t(`cat_${c.cat}`)}, ${c.accuracy === null ? t('st_none') : pct(c.accuracy)}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderColor: p.line }}>
                  <Emoji size={18}>{info?.icon}</Emoji>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                      <Txt size={14} weight="bold" lines={1} style={{ flex: 1 }}>
                        {t(`cat_${c.cat}`)}
                      </Txt>
                      <Txt size={13} weight="heavy" color={c.accuracy === null ? p.muted : p.ink}>
                        {c.accuracy === null ? t('st_none') : pct(c.accuracy)}
                      </Txt>
                    </View>
                    <Bar value={c.accuracy ?? 0} height={5} color={c.accuracy !== null && c.accuracy >= 0.8 ? p.green : p.ink} />
                    {c.tries > 0 && (
                      <Txt size={11} color={p.muted}>
                        {t('st_answers', { w: c.wins, t: c.tries })}
                      </Txt>
                    )}
                  </View>
                </View>
              );
            })}
          </Card>
          <View style={{ alignItems: 'center', paddingTop: 14, gap: 4 }}>
            <Stars n={3} size={16} />
            <Txt size={12} color={p.muted} center style={{ paddingHorizontal: 24 }}>
              {t('star_rules')}
            </Txt>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
