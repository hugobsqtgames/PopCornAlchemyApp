import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AdIcon } from '@/components/icons';
import { Btn, Card, Emoji, Header, Screen, Txt } from '@/components/ui';
import { dayKey } from '@/game/dates';
import { openGift, pickSlice, SLICE_DEG, spinRotation, tickTimes, WHEEL, type Prize } from '@/game/wheel';
import { useLayout, useNow, usePalette, useReduceMotion, useT } from '@/hooks/use-app';
import { checkAchievements } from '@/services/achievements';
import { buzz, play } from '@/services/feedback';
import { MONEY_READY, showRewardedAd } from '@/services/store-services';
import { useProfile } from '@/store/profile';

function slicePath(i: number, r: number) {
  const a0 = ((i * SLICE_DEG - SLICE_DEG / 2 - 90) * Math.PI) / 180;
  const a1 = ((i * SLICE_DEG + SLICE_DEG / 2 - 90) * Math.PI) / 180;
  const x0 = r + r * Math.cos(a0);
  const y0 = r + r * Math.sin(a0);
  const x1 = r + r * Math.cos(a1);
  const y1 = r + r * Math.sin(a1);
  return `M${r} ${r} L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z`;
}

export default function Roue() {
  const p = usePalette();
  const t = useT();
  const { insets, width, height } = useLayout();
  const s = useProfile();
  const today = dayKey(useNow());
  const freeLeft = s.wheelLast !== today;
  const bonusLeft = s.wheelBonusLast !== today;
  const still = useReduceMotion();
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<{ prize: Prize; icon: string; gift: boolean } | null>(null);
  const rot = useState(() => new Animated.Value(0))[0];
  const total = useRef(0);
  const ticks = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => ticks.current.forEach(clearTimeout), []);
  const size = Math.min(width - 64, height * 0.42, 420);
  const r = size / 2 - 10;
  const colors = [p.gold, p.goldTint, p.actionTint, p.goldTint, p.blueTint, p.goldTint, p.mintTint, p.goldTint];

  const give = (prize: Prize) => {
    const st = useProfile.getState();
    if (prize.kind === 'coins') st.addCoins(prize.amount);
    if (prize.kind === 'hints') st.addItem('hints', prize.amount);
    if (prize.kind === 'shield') st.addItem('shields', 1);
  };

  // The spin state updates on the next render: a ref also blocks a second tap in between.
  const turning = useRef(false);
  const spin = (bonus: boolean) => {
    if (spinning || turning.current) return;
    turning.current = true;
    const i = pickSlice();
    setWon(null);
    setSpinning(true);
    s.set(bonus ? { wheelBonusLast: today } : { wheelLast: today });
    s.bumpStats({ spins: 1 });
    // The wheel starts from where it stopped last time.
    const from = total.current;
    const base = from - (from % 360);
    total.current = base + spinRotation(i);
    const duration = still ? 1200 : 4200;
    // The wheel turns on the native side (smooth at 120 fps). The ticks are scheduled from the
    // same easing curve, so they slow down with the wheel without listening to every frame.
    ticks.current.forEach(clearTimeout);
    ticks.current = tickTimes(from, total.current, duration).map(({ at, strong }) =>
      setTimeout(() => {
        play('tick');
        if (strong) buzz('select');
      }, at)
    );
    play('spin');
    Animated.timing(rot, { toValue: total.current, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
      const slice = WHEEL[i];
      const gift = slice.prize.kind === 'gift';
      const prize = gift ? openGift() : slice.prize;
      give(prize);
      setWon({ prize, icon: gift ? '🎁' : slice.icon, gift });
      setSpinning(false);
      turning.current = false;
      play('win');
      buzz('success');
      checkAchievements();
    });
  };

  const prizeText = (prize: Prize) =>
    prize.kind === 'coins'
      ? t('prize_coins', { n: prize.amount })
      : prize.kind === 'hints'
        ? t('prize_hints', { n: prize.amount })
        : t('prize_shield');

  const rotate = rot.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });

  return (
    <Screen>
      <Header title={t('wheel_title')} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size, height: size }}>
          <View style={{ position: 'absolute', inset: 0, borderRadius: size / 2, backgroundColor: p.surface, borderWidth: p.border, borderColor: p.line, borderBottomWidth: 6 }} />
          <Animated.View style={{ position: 'absolute', left: 10, top: 10, width: r * 2, height: r * 2, transform: [{ rotate }] }}>
            <Svg width={r * 2} height={r * 2}>
              {WHEEL.map((_, i) => (
                <Path key={i} d={slicePath(i, r)} fill={colors[i]} />
              ))}
            </Svg>
            {WHEEL.map((w, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: r - 28,
                  top: r - 28,
                  width: 56,
                  height: 56,
                  alignItems: 'center',
                  transform: [{ rotate: `${i * SLICE_DEG}deg` }, { translateY: -r * 0.64 }],
                }}>
                <Emoji size={22}>{w.icon}</Emoji>
                <Txt size={13} weight="heavy">
                  {w.label}
                </Txt>
              </View>
            ))}
          </Animated.View>
          <View style={{ position: 'absolute', left: size / 2 - 28, top: size / 2 - 28, width: 56, height: 56, borderRadius: 28, backgroundColor: p.surface, borderWidth: p.border, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}>
            <Emoji size={26}>🍿</Emoji>
          </View>
          <Svg width={32} height={36} viewBox="0 0 32 36" style={{ position: 'absolute', left: size / 2 - 16, top: -14 }}>
            <Path d="M4 4h24L16 32z" fill={p.action} stroke={p.surface} strokeWidth={4} strokeLinejoin="round" />
          </Svg>
        </View>
        <View style={{ height: 80, justifyContent: 'center', paddingHorizontal: 24 }}>
          {won ? (
            <Card tint={p.goldTint} style={{ paddingVertical: 12, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Emoji size={24}>{won.icon}</Emoji>
              <Txt size={16} weight="heavy" style={{ flexShrink: 1 }}>
                {won.gift ? `${t('gift_title')} ` : `${t('you_won')} `}
                {prizeText(won.prize)}
              </Txt>
            </Card>
          ) : (
            <Txt size={15} color={p.muted} center>
              {freeLeft || (MONEY_READY && bonusLeft) ? t('wheel_sub') : t('wheel_used')}
            </Txt>
          )}
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 6 }}>
        {freeLeft ? (
          <Btn label={t('spin')} disabled={spinning} onPress={() => spin(false)} />
        ) : !MONEY_READY ? null : (
          <Btn
            variant="gold"
            label={t('spin_bonus')}
            icon={<AdIcon color="#1F1B2D" />}
            disabled={spinning || !bonusLeft}
            onPress={async () => {
              if (await showRewardedAd()) spin(true);
            }}
          />
        )}
      </View>
    </Screen>
  );
}
