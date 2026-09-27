import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { Run } from '@/hooks/use-run';
import { useLayout, useLevelName, usePalette, useT } from '@/hooks/use-app';
import { useProfile } from '@/store/profile';

import { Confetti } from '../confetti';
import { Btn, Card, Emoji, Screen, Txt } from '../ui';

/** Ends the guided level and opens the home screen. */
function finish() {
  useProfile.getState().set({ tutorialDone: true });
  router.replace('/');
}

/** Grid index of the next emoji to tap in the guided level. */
export function guideTarget(run: Run): number | undefined {
  if (run.config.mode !== 'tutorial' || run.phase !== 'play' || !run.level) return undefined;
  const missing = [...run.level.sol];
  for (const i of run.picked) {
    const k = missing.indexOf(run.grid[i]);
    if (k >= 0) missing.splice(k, 1);
  }
  if (!missing.length) return undefined;
  const i = run.grid.findIndex((e, j) => e === missing[0] && !run.picked.includes(j));
  return i >= 0 ? i : undefined;
}

/** Top bar of the guided level: its name and a way out. */
export function GuideBar() {
  const p = usePalette();
  const t = useT();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 44 }}>
      <Txt size={13} weight="bold" color={p.muted} style={{ letterSpacing: 1.2 }}>
        {t('tuto_label')}
      </Txt>
      <Pressable onPress={finish} hitSlop={10} accessibilityRole="button">
        <Txt size={15} weight="bold" color={p.muted}>
          {t('skip')}
        </Txt>
      </Pressable>
    </View>
  );
}

/** What to do now: tap this emoji, then that one, then fuse. */
export function GuideBubble({ run }: { run: Run }) {
  const p = usePalette();
  const t = useT();
  const name = useLevelName();
  if (!run.level || run.phase !== 'play') return null;
  const target = guideTarget(run);
  const text =
    target === undefined
      ? t('guide_fuse')
      : run.picked.length === 0
        ? t('guide_intro', { name: name(run.level), e: run.grid[target] })
        : t('guide_next', { e: run.grid[target] });
  return (
    <View accessibilityLiveRegion="polite" style={{ alignSelf: 'center', maxWidth: 420, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: p.ink }}>
      <Txt size={15} weight="bold" color={p.bg} center>
        {text}
      </Txt>
    </View>
  );
}

/** After the guided level: "You got it!" and off to the home screen. */
export function GuideDone() {
  const p = usePalette();
  const t = useT();
  const { insets } = useLayout();
  return (
    <Screen>
      <Confetti />
      <View style={{ flex: 1 }} />
      <View style={{ alignItems: 'center', gap: 14, paddingHorizontal: 24 }}>
        <View style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: p.gold, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5, borderColor: p.goldDeep }}>
          <Emoji size={56}>🍿</Emoji>
        </View>
        <Txt size={26} weight="heavy" center>
          {t('guide_done_title')}
        </Txt>
        <Txt size={16} color={p.muted} center>
          {t('guide_done_sub')}
        </Txt>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
        <Card style={{ padding: 14, gap: 10 }}>
          {[
            ['❤️', t('tuto_1')],
            ['⏱️', t('tuto_2')],
            ['🔥', t('tuto_3')],
          ].map(([icon, text]) => (
            <View key={icon} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Emoji size={20}>{icon}</Emoji>
              <Txt size={15} weight="semibold" style={{ flex: 1 }}>
                {text}
              </Txt>
            </View>
          ))}
        </Card>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}>
        <Btn label={t('guide_start')} onPress={finish} />
      </View>
    </Screen>
  );
}
