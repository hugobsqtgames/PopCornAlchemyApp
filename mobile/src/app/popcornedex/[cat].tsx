import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Stars } from '@/components/game/board';
import { Card, Emoji, Header, Screen, Tap, Txt } from '@/components/ui';
import { parseCategory } from '@/game/links';
import { levelsOfCategory } from '@/game/rules';
import { useLayout, useLevelName, usePalette, useT } from '@/hooks/use-app';
import { useProfile } from '@/store/profile';

/** One category of the Pop-Cornédex: found answers with their stars, the others still hidden. */
export default function DexCategory() {
  const p = usePalette();
  const t = useT();
  const name = useLevelName();
  const { insets, tablet } = useLayout();
  const cat = parseCategory(useLocalSearchParams<{ cat?: string }>().cat);
  const found = useProfile((s) => s.found);
  const stars = useProfile((s) => s.stars);
  if (!cat) return <Redirect href="/popcornedex" />;
  const have = new Set(found);
  const levels = [...levelsOfCategory(cat)].sort((a, b) => a.d - b.d || a.id - b.id);
  const done = levels.filter((l) => have.has(l.id)).length;
  const width = tablet ? '49.2%' : '100%';

  return (
    <Screen>
      <Header title={t(`cat_${cat}`)} right={<Txt size={14} weight="heavy" color={p.muted}>{`${done}/${levels.length}`}</Txt>} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
        <View style={{ width: '100%', maxWidth: tablet ? 900 : undefined, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {levels.map((l) =>
            have.has(l.id) ? (
              <Tap
                key={l.id}
                onPress={() => router.push({ pathname: '/jeu', params: { mode: 'replay', ids: String(l.id), fresh: String(Date.now()) } })}
                label={`${name(l)}, ${stars[l.id] ?? 1} / 3 ${t('st_stars')}, ${t('replay')}`}
                style={{ width, minHeight: 60, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {l.sol.map((e, i) => (
                    <Emoji key={i} size={20}>
                      {e}
                    </Emoji>
                  ))}
                </View>
                <Txt size={14} weight="bold" lines={2} style={{ flex: 1 }}>
                  {name(l)}
                </Txt>
                <Stars n={stars[l.id] ?? 1} size={16} />
              </Tap>
            ) : (
              <Card key={l.id} style={{ width, minHeight: 60, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: 0.6, borderStyle: 'dashed' }}>
                <Txt size={18} weight="heavy" color={p.muted}>
                  ???
                </Txt>
                <Txt size={13} color={p.muted} lines={1} style={{ flex: 1 }}>
                  {t('dex_locked')}
                </Txt>
                <Txt size={12} weight="bold" color={p.muted}>
                  {t(`diff_${l.d}`)}
                </Txt>
              </Card>
            )
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
