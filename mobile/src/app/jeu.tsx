import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Animated, View } from 'react-native';

import { CorrectCard, FlashMessage, FuseButton, Grid, Hud, ObjectiveCard, PowerUps, RevealCard, Slots } from '@/components/game/board';
import { ClueSheet } from '@/components/game/clues';
import { GuideBar, GuideBubble, GuideDone, guideTarget } from '@/components/game/guide';
import { PauseSheet } from '@/components/game/pause';
import { OverView, TierView, WinView } from '@/components/game/results';
import { dayKey, daySeed } from '@/game/dates';
import { buildDaily, buildRun, levelById } from '@/game/rules';
import type { Category, Difficulty, Mode, RunConfig, RunSave } from '@/game/types';
import { useLayout, usePalette } from '@/hooks/use-app';
import { useRun } from '@/hooks/use-run';
import { useProfile } from '@/store/profile';

type Params = { mode?: Mode; cat?: Category; diff?: string; resume?: string; ids?: string; target?: string; name?: string };

function makeConfig(params: Params): { config: RunConfig; save?: RunSave } {
  const save = useProfile.getState().save;
  if (params.resume && save && save.ids.every((id) => levelById(id))) return { config: save, save };
  switch (params.mode) {
    case 'daily':
      return { config: buildDaily(daySeed(dayKey())) };
    case 'tutorial':
      // The guided first level: Titanic, 🚢 + 🧊.
      return { config: { mode: 'tutorial', ids: [1] } };
    case 'challenge': {
      const ids = (params.ids ?? '').split(',').map(Number).filter((id) => levelById(id));
      return { config: { mode: 'challenge', ids, target: Number(params.target ?? 0), challenger: params.name } };
    }
    case 'category':
      return { config: buildRun('category', { category: params.cat }) };
    case 'chrono':
    case 'hardcore':
    case 'zen':
      return { config: buildRun(params.mode) };
    default: {
      const d = Number(params.diff);
      return { config: buildRun('classic', { difficulty: d === 2 || d === 3 ? d : (1 as Difficulty) }) };
    }
  }
}

export default function Jeu() {
  const params = useLocalSearchParams<Params>();
  const [{ config, save }] = useState(() => makeConfig(params));
  const run = useRun(config, save);
  const [cluesOpen, setCluesOpen] = useState(false);
  const openClues = () => setCluesOpen(true);
  const p = usePalette();
  const { wide: wideScreen, tablet, insets, height, width } = useLayout();
  // Side-by-side layout only in landscape; an iPad held upright uses the phone layout, bigger.
  const wide = wideScreen && width > height;

  if (!config.ids.length) return <Redirect href="/" />;

  const replay = () =>
    router.replace({
      pathname: '/jeu',
      params:
        config.mode === 'challenge'
          ? { mode: 'challenge', ids: config.ids.join(','), target: String(config.target ?? 0), name: config.challenger ?? '' }
          : { mode: config.mode, cat: config.category ?? '', diff: String(config.difficulty ?? 1), fresh: String(Date.now()) },
    });

  const tutorial = config.mode === 'tutorial';
  if (tutorial && run.phase === 'win') return <GuideDone />;
  if (run.phase === 'tier') return <TierView run={run} />;
  if (run.phase === 'over') return <OverView run={run} onReplay={replay} />;
  if (run.phase === 'win') return <WinView run={run} />;

  const pause = () => run.setPaused(true);
  const big = height > 800;
  const slotSize = wide || tablet ? 76 : big ? 62 : 50;
  const guide = guideTarget(run);
  const top = tutorial ? <GuideBar /> : <Hud run={run} onPause={pause} big={wide} />;

  const body = wide ? (
    <View style={{ flex: 1, flexDirection: 'row', gap: 40, paddingHorizontal: 40, paddingTop: 16, paddingBottom: insets.bottom + 24 }}>
      <View style={{ width: 420, gap: 22 }}>
        {top}
        <View style={{ height: 6 }} />
        <ObjectiveCard run={run} big />
        <Slots run={run} size={slotSize} />
        {tutorial && <GuideBubble run={run} />}
        <View style={{ flex: 1 }} />
        {!tutorial && <PowerUps run={run} big onClues={openClues} />}
        <FuseButton run={run} big />
      </View>
      <View style={{ flex: 1 }}>
        <Grid run={run} cols={5} guide={guide} />
        <CorrectCard run={run} />
        <RevealCard run={run} />
      </View>
    </View>
  ) : (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10), gap: 14, width: '100%', maxWidth: tablet ? 680 : 600, alignSelf: 'center' }}>
      {top}
      <ObjectiveCard run={run} big={big} />
      <Slots run={run} size={slotSize} />
      {tutorial && <GuideBubble run={run} />}
      <View style={{ flex: 1 }}>
        <Grid run={run} cols={tablet ? 5 : 4} guide={guide} />
        <CorrectCard run={run} />
        <RevealCard run={run} />
      </View>
      {!tutorial && <PowerUps run={run} big={big} onClues={openClues} />}
      <FuseButton run={run} big={big} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: p.bg, paddingTop: insets.top }}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: run.shake }] }}>{body}</Animated.View>
      <FlashMessage run={run} />
      <PauseSheet run={run} />
      <ClueSheet run={run} open={cluesOpen} onClose={() => setCluesOpen(false)} />
    </View>
  );
}
