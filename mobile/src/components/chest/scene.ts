/**
 * The chest on stage and its whole show: it drops in and bounces, floats while it waits, takes
 * three knocks that get stronger (the lock heats up, light leaks out), then bursts open: the lid
 * flies back, beams of light rise, real 3D coins jump out and sparkles explode.
 * Pure three.js, driven by update(dt): the same code runs in expo-gl and in a browser.
 */
import * as THREE from 'three';

import type { ChestKind } from '@/game/chests';

import { buildChest, CHEST_SIZE, spotTexture, type Chest } from './model';

export type ChestPhase = 'appear' | 'idle' | 'charge' | 'burst' | 'open';

const ease = {
  outCubic: (x: number) => 1 - Math.pow(1 - x, 3),
  inCubic: (x: number) => x * x * x,
  outBack: (x: number) => {
    const c1 = 2.2;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },
  outBounce: (x: number) => {
    const n = 7.5625;
    const d = 2.75;
    if (x < 1 / d) return n * x * x;
    if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
    if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
    return n * (x -= 2.625 / d) * x + 0.984375;
  },
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** When each knock lands during the charge (seconds), and when the lid bursts open. */
export const KNOCKS = [0.25, 0.75, 1.15];
export const BURST_AT = 1.55;
const APPEAR = 0.8;
const COINS = 36;
const SPARKS = 90;
const BASE_YAW = -0.42;

export class ChestScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  phase: ChestPhase = 'appear';
  /** Called on every knock (0, 1, 2) and when the lid bursts: sounds and vibrations. */
  onKnock?: (i: number) => void;
  onBurst?: () => void;

  private chest: Chest;
  private kind: ChestKind;
  private t = 0;
  private phaseT = 0;
  private knocked = 0;
  private stillMotion = false;
  private shadow: THREE.Mesh;
  private halo: THREE.Mesh;
  private haloMat: THREE.MeshBasicMaterial;
  private coins: THREE.InstancedMesh;
  private coinState: { p: THREE.Vector3; v: THREE.Vector3; r: THREE.Euler; w: THREE.Vector3 }[] = [];
  private sparks: THREE.Points;
  private sparkPos: Float32Array;
  private sparkVel: Float32Array;
  private sparkMat: THREE.PointsMaterial;
  private keep: { dispose: () => void }[] = [];
  private dummy = new THREE.Object3D();

  constructor(kind: ChestKind, opts: { reduceMotion?: boolean } = {}) {
    this.kind = kind;
    this.stillMotion = !!opts.reduceMotion;
    const s = this.scene;

    // Light: warm fill, sky/ground, a key light and a coloured rim from behind.
    s.add(new THREE.AmbientLight('#fff4e0', 0.5));
    s.add(new THREE.HemisphereLight('#fff1d6', '#2a1f3a', 0.75));
    const key = new THREE.DirectionalLight('#ffffff', 1.7);
    key.position.set(2.6, 4.2, 4.5);
    s.add(key);
    const rim = new THREE.DirectionalLight('#ffffff', 1.2);
    rim.position.set(-3.2, 2.2, -3.4);
    rim.name = 'rim';
    s.add(rim);
    // Small lights that make the metal shine (highlights on the bands and the lock).
    const shine = new THREE.PointLight('#ffffff', 2.4, 9, 1.4);
    shine.position.set(-1.6, 2.6, 2.6);
    s.add(shine);
    const shine2 = new THREE.PointLight('#fff2d6', 1.6, 9, 1.4);
    shine2.position.set(2.2, 1.2, 2.2);
    s.add(shine2);

    // Soft shadow on the ground and a halo of the chest's colour.
    const shadowTex = spotTexture('#0b0614', 1.6);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.75, depthWrite: false });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.9), shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.002;
    s.add(this.shadow);
    this.haloMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
    this.halo = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), this.haloMat);
    this.halo.rotation.x = -Math.PI / 2;
    this.halo.position.y = 0.001;
    s.add(this.halo);
    this.keep.push(shadowTex, shadowMat, this.shadow.geometry, this.haloMat, this.halo.geometry);

    // Coins that jump out (instanced: one draw for all of them).
    const coinGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.028, 22);
    const coinMat = new THREE.MeshPhongMaterial({ color: '#ffc93c', specular: new THREE.Color('#fff6c8'), shininess: 90, emissive: new THREE.Color('#6a4400') });
    this.coins = new THREE.InstancedMesh(coinGeo, coinMat, COINS);
    this.coins.visible = false;
    s.add(this.coins);
    this.keep.push(coinGeo, coinMat);
    for (let i = 0; i < COINS; i++) this.coinState.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3() });

    // Sparkles: drifting up while the chest waits, exploding when it opens.
    this.sparkPos = new Float32Array(SPARKS * 3);
    this.sparkVel = new Float32Array(SPARKS * 3);
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPos, 3));
    const sparkTex = spotTexture('#ffffff', 2.4);
    this.sparkMat = new THREE.PointsMaterial({ map: sparkTex, size: 0.09, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    this.sparks = new THREE.Points(sparkGeo, this.sparkMat);
    s.add(this.sparks);
    this.keep.push(sparkGeo, sparkTex, this.sparkMat);

    this.chest = buildChest(kind);
    s.add(this.chest.root);
    this.dressFor(kind);
    this.resetSparks();
    this.camera.position.set(0, 1.85, 5.6);
    this.camera.lookAt(0, 0.6, 0);
  }

  /** A new chest of `kind` drops in (after an opening, or another kind chosen). */
  setKind(kind: ChestKind) {
    this.scene.remove(this.chest.root);
    this.chest.dispose();
    this.kind = kind;
    this.chest = buildChest(kind);
    this.scene.add(this.chest.root);
    this.dressFor(kind);
    this.coins.visible = false;
    this.knocked = 0;
    this.go('appear');
    this.resetSparks();
  }

  get currentKind() {
    return this.kind;
  }

  /** Starts the opening: three knocks, then the burst. */
  open() {
    if (this.phase === 'idle' || this.phase === 'appear') {
      this.knocked = 0;
      this.go('charge');
    }
  }

  setSize(width: number, height: number) {
    this.camera.aspect = width / height;
    // Narrow screens: step back so the beams and the coins stay in the picture.
    this.camera.fov = width / height < 0.7 ? 34 : 28;
    this.camera.updateProjectionMatrix();
  }

  private dressFor(kind: ChestKind) {
    const look = this.chest.look;
    (this.scene.getObjectByName('rim') as THREE.DirectionalLight).color.set(look.rim);
    this.haloMat.map?.dispose();
    this.haloMat.map = spotTexture(look.glow, 2.2);
    this.haloMat.needsUpdate = true;
    this.sparkMat.color.set(kind === 'legend' ? '#e9dcff' : '#fff1c4');
  }

  private go(phase: ChestPhase) {
    this.phase = phase;
    this.phaseT = 0;
  }

  private resetSparks() {
    for (let i = 0; i < SPARKS; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.9 + Math.random() * 1.2;
      this.sparkPos[i * 3] = Math.cos(a) * r;
      this.sparkPos[i * 3 + 1] = Math.random() * 2.4;
      this.sparkPos[i * 3 + 2] = Math.sin(a) * r * 0.6;
      this.sparkVel[i * 3] = 0;
      this.sparkVel[i * 3 + 1] = 0.15 + Math.random() * 0.25;
      this.sparkVel[i * 3 + 2] = 0;
    }
  }

  private burstSparks() {
    const { H } = CHEST_SIZE;
    for (let i = 0; i < SPARKS; i++) {
      const a = Math.random() * Math.PI * 2;
      const up = 0.6 + Math.random() * 0.9;
      const speed = 1.6 + Math.random() * 3.2;
      this.sparkPos[i * 3] = (Math.random() - 0.5) * 0.8;
      this.sparkPos[i * 3 + 1] = H + 0.1;
      this.sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      this.sparkVel[i * 3] = Math.cos(a) * speed * (1 - up * 0.4);
      this.sparkVel[i * 3 + 1] = up * speed;
      this.sparkVel[i * 3 + 2] = Math.sin(a) * speed * 0.5;
    }
  }

  private burstCoins() {
    const { H } = CHEST_SIZE;
    this.coins.visible = true;
    for (const c of this.coinState) {
      const a = Math.random() * Math.PI * 2;
      const out = 0.9 + Math.random() * 1.8;
      c.p.set((Math.random() - 0.5) * 0.7, H + 0.05, (Math.random() - 0.5) * 0.4);
      c.v.set(Math.cos(a) * out, 3.6 + Math.random() * 2.6, Math.sin(a) * out * 0.7 + 0.6);
      c.r.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      c.w.set((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 18);
    }
  }

  update(dt: number) {
    dt = Math.min(dt, 1 / 20);
    this.t += dt;
    this.phaseT += dt;
    const { root, lid, lockMat, glowMat, light, beams, beamMats, gems } = this.chest;
    const t = this.t;
    const pt = this.phaseT;
    const still = this.stillMotion;

    let y = 0;
    let yaw = BASE_YAW + (still ? 0 : Math.sin(t * 0.5) * 0.1);
    let tilt = 0;
    let squash = 1;
    let lidAngle = 0;
    let heat = 0;
    let camZ = 5.6;

    if (this.phase === 'appear') {
      const k = clamp01(pt / APPEAR);
      y = still ? 0 : (1 - ease.outBounce(k)) * 2.6;
      // Squash on landing.
      const land = clamp01((pt - APPEAR * 0.36) / 0.25);
      squash = still ? 1 : 1 - Math.sin(land * Math.PI) * 0.12;
      if (pt >= APPEAR) this.go('idle');
    } else if (this.phase === 'idle') {
      y = still ? 0 : 0.035 + Math.sin(t * 1.7) * 0.035;
      heat = 0.15 + Math.sin(t * 2.4) * 0.1;
    } else if (this.phase === 'charge') {
      // Three knocks, each one stronger: a hop, a twist, the lid rattles, the lock heats up.
      const n = KNOCKS.filter((k) => pt >= k).length;
      if (n > this.knocked) {
        this.knocked = n;
        this.onKnock?.(n - 1);
      }
      for (let i = 0; i < KNOCKS.length; i++) {
        const since = pt - KNOCKS[i];
        if (since < 0 || since > 0.35) continue;
        const power = 0.5 + i * 0.35;
        const k = Math.sin(clamp01(since / 0.35) * Math.PI);
        y += k * 0.14 * power;
        tilt += Math.sin(since * 38) * (1 - since / 0.35) * 0.09 * power * (i % 2 ? -1 : 1);
        lidAngle -= k * 0.12 * power;
        squash = 1 + k * 0.05 * power;
      }
      yaw = BASE_YAW + (-0.2 - BASE_YAW) * ease.outCubic(clamp01(pt / BURST_AT));
      heat = 0.3 + (pt / BURST_AT) * 1.2;
      glowMat.opacity = this.knocked * 0.12;
      camZ = 5.6 - ease.outCubic(clamp01(pt / BURST_AT)) * 0.9;
      if (pt >= BURST_AT) {
        this.go('burst');
        beams.visible = true;
        this.burstCoins();
        this.burstSparks();
        this.onBurst?.();
      }
    }
    if (this.phase === 'burst' || this.phase === 'open') {
      const k = this.phase === 'burst' ? clamp01(pt / 0.55) : 1;
      yaw = -0.2 + (this.phase === 'open' && !still ? Math.sin(t * 0.45) * 0.08 : 0);
      lidAngle = -1.95 * ease.outBack(k);
      y = this.phase === 'burst' ? Math.sin(k * Math.PI) * 0.18 : still ? 0 : Math.sin(t * 1.5) * 0.02;
      squash = this.phase === 'burst' ? 1 - Math.sin(clamp01(pt / 0.18) * Math.PI) * 0.1 : 1;
      const pulse = this.phase === 'open' ? 0.85 + Math.sin(t * 3) * 0.15 : 1;
      glowMat.opacity = Math.min(1, k * 1.4) * pulse;
      light.intensity = (this.phase === 'burst' ? 9 - k * 3 : 6) * pulse;
      heat = 1.4;
      beams.rotation.y += dt * 0.35;
      const beamK = this.phase === 'burst' ? ease.outCubic(k) : 1;
      beams.scale.set(beamK, beamK * (0.9 + Math.sin(t * 2) * 0.06), beamK);
      beamMats.forEach((m, i) => (m.opacity = (0.32 + Math.sin(t * 2.2 + i) * 0.08) * beamK));
      camZ = this.phase === 'burst' ? 4.7 + ease.outCubic(k) * 0.5 : 5.2;
      if (this.phase === 'burst' && pt >= 0.55) this.go('open');
    } else {
      light.intensity = this.phase === 'charge' ? this.knocked * 0.8 : 0;
      beams.visible = false;
      if (this.phase !== 'charge') glowMat.opacity = 0;
    }

    root.position.y = y;
    root.rotation.set(0, yaw, tilt);
    root.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
    lid.rotation.x = lidAngle;
    lockMat.emissive.set(this.chest.look.glow).multiplyScalar(Math.max(0, heat) * 0.45);
    gems.forEach((g, i) => {
      g.rotation.y = t * (1.2 + i * 0.2);
      g.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.08);
    });

    // Shadow and halo follow the height of the chest.
    const lift = clamp01(y / 2.6);
    this.shadow.scale.setScalar(1 - lift * 0.5);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - lift * 0.7);
    this.haloMat.opacity = (this.phase === 'open' || this.phase === 'burst' ? 0.75 : 0.32) + Math.sin(t * 2) * 0.05;

    // Coins: thrown, spinning, falling under gravity, gone below the floor.
    if (this.coins.visible) {
      let alive = 0;
      this.coinState.forEach((c, i) => {
        c.v.y -= 9.5 * dt;
        c.p.addScaledVector(c.v, dt);
        c.r.x += c.w.x * dt;
        c.r.y += c.w.y * dt;
        c.r.z += c.w.z * dt;
        if (c.p.y > -1.5) alive++;
        this.dummy.position.copy(c.p);
        this.dummy.rotation.copy(c.r);
        this.dummy.updateMatrix();
        this.coins.setMatrixAt(i, this.dummy.matrix);
      });
      this.coins.instanceMatrix.needsUpdate = true;
      if (!alive) this.coins.visible = false;
    }

    // Sparkles.
    const exploding = this.phase === 'burst' || (this.phase === 'open' && pt < 2.5);
    for (let i = 0; i < SPARKS; i++) {
      const j = i * 3;
      if (exploding) {
        this.sparkVel[j + 1] -= 2.2 * dt;
        this.sparkVel[j] *= 0.985;
        this.sparkVel[j + 2] *= 0.985;
      }
      this.sparkPos[j] += this.sparkVel[j] * dt;
      this.sparkPos[j + 1] += this.sparkVel[j + 1] * dt;
      this.sparkPos[j + 2] += this.sparkVel[j + 2] * dt;
      if (!exploding && this.sparkPos[j + 1] > 2.6) this.sparkPos[j + 1] = 0;
    }
    if (this.phase === 'open' && pt >= 2.5 && pt - dt < 2.5) this.resetSparks();
    (this.sparks.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.sparkMat.size = exploding ? 0.12 : 0.07 + Math.sin(t * 4) * 0.01;
    this.sparkMat.opacity = exploding ? 1 : 0.7;

    // Camera: a slow drift, closer during the knocks.
    const drift = still ? 0 : Math.sin(t * 0.3) * 0.18;
    // Once open, the camera looks a little higher: the lid, the beams, the coins in the air.
    const up = this.phase === 'burst' ? ease.outCubic(clamp01(pt / 0.55)) * 0.3 : this.phase === 'open' ? 0.3 : 0;
    this.camera.position.set(drift, 1.85 - (5.6 - camZ) * 0.25 + up * 0.4, camZ);
    this.camera.lookAt(0, 0.62 + up, 0);
  }

  render(renderer: THREE.WebGLRenderer) {
    renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.chest.dispose();
    this.haloMat.map?.dispose();
    this.keep.forEach((d) => d.dispose());
  }
}
