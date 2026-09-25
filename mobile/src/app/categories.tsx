import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ChevronIcon } from '@/components/icons';
import { Badge, Bar, Emoji, Header, Screen, Section, Tap, Txt } from '@/components/ui';
import { CATEGORIES, DIFFICULTIES, levelsOfCategory, levelsOfDifficulty, TIER_SIZE } from '@/game/rules';
import type { Category, Difficulty } from '@/game/types';
import { useLayout, usePalette, useT } from '@/hooks/use-app';
import { useProfile } from '@/store/profile';

/** A new value each time, so pressing the same run twice starts a new game. */
const freshKey = () => String(Date.now());

const DIFF_ICON: Record<Difficulty, string> = { 1: '🙂', 2: '😎', 3: '🤯' };

export default function Categories() {
  const p = usePalette();
  const t = useT();
  const { insets, tablet } = useLayout();
  const cats = useProfile((s) => s.stats.cat);
  const hasSave = useProfile((s) => !!s.save);
  const tints = [p.actionTint, p.blueTint, p.lilacTint, p.goldTint, p.mintTint];
  const diffColors: Record<Difficulty, { tint: string; border: string }> = {
    1: { tint: p.mintTint, border: p.green },
    2: { tint: p.goldTint, border: p.gold },
    3: { tint: p.actionTint, border: p.action },
  };

  const start = (params: { mode: string; cat?: Category; diff?: string }) =>
    router.push({ pathname: '/jeu', params: { ...params, fresh: freshKey() } });

  return (
    <Screen>
      <Header title={t('new_game')} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
        {hasSave && (
          <Txt size={13} weight="semibold" color={p.muted} center style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            {t('replace_save')}
          </Txt>
        )}
        <Section>{t('adventure')}</Section>
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          {DIFFICULTIES.map((d) => {
            const n = levelsOfDifficulty(d).length;
            return (
              <Tap
                key={d}
                onPress={() => start({ mode: 'classic', diff: String(d) })}
                tint={diffColors[d].tint}
                border={diffColors[d].border}
                label={`${t('adventure')} ${t(`diff_${d}`)}`}
                style={{ minHeight: 66, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Badge tint={p.surface} size={44}>
                  <Emoji size={24}>{DIFF_ICON[d]}</Emoji>
                </Badge>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Txt size={17} weight="heavy">
                      {t(`diff_${d}`)}
                    </Txt>
                    <Txt size={12} weight="bold" color={p.muted}>
                      {t('adventure_sub', { n, t: Math.ceil(n / TIER_SIZE) })}
                    </Txt>
                  </View>
                  <Txt size={13} weight="semibold" color={p.muted} lines={2}>
                    {t(`diff_${d}_sub`)}
                  </Txt>
                </View>
                <ChevronIcon color={p.ink} />
              </Tap>
            );
          })}
        </View>
        <Section>{t('one_category')}</Section>
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((c, i) => {
            const total = levelsOfCategory(c.id).length;
            const done = Math.min(cats[c.id] ?? 0, total);
            const full = done >= total;
            return (
              <Tap
                key={c.id}
                onPress={() => start({ mode: 'category', cat: c.id })}
                label={t(`cat_${c.id}`)}
                style={{ width: tablet ? '32.4%' : '48.8%', height: 62, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Badge tint={tints[i % tints.length]}>
                  <Emoji size={20}>{c.icon}</Emoji>
                </Badge>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt size={15} weight="bold" lines={1}>
                    {t(`cat_${c.id}`)}
                  </Txt>
                  <Bar value={done / total} height={5} color={full ? p.green : p.ink} />
                  <Txt size={11} weight={full ? 'bold' : 'semibold'} color={full ? p.green : p.muted}>
                    {done}/{total}
                    {full ? ' ✓' : ''}
                  </Txt>
                </View>
              </Tap>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
