import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useEffect, useRef, useState } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import * as THREE from 'three';

import type { ChestKind } from '@/game/chests';

import { ChestFallback } from './fallback';
import { ChestScene, type ChestPhase } from './scene';

interface Props {
  kind: ChestKind;
  /** Increase it to start the opening (knocks, then burst). */
  openKey: number;
  reduceMotion?: boolean;
  onKnock?: (i: number) => void;
  onBurst?: () => void;
  onPhase?: (phase: ChestPhase) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * A 3D chest (three.js in an expo-gl view). If the device cannot draw it, the same show plays
 * with pictures of the chests instead, so opening a chest always works.
 */
export function ChestStage({ kind, openKey, reduceMotion, onKnock, onBurst, onPhase, style }: Props) {
  const [failed, setFailed] = useState(false);
  const scene = useRef<ChestScene | null>(null);
  const cleanup = useRef<(() => void) | null>(null);
  // The latest callbacks, read by the render loop.
  const cbs = useRef({ onKnock, onBurst, onPhase });
  useEffect(() => {
    cbs.current = { onKnock, onBurst, onPhase };
  });
  const firstKind = useRef(kind);

  useEffect(() => {
    if (scene.current && scene.current.currentKind !== kind) scene.current.setKind(kind);
  }, [kind]);
  useEffect(() => {
    if (openKey > 0) scene.current?.open();
  }, [openKey]);
  useEffect(() => () => cleanup.current?.(), []);

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    try {
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      const ctx = gl as unknown as Record<string, unknown>;
      if (Platform.OS !== 'web') {
        // expo-gl only knows the flip-Y setting; three.js sets others it would complain about.
        const pixelStorei = (gl.pixelStorei as (p: number, v: number) => void).bind(gl);
        ctx.pixelStorei = (p: number, v: number) => (p === gl.UNPACK_FLIP_Y_WEBGL ? pixelStorei(p, v) : undefined);
        if (typeof ctx.getContextAttributes !== 'function') {
          ctx.getContextAttributes = () => ({ alpha: true, antialias: false, depth: true, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false });
        }
      }
      // three.js wants a canvas; the view's drawing buffer is what it really draws into.
      const canvas = { width: w, height: h, clientWidth: w, clientHeight: h, style: {}, addEventListener: () => {}, removeEventListener: () => {} };
      const renderer = new THREE.WebGLRenderer({ canvas: canvas as unknown as HTMLCanvasElement, context: gl as unknown as WebGLRenderingContext, antialias: true, alpha: true });
      renderer.setPixelRatio(1);
      renderer.setSize(w, h, false);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const s = new ChestScene(firstKind.current, { reduceMotion });
      s.setSize(w, h);
      s.onKnock = (i) => cbs.current.onKnock?.(i);
      s.onBurst = () => cbs.current.onBurst?.();
      scene.current = s;
      if (s.currentKind !== kind) s.setKind(kind);

      let last = -1;
      let phase: ChestPhase | null = null;
      let frame = 0;
      const loop = (now: number) => {
        frame = requestAnimationFrame(loop);
        const dt = last < 0 ? 1 / 60 : (now - last) / 1000;
        last = now;
        s.update(dt);
        if (s.phase !== phase) {
          phase = s.phase;
          cbs.current.onPhase?.(phase);
        }
        s.render(renderer);
        gl.endFrameEXP?.();
      };
      frame = requestAnimationFrame(loop);
      cleanup.current = () => {
        cancelAnimationFrame(frame);
        s.dispose();
        renderer.dispose();
        scene.current = null;
      };
    } catch (e) {
      console.warn('3D chest unavailable', e);
      setFailed(true);
    }
  };

  if (failed) return <ChestFallback kind={kind} openKey={openKey} reduceMotion={reduceMotion} onKnock={onKnock} onBurst={onBurst} onPhase={onPhase} style={style} />;
  return (
    <View style={style}>
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
    </View>
  );
}
