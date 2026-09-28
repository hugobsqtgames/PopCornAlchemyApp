import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, View, type LayoutChangeEvent } from 'react-native';

import { AnswerEmojis, Stars } from '@/components/game/board';
import { PlayIcon } from '@/components/icons';
import { Popi } from '@/components/mascot';
import { Btn, Header, Screen, Tap, Txt } from '@/components/ui';
import { WorldDeco } from '@/components/world-deco';
import { one } from '@/game/links';
import { mulberry32 } from '@/game/random';
import { adventureIds, levelById, TIER_SIZE } from '@/game/rules';
import type { Difficulty } from '@/game/types';
import { worldOf } from '@/game/worlds';
import { useLayout, useLevelName, usePalette, useT } from '@/hooks/use-app';
import type { StringKey } from '@/i18n/strings';
import { useProfile } from '@/store/profile';

/** Height of one level on the path, and of the "Tier N" banner at the start of each tier. */
const ROW = 84;
const BANNER = 64;
const PAD = 48;
const POPI = 56;

interface MapLayout {
  /** Centre of each level, by index in the adventure (level 1 is at the bottom). */
  pos: { x: number; y: number }[];
  /** One banner under the first level of each tier. */
  banners: { tier: number; y: number }[];
  /** The ground of each tier's world, from its top to the bottom of its banner. */
  sections: { tier: number; top: number; bottom: number }[];
  /** Scenery scattered over the whole screen width, clear of the path (screen coordinates). */
  decos: { key: string; tier: number; kind: 0 | 1; size: number; x: number; y: number }[];
  height: number;
}

/** How close a drawing may come to a level (centre to centre) and to the trail. */
const NODE_GAP = 62;
const TRAIL_GAP = 40;

/** Distance from point (x, y) to the segment a-b. */
function toSegment(x: number, y: number, a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const k = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - a.x - k * dx, y - a.y - k * dy);
}

/**
 * Lays the path out from the top (last level) down to level 1, winding left and right, in a
 * column of `width` centred on a screen of `full` width. The scenery is scattered over the
 * whole screen, always the same for a given size (seeded), and never on the path.
 */
function layoutMap(total: number, width: number, full: number): MapLayout {
  const pos: MapLayout['pos'] = new Array(total);
  const rows: { i: number; top: number }[] = [];
  const banners: MapLayout['banners'] = [];
  const sections: MapLayout['sections'] = [];
  const swing = Math.max(0, width / 2 - 70);
  const shift = (full - width) / 2;
  let y = PAD;
  let top = 0;
  for (let i = total - 1; i >= 0; i--) {
    pos[i] = { x: width / 2 + swing * Math.sin(i * 0.75), y: y + ROW / 2 };
    rows.push({ i, top: y });
    y += ROW;
    if (i % TIER_SIZE === 0) {
      banners.push({ tier: i / TIER_SIZE, y });
      y += BANNER;
      sections.push({ tier: i / TIER_SIZE, top, bottom: i === 0 ? y + PAD : y });
      top = y;
    }
  }

  const decos: MapLayout['decos'] = [];
  const rng = mulberry32(total * 7919 + Math.round(full));
  const tries = Math.max(3, Math.round(full / 260));
  for (const { i, top: rowTop } of rows) {
    const here = { x: pos[i].x + shift, y: pos[i].y };
    const near = [pos[i + 1], pos[i - 1]].filter(Boolean).map((q) => ({ x: q.x + shift, y: q.y }));
    const placed: { x: number; y: number; r: number }[] = [];
    for (let k = 0; k < tries; k++) {
      const size = 30 + Math.round(rng() * 16);
      const x = 6 + rng() * (full - size - 12);
      const top = rowTop + 4 + rng() * (ROW - size - 8);
      const cx = x + size / 2;
      const cy = top + size / 2;
      const clear =
        Math.hypot(cx - here.x, cy - here.y) > NODE_GAP &&
        near.every((q) => Math.hypot(cx - q.x, cy - q.y) > NODE_GAP && toSegment(cx, cy, here, q) > TRAIL_GAP) &&
        placed.every((o) => Math.hypot(cx - o.x, cy - o.y) > (size / 2 + o.r) * 2);
      if (!clear) continue;
      placed.push({ x: cx, y: cy, r: size / 2 });
      decos.push({ key: `${i}-${k}`, tier: Math.floor(i / TIER_SIZE), kind: rng() < 0.5 ? 0 : 1, size, x, y: top });
    }
  }
  return { pos, banners, sections, decos, height: y + PAD };
}

/** The adventure map of one difficulty: the path of levels, what is done and what is left. */
export default function Aventure() {
  const p = usePalette();
  const t = useT();
  const name = useLevelName();
  const { insets, tablet, width: screenWidth } = useLayout();
  const raw = Number(one(useLocalSearchParams<{ diff?: string }>().diff));
  const d: Difficulty | null = raw === 1 || raw === 2 || raw === 3 ? raw : null;
  const passed = useProfile((s) => (d ? s.adventure[d] : 0));
  const stars = useProfile((s) => s.stars);
  const found = useProfile((s) => s.found);
  const save = useProfile((s) => s.save);
  const lang = useProfile((s) => s.lang) ?? 'fr';
  const [open, setOpen] = useState<number | null>(null);
  const width = Math.min(screenWidth, tablet ? 640 : 600);
  const ids = useMemo(() => (d ? adventureIds(d) : []), [d]);
  const map = useMemo(() => layoutMap(ids.length, width, screenWidth), [ids.length, width, screenWidth]);
  const scroller = useRef<ScrollView>(null);
  // Scrolled to the current level once both the screen and the path have a size.
  const sized = useRef({ viewport: 0, content: false, done: false });

  if (!d) return <Redirect href="/categories" />;

  const total = ids.length;
  const current = passed < total ? passed : -1;
  const got = ids.reduce((sum, id) => sum + (stars[id] ?? 0), 0);
  const tierOfCurrent = Math.floor((current < 0 ? total - 1 : current) / TIER_SIZE);
  const resumable = save?.adventure && save.difficulty === d ? save.index : null;
  const currentLevel = current >= 0 ? levelById(ids[current]) : undefined;

  // Once the path is laid out, show the current level in the middle of the screen.
  const showCurrent = () => {
    const s = sized.current;
    if (s.done || !s.viewport || !s.content) return;
    s.done = true;
    const target = current >= 0 ? map.pos[current].y : 0;
    scroller.current?.scrollTo({ y: Math.max(0, target - s.viewport / 2), animated: false });
  };
  const onViewport = (e: LayoutChangeEvent) => {
    sized.current.viewport = e.nativeEvent.layout.height;
    showCurrent();
  };
  const onContent = () => {
    sized.current.content = true;
    showCurrent();
  };

  // Nothing drawn under Popi and the "your turn" bubble, next to the current level.
  const nearPopi = (x: number, y: number, size: number) => {
    if (current < 0) return false;
    const node = map.pos[current];
    const left = (screenWidth - width) / 2 + (node.x < width / 2 ? node.x + 36 : node.x - 44 - 138);
    return x + size > left && x < left + 146 && y + size > node.y - 66 && y < node.y + 40;
  };

  const play = () => {
    if (resumable !== null) router.push({ pathname: '/jeu', params: { resume: '1' } });
    else router.push({ pathname: '/jeu', params: { mode: 'classic', diff: String(d), fresh: String(Date.now()) } });
  };

  const openLevel = open !== null ? levelById(ids[open]) : undefined;
  const openFound = openLevel ? found.includes(openLevel.id) : false;

  return (
    <Screen style={{ maxWidth: '100%' }}>
      {/* The map spans the whole screen on iPad; the header keeps the usual column. */}
      <View style={{ width: '100%', maxWidth: tablet ? 640 : undefined, alignSelf: 'center' }}>
        <Header
          title={`${t('adventure')} ${t(`diff_${d}` as StringKey)}`}
          right={
            <View style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: p.goldTint, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Txt size={15} weight="heavy" color={p.goldDeep}>
                ★
              </Txt>
              <Txt size={15} weight="heavy">
                {`${got} / ${total * 3}`}
              </Txt>
            </View>
          }
        />
        <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt size={13} weight="bold" color={p.muted} lines={1} style={{ flex: 1 }}>
            {t('map_world', { n: tierOfCurrent + 1, name: worldOf(d, tierOfCurrent).name[lang] })}
          </Txt>
          <Tap
            onPress={() => router.push({ pathname: '/mondes', params: { diff: String(d) } })}
            label={t('worlds_link')}
            style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, justifyContent: 'center' }}>
            <Txt size={13} weight="heavy">
              {`${t('worlds_link')} ›`}
            </Txt>
          </Tap>
        </View>
      </View>

      <ScrollView ref={scroller} onLayout={onViewport} onContentSizeChange={onContent} style={{ flex: 1, backgroundColor: worldOf(d, 0).bg }} contentContainerStyle={{ alignItems: 'center' }}>
        {/* Each tier is a world: its ground, drawn from edge to edge of the screen. */}
        <View style={{ width: screenWidth, height: map.height }}>
          {map.sections.map(({ tier, top, bottom }) => (
            <View key={`ground-${tier}`} style={{ position: 'absolute', left: 0, width: screenWidth, top, height: bottom - top, backgroundColor: worldOf(d, tier).bg }} />
          ))}
          {map.decos.map(({ key, tier, kind, size, x, y }) =>
            nearPopi(x, y, size) ? null : (
              <View key={`deco-${key}`} pointerEvents="none" style={{ position: 'absolute', left: x, top: y }}>
                <WorldDeco kind={worldOf(d, tier).decos[kind]} size={size} />
              </View>
            ),
          )}
          <View style={{ position: 'absolute', left: (screenWidth - width) / 2, top: 0, width, height: map.height }}>
            {/* The trail: small dots between levels, gold where the player went. */}
            {map.pos.slice(0, -1).map((a, i) => {
              const b = map.pos[i + 1];
              const done = i + 1 <= passed;
              const road = worldOf(d, Math.floor((i + 1) / TIER_SIZE)).road;
              return [1, 2].map((k) => (
                <View
                  key={`${i}-${k}`}
                  style={{
                    position: 'absolute',
                    left: a.x + ((b.x - a.x) * k) / 3 - 5,
                    top: a.y + ((b.y - a.y) * k) / 3 - 5,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: done ? p.gold : road,
                  }}
                />
              ));
            })}

            {/* The entrance sign of each world, under its first level. */}
            {map.banners.map(({ tier, y }) => {
              const end = Math.min(total, (tier + 1) * TIER_SIZE);
              const complete = passed >= end;
              const world = worldOf(d, tier);
              const label = t('map_world', { n: tier + 1, name: world.name[lang] });
              return (
                <View
                  key={tier}
                  accessible
                  accessibilityLabel={complete ? `${label}, ${t('map_tier_done', { n: tier + 1 })}` : label}
                  style={{
                    position: 'absolute',
                    left: width / 2 - 130,
                    top: y + (BANNER - 44) / 2,
                    width: 260,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: world.sign,
                    borderBottomWidth: 4,
                    borderBottomColor: 'rgba(0,0,0,0.25)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 10,
                  }}>
                  <Txt size={13} weight="heavy" color={world.signText} lines={1} style={{ letterSpacing: 0.4 }}>
                    {`${complete ? '✓ ' : ''}${label.toUpperCase()}`}
                  </Txt>
                </View>
              );
            })}

            {map.pos.map(({ x, y }, i) => {
              const id = ids[i];
              const isCurrent = i === current;
              const isPassed = i < passed;
              const n = stars[id] ?? 0;
              const size = isCurrent ? 72 : isPassed ? 56 : 48;
              if (isCurrent) {
                return (
                  <View key={id} style={{ position: 'absolute', left: x - 48, top: y - 48, width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: p.gold, opacity: 0.28 }} />
                    <Pressable
                      onPress={play}
                      accessibilityRole="button"
                      accessibilityLabel={t('map_play', { n: i + 1 })}
                      style={({ pressed }) => ({
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: p.gold,
                        borderWidth: 4,
                        borderColor: '#FFFFFF',
                        borderBottomWidth: pressed ? 4 : 8,
                        borderBottomColor: p.goldDeep,
                        alignItems: 'center',
                        justifyContent: 'center',
                      })}>
                      <Txt size={24} weight="heavy" color="#1F1B2D">
                        {i + 1}
                      </Txt>
                    </Pressable>
                  </View>
                );
              }
              return (
                <View key={id} style={{ position: 'absolute', left: x - 40, top: y - size / 2, width: 80, alignItems: 'center', gap: 2 }}>
                  <Pressable
                    disabled={!isPassed}
                    onPress={() => setOpen(i)}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !isPassed }}
                    accessibilityLabel={
                      !isPassed ? t('map_locked', { n: i + 1 }) : n ? t('map_node_done', { n: i + 1, s: n }) : t('map_node_missed', { n: i + 1 })
                    }
                    style={{
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      backgroundColor: isPassed ? p.surface : p.sunk,
                      borderWidth: isPassed ? 3 : 2,
                      borderStyle: isPassed ? 'solid' : 'dashed',
                      borderColor: isPassed ? (n ? p.green : p.line2) : p.line2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Txt size={isPassed ? 18 : 15} weight="heavy" color={isPassed ? p.ink : p.muted}>
                      {i + 1}
                    </Txt>
                  </Pressable>
                  {isPassed && n > 0 && <Stars n={n} size={12} />}
                </View>
              );
            })}

            {current >= 0 && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: map.pos[current].y - 60,
                  left: map.pos[current].x < width / 2 ? map.pos[current].x + 44 : map.pos[current].x - 44 - 130,
                  width: 130,
                  alignItems: 'center',
                  gap: 2,
                }}>
                <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: p.surface, borderWidth: p.border, borderColor: p.line }}>
                  <Txt size={12} weight="bold">
                    {t('map_here')}
                  </Txt>
                </View>
                <Popi mood="happy" size={POPI} />
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: insets.bottom + 14,
          gap: 12,
          backgroundColor: p.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderWidth: p.border,
          borderBottomWidth: 0,
          borderColor: p.line,
        }}>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', gap: 12 }}>
          {currentLevel ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt size={18} weight="heavy">
                  {`${t('level')} ${current + 1}`}
                </Txt>
                <Txt size={13} weight="semibold" color={p.muted}>
                  {t('map_level_sub', { cat: t(`cat_${currentLevel.cat}` as StringKey) })}
                </Txt>
              </View>
              <Stars n={0} size={16} />
            </View>
          ) : (
            <Txt size={18} weight="heavy" center>
              {t('map_done')}
            </Txt>
          )}
          <Btn
            label={resumable !== null ? t('map_continue', { n: resumable + 1 }) : current >= 0 ? t('map_play', { n: current + 1 }) : t('map_restart')}
            icon={<PlayIcon color={p.onAction} />}
            onPress={play}
          />
        </View>
      </View>

      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(31,27,45,0.55)' }} onPress={() => setOpen(null)} accessibilityLabel={t('close')} />
        {openLevel && open !== null && (
          <View
            style={{
              width: '100%',
              maxWidth: 560,
              alignSelf: 'center',
              backgroundColor: p.bg,
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
              padding: 18,
              paddingTop: 10,
              paddingBottom: insets.bottom + 18,
              gap: 14,
            }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: p.line2, alignSelf: 'center' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ gap: 2 }}>
                <Txt size={22} weight="heavy">
                  {`${t('level')} ${open + 1}`}
                </Txt>
                <Txt size={13} weight="semibold" color={p.muted}>
                  {t(`cat_${openLevel.cat}` as StringKey)}
                </Txt>
              </View>
              <Stars n={stars[openLevel.id] ?? 0} size={28} />
            </View>
            {openFound ? (
              <View style={{ padding: 16, borderRadius: 20, backgroundColor: p.surface, borderWidth: p.border, borderColor: p.line, alignItems: 'center', gap: 10 }}>
                <AnswerEmojis level={openLevel} size={52} />
                <Txt size={18} weight="heavy" center>
                  {name(openLevel)}
                </Txt>
              </View>
            ) : (
              <View style={{ padding: 16, borderRadius: 20, backgroundColor: p.surface, borderWidth: p.border, borderColor: p.line, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Popi mood="surprised" size={52} />
                <Txt size={14} weight="semibold" style={{ flex: 1 }}>
                  {t('map_missed')}
                </Txt>
              </View>
            )}
            <Txt size={13} color={p.muted} center>
              {t('star_rules')}
            </Txt>
            <Btn
              variant="gold"
              label={t('replay')}
              onPress={() => {
                const id = openLevel.id;
                setOpen(null);
                router.push({ pathname: '/jeu', params: { mode: 'replay', ids: String(id), from: 'map', fresh: String(Date.now()) } });
              }}
            />
            <Btn variant="soft" label={t('close')} height={48} size={15} onPress={() => setOpen(null)} />
          </View>
        )}
      </Modal>
    </Screen>
  );
}
