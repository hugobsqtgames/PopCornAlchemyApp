import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Stars } from '@/components/game/board';
import { Badge, Bar, Card, Emoji, Header, Screen, Tap, Txt } from '@/components/ui';
import { LEVELS } from '@/game/levels';
import { CATEGORIES, levelsOfCategory } from '@/game/rules';
import { useLayout, usePalette, useT } from '@/hooks/use-app';
import { useProfile } from '@/store/profile';

/** The Pop-Cornédex: every answer found, sorted by category. */
export default function PopCornedex() {
  const p = usePalette();
  const t = useT();
  const { insets, tablet } = useLayout();
  const found = useProfile((s) => s.found);
  const stars = useProfile((s) => s.stars);
  const have = new Set(found);
  const tints = [p.actionTint, p.blueTint, p.lilacTint, p.goldTint, p.mintTint];
  const starTotal = Object.values(stars).reduce<number>((a, n) => a + n, 0);

  return (
    <Screen>
      <Header title={t('dex')} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
        <View style={{ width: '100%', maxWidth: tablet ? 760 : undefined, alignSelf: 'center' }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <Card style={{ padding: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Txt size={16} weight="heavy">
                  {t('dex_sub', { n: found.length, t: LEVELS.length })}
                </Txt>
                <Txt size={15} weight="heavy" color={p.muted}>
                  {starTotal} ★
                </Txt>
              </View>
              <Bar value={found.length / LEVELS.length} height={8} color={p.green} />
              <Txt size={13} color={p.muted}>
                {t('dex_hint')}
              </Txt>
            </Card>
          </View>
          <View style={{ paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((c, i) => {
              const levels = levelsOfCategory(c.id);
              const done = levels.filter((l) => have.has(l.id));
              const three = done.filter((l) => stars[l.id] === 3).length;
              const full = done.length === levels.length;
              return (
                <Tap
                  key={c.id}
                  onPress={() => router.push({ pathname: '/popcornedex/[cat]', params: { cat: c.id } })}
                  label={`${t(`cat_${c.id}`)}, ${done.length} / ${levels.length}`}
                  style={{ width: tablet ? '32.4%' : '48.8%', minHeight: 66, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Badge tint={tints[i % tints.length]}>
                    <Emoji size={20}>{c.icon}</Emoji>
                  </Badge>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt size={15} weight="bold" lines={1}>
                      {t(`cat_${c.id}`)}
                    </Txt>
                    <Bar value={done.length / levels.length} height={5} color={full ? p.green : p.ink} />
                    <Txt size={11} weight="semibold" color={full ? p.green : p.muted} lines={1}>
                      {done.length}/{levels.length}
                      {three ? ` · ${three} ★★★` : ''}
                    </Txt>
                  </View>
                </Tap>
              );
            })}
          </View>
          <View style={{ alignItems: 'center', paddingTop: 16, gap: 6 }}>
            <Stars n={3} size={18} />
            <Txt size={12} color={p.muted} center style={{ paddingHorizontal: 24 }}>
              {t('star_rules')}
            </Txt>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
