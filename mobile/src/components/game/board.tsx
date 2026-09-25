import { useEffect, useState } from 'react';
import { Animated, Pressable, View, type LayoutChangeEvent } from 'react-native';

import { CATEGORIES, GRID_SIZE } from '@/game/rules';
import type { Run } from '@/hooks/use-run';
import { fmt, useLevelName, usePalette, useT } from '@/hooks/use-app';
import type { StringKey } from '@/i18n/strings';
import { useProfile } from '@/store/profile';

import { CheckIcon, PauseIcon } from '../icons';
import { Bar, Btn, Emoji, IconBtn, Px, Txt } from '../ui';

export function Hud({ run, onPause, big }: { run: Run; onPause: () => void; big?: boolean }) {
  const p = usePalette();
  const t = useT();
  const best = useProfile((s) => s.best[run.config.mode] ?? 0);
  const inTier = (run.index % 20) + 1;
  const mode = run.config.mode;
  const progressLabel =
    mode === 'chrono'
      ? `${Math.max(0, run.chronoLeft)} s`
      : mode === 'daily' || mode === 'challenge'
        ? `${run.index + 1}/${run.config.ids.length}`
        : `${t('tier')} ${Math.floor(run.index / 20) + 1}`;
  const progress =
    mode === 'chrono' ? Math.max(0, run.chronoLeft) / 60 : mode === 'daily' || mode === 'challenge' ? run.index / run.config.ids.length : inTier / 20;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <IconBtn label={t('pause')} onPress={onPause}>
        <PauseIcon color={p.ink} />
      </IconBtn>
      <View style={{ flex: 1, gap: 6 }}>
        <Txt size={big ? 16 : 13} weight="bold" lines={1}>
          {t('level')} {run.index + 1}
          <Txt size={big ? 16 : 13} weight="semibold" color={p.muted}>
            {' '}
            · {progressLabel}
          </Txt>
        </Txt>
        <Bar value={progress} color={mode === 'chrono' && run.chronoLeft <= 10 ? p.action : p.ink} height={big ? 8 : 6} />
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Txt size={big ? 22 : 17} weight="heavy" style={{ fontVariant: ['tabular-nums'] }}>
          {fmt(run.score)}
        </Txt>
        <Txt size={11} weight="semibold" color={p.muted}>
          {t('record_small', { n: best })}
        </Txt>
      </View>
    </View>
  );
}

export function ObjectiveCard({ run, big }: { run: Run; big?: boolean }) {
  const p = usePalette();
  const t = useT();
  const name = useLevelName();
  if (!run.level) return null;
  const cat = CATEGORIES.find((c) => c.id === run.level?.cat);
  const lifeCount = run.config.mode === 'hardcore' ? 1 : 4;
  const showLives = run.config.mode !== 'chrono';
  const done = run.phase === 'correct';
  const width = run.bonus.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View
      style={{
        backgroundColor: p.surface,
        borderRadius: big ? 24 : 20,
        borderWidth: run.fever ? 2 : p.border,
        borderColor: run.fever ? p.gold : p.line,
        padding: big ? 20 : 12,
        paddingHorizontal: big ? 22 : 14,
        gap: big ? 14 : 10,
      }}>
      {(run.combo > 1 || run.doubleOn) && (
        <View style={{ position: 'absolute', top: -12, alignSelf: 'center', flexDirection: 'row', gap: 6 }}>
          {run.combo > 1 && (
            <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: p.gold }}>
              <Txt size={11} weight="heavy" color="#1F1B2D" style={{ letterSpacing: 0.6 }}>
                {run.fever ? t('fever', { n: run.combo }) : t('combo', { n: run.combo })}
              </Txt>
            </View>
          )}
          {run.doubleOn && (
            <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: p.ink }}>
              <Txt size={11} weight="heavy" color={p.bg}>
                ✨ 💰×2
              </Txt>
            </View>
          )}
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: p.blueTint }}>
          <Emoji size={12}>{cat?.icon}</Emoji>
          <Txt size={12} weight="bold">
            {t(`cat_${run.level.cat}` as StringKey)}
          </Txt>
        </View>
        {showLives && (
          <View accessible accessibilityLabel={t('lives_left', { n: run.lives })}>
            <Txt size={big ? 18 : 14} style={{ letterSpacing: 1 }}>
              {'❤️'.repeat(Math.max(0, run.lives))}
              {'🤍'.repeat(Math.max(0, lifeCount - run.lives))}
            </Txt>
          </View>
        )}
      </View>
      <Txt size={big ? 32 : 22} weight="heavy" center lines={2} style={{ lineHeight: big ? 38 : 26 }}>
        {name(run.level)}
      </Txt>
      <View style={{ height: big ? 8 : 6, borderRadius: 999, backgroundColor: p.sunk, overflow: 'hidden' }} accessibilityLabel={t('time_up')}>
        <Animated.View style={{ height: '100%', width: done ? '0%' : width, borderRadius: 999, backgroundColor: p.action }} />
      </View>
    </View>
  );
}

export function Slots({ run, size }: { run: Run; size: number }) {
  const p = usePalette();
  const style = useProfile((s) => s.style);
  if (!run.level) return null;
  const done = run.phase === 'correct';
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: size * 0.2 }}>
      {run.level.sol.map((_, i) => {
        const tile = run.picked[i];
        const emoji = tile !== undefined ? run.grid[tile] : null;
        return (
          <Pressable
            key={i}
            disabled={emoji === null}
            onPress={() => run.removePick(i)}
            accessibilityRole="button"
            accessibilityLabel={emoji ?? `${i + 1}`}
            style={{
              width: size,
              height: size,
              borderRadius: size * 0.28,
              borderWidth: 2,
              borderStyle: emoji ? 'solid' : 'dashed',
              borderColor: done ? p.green : emoji ? p.ink : p.line2,
              backgroundColor: done ? p.greenTint : emoji ? p.surface : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {emoji ? (
              <Emoji size={size * 0.52}>{emoji}</Emoji>
            ) : (
              <Emoji size={size * 0.36} style={{ opacity: 0.18 }}>
                {style}
              </Emoji>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** The emoji grid. `cols` is 4 on phones, 5 on iPad. Tiles grow to fill the space. */
export function Grid({ run, cols }: { run: Run; cols: number }) {
  const p = usePalette();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const rows = GRID_SIZE / cols;
  const gap = size.h > 520 ? 14 : size.h > 380 ? 10 : 7;
  const tileH = size.h ? (size.h - gap * (rows - 1)) / rows : 0;
  const tileW = size.w ? (size.w - gap * (cols - 1)) / cols : 0;
  const h = Math.min(tileH, tileW * 1.05);
  const emoji = Math.max(20, Math.min(h * 0.5, tileW * 0.5, 54));
  const dim = run.phase === 'correct';

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  return (
    <View style={{ flex: 1, justifyContent: 'center' }} onLayout={onLayout}>
      {size.h > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, opacity: dim ? 0.3 : 1 }}>
          {run.grid.map((e, i) => {
            const used = run.picked.includes(i);
            const hint = run.hinted === i;
            return (
              <Pressable
                key={`${run.index}-${i}`}
                onPress={() => run.tapTile(i)}
                disabled={used}
                accessibilityRole="button"
                accessibilityLabel={e}
                accessibilityState={{ selected: used }}
                style={({ pressed }) => ({
                  width: tileW,
                  height: h,
                  borderRadius: Math.min(20, h * 0.26),
                  borderWidth: used ? 2 : p.border + 0.5,
                  borderStyle: used ? 'dashed' : 'solid',
                  borderColor: hint ? p.gold : p.line,
                  backgroundColor: hint ? p.goldTint : used ? p.sunk : p.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ translateY: used || pressed ? 3 : 0 }, { scale: hint ? 1.08 : 1 }],
                  borderBottomWidth: used || pressed ? 2 : 5,
                  borderBottomColor: hint ? p.goldDeep : used ? p.line2 : p.line2,
                })}>
                <Emoji size={emoji} style={{ opacity: used ? 0.25 : 1 }}>
                  {e}
                </Emoji>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export function PowerUps({ run, big }: { run: Run; big?: boolean }) {
  const p = usePalette();
  const t = useT();
  const s = useProfile();
  const items = [
    { icon: '💡', n: s.hints, on: () => run.giveHint(), gold: true, off: run.hintUsed, label: t('bonus_hints') },
    { icon: '🛡️', n: s.shields, on: undefined, off: run.config.mode === 'hardcore' || run.config.mode === 'chrono', label: t('bonus_shield') },
    { icon: '⏭️', n: s.skips, on: () => run.skip(), off: false, label: t('bonus_skip') },
    { icon: '✨', n: s.doubles, on: () => run.double(), off: run.doubleOn, label: t('bonus_double') },
  ];
  const h = big ? 56 : 44;
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {items.map((it) => {
        const disabled = it.n <= 0 || it.off;
        return (
          <Pressable
            key={it.icon}
            onPress={it.on}
            disabled={disabled || !it.on}
            accessibilityRole="button"
            accessibilityLabel={`${it.label}, ${it.n}`}
            style={({ pressed }) => ({
              flex: 1,
              height: h,
              borderRadius: 14,
              borderWidth: p.border,
              borderColor: it.gold && !disabled ? p.gold : p.line,
              backgroundColor: it.gold && !disabled ? p.goldTint : p.surface,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
            })}>
            <Emoji size={big ? 26 : 20}>{it.icon}</Emoji>
            <View
              style={{
                position: 'absolute',
                top: -7,
                right: -4,
                minWidth: 20,
                height: 20,
                paddingHorizontal: 5,
                borderRadius: 10,
                backgroundColor: p.ink,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Txt size={11} weight="heavy" color={p.bg}>
                {it.n}
              </Txt>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FuseButton({ run, big }: { run: Run; big?: boolean }) {
  const t = useT();
  const style = useProfile((s) => s.style);
  const need = run.level?.sol.length ?? 0;
  if (run.phase === 'correct') {
    return <Btn variant="green" label={t('next_level')} icon={<CheckIcon color="#FFFFFF" size={18} />} height={big ? 68 : 54} />;
  }
  const ready = run.picked.length === need;
  return (
    <Btn
      variant={ready ? 'action' : 'off'}
      disabled={!ready}
      label={ready ? `${style} ${t('fusion')}` : `${t('fusion')} · ${run.picked.length}/${need}`}
      onPress={run.fuse}
      height={big ? 68 : 54}
      size={big ? 18 : 16}
    />
  );
}

/** The "BRAVO!" card shown on the grid after a right answer. */
export function CorrectCard({ run }: { run: Run }) {
  const p = usePalette();
  const t = useT();
  const scale = useState(() => new Animated.Value(0.6))[0];
  useEffect(() => {
    if (run.phase === 'correct') {
      scale.setValue(0.6);
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 14 }).start();
    }
  }, [run.phase, scale]);
  if (run.phase !== 'correct') return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          transform: [{ scale }],
          paddingVertical: 22,
          paddingHorizontal: 26,
          borderRadius: 24,
          backgroundColor: p.surface,
          borderWidth: 2,
          borderColor: p.green,
          borderBottomWidth: 6,
          alignItems: 'center',
          gap: 14,
        }}>
        <Px size={26} color={p.green}>
          {t('bravo')}
        </Px>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip>+{run.last.points} pts</Chip>
          <Chip>+{run.last.coins} 💰</Chip>
          <Chip>⚡ {run.last.seconds.toFixed(1).replace('.', ',')} s</Chip>
        </View>
      </Animated.View>
    </View>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: p.sunk }}>
      <Txt size={14} weight="heavy">
        {children}
      </Txt>
    </View>
  );
}

/** Short floating message (shield used, no hints…). */
export function FlashMessage({ run }: { run: Run }) {
  const p = usePalette();
  const t = useT();
  const opacity = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!run.message) return;
    opacity.setValue(1);
    Animated.timing(opacity, { toValue: 0, duration: 1800, delay: 600, useNativeDriver: true }).start();
  }, [run.message, opacity]);
  if (!run.message) return null;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top: '40%', alignSelf: 'center', opacity }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: p.ink, maxWidth: 320 }}>
        <Txt size={15} weight="bold" color={p.bg} center>
          {t(run.message.text as StringKey)}
        </Txt>
      </View>
    </Animated.View>
  );
}
