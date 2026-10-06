import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ChestKind } from '@/game/chests';

import { BURST_AT, KNOCKS, type ChestPhase } from './scene';

/** Pictures of the 3D chests (rendered from the same model by store/outils/coffres). */
export const CHEST_IMAGES: Record<ChestKind, number> = {
  wood: require('@/assets/images/chest-wood.png'),
  gold: require('@/assets/images/chest-gold.png'),
  legend: require('@/assets/images/chest-legend.png'),
};
export const CHEST_GLOW: Record<ChestKind, string> = { wood: '#ffd27a', gold: '#ffe28a', legend: '#c9a2ff' };

interface Props {
  kind: ChestKind;
  openKey: number;
  reduceMotion?: boolean;
  onKnock?: (i: number) => void;
  onBurst?: () => void;
  onPhase?: (phase: ChestPhase) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * The chest show without 3D (a device where the GL view cannot start): the picture of the chest
 * drops in, takes the same three knocks and bursts with a flash of its colour, on the same timing.
 */
export function ChestFallback({ kind, openKey, reduceMotion, onKnock, onBurst, onPhase, style }: Props) {
  const drop = useState(() => new Animated.Value(0))[0];
  const knock = useState(() => new Animated.Value(0))[0];
  const burst = useState(() => new Animated.Value(0))[0];
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    drop.setValue(reduceMotion ? 1 : 0);
    burst.setValue(0);
    onPhase?.('appear');
    Animated.timing(drop, { toValue: 1, duration: 700, easing: Easing.bounce, useNativeDriver: true }).start(() => onPhase?.('idle'));
    // Only a new chest restarts the drop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  useEffect(() => {
    if (openKey <= 0) return;
    onPhase?.('charge');
    timers.current.forEach(clearTimeout);
    timers.current = KNOCKS.map((at, i) =>
      setTimeout(() => {
        onKnock?.(i);
        knock.setValue(0);
        Animated.timing(knock, { toValue: 1, duration: 320, useNativeDriver: true }).start();
      }, at * 1000),
    );
    timers.current.push(
      setTimeout(() => {
        onPhase?.('burst');
        onBurst?.();
        Animated.timing(burst, { toValue: 1, duration: 550, easing: Easing.out(Easing.back(2)), useNativeDriver: true }).start(() => onPhase?.('open'));
      }, BURST_AT * 1000),
    );
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey]);

  const y = drop.interpolate({ inputRange: [0, 1], outputRange: [-320, 0] });
  const hop = knock.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -18, 0] });
  const twist = knock.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '-6deg', '5deg', '-3deg', '0deg'] });
  const grow = burst.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const flash = burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0.55] });

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View style={{ position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: CHEST_GLOW[kind], opacity: flash, transform: [{ scale: grow }] }} />
      <Animated.View style={{ transform: [{ translateY: y }, { translateY: hop }, { rotate: twist }, { scale: grow }] }}>
        <Image source={CHEST_IMAGES[kind]} style={{ width: 260, height: 260 }} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}
