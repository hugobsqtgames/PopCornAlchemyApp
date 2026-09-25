import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Animated, View } from 'react-native';

import { CorrectCard, FlashMessage, FuseButton, Grid, Hud, ObjectiveCard, PowerUps, Slots } from '@/components/game/board';
import { PauseSheet } from '@/components/game/pause';
import { OverView, TierView, WinView } from '@/components/game/results';
import { dayKey, daySeed } from '@/game/dates';
import { buildDaily, buildRun, levelById } from '@/game/rules';
import type { Category, Mode, RunConfig, RunSave } from '@/game/types';
import { useLayout, usePalette } from '@/hooks/use-app';
import { useRun } from '@/hooks/use-run';
import { useProfile } from '@/store/profile';

type Params = { mode?: Mode; cat?: Category; resume?: string; ids?: string; target?: string; name?: string };

function makeConfig(params: Params): { config: RunConfig; save?: RunSave } {
  const save = useProfile.getState().save;
  if (params.resume && save && save.ids.every((id) => levelById(id))) return { config: save, save };
  switch (params.mode) {
    case 'daily':
      return { config: buildDaily(daySeed(dayKey())) };
    case 'challenge': {
      const ids = (params.ids ?? '').split(',').map(Number).filter((id) => levelById(id));
      return { config: { mode: 'challenge', ids, target: Number(params.target ?? 0), challenger: params.name } };
    }
    case 'category':
      return { config: buildRun('category', params.cat) };
    case 'chrono':
    case 'hardcore':
      return { config: buildRun(params.mode) };
    default:
      return { config: buildRun('classic') };
  }
}

export default function Jeu() {
  const params = useLocalSearchParams<Params>();
  const [{ config, save }] = useState(() => makeConfig(params));
  const run = useRun(config, save);
  const p = usePalette();
  const { wide, insets, height } = useLayout();

  if (!config.ids.length) return <Redirect href="/" />;

  const replay = () =>
    router.replace({
      pathname: '/jeu',
      params:
        config.mode === 'challenge'
          ? { mode: 'challenge', ids: config.ids.join(','), target: String(config.target ?? 0), name: config.challenger ?? '' }
          : { mode: config.mode, cat: config.category ?? '', fresh: String(Date.now()) },
    });

  if (run.phase === 'tier') return <TierView run={run} />;
  if (run.phase === 'over') return <OverView run={run} onReplay={replay} />;
  if (run.phase === 'win') return <WinView run={run} />;

  const pause = () => run.setPaused(true);
  const big = height > 800;
  const slotSize = wide ? 76 : big ? 62 : 50;

  const body = wide ? (
    <View style={{ flex: 1, flexDirection: 'row', gap: 40, paddingHorizontal: 40, paddingTop: 16, paddingBottom: insets.bottom + 24 }}>
      <View style={{ width: 420, gap: 22 }}>
        <Hud run={run} onPause={pause} big />
        <View style={{ height: 6 }} />
        <ObjectiveCard run={run} big />
        <Slots run={run} size={slotSize} />
        <View style={{ flex: 1 }} />
        <PowerUps run={run} big />
        <FuseButton run={run} big />
      </View>
      <View style={{ flex: 1 }}>
        <Grid run={run} cols={5} />
        <CorrectCard run={run} />
      </View>
    </View>
  ) : (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10), gap: 14, width: '100%', maxWidth: 600, alignSelf: 'center' }}>
      <Hud run={run} onPause={pause} />
      <ObjectiveCard run={run} big={big} />
      <Slots run={run} size={slotSize} />
      <View style={{ flex: 1 }}>
        <Grid run={run} cols={4} />
        <CorrectCard run={run} />
      </View>
      <PowerUps run={run} big={big} />
      <FuseButton run={run} big={big} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: p.bg, paddingTop: insets.top }}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: run.shake }] }}>{body}</Animated.View>
      <FlashMessage run={run} />
      <PauseSheet run={run} />
    </View>
  );
}
