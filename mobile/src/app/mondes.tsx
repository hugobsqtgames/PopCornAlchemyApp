import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Popi } from '@/components/mascot';
import { Header, Screen, Tap, Txt } from '@/components/ui';
import { WorldPreview } from '@/components/world-scene';
import { one } from '@/game/links';
import { adventureIds, TIER_SIZE } from '@/game/rules';
import type { Difficulty } from '@/game/types';
import { WORLDS } from '@/game/worlds';
import { useLayout, usePalette, useT } from '@/hooks/use-app';
import type { StringKey } from '@/i18n/strings';
import { useProfile } from '@/store/profile';

/** The worlds of one adventure: done, the current one, and the ones still to discover. */
export default function Mondes() {
  const p = usePalette();
  const t = useT();
  const { insets, tablet } = useLayout();
  const raw = Number(one(useLocalSearchParams<{ diff?: string }>().diff));
  const d: Difficulty | null = raw === 1 || raw === 2 || raw === 3 ? raw : null;
  const passed = useProfile((s) => (d ? s.adventure[d] : 0));
  const stars = useProfile((s) => s.stars);
  const lang = useProfile((s) => s.lang) ?? 'fr';
  if (!d) return <Redirect href="/categories" />;

  const ids = adventureIds(d);
  const worlds = WORLDS[d];

  return (
    <Screen>
      <Header title={t(`worlds_title_${d}` as StringKey)} />
      <Txt size={13} weight="semibold" color={p.muted} style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        {t('worlds_sub', { d: `${t('adventure')} ${t(`diff_${d}` as StringKey)}`, n: worlds.length })}
      </Txt>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 8 }}>
        <View style={{ width: '100%', maxWidth: tablet ? 640 : undefined, alignSelf: 'center', gap: 8 }}>
          {worlds.map((world, tier) => {
            const start = tier * TIER_SIZE;
            const end = Math.min(ids.length, start + TIER_SIZE);
            const done = passed >= end;
            const current = !done && passed >= start;
            const locked = !done && !current;
            const got = ids.slice(start, end).reduce((sum, id) => sum + (stars[id] ?? 0), 0);
            const name = `${tier + 1} · ${world.name[lang]}`;
            const status = done
              ? t('world_done', { s: got, t: (end - start) * 3 })
              : current
                ? t('world_current', { n: passed - start, t: end - start })
                : t('world_levels', { a: start + 1, b: end });
            return (
              <Tap
                key={tier}
                onPress={() => router.back()}
                disabled={locked}
                label={`${name}, ${status}`}
                tint={done ? p.greenTint : current ? p.goldTint : undefined}
                border={done ? p.green : current ? p.gold : undefined}
                style={{ minHeight: 80, paddingHorizontal: 8, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 92, height: 64, borderRadius: 14, overflow: 'hidden', opacity: locked ? 0.55 : 1 }}>
                  <WorldPreview world={world} width={92} height={64} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt size={16} weight="heavy" color={locked ? p.muted : p.ink} lines={2}>
                    {name}
                  </Txt>
                  <Txt size={12} weight="bold" color={done ? p.greenDeep : current ? p.ink : p.muted}>
                    {status}
                  </Txt>
                </View>
                <Txt size={16} weight="heavy" color={p.muted}>
                  {done ? '✓' : locked ? '🔒' : '›'}
                </Txt>
              </Tap>
            );
          })}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: p.surface, borderWidth: p.border, borderColor: p.line, marginTop: 4 }}>
            <Popi mood="joy" size={48} />
            <Txt size={13} weight="semibold" style={{ flex: 1 }}>
              {t('world_hint')}
            </Txt>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
