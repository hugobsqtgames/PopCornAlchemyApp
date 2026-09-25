import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ChevronIcon } from '@/components/icons';
import { Badge, Bar, Emoji, Header, Screen, Section, Tap, Txt } from '@/components/ui';
import { CATEGORIES, levelsOfCategory } from '@/game/rules';
import type { Category } from '@/game/types';
import { useLayout, usePalette, useT } from '@/hooks/use-app';
import { useProfile } from '@/store/profile';

export default function Categories() {
  const p = usePalette();
  const t = useT();
  const { insets } = useLayout();
  const cats = useProfile((s) => s.stats.cat);
  const tints = [p.actionTint, p.blueTint, p.lilacTint, p.goldTint, p.mintTint];

  const start = (params: { mode: string; cat?: Category }) =>
    router.push({ pathname: '/jeu', params: { ...params, fresh: String(Date.now()) } });

  return (
    <Screen>
      <Header title={t('new_game')} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Tap
            onPress={() => start({ mode: 'classic' })}
            tint={p.goldTint}
            border={p.gold}
            label={t('all_mixed')}
            style={{ height: 68, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Badge tint={p.gold} size={44}>
              <Emoji size={22}>🌟</Emoji>
            </Badge>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt size={17} weight="heavy">
                {t('all_mixed')}
              </Txt>
              <Txt size={13} weight="semibold" color={p.muted}>
                {t('all_mixed_sub')}
              </Txt>
            </View>
            <ChevronIcon color={p.ink} />
          </Tap>
        </View>
        <Section>{t('one_category')}</Section>
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((c, i) => {
            const total = levelsOfCategory(c.id).length;
            const done = Math.min(cats[c.id], total);
            const full = done >= total;
            return (
              <Tap
                key={c.id}
                onPress={() => start({ mode: 'category', cat: c.id })}
                label={t(`cat_${c.id}`)}
                style={{ width: '48.8%', height: 62, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
