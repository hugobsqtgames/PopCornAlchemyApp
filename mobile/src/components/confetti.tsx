import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useReduceMotion } from '@/hooks/use-app';

const COLORS = ['#D93A3A', '#FFC93C', '#1FA463', '#4F7CF6', '#8B7BE8', '#FF8A3D'];
const COUNT = 40;

interface Piece {
  x: number;
  drift: number;
  delay: number;
  duration: number;
  spin: number;
  color: string;
  w: number;
  h: number;
}

function makePieces(): Piece[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    x: Math.random(),
    drift: (Math.random() - 0.5) * 120,
    delay: Math.random() * 500,
    duration: 1800 + Math.random() * 1400,
    spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
    color: COLORS[i % COLORS.length],
    w: 7 + Math.random() * 6,
    h: 10 + Math.random() * 8,
  }));
}

/** Confetti falling once over the whole screen. Nothing when animations are reduced. */
export function Confetti() {
  const still = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const [pieces] = useState(makePieces);
  const [fall] = useState(() => pieces.map(() => new Animated.Value(0)));

  useEffect(() => {
    if (still) return;
    const anims = pieces.map((pc, i) =>
      Animated.timing(fall[i], { toValue: 1, duration: pc.duration, delay: pc.delay, easing: Easing.in(Easing.quad), useNativeDriver: true })
    );
    Animated.parallel(anims).start();
    return () => anims.forEach((a) => a.stop());
  }, [still, pieces, fall]);

  if (still) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 10, overflow: 'hidden' }]}>
      {pieces.map((pc, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: pc.x * width,
            top: -30,
            width: pc.w,
            height: pc.h,
            borderRadius: 2,
            backgroundColor: pc.color,
            opacity: fall[i].interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: fall[i].interpolate({ inputRange: [0, 1], outputRange: [0, height + 60] }) },
              { translateX: fall[i].interpolate({ inputRange: [0, 1], outputRange: [0, pc.drift] }) },
              { rotate: fall[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${pc.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
