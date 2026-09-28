import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import { DecoShapes } from '@/components/world-deco';
import { mulberry32 } from '@/game/random';
import type { Deco, Terrain, Texture, World } from '@/game/worlds';

/**
 * The painted landscape under the adventure map: big scenery along both edges, marks on the
 * ground, the road between the levels and groups of small drawings. The map is cut into
 * horizontal strips so only the ones near the screen are drawn.
 */
export const STRIP = 400;

type Point = { x: number; y: number };
export interface SceneSection {
  tier: number;
  top: number;
  bottom: number;
}

interface Land {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 1: from the left edge, -1: from the right edge (drawn mirrored). */
  side: 1 | -1;
  far: boolean;
  seed: number;
}
interface Prop {
  x: number;
  y: number;
  size: number;
  deco: 0 | 1;
}
interface Patch {
  x: number;
  y: number;
  rx: number;
  ry: number;
  light: boolean;
}
interface SectionScene extends SceneSection {
  lands: Land[];
  props: Prop[];
  patches: Patch[];
  /** Ground marks, one path per strip index. */
  marks: Record<number, string>;
}
export interface MapScene {
  sections: SectionScene[];
  /** Smooth road through every level, in screen coordinates. */
  road: string;
  /** Section indices to draw in each strip. */
  strips: number[][];
}

/** a → b by t, for #RRGGBB colours. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

function toSegment(x: number, y: number, a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const k = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - a.x - k * dx, y - a.y - k * dy);
}

/** Catmull-Rom curve through the points, as cubic Béziers. */
function smooth(pts: Point[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/** One small ground mark as path data (drawn with a stroke of 2). */
function mark(kind: Texture, x: number, y: number, s: number): string {
  const f = (n: number) => n.toFixed(1);
  switch (kind) {
    case 'tuft':
      return `M${f(x - s * 0.5)} ${f(y - s)} L${f(x)} ${f(y)} L${f(x)} ${f(y - s * 1.3)} M${f(x)} ${f(y)} L${f(x + s * 0.5)} ${f(y - s)}`;
    case 'wave':
      return `M${f(x - s)} ${f(y)} q${f(s / 2)} ${f(-s / 2)} ${f(s)} 0 q${f(s / 2)} ${f(s / 2)} ${f(s)} 0`;
    case 'crack':
      return `M${f(x - s)} ${f(y - s * 0.4)} L${f(x - s * 0.2)} ${f(y + s * 0.3)} L${f(x + s * 0.3)} ${f(y - s * 0.3)} L${f(x + s)} ${f(y + s * 0.4)}`;
    case 'sparkle':
    case 'star':
      return `M${f(x)} ${f(y - s)} L${f(x)} ${f(y + s)} M${f(x - s)} ${f(y)} L${f(x + s)} ${f(y)}`;
    case 'bubble':
      return `M${f(x - s * 0.6)} ${f(y)} a${f(s * 0.6)} ${f(s * 0.6)} 0 1 0 ${f(s * 1.2)} 0 a${f(s * 0.6)} ${f(s * 0.6)} 0 1 0 ${f(-s * 1.2)} 0`;
    default:
      // dot, confetti: a tiny dash reads as a dot with round caps.
      return `M${f(x)} ${f(y)} l${f(s * 0.4)} ${f(kind === 'confetti' ? s * 0.4 : 0.01)}`;
  }
}

/**
 * Lays out the scenery of the whole map. `pos` are the level centres in screen coordinates
 * (level 1 first), `full` the screen width.
 */
export function buildScene(worlds: World[], sections: SceneSection[], pos: Point[], full: number, height: number): MapScene {
  const land = Math.max(100, Math.min(250, full * 0.22));
  const road = smooth(pos);
  const out: SectionScene[] = sections.map((sec) => {
    const world = worlds[sec.tier];
    const rng = mulberry32(9001 + sec.tier * 131 + Math.round(full));
    const lands: Land[] = [];
    const props: Prop[] = [];
    const patches: Patch[] = [];
    const marks: Record<number, string> = {};

    // Edge scenery: two overlapping rows on each side, the far one bigger and paler.
    for (const side of [1, -1] as const) {
      for (const far of [true, false]) {
        let y = sec.top - land * (far ? 0.5 : 0.2) + rng() * land * 0.3;
        while (y < sec.bottom) {
          const w = land * (far ? 1.25 : 1) * (0.85 + rng() * 0.3);
          const h = w * (0.85 + rng() * 0.35);
          const inset = w * (far ? 0.35 : 0.25);
          lands.push({ x: side === 1 ? -inset : full - w + inset, y, w, h, side, far, seed: Math.floor(rng() * 1e6) });
          y += h * (far ? 0.62 : 0.72);
        }
      }
    }

    // Soft patches of lighter and darker ground.
    const area = (full * (sec.bottom - sec.top)) / (240 * 240);
    for (let i = 0; i < area; i++) {
      patches.push({
        x: rng() * full,
        y: sec.top + rng() * (sec.bottom - sec.top),
        rx: 60 + rng() * 90,
        ry: 30 + rng() * 45,
        light: rng() < 0.6,
      });
    }

    // Marks on a jittered grid.
    const step = 46;
    for (let y = sec.top + step / 2; y < sec.bottom; y += step) {
      for (let x = step / 2; x < full; x += step) {
        if (rng() < 0.55) continue;
        const mx = x + (rng() - 0.5) * step * 0.8;
        const my = y + (rng() - 0.5) * step * 0.8;
        const k = Math.floor(my / STRIP);
        marks[k] = (marks[k] ?? '') + mark(world.scene.texture, mx, my, 3 + rng() * 3);
      }
    }

    // Groups of small drawings on the open ground, clear of the road and the levels.
    const inSection = pos.map((q, i) => ({ q, i })).filter(({ q }) => q.y > sec.top - 90 && q.y < sec.bottom + 90);
    const edge = land * 0.45;
    const tries = Math.round(((sec.bottom - sec.top) / 84) * Math.max(3.2, full / 150));
    const placed: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < tries; i++) {
      const cx = edge + rng() * (full - 2 * edge);
      const cy = sec.top + 30 + rng() * (sec.bottom - sec.top - 60);
      const count = 1 + Math.floor(rng() * 3);
      for (let j = 0; j < count; j++) {
        const size = 30 + rng() * 22;
        const x = cx + (j === 0 ? 0 : (rng() - 0.5) * 70);
        const y = cy + (j === 0 ? 0 : (rng() - 0.5) * 40);
        const r = size / 2;
        const px = x + r;
        const py = y + r;
        if (y < sec.top + 4 || y + size > sec.bottom - 4) continue;
        const clear =
          inSection.every(({ q, i: n }) => Math.hypot(px - q.x, py - q.y) > 48 + r && (!pos[n + 1] || toSegment(px, py, q, pos[n + 1]) > 26 + r)) &&
          placed.every((o) => Math.hypot(px - o.x, py - o.y) > (r + o.r) * 1.05);
        if (!clear) continue;
        placed.push({ x: px, y: py, r });
        props.push({ x, y, size, deco: rng() < 0.5 ? 0 : 1 });
      }
    }
    props.sort((a, b) => a.y + a.size - (b.y + b.size));
    lands.sort((a, b) => Number(b.far) - Number(a.far) || a.y - b.y);
    return { ...sec, lands, props, patches, marks };
  });

  const strips: number[][] = [];
  for (let k = 0; k * STRIP < height; k++) {
    strips.push(out.map((s, i) => (s.top < (k + 1) * STRIP && s.bottom > k * STRIP ? i : -1)).filter((i) => i >= 0));
  }
  return { sections: out, road, strips };
}

/* ------------------------------------------------------------------ */
/* The edge scenery, drawn for the left edge in a w × h box.          */

interface Paint {
  w: number;
  h: number;
  base: string;
  lite: string;
  shade: string;
  acc: string;
  rng: () => number;
}

function hills({ w, h, base, lite, shade, acc, rng }: Paint) {
  const bushes = Array.from({ length: 3 }, () => ({ x: w * (0.05 + rng() * 0.5), y: h * (0.25 + rng() * 0.5), r: w * (0.07 + rng() * 0.05) }));
  return (
    <G>
      <Ellipse cx={0} cy={h * 0.55} rx={w * 0.9} ry={h * 0.46} fill={base} />
      <Ellipse cx={-w * 0.12} cy={h * 0.4} rx={w * 0.62} ry={h * 0.26} fill={lite} opacity={0.35} />
      <Path
        d={[0.3, 0.45, 0.6, 0.75].map((k) => `M${-w * 0.05} ${h * k} Q${w * 0.3} ${h * (k - 0.06)} ${w * (0.62 - Math.abs(k - 0.52) * 0.6)} ${h * (k + 0.02)}`).join(' ')}
        stroke={acc}
        strokeWidth={3}
        strokeDasharray="2 7"
        strokeLinecap="round"
        fill="none"
      />
      {bushes.map((b, i) => (
        <G key={i}>
          <Circle cx={b.x} cy={b.y + b.r * 0.4} r={b.r} fill={shade} opacity={0.35} />
          <Circle cx={b.x} cy={b.y} r={b.r} fill={mix(base, '#1F6B2A', 0.45)} />
          <Circle cx={b.x - b.r * 0.3} cy={b.y - b.r * 0.3} r={b.r * 0.4} fill={lite} opacity={0.5} />
        </G>
      ))}
    </G>
  );
}

function dunes({ w, h, base, lite, shade }: Paint) {
  return (
    <G>
      <Path d={`M0 ${h * 0.05} C${w * 0.55} ${h * 0.12} ${w * 0.98} ${h * 0.55} ${w * 0.62} ${h * 0.8} C${w * 0.42} ${h * 0.95} ${w * 0.15} ${h} 0 ${h} Z`} fill={base} />
      <Path d={`M0 ${h * 0.55} C${w * 0.3} ${h * 0.6} ${w * 0.5} ${h * 0.75} ${w * 0.4} ${h * 0.9} C${w * 0.25} ${h} 0 ${h} 0 ${h} Z`} fill={shade} opacity={0.3} />
      <Path d={`M0 ${h * 0.2} C${w * 0.4} ${h * 0.26} ${w * 0.72} ${h * 0.5} ${w * 0.56} ${h * 0.72}`} stroke={lite} strokeWidth={4} fill="none" strokeLinecap="round" />
    </G>
  );
}

function pine(cx: number, top: number, s: number, base: string, lite: string, snow?: string) {
  return (
    <G key={`${cx}-${top}`}>
      <Rect x={cx - s * 0.07} y={top + s * 0.98} width={s * 0.14} height={s * 0.22} fill="#6B4423" />
      <Path d={`M${cx} ${top + s * 0.3} L${cx + s * 0.5} ${top + s} L${cx - s * 0.5} ${top + s} Z`} fill={base} />
      <Path d={`M${cx} ${top} L${cx + s * 0.4} ${top + s * 0.6} L${cx - s * 0.4} ${top + s * 0.6} Z`} fill={base} />
      <Path d={`M${cx} ${top + s * 0.3} L${cx - s * 0.5} ${top + s} L${cx} ${top + s} Z M${cx} ${top} L${cx - s * 0.4} ${top + s * 0.6} L${cx} ${top + s * 0.6} Z`} fill={lite} opacity={0.35} />
      {snow ? <Path d={`M${cx} ${top} L${cx + s * 0.16} ${top + s * 0.24} L${cx} ${top + s * 0.18} L${cx - s * 0.16} ${top + s * 0.24} Z`} fill={snow} /> : null}
    </G>
  );
}

function forest({ w, h, base, lite, shade, rng }: Paint) {
  const trees = Array.from({ length: 5 }, () => {
    const s = h * (0.42 + rng() * 0.28);
    return { cx: w * (0.05 + rng() * 0.62), top: rng() * (h - s * 1.2), s };
  }).sort((a, b) => a.top + a.s - (b.top + b.s));
  return (
    <G>
      <Ellipse cx={w * 0.2} cy={h * 0.62} rx={w * 0.7} ry={h * 0.36} fill={shade} opacity={0.25} />
      {trees.map((t) => pine(t.cx, t.top, t.s, base, lite))}
    </G>
  );
}

function windows(x: number, y: number, bw: number, bh: number, rng: () => number, lit: string, acc: string) {
  let on = '';
  let neon = '';
  for (let wy = y + 8; wy < y + bh - 10; wy += 13) {
    for (let wx = x + 6; wx < x + bw - 8; wx += 11) {
      const r = rng();
      if (r < 0.35) on += `M${wx.toFixed(1)} ${wy.toFixed(1)}h5v6h-5Z`;
      else if (r < 0.45) neon += `M${wx.toFixed(1)} ${wy.toFixed(1)}h5v6h-5Z`;
    }
  }
  return (
    <G>
      <Path d={on} fill={lit} />
      <Path d={neon} fill={acc} />
    </G>
  );
}

function skyline({ w, h, base, lite, shade, acc, rng }: Paint) {
  const out: ReactNode[] = [];
  let x = -w * 0.1;
  let n = 0;
  while (x < w * 0.8) {
    const bw = w * (0.22 + rng() * 0.12);
    const bh = h * (0.45 + rng() * 0.5);
    const y = h - bh;
    const fill = n % 2 ? base : shade;
    out.push(
      <G key={n}>
        <Rect x={x} y={y} width={bw} height={bh} fill={fill} />
        <Rect x={x} y={y} width={bw} height={4} fill={lite} opacity={0.5} />
        {windows(x, y, bw, bh, rng, '#FFD34D', acc)}
        {bh > h * 0.8 ? <Path d={`M${x + bw / 2} ${y} v-14`} stroke={acc} strokeWidth={2} /> : null}
        {bh > h * 0.8 ? <Circle cx={x + bw / 2} cy={y - 16} r={3} fill={acc} /> : null}
      </G>,
    );
    x += bw * 0.92;
    n++;
  }
  return <G>{out}</G>;
}

function mountains({ w, h, base, shade, acc }: Paint) {
  const peak = (px: number, py: number, l: number, r: number, key: string) => (
    <G key={key}>
      <Path d={`M${l} ${h} L${px} ${py} L${r} ${h} Z`} fill={base} />
      <Path d={`M${px} ${py} L${r} ${h} L${px + (r - px) * 0.25} ${h} Z`} fill={shade} opacity={0.35} />
      <Path
        d={`M${px} ${py} L${px + (r - px) * 0.2} ${py + (h - py) * 0.24} L${px + (r - px) * 0.06} ${py + (h - py) * 0.18} L${px - (px - l) * 0.05} ${py + (h - py) * 0.26} L${px - (px - l) * 0.2} ${py + (h - py) * 0.22} Z`}
        fill={acc}
      />
    </G>
  );
  return (
    <G>
      {peak(w * 0.22, h * 0.02, -w * 0.4, w * 0.8, 'a')}
      {peak(w * 0.58, h * 0.36, w * 0.1, w * 1.0, 'b')}
    </G>
  );
}

function sea({ w, h, base, lite, acc }: Paint) {
  const shore = `M${w * 0.5} 0 C${w * 0.85} ${h * 0.2} ${w * 0.35} ${h * 0.45} ${w * 0.7} ${h * 0.7} C${w * 0.9} ${h * 0.85} ${w * 0.55} ${h} ${w * 0.45} ${h}`;
  return (
    <G>
      <Path d={`${shore} L-2 ${h} L-2 0 Z`} fill={base} />
      <Path d={shore} stroke={acc} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d={`M${w * 0.1} ${h * 0.3} q${w * 0.06} ${-h * 0.05} ${w * 0.12} 0 q${w * 0.06} ${h * 0.05} ${w * 0.12} 0`} stroke={lite} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d={`M${w * 0.18} ${h * 0.68} q${w * 0.06} ${-h * 0.05} ${w * 0.12} 0 q${w * 0.06} ${h * 0.05} ${w * 0.12} 0`} stroke={lite} strokeWidth={3} fill="none" strokeLinecap="round" />
    </G>
  );
}

function island({ w, h, base, shade, acc }: Paint) {
  return (
    <G>
      <Ellipse cx={w * 0.05} cy={h * 0.5} rx={w * 0.74} ry={h * 0.42} fill={acc} opacity={0.7} />
      <Ellipse cx={w * 0.05} cy={h * 0.5} rx={w * 0.68} ry={h * 0.37} fill={base} />
      <Ellipse cx={w * 0.05} cy={h * 0.58} rx={w * 0.6} ry={h * 0.26} fill={shade} opacity={0.15} />
      <Ellipse cx={-w * 0.06} cy={h * 0.44} rx={w * 0.42} ry={h * 0.2} fill="#6DBE5E" />
      <Ellipse cx={-w * 0.1} cy={h * 0.4} rx={w * 0.3} ry={h * 0.12} fill="#8FD67A" />
    </G>
  );
}

function jungle({ w, h, base, lite, shade, rng }: Paint) {
  const leaves = Array.from({ length: 5 }, (_, i) => ({ y: h * (0.12 + i * 0.19 + rng() * 0.06), len: w * (0.75 + rng() * 0.3), a: -35 + rng() * 70, i }));
  return (
    <G>
      {leaves.map(({ y, len, a, i }) => (
        <G key={i} transform={`translate(-6 ${y}) rotate(${a})`}>
          <Path d={`M0 0 Q${len * 0.5} ${-len * 0.24} ${len} 0 Q${len * 0.5} ${len * 0.24} 0 0 Z`} fill={i % 2 ? base : lite} />
          <Path d={`M0 0 L${len * 0.92} 0`} stroke={shade} strokeWidth={2} opacity={0.5} />
        </G>
      ))}
    </G>
  );
}

function curtain({ w, h, base, lite, shade, acc }: Paint) {
  return (
    <G>
      <Path d={`M-2 -2 L${w * 0.62} -2 C${w * 0.5} ${h * 0.35} ${w * 0.68} ${h * 0.7} ${w * 0.56} ${h + 2} L-2 ${h + 2} Z`} fill={base} />
      {[0.12, 0.26, 0.4].map((k) => (
        <Path key={k} d={`M${w * k} -2 C${w * (k - 0.04)} ${h * 0.35} ${w * (k + 0.05)} ${h * 0.7} ${w * (k - 0.02)} ${h + 2}`} stroke={shade} strokeWidth={w * 0.05} fill="none" opacity={0.55} />
      ))}
      <Path d={`M${w * 0.19} -2 C${w * 0.15} ${h * 0.35} ${w * 0.24} ${h * 0.7} ${w * 0.17} ${h + 2}`} stroke={lite} strokeWidth={3} fill="none" opacity={0.4} />
      <Path d={`M${w * 0.6} ${h * 0.02} C${w * 0.5} ${h * 0.35} ${w * 0.66} ${h * 0.7} ${w * 0.55} ${h}`} stroke={acc} strokeWidth={4} fill="none" />
      <Path d={`M-2 ${h * 0.5} Q${w * 0.3} ${h * 0.56} ${w * 0.58} ${h * 0.48}`} stroke={acc} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Circle cx={w * 0.58} cy={h * 0.48} r={6} fill={acc} />
    </G>
  );
}

function space({ w, h, base, lite, shade, acc, rng }: Paint) {
  const r = Math.min(w, h) * 0.4;
  const cx = w * 0.18;
  const cy = h * 0.5;
  if (rng() < 0.45) {
    // A cratered moon.
    return (
      <G>
        <Circle cx={cx} cy={cy} r={r} fill="#CFCBE6" />
        <Circle cx={cx + r * 0.15} cy={cy + r * 0.15} r={r * 0.85} fill="#B9B3D6" opacity={0.5} />
        <Circle cx={cx + r * 0.3} cy={cy - r * 0.3} r={r * 0.18} fill="#A59ECB" />
        <Circle cx={cx + r * 0.5} cy={cy + r * 0.3} r={r * 0.12} fill="#A59ECB" />
        <Circle cx={cx - r * 0.1} cy={cy + r * 0.45} r={r * 0.1} fill="#A59ECB" />
      </G>
    );
  }
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={base} />
      <Path d={`M${cx - r} ${cy - r * 0.2} Q${cx} ${cy - r * 0.45} ${cx + r} ${cy - r * 0.2}`} stroke={lite} strokeWidth={r * 0.14} fill="none" opacity={0.6} />
      <Path d={`M${cx - r} ${cy + r * 0.25} Q${cx} ${cy} ${cx + r} ${cy + r * 0.25}`} stroke={shade} strokeWidth={r * 0.12} fill="none" opacity={0.4} />
      <Ellipse cx={cx} cy={cy} rx={r * 1.55} ry={r * 0.32} stroke={acc} strokeWidth={5} fill="none" transform={`rotate(-18 ${cx} ${cy})`} />
    </G>
  );
}

function castle({ w, h, base, lite, shade, acc }: Paint) {
  const wy = h * 0.42;
  const wall = `M${-w * 0.1} ${h * 0.9} L${-w * 0.1} ${wy} ${Array.from({ length: 6 }, (_, i) => {
    const x = -w * 0.1 + i * w * 0.13;
    return `L${x} ${wy - 10} L${x + w * 0.065} ${wy - 10} L${x + w * 0.065} ${wy} L${x + w * 0.13} ${wy}`;
  }).join(' ')} L${w * 0.68} ${h * 0.9} Z`;
  const tx = w * 0.42;
  const tw = w * 0.26;
  return (
    <G>
      <Path d={wall} fill={base} />
      <Path d={`M${-w * 0.1} ${h * 0.6} H${w * 0.68} M${-w * 0.1} ${h * 0.75} H${w * 0.68}`} stroke={shade} strokeWidth={2} opacity={0.35} />
      <Rect x={tx} y={h * 0.2} width={tw} height={h * 0.7} fill={lite} />
      <Rect x={tx + tw * 0.62} y={h * 0.2} width={tw * 0.38} height={h * 0.7} fill={shade} opacity={0.25} />
      <Path d={`M${tx - 6} ${h * 0.2} L${tx + tw / 2} ${h * 0.02} L${tx + tw + 6} ${h * 0.2} Z`} fill={acc} />
      <Path d={`M${tx + tw / 2} ${h * 0.02} v-12`} stroke="#6B4423" strokeWidth={2} />
      <Path d={`M${tx + tw / 2} ${h * 0.02 - 12} l12 4 l-12 4 Z`} fill="#FFC93C" />
      <Path d={`M${tx + tw * 0.3} ${h * 0.5} v-8 a${tw * 0.2} ${tw * 0.2} 0 0 1 ${tw * 0.4} 0 v8 Z`} fill="#3A2A1A" />
    </G>
  );
}

function cliffs({ w, h, base, lite, shade, acc }: Paint) {
  return (
    <G>
      <Path d={`M-4 ${h * 0.1} L${w * 0.45} ${h * 0.04} L${w * 0.76} ${h * 0.34} L${w * 0.6} ${h * 0.6} L${w * 0.82} ${h * 0.92} L-4 ${h} Z`} fill={base} />
      <Path d={`M-4 ${h * 0.1} L${w * 0.45} ${h * 0.04} L${w * 0.62} ${h * 0.2} L${w * 0.1} ${h * 0.26} Z`} fill={lite} opacity={0.6} />
      <Path d={`M${w * 0.3} ${h * 0.4} l${w * 0.12} ${h * 0.12} l-${w * 0.06} ${h * 0.14} M${w * 0.15} ${h * 0.7} l${w * 0.14} ${h * 0.08}`} stroke={shade} strokeWidth={3} fill="none" opacity={0.45} strokeLinecap="round" />
      <Path d={`M${w * 0.05} ${h * 0.1} l4 -10 l4 10 M${w * 0.25} ${h * 0.07} l4 -12 l4 12 M${w * 0.42} ${h * 0.05} l3 -9 l3 9`} stroke={acc} strokeWidth={3} fill="none" strokeLinecap="round" />
    </G>
  );
}

function reef({ w, h, base, acc, rng }: Paint) {
  const corals = Array.from({ length: 3 }, (_, i) => ({ x: w * (0.12 + i * 0.2 + rng() * 0.08), s: h * (0.3 + rng() * 0.25), c: i === 1 ? '#FFC93C' : acc }));
  return (
    <G>
      <Path d={`M-4 ${h * 0.35} C${w * 0.3} ${h * 0.25} ${w * 0.75} ${h * 0.5} ${w * 0.7} ${h * 0.8} C${w * 0.6} ${h} ${w * 0.2} ${h} -4 ${h} Z`} fill={base} />
      {corals.map(({ x, s, c }, i) => {
        const y = h * 0.62;
        return (
          <Path
            key={i}
            d={`M${x} ${y} L${x} ${y - s} M${x} ${y - s * 0.45} L${x + s * 0.35} ${y - s * 0.8} M${x} ${y - s * 0.3} L${x - s * 0.3} ${y - s * 0.62}`}
            stroke={c}
            strokeWidth={Math.max(5, s * 0.14)}
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
      <Path d={`M${w * 0.6} ${h * 0.75} q-8 -14 0 -28 q8 -14 0 -28`} stroke="#2CB38A" strokeWidth={5} fill="none" strokeLinecap="round" />
    </G>
  );
}

function tents({ w, h, base, acc }: Paint) {
  const tent = (cx: number, by: number, tw: number, th: number, key: string) => {
    const eave = by - th * 0.5;
    const top = by - th;
    const stripes = Array.from({ length: 4 }, (_, i) => {
      const x0 = cx - tw / 2 + (i * tw) / 4;
      return i % 2 ? '' : `M${x0} ${eave} L${cx} ${top} L${x0 + tw / 4} ${eave} Z M${x0} ${eave} h${tw / 4} V${by} h${-tw / 4} Z`;
    }).join(' ');
    return (
      <G key={key}>
        <Path d={`M${cx - tw / 2} ${by} L${cx - tw / 2} ${eave} L${cx} ${top} L${cx + tw / 2} ${eave} L${cx + tw / 2} ${by} Z`} fill={acc} />
        <Path d={stripes} fill={base} />
        <Path d={`M${cx - tw * 0.1} ${by} v${-th * 0.22} a${tw * 0.1} ${tw * 0.1} 0 0 1 ${tw * 0.2} 0 v${th * 0.22} Z`} fill="#3A1A2A" />
        <Path d={`M${cx} ${top} v-12`} stroke="#6B4423" strokeWidth={2} />
        <Path d={`M${cx} ${top - 12} l11 4 l-11 4 Z`} fill="#FFC93C" />
      </G>
    );
  };
  return (
    <G>
      {tent(w * 0.2, h * 0.62, w * 0.55, h * 0.55, 'a')}
      {tent(w * 0.5, h * 0.98, w * 0.42, h * 0.42, 'b')}
    </G>
  );
}

function lava({ w, h, base, lite, acc }: Paint) {
  const river = `M-4 ${h * 0.2} C${w * 0.3} ${h * 0.3} ${w * 0.15} ${h * 0.6} ${w * 0.45} ${h * 0.7}`;
  return (
    <G>
      <Path d={`M-4 0 C${w * 0.5} ${h * 0.05} ${w * 0.85} ${h * 0.4} ${w * 0.7} ${h * 0.75} C${w * 0.6} ${h} ${w * 0.2} ${h} -4 ${h} Z`} fill={base} />
      <Path d={`M-4 ${h * 0.05} C${w * 0.4} ${h * 0.1} ${w * 0.6} ${h * 0.3} ${w * 0.62} ${h * 0.45}`} stroke={lite} strokeWidth={4} fill="none" opacity={0.3} />
      <Path d={river} stroke={acc} strokeWidth={w * 0.16} fill="none" opacity={0.25} strokeLinecap="round" />
      <Path d={river} stroke={acc} strokeWidth={w * 0.07} fill="none" strokeLinecap="round" />
      <Ellipse cx={w * 0.47} cy={h * 0.72} rx={w * 0.12} ry={h * 0.06} fill={acc} />
      <Ellipse cx={w * 0.47} cy={h * 0.71} rx={w * 0.06} ry={h * 0.025} fill="#FFE27A" />
    </G>
  );
}

function ruins({ w, h, base, lite, shade }: Paint) {
  const col = (x: number, top: number, cw: number, key: string, broken = false) => (
    <G key={key}>
      <Rect x={x} y={top} width={cw} height={h * 0.92 - top} fill={lite} />
      <Path d={`M${x + cw * 0.33} ${top + 8} V${h * 0.9} M${x + cw * 0.66} ${top + 8} V${h * 0.9}`} stroke={shade} strokeWidth={2} opacity={0.35} />
      {broken ? (
        <Path d={`M${x - 2} ${top} l${cw * 0.3} -8 l${cw * 0.3} 6 l${cw * 0.44} -10 V${top + 4} H${x - 2} Z`} fill={lite} />
      ) : (
        <Rect x={x - cw * 0.2} y={top - 8} width={cw * 1.4} height={9} fill={base} />
      )}
      <Rect x={x - cw * 0.2} y={h * 0.9} width={cw * 1.4} height={8} fill={base} />
    </G>
  );
  return (
    <G>
      <Path d={`M-6 ${h * 0.95} V${h * 0.55} l${w * 0.12} -6 l${w * 0.1} 10 l${w * 0.14} -4 V${h * 0.95} Z`} fill={base} />
      <Path d={`M-6 ${h * 0.68} H${w * 0.36} M-6 ${h * 0.81} H${w * 0.36} M${w * 0.1} ${h * 0.55} V${h * 0.68} M${w * 0.22} ${h * 0.68} V${h * 0.81}`} stroke={shade} strokeWidth={2} opacity={0.4} />
      {col(w * 0.42, h * 0.18, w * 0.12, 'a')}
      {col(w * 0.62, h * 0.4, w * 0.12, 'b', true)}
      <Ellipse cx={w * 0.2} cy={h * 0.97} rx={w * 0.1} ry={5} fill={lite} />
    </G>
  );
}

function clouds({ w, h, base, acc }: Paint) {
  return (
    <G>
      <Ellipse cx={w * 0.25} cy={h * 0.74} rx={w * 0.6} ry={h * 0.16} fill={acc} opacity={0.6} />
      <Circle cx={w * 0.05} cy={h * 0.5} r={h * 0.3} fill={base} />
      <Circle cx={w * 0.35} cy={h * 0.45} r={h * 0.24} fill={base} />
      <Circle cx={w * 0.58} cy={h * 0.6} r={h * 0.16} fill={base} />
      <Rect x={-w * 0.2} y={h * 0.5} width={w * 0.9} height={h * 0.26} rx={h * 0.13} fill={base} />
      <Circle cx={w * 0.3} cy={h * 0.38} r={h * 0.08} fill="#FFFFFF" opacity={0.7} />
    </G>
  );
}

function crystals({ w, h, base, lite, rng }: Paint) {
  const list = Array.from({ length: 4 }, (_, i) => ({ x: w * (0.05 + i * 0.17 + rng() * 0.06), ch: h * (0.4 + rng() * 0.5), a: -22 + rng() * 44, i })).sort((a, b) => b.ch - a.ch);
  return (
    <G>
      <Ellipse cx={w * 0.3} cy={h * 0.95} rx={w * 0.5} ry={h * 0.07} fill={lite} opacity={0.6} />
      {list.map(({ x, ch, a, i }) => {
        const cw = ch * 0.3;
        return (
          <G key={i} transform={`translate(${x} ${h * 0.95}) rotate(${a})`}>
            <Path d={`M${-cw / 2} 0 L${-cw / 2} ${-ch * 0.78} L0 ${-ch} L${cw / 2} ${-ch * 0.78} L${cw / 2} 0 Z`} fill={base} />
            <Path d={`M0 ${-ch} L${cw / 2} ${-ch * 0.78} L${cw / 2} 0 L0 0 Z`} fill={lite} opacity={0.55} />
          </G>
        );
      })}
    </G>
  );
}

function flares({ w, h, base, acc }: Paint) {
  const cy = h / 2;
  return (
    <G>
      <Circle cx={0} cy={cy} r={w * 0.9} fill={acc} opacity={0.14} />
      <Circle cx={0} cy={cy} r={w * 0.66} fill={base} opacity={0.5} />
      <Circle cx={0} cy={cy} r={w * 0.42} fill={acc} opacity={0.85} />
      <Circle cx={0} cy={cy} r={w * 0.24} fill="#FFF3C4" />
      {[-0.32, 0, 0.32].map((k) => (
        <Path
          key={k}
          d={`M${w * 0.4} ${cy + h * k - 10} Q${w * 0.72} ${cy + h * k} ${w * 0.4} ${cy + h * k + 10} Z`}
          fill={acc}
        />
      ))}
    </G>
  );
}

const TERRAIN: Record<Terrain, (p: Paint) => ReactNode> = {
  hills,
  sea,
  forest,
  skyline,
  mountains,
  dunes,
  jungle,
  curtain,
  space,
  castle,
  island,
  cliffs,
  reef,
  tents,
  lava,
  ruins,
  clouds,
  crystals,
  flares,
};

/** Ground colours of one world, derived from its palette. */
export function lookOf(world: World) {
  const { bg, dark } = world;
  return {
    mark: mix(bg, dark ? '#FFFFFF' : '#000000', dark ? 0.28 : 0.12),
    patchLight: mix(bg, '#FFFFFF', dark ? 0.08 : 0.3),
    patchDark: mix(bg, '#000000', dark ? 0.18 : 0.06),
    roadEdge: mix(bg, '#000000', dark ? 0.35 : 0.12),
    roadFill: mix(bg, '#FFFFFF', dark ? 0.16 : 0.55),
  };
}

function LandView({ land, world }: { land: Land; world: World }) {
  const { near, accent, terrain } = world.scene;
  const base = land.far ? mix(near, world.bg, 0.45) : near;
  const paint: Paint = {
    w: land.w,
    h: land.h,
    base,
    lite: mix(base, '#FFFFFF', 0.3),
    shade: mix(base, '#000000', 0.25),
    acc: land.far ? mix(accent, world.bg, 0.4) : accent,
    rng: mulberry32(land.seed),
  };
  const t = land.side === 1 ? `translate(${land.x} ${land.y})` : `translate(${land.x + land.w} ${land.y}) scale(-1 1)`;
  return <G transform={t}>{TERRAIN[terrain](paint)}</G>;
}

/** One horizontal strip of the painted map, `k` counted from the top. */
export function SceneStrip({
  scene,
  k,
  worlds,
  full,
  avoid,
}: {
  scene: MapScene;
  k: number;
  worlds: World[];
  full: number;
  /** A rect kept free of small drawings (Popi and the "your turn" bubble). */
  avoid?: { x: number; y: number; w: number; h: number };
}) {
  const top = k * STRIP;
  const list = scene.strips[k] ?? [];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top, width: full, height: STRIP }}>
      <Svg width={full} height={STRIP} viewBox={`0 ${top} ${full} ${STRIP}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Defs>
          {list.map((i) => (
            <ClipPath key={i} id={`sec-${k}-${i}`}>
              <Rect x={0} y={scene.sections[i].top} width={full} height={scene.sections[i].bottom - scene.sections[i].top} />
            </ClipPath>
          ))}
        </Defs>
        {list.map((i) => {
          const sec = scene.sections[i];
          const world = worlds[sec.tier];
          const look = lookOf(world);
          const near = (y: number, h: number) => y < top + STRIP && y + h > top;
          return (
            <G key={i} clipPath={`url(#sec-${k}-${i})`}>
              {sec.patches
                .filter((q) => near(q.y - q.ry, q.ry * 2))
                .map((q, n) => (
                  <Ellipse key={`p${n}`} cx={q.x} cy={q.y} rx={q.rx} ry={q.ry} fill={q.light ? look.patchLight : look.patchDark} opacity={0.55} />
                ))}
              {sec.marks[k] ? <Path d={sec.marks[k]} stroke={look.mark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
              {sec.lands
                .filter((l) => near(l.y - 30, l.h + 60))
                .map((l, n) => (
                  <LandView key={`l${n}`} land={l} world={world} />
                ))}
              <Path d={scene.road} stroke={look.roadEdge} strokeWidth={34} strokeLinecap="round" fill="none" opacity={0.5} />
              <Path d={scene.road} stroke={look.roadFill} strokeWidth={24} strokeLinecap="round" fill="none" />
              {sec.props
                .filter((q) => near(q.y, q.size) && !(avoid && q.x + q.size > avoid.x && q.x < avoid.x + avoid.w && q.y + q.size > avoid.y && q.y < avoid.y + avoid.h))
                .map((q, n) => (
                  <G key={`d${n}`} transform={`translate(${q.x} ${q.y}) scale(${q.size / 48})`}>
                    <Ellipse cx={24} cy={46} rx={17} ry={4} fill="#000000" opacity={0.12} />
                    <DecoShapes kind={world.decos[q.deco] as Deco} />
                  </G>
                ))}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
