/**
 * The 3D chests (three.js, no image files): built from shapes, lit, and animated by
 * ChestScene. Works the same in expo-gl (iPhone, iPad) and in a browser (WebGL).
 * Nothing here needs render targets, shadow maps or compressed textures (not all of
 * expo-gl supports them): shadows and glows are textures drawn by code.
 */
import * as THREE from 'three';

import type { ChestKind } from '@/game/chests';

interface Look {
  wood: string;
  woodDark: string;
  metal: string;
  metalShine: string;
  gem?: string;
  /** Colour of the light coming out of the chest. */
  glow: string;
  rim: string;
}

const LOOKS: Record<ChestKind, Look> = {
  wood: { wood: '#b9773d', woodDark: '#70421e', metal: '#4f535c', metalShine: '#ffffff', glow: '#ffd27a', rim: '#ffcf8a' },
  gold: { wood: '#a83a35', woodDark: '#5e1a1a', metal: '#d8981c', metalShine: '#fff3b8', glow: '#ffe28a', rim: '#ffd35a' },
  legend: { wood: '#5a43c9', woodDark: '#2b1b80', metal: '#e0a92a', metalShine: '#fff8d8', gem: '#5ff3ff', glow: '#c9a2ff', rim: '#a58aff' },
};

// Body size (scene units).
const W = 1.6;
const H = 0.82;
const D = 1.04;
const R = D / 2;

const rgb = (hex: string) => new THREE.Color(hex);

/** A small seeded random, so every chest of a kind looks exactly the same. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dataTexture(size: number, paint: (x: number, y: number) => [number, number, number, number]) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = paint(x, y);
      const i = (y * size + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

/** Planks with grain and dark joints. */
function woodTexture(look: Look, planks: number) {
  const a = rgb(look.wood);
  const b = rgb(look.woodDark);
  const rnd = seeded(7);
  const offsets = Array.from({ length: planks }, () => rnd() * 40);
  const tex = dataTexture(128, (x, y) => {
    const plank = Math.floor((x / 128) * planks);
    const inPlank = ((x / 128) * planks) % 1;
    const joint = inPlank < 0.05 || inPlank > 0.95;
    const grain = 0.5 + 0.5 * Math.sin(y * 0.16 + Math.sin(x * 0.21 + offsets[plank]) * 1.3 + offsets[plank]);
    const knot = Math.max(0, 1 - Math.hypot(x - ((offsets[plank] * 3) % 128), y - ((offsets[plank] * 7) % 128)) / 6);
    let k = 0.25 + grain * 0.45 + knot * 0.5 + (plank % 2) * 0.08;
    if (joint) k = 1.05;
    const c = a.clone().lerp(b, Math.min(1, k));
    return [c.r * 255, c.g * 255, c.b * 255, 255];
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A soft round spot: alpha falls off from the centre. */
function spotTexture(color: string, power = 2) {
  const c = rgb(color);
  return dataTexture(64, (x, y) => {
    const d = Math.min(1, Math.hypot(x - 31.5, y - 31.5) / 32);
    return [c.r * 255, c.g * 255, c.b * 255, Math.pow(1 - d, power) * 255];
  });
}

/** A light beam: bright at the base, fading towards the top and the sides. */
function beamTexture(color: string) {
  const c = rgb(color);
  return dataTexture(64, (x, y) => {
    const side = 1 - Math.abs(x - 31.5) / 32;
    const up = y / 63;
    return [c.r * 255, c.g * 255, c.b * 255, Math.pow(side, 2.2) * Math.pow(up, 1.6) * 255];
  });
}

export interface Chest {
  root: THREE.Group;
  lid: THREE.Group;
  lock: THREE.Group;
  lockMat: THREE.MeshPhongMaterial;
  glow: THREE.Mesh;
  glowMat: THREE.MeshBasicMaterial;
  light: THREE.PointLight;
  beams: THREE.Group;
  beamMats: THREE.MeshBasicMaterial[];
  gems: THREE.Mesh[];
  look: Look;
  dispose: () => void;
}

/** Builds one chest, lid closed, base at y = 0, centred. */
export function buildChest(kind: ChestKind): Chest {
  const look = LOOKS[kind];
  const disposables: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(x: T) => {
    disposables.push(x);
    return x;
  };

  const woodTex = keep(woodTexture(look, 5));
  const woodMat = keep(new THREE.MeshPhongMaterial({ map: woodTex, shininess: 14, specular: new THREE.Color('#2a1a10') }));
  const lidTex = keep(woodTexture(look, 7));
  lidTex.repeat.set(1, 1);
  const lidMat = keep(new THREE.MeshPhongMaterial({ map: lidTex, shininess: 14, specular: new THREE.Color('#2a1a10'), side: THREE.DoubleSide }));
  const metalMat = keep(
    new THREE.MeshPhongMaterial({ color: look.metal, specular: new THREE.Color(look.metalShine), shininess: kind === 'wood' ? 55 : 120, emissive: rgb(look.metal).multiplyScalar(kind === 'wood' ? 0.08 : 0.22) }),
  );
  const darkMat = keep(new THREE.MeshPhongMaterial({ color: '#15101c', shininess: 5 }));
  const innerMat = keep(new THREE.MeshPhongMaterial({ color: rgb(look.woodDark).multiplyScalar(0.55), shininess: 2, side: THREE.BackSide }));

  const root = new THREE.Group();
  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], x: number, y: number, z: number) => {
    keep(geo);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  // ── Body: wooden box, open at the top, with a dark inside ──
  // (BoxGeometry faces: +x, -x, +y, -y, +z, -z; the top one is left out.)
  const hidden = keep(new THREE.MeshBasicMaterial({ visible: false }));
  const box = (mat: THREE.Material) => [mat, mat, hidden, mat, mat, mat];
  add(root, new THREE.BoxGeometry(W, H, D), box(woodMat), 0, H / 2, 0);
  add(root, new THREE.BoxGeometry(W - 0.1, H - 0.06, D - 0.1), box(innerMat), 0, H / 2 + 0.04, 0);
  // Metal frame: bottom and top rims, corner guards, two straps.
  add(root, new THREE.BoxGeometry(W + 0.05, 0.1, D + 0.05), metalMat, 0, 0.05, 0);
  add(root, new THREE.BoxGeometry(W + 0.05, 0.08, D + 0.05), metalMat, 0, H - 0.04, 0);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) add(root, new THREE.BoxGeometry(0.13, H, 0.13), metalMat, sx * (W / 2 - 0.045), H / 2, sz * (D / 2 - 0.045));
  for (const sx of [-1, 1]) {
    add(root, new THREE.BoxGeometry(0.13, H, D + 0.035), metalMat, sx * 0.45, H / 2, 0);
    // Rivets on the front straps.
    for (const y of [0.2, H / 2, H - 0.2]) add(root, new THREE.SphereGeometry(0.028, 10, 8), metalMat, sx * 0.45, y, D / 2 + 0.02);
  }
  // Feet.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(root, new THREE.BoxGeometry(0.16, 0.06, 0.16), metalMat, sx * (W / 2 - 0.06), -0.03, sz * (D / 2 - 0.06));

  // ── Treasure inside: a heap of coins, seen when the lid opens ──
  const coinGeo = keep(new THREE.CylinderGeometry(0.08, 0.08, 0.025, 18));
  const coinMat = keep(new THREE.MeshPhongMaterial({ color: '#ffc93c', specular: new THREE.Color('#fff6c8'), shininess: 80, emissive: new THREE.Color('#5a3a00') }));
  const rnd = seeded(kind === 'wood' ? 3 : kind === 'gold' ? 5 : 9);
  for (let i = 0; i < (kind === 'wood' ? 26 : 42); i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * 0.62;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r * 0.65;
    const y = H - 0.08 + (1 - r / 0.62) * 0.16 + rnd() * 0.03;
    const c = new THREE.Mesh(coinGeo, coinMat);
    c.position.set(x, y, z);
    c.rotation.set((rnd() - 0.5) * 0.9, rnd() * 3, (rnd() - 0.5) * 0.9);
    root.add(c);
  }

  // ── Light from the inside (off while closed) ──
  const glowMat = keep(new THREE.MeshBasicMaterial({ map: keep(spotTexture(look.glow, 1.4)), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  const glow = add(root, new THREE.PlaneGeometry(W * 1.5, D * 1.6), glowMat, 0, H + 0.02, 0);
  glow.rotation.x = -Math.PI / 2;
  const light = new THREE.PointLight(look.glow, 0, 6, 1.6);
  light.position.set(0, H + 0.35, 0.1);
  root.add(light);

  // ── Lid: half cylinder hinged on the back edge ──
  const lid = new THREE.Group();
  lid.position.set(0, H, -D / 2);
  root.add(lid);
  const half = (radius: number, length: number, open = false) => new THREE.CylinderGeometry(radius, radius, length, 40, 1, open, 0, Math.PI).rotateZ(Math.PI / 2);
  add(lid, half(R, W), lidMat, 0, 0, R);
  // The flat underside of the lid (seen when it is open).
  const underMat = keep(new THREE.MeshPhongMaterial({ map: woodTex, color: '#8a8a8a', shininess: 6 }));
  add(lid, new THREE.BoxGeometry(W - 0.02, 0.04, D - 0.02), underMat, 0, 0.02, R);
  // Metal bands over the lid: the two ends and the two straps.
  const bandMat = keep(metalMat.clone());
  bandMat.side = THREE.DoubleSide;
  for (const x of [-(W / 2 - 0.05), W / 2 - 0.05]) add(lid, half(R + 0.03, 0.11), bandMat, x, 0, R);
  for (const x of [-0.45, 0.45]) add(lid, half(R + 0.022, 0.13), bandMat, x, 0, R);
  // Front lip.
  add(lid, new THREE.BoxGeometry(W + 0.05, 0.07, 0.06), metalMat, 0, 0.02, D + 0.0);

  // ── Lock on the front: plate, keyhole, glows before opening ──
  const lockMat = keep(new THREE.MeshPhongMaterial({ color: look.metal, specular: new THREE.Color(look.metalShine), shininess: 100, emissive: new THREE.Color('#000000') }));
  const lock = new THREE.Group();
  lock.position.set(0, -0.07, D + 0.035);
  lid.add(lock);
  add(lock, new THREE.BoxGeometry(0.26, 0.3, 0.07), lockMat, 0, 0, 0);
  add(lock, new THREE.CylinderGeometry(0.035, 0.035, 0.08, 14).rotateX(Math.PI / 2), darkMat, 0, 0.03, 0.01);
  add(lock, new THREE.BoxGeometry(0.03, 0.08, 0.08), darkMat, 0, -0.03, 0.01);

  // ── Legendary chest: gems on the lid and the lock ──
  const gems: THREE.Mesh[] = [];
  if (look.gem) {
    const gemMat = keep(new THREE.MeshPhongMaterial({ color: look.gem, emissive: rgb(look.gem).multiplyScalar(0.55), specular: new THREE.Color('#ffffff'), shininess: 120, flatShading: true }));
    const big = add(lid, new THREE.OctahedronGeometry(0.11, 0), gemMat, 0, R + 0.03, R);
    big.scale.set(1, 0.7, 1);
    gems.push(big);
    for (const x of [-0.45, 0.45]) {
      const g = add(lid, new THREE.OctahedronGeometry(0.06, 0), gemMat, x, R + 0.04, R);
      gems.push(g);
    }
    const lockGem = add(lock, new THREE.OctahedronGeometry(0.05, 0), gemMat, 0, 0.09, 0.05);
    gems.push(lockGem);
    for (const sx of [-1, 1]) gems.push(add(root, new THREE.OctahedronGeometry(0.05, 0), gemMat, sx * 0.45, H / 2, D / 2 + 0.05));
  }

  // ── Beams of light (shown when the chest opens) ──
  const beams = new THREE.Group();
  beams.position.set(0, H + 0.02, 0);
  root.add(beams);
  const beamMats: THREE.MeshBasicMaterial[] = [];
  const beamTex = keep(beamTexture(look.glow));
  for (let i = 0; i < 7; i++) {
    const mat = keep(new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beamMats.push(mat);
    const plane = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.42 + (i % 3) * 0.12, 3.2)), mat);
    plane.position.y = 1.6;
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 7) * Math.PI;
    pivot.rotation.z = ((i % 2 ? 1 : -1) * (0.08 + (i % 3) * 0.1));
    pivot.add(plane);
    beams.add(pivot);
  }
  beams.visible = false;

  return {
    root,
    lid,
    lock,
    lockMat,
    glow,
    glowMat,
    light,
    beams,
    beamMats,
    gems,
    look,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}

export const CHEST_SIZE = { W, H, D, R };
export { LOOKS, spotTexture };
