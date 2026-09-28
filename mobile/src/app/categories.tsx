import { router } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { ScrollView, View } from 'react-native';

import { ChevronIcon } from '@/components/icons';
import { Badge, Bar, Emoji, Header, Screen, Section, Tap, Txt } from '@/components/ui';
import { adventureIds, CATEGORIES, DIFFICULTIES, levelsOfCategory, levelsOfDifficulty, TIER_SIZE } from '@/game/rules';
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
  const adventure = useProfile((s) => s.adventure);
  const stars = useProfile((s) => s.stars);
  const found = useProfile((s) => s.found);
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
        <Section>{t('adventure_path')}</Section>
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          {DIFFICULTIES.map((d) => {
            const n = levelsOfDifficulty(d).length;
            const passed = adventure[d];
            const got = adventureIds(d).reduce((sum, id) => sum + (stars[id] ?? 0), 0);
            return (
              <Tap
                key={d}
                onPress={() => router.push({ pathname: '/aventure', params: { diff: String(d) } })}
                tint={diffColors[d].tint}
                border={diffColors[d].border}
                label={`${t('adventure')} ${t(`diff_${d}`)}`}
                style={{ minHeight: 66, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MiniPath done={passed / n} p={p} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Txt size={17} weight="heavy">
                      {t(`diff_${d}`)}
                    </Txt>
                    <Txt size={12} weight="bold" color={p.muted}>
                      {DIFF_ICON[d]}
                    </Txt>
                  </View>
                  {passed > 0 ? (
                    <Txt size={13} weight="bold" color={p.greenDeep} lines={1}>
                      {passed >= n ? `${t('map_done')} ★ ${got}` : t('map_progress', { n: passed + 1, s: got })}
                    </Txt>
                  ) : (
                    <Txt size={13} weight="semibold" color={p.muted} lines={2}>
                      {`${t(`diff_${d}_sub`)} · ${t('adventure_sub', { n, t: Math.ceil(n / TIER_SIZE) })}`}
                    </Txt>
                  )}
                </View>
                <ChevronIcon color={p.ink} />
              </Tap>
            );
          })}
        </View>
        <Section>{t('categories_free')}</Section>
        <Txt size={12} weight="semibold" color={p.muted} style={{ paddingHorizontal: 20, marginTop: -4, marginBottom: 8 }}>
          {t('categories_hint')}
        </Txt>
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((c, i) => {
            const levels = levelsOfCategory(c.id);
            const total = levels.length;
            // Answers of this category in the Pop-Cornédex, and their stars.
            const done = levels.filter((l) => found.includes(l.id)).length;
            const got = levels.reduce((sum, l) => sum + (stars[l.id] ?? 0), 0);
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
                    {got ? ` · ★ ${got}` : ''}
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

/** A tiny path of the adventure: gold up to where the player is, grey after. */
function MiniPath({ done, p }: { done: number; p: ReturnType<typeof usePalette> }) {
  const dots = [
    { x: 6, y: 32 },
    { x: 20, y: 15 },
    { x: 33, y: 22 },
    { x: 46, y: 23 },
    { x: 58, y: 8 },
  ];
  // The current dot: how far along the adventure the player is, on 5 dots.
  const at = Math.min(dots.length - 1, Math.floor(done * dots.length));
  return (
    <Svg width={64} height={40} viewBox="0 0 64 40">
      <Path d="M6 32 Q16 8 30 20 Q44 32 58 8" stroke={done > 0 ? p.gold : p.line} strokeWidth={5} fill="none" strokeLinecap="round" />
      {dots.map((c, i) => (
        <Circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={i === at ? 6.5 : i < at ? 5 : 4}
          fill={i === at ? p.gold : i < at ? p.green : p.line2}
          stroke={i === at ? '#FFFFFF' : 'none'}
          strokeWidth={2}
        />
      ))}
    </Svg>
  );
}
