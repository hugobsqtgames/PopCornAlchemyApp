import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, View, type LayoutChangeEvent } from 'react-native';

import { CATEGORIES, GRID_SIZE } from '@/game/rules';
import type { Run } from '@/hooks/use-run';
import { fmt, fmt1, useLayout, useLevelName, usePalette, useReduceMotion, useT } from '@/hooks/use-app';
import type { StringKey } from '@/i18n/strings';
import { useProfile } from '@/store/profile';

import { CheckIcon, PauseIcon } from '../icons';
import { Popi, type Mood } from '../mascot';
import { Bar, Btn, Emoji, IconBtn, Px, textEm, Txt } from '../ui';

export function Hud({ run, onPause, big }: { run: Run; onPause: () => void; big?: boolean }) {
  const p = usePalette();
  const t = useT();
  const best = useProfile((s) => s.best[run.config.mode] ?? 0);
  const inTier = (run.index % 20) + 1;
  const mode = run.config.mode;
  // Zen and a replayed level have no progress to show: just the mode's name.
  const calm = run.relaxed || run.practice;
  const progressLabel = calm
    ? t(`mode_${mode}` as StringKey)
    : mode === 'chrono'
      ? `${Math.max(0, run.chronoLeft)} s`
      : mode === 'daily' || mode === 'challenge'
        ? `${run.index + 1}/${run.config.ids.length}`
        : `${t('tier')} ${Math.floor(run.index / 20) + 1}`;
  const progress = calm
    ? 0
    : mode === 'chrono' ? Math.max(0, run.chronoLeft) / 60 : mode === 'daily' || mode === 'challenge' ? run.index / run.config.ids.length : inTier / 20;

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
        {!calm && <Bar value={progress} color={mode === 'chrono' && run.chronoLeft <= 10 ? p.action : p.ink} height={big ? 8 : 6} />}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Txt size={big ? 22 : 17} weight="heavy" style={{ fontVariant: ['tabular-nums'] }}>
          {fmt(run.score)}
        </Txt>
        {!calm && (
          <Txt size={11} weight="semibold" color={p.muted}>
            {t('record_small', { n: best })}
          </Txt>
        )}
      </View>
    </View>
  );
}

/** How Popi feels about what is happening in the run. */
export function runMood(run: Run): Mood {
  if (run.paused) return 'sleep';
  switch (run.phase) {
    case 'reveal':
      return run.missed?.skipped ? 'surprised' : 'sad';
    case 'correct':
      return run.fever ? 'fever' : run.last.stars === 3 ? 'joy' : 'happy';
    case 'tier':
    case 'win':
      return 'joy';
    case 'over':
      return 'sad';
    default:
      // Worried after a wrong try, on fire in Fever, calm otherwise.
      return run.fever ? 'fever' : run.tierStats.mistakesThisLevel > 0 ? 'sad' : 'idle';
  }
}

/** How many lines `words` take at `size` in `room` points, breaking between words like the text does. */
function linesAt(words: string[], size: number, room: number, gap = textEm(' ')) {
  let lines = 1;
  let used = 0;
  for (const w of words) {
    const width = textEm(w) * size;
    const space = used ? gap * size : 0;
    if (used && used + space + width > room) {
      lines++;
      used = width;
    } else used += space + width;
  }
  return lines;
}

/** Font size for an answer on at most two lines of `room` points (never under 70 %), and the text to show. */
function nameLayout(text: string, base: number, room: number) {
  // Chinese and Japanese have no spaces and break anywhere: every character is its own "word".
  if (/[⺀-鿿가-힯＀-￯]/.test(text) && !/\s/.test(text)) {
    const chars = [...text];
    // A short name would break in the middle of the word: keep it on one line when it fits.
    for (let size = base; size > base * 0.7; size -= 0.5) if (linesAt(chars, size, room, 0) === 1) return { size, text };
    // Too long: two lines, cut after the "・" between words when there is one.
    const parts = text.match(/[^・]+・?|・/g) ?? [text];
    if (parts.length > 1) {
      for (let size = base; size > base * 0.7; size -= 0.5) {
        if (linesAt(parts, size, room, 0) > 2) continue;
        // As many words as fit on the first line, the rest on the second.
        let first = 1;
        while (first < parts.length - 1 && linesAt(parts.slice(0, first + 1), size, room, 0) === 1) first++;
        return { size, text: `${parts.slice(0, first).join('')}\n${parts.slice(first).join('')}` };
      }
    }
    for (let size = base; size > base * 0.7; size -= 0.5) if (linesAt(chars, size, room, 0) <= 2) return { size, text };
    return { size: base * 0.7, text };
  }
  const words = text.split(/\s+/);
  for (let size = base; size > base * 0.7; size -= 0.5) {
    if (linesAt(words, size, room) <= 2 && Math.max(...words.map(textEm)) * size <= room) return { size, text };
  }
  return { size: base * 0.7, text };
}

export function ObjectiveCard({ run, big, wide }: { run: Run; big?: boolean; wide?: boolean }) {
  const p = usePalette();
  const t = useT();
  const name = useLevelName();
  const { width, tablet } = useLayout();
  const doubleLeft = useProfile((s) => s.doubleLevels);
  if (!run.level) return null;
  const cat = CATEGORIES.find((c) => c.id === run.level?.cat);
  const lifeCount = run.config.mode === 'hardcore' ? 1 : 4;
  const showLives = run.config.mode !== 'chrono' && !run.relaxed && !run.practice;
  const done = run.phase !== 'play';
  const popi = big ? 64 : 44;
  // Width left for the answer: the card, minus its padding, Popi and the spacer on the other side.
  const card = wide ? 420 : Math.min(width - 32, tablet ? 680 - 32 : 600 - 32);
  const nameRoom = card - (big ? 44 : 28) - 2 * popi - 16;
  const answer = nameLayout(name(run.level), big ? 32 : 22, nameRoom);

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
                ✨ 💰×2 · {doubleLeft}
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Popi mood={runMood(run)} size={popi} />
        {/* Long answers (some languages) get a smaller font so they always fit on two lines. */}
        <Txt size={answer.size} weight="heavy" center lines={2} style={{ flex: 1 }}>
          {answer.text}
        </Txt>
        {/* Same width as Popi, so the name stays centred. */}
        <View style={{ width: popi }} />
      </View>
      {!run.relaxed && (
        <View style={{ height: big ? 8 : 6, borderRadius: 999, backgroundColor: p.sunk, overflow: 'hidden' }} accessibilityLabel={t('time_up')}>
          {/* Scaled from the left edge: a transform runs natively, a width would not. */}
          <Animated.View
            style={{ height: '100%', width: '100%', borderRadius: 999, backgroundColor: p.action, transformOrigin: 'left', transform: [{ scaleX: done ? 0 : run.bonus }] }}
          />
        </View>
      )}
    </View>
  );
}

export function Slots({ run, size: wanted }: { run: Run; size: number }) {
  const p = usePalette();
  // Up to 5 slots must fit the column (the iPad's side column is narrower than 5 big slots).
  const [room, setRoom] = useState(0);
  const style = useProfile((s) => s.style);
  const still = useReduceMotion();
  // Fusion: the slots slide together and pop into a burst of pop-corn.
  const merge = useState(() => new Animated.Value(0))[0];
  const done = run.phase === 'correct';
  useEffect(() => {
    merge.setValue(0);
    if (done && !still) Animated.timing(merge, { toValue: 1, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
  }, [done, still, merge]);
  if (!run.level) return null;
  const n = run.level.sol.length;
  const size = room ? Math.min(wanted, Math.floor(room / (n * 1.2 - 0.2))) : wanted;
  const gap = size * 0.2;
  return (
    <View onLayout={(e) => setRoom(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', justifyContent: 'center', gap }}>
      {run.level.sol.map((_, i) => {
        const tile = run.picked[i];
        const emoji = tile !== undefined ? run.grid[tile] : null;
        const toCenter = ((n - 1) / 2 - i) * (size + gap);
        return (
          // The animated style is always attached (at rest it changes nothing), and each level gets
          // new views: a native-driven style that is detached keeps its last values on iOS.
          <Animated.View
            key={`${run.index}-${i}`}
            style={{
              opacity: merge.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateX: merge.interpolate({ inputRange: [0, 1], outputRange: [0, toCenter] }) },
                { scale: merge.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }) },
              ],
            }}>
            <Pressable
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
          </Animated.View>
        );
      })}
      {done && !still && <FusionBurst size={size} style={style} />}
    </View>
  );
}

const BURST = Array.from({ length: 10 }, (_, i) => ({ angle: (i / 10) * Math.PI * 2 + 0.3, far: i % 2 ? 1 : 0.7 }));

/** The pop after a fusion: the player's pop-corn style bursts out of the merged slots. */
function FusionBurst({ size, style }: { size: number; style: string }) {
  const t = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 650, delay: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [t]);
  const reach = size * 1.6;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          opacity: t.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.2, 1.4, 1.1] }) }],
        }}>
        <Emoji size={size * 0.8}>{style}</Emoji>
      </Animated.View>
      {BURST.map((b, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            opacity: t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(b.angle) * reach * b.far] }) },
              { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(b.angle) * reach * b.far * 0.6] }) },
              { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] }) },
            ],
          }}>
          <Emoji size={size * 0.4}>{i % 3 === 0 ? '✨' : style}</Emoji>
        </Animated.View>
      ))}
    </View>
  );
}

/** The emoji grid. `cols` is 4 on phones, 5 on iPad. Tiles grow to fill the space. */
export function Grid({ run, cols, guide }: { run: Run; cols: number; guide?: number }) {
  const p = usePalette();
  const bounce = useBounce(guide !== undefined);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const rows = GRID_SIZE / cols;
  const gap = size.h > 520 ? 14 : size.h > 380 ? 10 : 7;
  const tileH = size.h ? (size.h - gap * (rows - 1)) / rows : 0;
  const tileW = size.w ? (size.w - gap * (cols - 1)) / cols : 0;
  const h = Math.min(tileH, tileW * 1.05);
  const emoji = Math.max(20, Math.min(h * 0.5, tileW * 0.5, 54));
  const dim = run.phase === 'correct' || run.phase === 'reveal';

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  return (
    <View style={{ flex: 1, justifyContent: 'center' }} onLayout={onLayout}>
      {size.h > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, opacity: dim ? 0.3 : 1 }}>
          {run.grid.map((e, i) => {
            const used = run.picked.includes(i);
            const hint = run.hinted === i || guide === i;
            const gone = run.removed.includes(i);
            if (gone) return <View key={`${run.index}-${i}`} style={{ width: tileW, height: h }} />;
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
                {guide === i && (
                  <Animated.View pointerEvents="none" style={{ position: 'absolute', right: -6, bottom: -14, transform: [{ translateY: bounce }] }}>
                    <Emoji size={30}>👆</Emoji>
                  </Animated.View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

/** A small up-and-down loop (the guiding hand), still when animations are reduced. */
export function useBounce(on: boolean) {
  const still = useReduceMotion();
  const y = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!on || still) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -8, duration: 380, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 380, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [on, still, y]);
  return y;
}

export function PowerUps({ run, big, onClues }: { run: Run; big?: boolean; onClues: () => void }) {
  const p = usePalette();
  const t = useT();
  const s = useProfile();
  const items = [
    // The bulb opens the clue sheet: reveal an emoji, remove wrong ones, shuffle.
    { icon: '💡', n: s.hints, on: onClues, gold: true, off: run.phase !== 'play', label: t('clues') },
    // A replayed level has no lives, no coins, and skipping it would end the replay.
    { icon: '🛡️', n: s.shields, on: undefined, off: run.config.mode === 'hardcore' || run.config.mode === 'chrono' || run.practice, label: t('bonus_shield') },
    { icon: '⏭️', n: s.skips, on: () => run.skip(), off: run.practice, label: t('bonus_skip') },
    { icon: '✨', n: s.doubles, on: () => run.double(), off: run.doubleOn || run.practice, label: t('bonus_double') },
  ];
  const h = big ? 56 : 44;
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {items.map((it) => {
        const disabled = (it.n <= 0 && it.on !== onClues) || it.off;
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
  if (run.phase === 'reveal') {
    return <Btn variant="off" disabled label={t('next_level')} height={big ? 68 : 54} />;
  }
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
  const still = useReduceMotion();
  const scale = useState(() => new Animated.Value(0.6))[0];
  useEffect(() => {
    if (run.phase === 'correct') {
      scale.setValue(still ? 1 : 0.6);
      if (!still) Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 14 }).start();
    }
  }, [run.phase, scale, still]);
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
        {run.last.stars !== null && <Stars n={run.last.stars} size={30} />}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip>{t('pts_gain', { n: run.last.points })}</Chip>
          {!run.practice && <Chip>+{run.last.coins} 💰</Chip>}
          <Chip>⚡ {fmt1(run.last.seconds)} s</Chip>
        </View>
        {run.last.first && (
          <Txt size={14} weight="bold" color={p.muted}>
            {t('dex_new')}
          </Txt>
        )}
      </Animated.View>
    </View>
  );
}

/** The answer of a missed or skipped level, shown on the grid for a moment. */
export function RevealCard({ run }: { run: Run }) {
  const p = usePalette();
  const t = useT();
  const name = useLevelName();
  const still = useReduceMotion();
  const scale = useState(() => new Animated.Value(0.6))[0];
  useEffect(() => {
    if (run.phase === 'reveal') {
      scale.setValue(still ? 1 : 0.6);
      if (!still) Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 10 }).start();
    }
  }, [run.phase, scale, still]);
  if (run.phase !== 'reveal' || !run.missed) return null;
  const { level, skipped } = run.missed;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        accessibilityLiveRegion="polite"
        style={{
          transform: [{ scale }],
          maxWidth: '100%',
          paddingVertical: 20,
          paddingHorizontal: 24,
          borderRadius: 24,
          backgroundColor: p.surface,
          borderWidth: 2,
          borderColor: skipped ? p.line2 : p.action,
          borderBottomWidth: 6,
          alignItems: 'center',
          gap: 10,
        }}>
        <Popi mood={skipped ? 'surprised' : 'sad'} size={64} style={{ marginTop: -54 }} />
        <Txt size={20} weight="heavy" color={skipped ? p.ink : p.action}>
          {skipped ? t('level_skipped') : t('missed_title')}
        </Txt>
        <Txt size={13} weight="bold" color={p.muted}>
          {t('answer_was')}
        </Txt>
        <AnswerEmojis level={level} />
        <Txt size={16} weight="heavy" center lines={2}>
          {name(level)}
        </Txt>
      </Animated.View>
    </View>
  );
}

/** The emojis of an answer, in tiles. */
export function AnswerEmojis({ level, size = 52 }: { level: { sol: string[] }; size?: number }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', gap: 8 }} accessible accessibilityLabel={level.sol.join(' ')}>
      {level.sol.map((e, i) => (
        <View
          key={i}
          style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: p.greenTint, borderWidth: 2, borderColor: p.green, alignItems: 'center', justifyContent: 'center' }}>
          <Emoji size={size * 0.5}>{e}</Emoji>
        </View>
      ))}
    </View>
  );
}

/** 1 to 3 stars out of 3: gold for the ones earned. */
export function Stars({ n, size = 20 }: { n: number; size?: number }) {
  const p = usePalette();
  const t = useT();
  return (
    <View style={{ flexDirection: 'row', gap: size * 0.12 }} accessible accessibilityLabel={`${n} / 3 ${t('st_stars')}`}>
      {[1, 2, 3].map((i) => (
        <Txt key={i} size={size} weight="heavy" color={i <= n ? p.gold : p.muted} style={{ lineHeight: size * 1.2, opacity: i <= n ? 1 : 0.3 }}>
          ★
        </Txt>
      ))}
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
