import { Redirect, router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { CorrectCard, FlashMessage, FuseButton, Grid, Hud, ObjectiveCard, PowerUps, RevealCard, Slots } from '@/components/game/board';
import { ClueSheet } from '@/components/game/clues';
import { GuideBar, GuideBubble, GuideDone, guideTarget } from '@/components/game/guide';
import { PauseSheet } from '@/components/game/pause';
import { OverView, TierView, WinView } from '@/components/game/results';
import { dayKey, daySeed } from '@/game/dates';
import { one, parseCategory, parseLevelIds, parseName, parseScore } from '@/game/links';
import { adventureIds, buildDaily, buildRun, startLives } from '@/game/rules';
import type { Difficulty, Mode, RunConfig, RunSave } from '@/game/types';
import { useLayout, usePalette } from '@/hooks/use-app';
import { useRun } from '@/hooks/use-run';
import { useProfile } from '@/store/profile';

type Param = string | string[] | undefined;
type Params = { mode?: Param; cat?: Param; diff?: Param; resume?: Param; ids?: Param; target?: Param; name?: Param; from?: Param };

function makeConfig(params: Params): { config: RunConfig; save?: RunSave } {
  // The profile store already dropped any save that does not point to a real level.
  const save = useProfile.getState().save;
  if (one(params.resume) && save) return { config: save, save };
  const mode = one(params.mode) as Mode | undefined;
  switch (mode) {
    case 'daily':
      return { config: buildDaily(daySeed(dayKey())) };
    case 'tutorial':
      // The guided first level: Titanic, 🚢 + 🧊.
      return { config: { mode: 'tutorial', ids: [1] } };
    case 'replay': {
      // One level again, from the Pop-Cornédex or the map: only a level already found or passed.
      const { found, adventure } = useProfile.getState();
      const passed = ([1, 2, 3] as const).flatMap((d) => adventureIds(d).slice(0, adventure[d]));
      const ids = parseLevelIds(params.ids, 1).filter((id) => found.includes(id) || passed.includes(id));
      return { config: { mode: 'replay', ids, ...(one(params.from) === 'map' && { origin: 'map' as const }) } };
    }
    case 'challenge':
      return { config: { mode: 'challenge', ids: parseLevelIds(params.ids), target: parseScore(params.target), challenger: parseName(params.name) } };
    case 'category': {
      const category = parseCategory(params.cat);
      // An unknown category is not a run: back home.
      return { config: category ? buildRun('category', { category }) : { mode: 'category', ids: [] } };
    }
    case 'chrono':
    case 'hardcore':
    case 'zen':
      return { config: buildRun(mode) };
    default: {
      // The adventure map: its fixed levels, from the first one not passed yet.
      const n = Number(one(params.diff));
      const d: Difficulty = n === 2 || n === 3 ? n : 1;
      const ids = adventureIds(d);
      const passed = useProfile.getState().adventure[d];
      const config: RunConfig = { mode: 'classic', difficulty: d, ids, adventure: true };
      // A finished adventure starts over from level 1 (the map keeps its progress and stars).
      const index = passed < ids.length ? passed : 0;
      return { config, save: index ? { ...config, index, lives: startLives('classic'), score: 0, combo: 0, continued: false } : undefined };
    }
  }
}

export default function Jeu() {
  const params = useLocalSearchParams<Params>();
  const [{ config, save }] = useState(() => makeConfig(params));
  const run = useRun(config, save);
  const [cluesOpen, setCluesOpen] = useState(false);
  // Another screen on top (rules, a challenge link…): the run waits paused underneath.
  const focused = useIsFocused();
  const { setPaused } = run;
  useEffect(() => {
    if (!focused) setPaused(true);
  }, [focused, setPaused]);
  // The clue sheet closes when the game pauses (the pause sheet takes its place).
  if (run.paused && cluesOpen) setCluesOpen(false);
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
          : config.mode === 'replay'
            ? { mode: 'replay', ids: config.ids.join(','), from: config.origin ?? '', fresh: String(Date.now()) }
            : { mode: config.mode, cat: config.category ?? '', diff: String(config.difficulty ?? 1), fresh: String(Date.now()) },
    });

  const tutorial = config.mode === 'tutorial';
  if (tutorial && run.phase === 'win') return <GuideDone />;
  if (run.phase === 'tier') return <TierView run={run} />;
  if (run.phase === 'over') return <OverView run={run} onReplay={replay} />;
  if (run.phase === 'win') return <WinView run={run} onReplay={replay} />;

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
