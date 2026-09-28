import { useEffect, useState } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Text as SvgText } from 'react-native-svg';

import { useReduceMotion } from '@/hooks/use-app';

export type Mood = 'idle' | 'happy' | 'joy' | 'fever' | 'sad' | 'surprised' | 'sleep';

const INK = '#1F1B2D';
const BODY = '#FFF7E0';
const OUTLINE = '#E3CC96';
const HULL = '#F2B33D';
const HULL_DEEP = '#D9A01A';
const GOLD = '#FFC93C';

/** The fluffy pop-corn body, as circles: drawn once bigger (outline), then on top (fill). */
const PUFFS: [number, number, number][] = [
  [100, 112, 56],
  [56, 108, 28],
  [144, 108, 28],
  [66, 70, 30],
  [134, 70, 30],
  [100, 52, 34],
  [62, 138, 24],
  [138, 138, 24],
];

/** Room around the body for flames, raised arms and sparkles. */
const VIEW = { x: -12, y: -46, w: 224, h: 246 };

const eyeLine = { stroke: INK, strokeWidth: 5, strokeLinecap: 'round' as const, fill: 'none' };

function Face({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'happy':
      return (
        <G>
          <Path d="M73 105 Q82 93 91 105" {...eyeLine} />
          <Path d="M109 105 Q118 93 127 105" {...eyeLine} />
          <Path d="M85 119 Q100 142 115 119 Z" fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <Ellipse cx={100} cy={131} rx={7} ry={4.5} fill="#FF7A6B" />
        </G>
      );
    case 'joy':
      return (
        <G>
          <Circle cx={30} cy={66} r={18} fill={OUTLINE} />
          <Circle cx={170} cy={66} r={18} fill={OUTLINE} />
          <Circle cx={30} cy={66} r={14} fill={BODY} />
          <Circle cx={170} cy={66} r={14} fill={BODY} />
          <Path d="M82 88 L85 96 L93 97 L87 102 L89 110 L82 106 L75 110 L77 102 L71 97 L79 96 Z" fill={GOLD} stroke={HULL_DEEP} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M118 88 L121 96 L129 97 L123 102 L125 110 L118 106 L111 110 L113 102 L107 97 L115 96 Z" fill={GOLD} stroke={HULL_DEEP} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M80 118 Q100 150 120 118 Z" fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <Ellipse cx={100} cy={134} rx={9} ry={6} fill="#FF7A6B" />
          <Path d="M8 14 L12 24 L22 28 L12 32 L8 42 L4 32 L-6 28 L4 24 Z" fill={GOLD} />
          <Path d="M186 10 L189 18 L197 21 L189 24 L186 32 L183 24 L175 21 L183 18 Z" fill={GOLD} />
          <Path d="M186 150 L189 157 L196 160 L189 163 L186 170 L183 163 L176 160 L183 157 Z" fill={GOLD} />
        </G>
      );
    case 'fever':
      return (
        <G>
          <Path d="M70 88 L92 96" {...eyeLine} />
          <Path d="M130 88 L108 96" {...eyeLine} />
          <Circle cx={83} cy={106} r={8} fill={INK} />
          <Circle cx={117} cy={106} r={8} fill={INK} />
          <Circle cx={86} cy={103} r={2.6} fill="#FFFFFF" />
          <Circle cx={120} cy={103} r={2.6} fill="#FFFFFF" />
          <Path d="M78 120 Q100 146 122 120 Z" fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <Path d="M84 122 L116 122 L113 128 L87 128 Z" fill="#FFFFFF" />
        </G>
      );
    case 'sad':
      return (
        <G>
          <Path d="M71 92 L89 88" {...eyeLine} strokeWidth={4.5} />
          <Path d="M129 92 L111 88" {...eyeLine} strokeWidth={4.5} />
          <Circle cx={82} cy={104} r={7} fill={INK} />
          <Circle cx={118} cy={104} r={7} fill={INK} />
          <Circle cx={84} cy={102} r={2.2} fill="#FFFFFF" />
          <Circle cx={120} cy={102} r={2.2} fill="#FFFFFF" />
          <Path d="M88 134 Q100 122 112 134" {...eyeLine} strokeWidth={4.5} />
          <Path d="M76 114 Q70 126 76 131 Q83 126 76 114 Z" fill="#6BB6FF" stroke="#3E8EDB" strokeWidth={1.5} />
        </G>
      );
    case 'surprised':
      return (
        <G>
          <Circle cx={82} cy={100} r={11} fill={INK} />
          <Circle cx={118} cy={100} r={11} fill={INK} />
          <Circle cx={86} cy={96} r={3.4} fill="#FFFFFF" />
          <Circle cx={122} cy={96} r={3.4} fill="#FFFFFF" />
          <Ellipse cx={100} cy={129} rx={7} ry={9} fill={INK} />
          <Path d="M168 20 L162 46" stroke="#D93A3A" strokeWidth={6} strokeLinecap="round" />
          <Circle cx={159} cy={58} r={3.5} fill="#D93A3A" />
          <Path d="M186 32 L176 50" stroke="#D93A3A" strokeWidth={5} strokeLinecap="round" />
        </G>
      );
    case 'sleep':
      return (
        <G>
          <Path d="M74 104 Q82 110 90 104" {...eyeLine} strokeWidth={4.5} />
          <Path d="M110 104 Q118 110 126 104" {...eyeLine} strokeWidth={4.5} />
          <Ellipse cx={100} cy={128} rx={5} ry={4} fill={INK} />
          <SvgText x={146} y={44} fontSize={22} fontWeight="800" fill="#6E6882">
            z
          </SvgText>
          <SvgText x={162} y={22} fontSize={30} fontWeight="800" fill="#6E6882">
            Z
          </SvgText>
        </G>
      );
    default:
      return (
        <G>
          <Circle cx={82} cy={102} r={8} fill={INK} />
          <Circle cx={118} cy={102} r={8} fill={INK} />
          <Circle cx={85} cy={99} r={2.6} fill="#FFFFFF" />
          <Circle cx={121} cy={99} r={2.6} fill="#FFFFFF" />
          <Path d="M90 124 Q100 132 110 124" {...eyeLine} strokeWidth={4} />
        </G>
      );
  }
}

/** The flames of Fever mode, behind and above the head. */
function Flames() {
  return (
    <G>
      <Circle cx={100} cy={96} r={96} fill="#FF7A1A" opacity={0.16} />
      <Circle cx={100} cy={96} r={78} fill={GOLD} opacity={0.18} />
      <Path d="M58 62 C40 36 56 18 50 -6 C70 8 80 24 76 46 Z" fill="#D93A3A" />
      <Path d="M142 62 C160 36 144 18 150 -6 C130 8 120 24 124 46 Z" fill="#D93A3A" />
      <Path d="M78 34 C66 6 88 -8 84 -34 C104 -16 110 6 104 30 Z" fill="#FF7A1A" />
      <Path d="M122 34 C134 6 112 -8 116 -34 C96 -16 90 6 96 30 Z" fill="#FF7A1A" />
      <Path d="M92 24 C86 0 104 -12 100 -40 C118 -18 118 4 110 24 Z" fill={GOLD} />
    </G>
  );
}

/** Popi drawn still: the body and the face of one mood. */
export function PopiDrawing({ mood, size }: { mood: Mood; size: number }) {
  return (
    <Svg width={size} height={(size * VIEW.h) / VIEW.w} viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}>
      {mood === 'fever' && <Flames />}
      <Ellipse cx={100} cy={191} rx={48} ry={7} fill={INK} opacity={0.12} />
      <Ellipse cx={80} cy={182} rx={13} ry={8} fill={HULL_DEEP} />
      <Ellipse cx={120} cy={182} rx={13} ry={8} fill={HULL_DEEP} />
      <Path d="M50 138 Q52 182 100 182 Q148 182 150 138 Z" fill={HULL} stroke={HULL_DEEP} strokeWidth={4} strokeLinejoin="round" />
      <G fill={OUTLINE}>
        {PUFFS.map(([cx, cy, r], i) => (
          <Circle key={i} cx={cx} cy={cy} r={r + 4} />
        ))}
      </G>
      <G fill={BODY}>
        {PUFFS.map(([cx, cy, r], i) => (
          <Circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </G>
      <Circle cx={84} cy={38} r={9} fill="#FFFFFF" />
      <Circle cx={50} cy={64} r={6} fill="#FFFFFF" />
      <Ellipse cx={68} cy={122} rx={10} ry={6} fill="#FF9C8A" opacity={0.6} />
      <Ellipse cx={132} cy={122} rx={10} ry={6} fill="#FF9C8A" opacity={0.6} />
      <Face mood={mood} />
    </Svg>
  );
}

/**
 * Popi, the pop-corn mascot. It pops a little when its mood changes and floats gently
 * (faster in Fever); both stop when animations are reduced. Decorative for VoiceOver.
 */
export function Popi({ mood, size, style }: { mood: Mood; size: number; style?: StyleProp<ViewStyle> }) {
  const still = useReduceMotion();
  const [pop] = useState(() => new Animated.Value(1));
  const [float] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (still) return;
    pop.setValue(0.82);
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, bounciness: 14, speed: 14 }).start();
  }, [mood, still, pop]);

  useEffect(() => {
    float.setValue(0);
    if (still || mood === 'sleep') return;
    const half = mood === 'fever' ? 260 : 900;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: half, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: half, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [mood, still, float]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width: size, height: (size * VIEW.h) / VIEW.w },
        { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.04] }) }, { scale: pop }] },
        style,
      ]}>
      <PopiDrawing mood={mood} size={size} />
    </Animated.View>
  );
}
