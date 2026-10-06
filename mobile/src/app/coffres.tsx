import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Image, Pressable, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { CHEST_GLOW, CHEST_IMAGES } from '@/components/chest/fallback';
import type { ChestPhase } from '@/components/chest/scene';
import { ChestStage } from '@/components/chest/stage';
import { BackIcon } from '@/components/icons';
import { Btn, Emoji, IconBtn, Txt } from '@/components/ui';
import { CHEST_COINS, CHEST_KINDS, type ChestKind, type ChestReward } from '@/game/chests';
import { one } from '@/game/links';
import { useLayout, useReduceMotion, useT } from '@/hooks/use-app';
import type { StringKey } from '@/i18n/strings';
import { checkAchievements } from '@/services/achievements';
import { announce, buzz, play, playLater } from '@/services/feedback';
import { useProfile } from '@/store/profile';
import { paletteFor } from '@/theme/palettes';

const INK = '#1F1B2D';
const NAME: Record<ChestKind, StringKey> = {
  wood: 'chest_wood',
  gold: 'chest_gold',
  legend: 'chest_legend',
};
const HOW: Record<ChestKind, StringKey> = {
  wood: 'chest_how_wood',
  gold: 'chest_how_gold',
  legend: 'chest_how_legend',
};
const ITEM_ICON = {
  hints: '💡',
  shields: '🛡️',
  skips: '⏭️',
  doubles: '✨',
  streakSaves: '🧊',
} as const;
const ITEM_NAME = {
  hints: 'bonus_hints',
  shields: 'bonus_shield',
  skips: 'bonus_skip',
  doubles: 'bonus_double',
  streakSaves: 'bonus_streak',
} as const;

/** Chests: pick one, open it (3D show), see what was inside. */
export default function Coffres() {
  const t = useT();
  const { insets, width, height, tablet } = useLayout();
  const chests = useProfile((s) => s.chests);
  const still = useReduceMotion();
  const asked = one(useLocalSearchParams<{ open?: string }>().open) as ChestKind | undefined;
  const firstWith = CHEST_KINDS.find((k) => chests[k] > 0);
  const [kind, setKind] = useState<ChestKind>(asked && CHEST_KINDS.includes(asked) ? asked : (firstWith ?? 'wood'));
  const [openKey, setOpenKey] = useState(0);
  const [phase, setPhase] = useState<ChestPhase>('appear');
  const [rewards, setRewards] = useState<ChestReward[] | null>(null);
  // A new chest of the same kind drops in after "Awesome!": the stage is mounted again.
  const [round, setRound] = useState(0);
  const opening = openKey > 0 && rewards !== null;
  const showRewards = opening && phase === 'open';

  const open = () => {
    if (opening) return;
    // The rewards are drawn and given right away: leaving during the show loses nothing.
    const got = useProfile.getState().openChest(kind);
    if (!got) return;
    setRewards(got);
    setOpenKey((k) => k + 1);
    checkAchievements();
  };
  const next = () => {
    setRewards(null);
    setOpenKey(0);
    setPhase('appear');
    const left = useProfile.getState().chests;
    if (left[kind] <= 0) {
      const other = CHEST_KINDS.find((k) => left[k] > 0);
      if (other) setKind(other);
    }
    setRound((r) => r + 1);
    play('whoosh');
  };

  const onKnock = (i: number) => {
    play(i === 2 ? 'powerup' : 'pop');
    buzz(i === 2 ? 'heavy' : 'select');
  };
  // A flash of the chest's light when it bursts open.
  const flash = useState(() => new Animated.Value(0))[0];
  const onBurst = () => {
    flash.setValue(still ? 0.35 : 0.85);
    Animated.timing(flash, {
      toValue: 0,
      duration: 650,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    play(kind === 'wood' ? 'win' : 'victory');
    playLater('coin', 180);
    playLater('sparkle', 420);
    buzz('success');
    if (kind !== 'wood') announce('voice_amazing');
  };

  const glow = CHEST_GLOW[kind];
  const stageH = Math.min(height * 0.46, 440);

  return (
    <View style={{ flex: 1, backgroundColor: INK }}>
      {/* A soft light of the chest's colour behind the stage. */}
      <Svg style={{ position: 'absolute', left: 0, top: 0 }} width={width} height={height}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="42%" rx="70%" ry="45%">
            <Stop offset="0" stopColor={glow} stopOpacity={showRewards ? 0.45 : 0.28} />
            <Stop offset="0.55" stopColor="#3a2a5c" stopOpacity={0.35} />
            <Stop offset="1" stopColor={INK} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#g)" />
      </Svg>

      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: tablet ? 640 : undefined,
          alignSelf: 'center',
        }}>
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}>
          <IconBtn label={t('back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
            <BackIcon color={INK} />
          </IconBtn>
          <Txt size={20} weight="heavy" color="#FFFFFF" style={{ flex: 1 }}>
            {t('chests')}
          </Txt>
        </View>

        {/* The three kinds, with how many of each. */}
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 16,
            paddingTop: 14,
            opacity: opening ? 0.35 : 1,
          }}>
          {CHEST_KINDS.map((k) => {
            const on = k === kind;
            return (
              <Pressable
                key={k}
                disabled={opening}
                onPress={() => {
                  if (k === kind) return;
                  buzz('select');
                  play('click');
                  setKind(k);
                  setPhase('appear');
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${t(NAME[k])}, ${chests[k]}`}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: on ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
                  borderWidth: 2,
                  borderColor: on ? CHEST_GLOW[k] : 'transparent',
                }}>
                <Image
                  source={CHEST_IMAGES[k]}
                  style={{
                    width: 54,
                    height: 54,
                    opacity: chests[k] > 0 ? 1 : 0.45,
                  }}
                  resizeMode="contain"
                />
                <Txt size={12} weight="heavy" color="#FFFFFF" center lines={2}>
                  {t(NAME[k])}
                </Txt>
                <View
                  style={{
                    marginTop: 4,
                    minWidth: 30,
                    paddingHorizontal: 8,
                    height: 22,
                    borderRadius: 11,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: chests[k] > 0 ? CHEST_GLOW[k] : 'rgba(255,255,255,0.12)',
                  }}>
                  <Txt size={12} weight="heavy" color={chests[k] > 0 ? INK : '#FFFFFF'}>
                    ×{chests[k]}
                  </Txt>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* The stage keeps its size and is cropped (centred) when the screen is short. */}
        <View style={{ flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
          <ChestStage
            key={`${kind}-${round}`}
            kind={kind}
            openKey={openKey}
            reduceMotion={still}
            onKnock={onKnock}
            onBurst={onBurst}
            onPhase={setPhase}
            style={{ height: stageH }}
          />
        </View>

        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            backgroundColor: glow,
            opacity: flash,
          }}
        />

        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 16,
            gap: 12,
            minHeight: 190,
            justifyContent: 'flex-end',
          }}>
          {showRewards && rewards ? (
            <Rewards rewards={rewards} onDone={next} />
          ) : opening ? null : (
            <>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Txt size={22} weight="heavy" color="#FFFFFF" center>
                  {t(NAME[kind])}
                </Txt>
                <Txt size={14} color="rgba(255,255,255,0.75)" center>
                  {t('chest_coins_range', {
                    a: CHEST_COINS[kind][0],
                    b: CHEST_COINS[kind][1],
                  })}
                </Txt>
                {kind === 'legend' && (
                  <Txt size={13} weight="bold" color={CHEST_GLOW.legend} center>
                    {t('chest_legend_extra')}
                  </Txt>
                )}
              </View>
              {chests[kind] > 0 ? (
                <Btn variant="gold" label={t('chest_open')} height={60} size={17} onPress={open} />
              ) : (
                <View style={{ alignItems: 'center', gap: 4, paddingVertical: 8 }}>
                  <Txt size={15} weight="heavy" color="#FFFFFF" center>
                    {t('chest_none')}
                  </Txt>
                  <Txt size={13} color="rgba(255,255,255,0.7)" center>
                    {t(HOW[kind])}
                  </Txt>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

/** What was in the chest: one card after the other, the best one last, then "Awesome!". */
function Rewards({ rewards, onDone }: { rewards: ChestReward[]; onDone: () => void }) {
  const t = useT();
  const still = useReduceMotion();
  const anims = useState(() => rewards.map(() => new Animated.Value(still ? 1 : 0)))[0];
  const done = useState(() => new Animated.Value(still ? 1 : 0))[0];
  const [ready, setReady] = useState(still);

  useEffect(() => {
    if (still) return;
    // The cards arrive one after the other without waiting for the previous one to settle.
    const steps = Animated.stagger(
      260,
      anims.map((a) => Animated.spring(a, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true })),
    );
    const timers = rewards.map((r, i) =>
      setTimeout(
        () => {
          const special = r.kind === 'theme' || r.kind === 'style' || r.kind === 'avatar';
          play(special ? 'fever' : r.kind === 'coins' ? 'coin' : 'pop');
          buzz(special ? 'success' : 'tap');
        },
        i * 260 + 80,
      ),
    );
    Animated.sequence([
      steps,
      Animated.timing(done, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setReady(true));
    return () => timers.forEach(clearTimeout);
    // Played once for these rewards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ gap: 10 }}>
      <Txt size={13} weight="heavy" color="rgba(255,255,255,0.7)" center style={{ letterSpacing: 1.2 }}>
        {t('chest_inside').toUpperCase()}
      </Txt>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
        }}>
        {rewards.map((r, i) => {
          const a = anims[i];
          return (
            <Animated.View
              key={i}
              style={{
                opacity: a,
                transform: [
                  {
                    translateY: a.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                  {
                    scale: a.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    }),
                  },
                ],
              }}>
              <RewardCard reward={r} />
            </Animated.View>
          );
        })}
      </View>
      <Animated.View style={{ opacity: done }} pointerEvents={ready ? 'auto' : 'none'}>
        <Btn variant="gold" label={t('chest_collect')} height={56} onPress={onDone} />
      </Animated.View>
    </View>
  );
}

function RewardCard({ reward: r }: { reward: ChestReward }) {
  const t = useT();
  const special = r.kind === 'theme' || r.kind === 'style' || r.kind === 'avatar';
  let icon = '💰';
  let label = '';
  let swatch: string | null = null;
  if (r.kind === 'coins') label = t('prize_coins', { n: r.amount });
  else if (r.kind === 'item') {
    icon = ITEM_ICON[r.item];
    label = r.item === 'hints' ? t('prize_hints', { n: r.amount }) : `${r.amount} × ${t(ITEM_NAME[r.item])}`;
  } else if (r.kind === 'theme') {
    icon = '🎨';
    swatch = paletteFor(r.id, false).action;
    label = t('reward_theme', { name: t(`theme_${r.id}` as StringKey) });
  } else if (r.kind === 'style') {
    icon = r.id;
    label = t('reward_style');
  } else {
    icon = r.id;
    label = t('reward_avatar');
  }
  return (
    <View
      style={{
        minWidth: 92,
        maxWidth: 160,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 18,
        alignItems: 'center',
        gap: 4,
        backgroundColor: special ? '#FFC93C' : 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        borderColor: special ? '#FFE9A8' : 'rgba(255,255,255,0.16)',
      }}>
      {special && (
        <View
          style={{
            position: 'absolute',
            top: -10,
            paddingHorizontal: 8,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#D93A3A',
            justifyContent: 'center',
          }}>
          <Txt size={10} weight="heavy" color="#FFFFFF" style={{ letterSpacing: 0.8 }}>
            {t('chest_new')}
          </Txt>
        </View>
      )}
      {swatch ? (
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: swatch,
            borderWidth: 3,
            borderColor: '#FFFFFF',
          }}
        />
      ) : (
        <Emoji size={24}>{icon}</Emoji>
      )}
      <Txt size={13} weight="heavy" color={special ? INK : '#FFFFFF'} center lines={2}>
        {label}
      </Txt>
    </View>
  );
}
