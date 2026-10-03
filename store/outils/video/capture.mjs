// Films the real app (web build) for the App Store preview, frame by frame, with a virtual clock
// (clock.js): every animation is captured smoothly at 30 fps whatever the machine speed.
//
//   node store/outils/video/capture.mjs            (French, the clips of the storyboard)
//   APP_LANG=en node store/outils/video/capture.mjs (same clips in another language)
//
// Needs the web build served on BASE (see README.md). Output: WORK/<lang>/<clip>/00001.jpg… and
// WORK/<lang>/clips.json (frame count and sound events of each clip).
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(process.env.PLAYWRIGHT_FROM ?? '/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '../../..');
const BASE = process.env.BASE ?? 'http://localhost:8768';
const lang = process.env.APP_LANG ?? 'fr';
const WORK = path.join(process.env.WORK ?? '/tmp/pca-video', lang);
const ONLY = process.env.ONLY?.split(',');
const FPS = 30;
const STEP = 1000 / FPS;

const FUSE = { fr: 'Fusionner', en: 'Fuse', es: 'Fusionar', de: 'Fusionieren', ja: '合体', ko: '합치기', zh: '合成', it: 'Fondi', pt: 'Fundir', nl: 'Fuseren', pl: 'Połącz', tr: 'Birleştir', ru: 'Соединить' };
const SPIN = { fr: 'Lancer la roue', en: 'Spin the wheel', es: 'Girar la ruleta' };

// ─── The player of the video: same believable profile as the screenshots ───
const src = fs.readFileSync(path.join(root, 'mobile/src/game/levels.ts'), 'utf8');
const LEVELS = [...src.matchAll(/id: (\d+), cat: '(\w+)', d: (\d), sol: (\[.*?\]), name: (\{.*?\}) \}/g)].map((m) => ({
  id: +m[1],
  cat: m[2],
  d: +m[3],
  sol: JSON.parse(m[4]),
}));
const byId = (id) => LEVELS.find((l) => l.id === id);
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = dayKey(new Date());
const yesterday = dayKey(new Date(Date.now() - 86400000));
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function adventureIds(d) {
  const levels = LEVELS.filter((l) => l.d === d);
  const rng = mulberry32(1000 + d);
  const ids = [];
  for (let i = 0; i < levels.length; i += 20) {
    const out = levels.slice(i, i + 20);
    for (let k = out.length - 1; k > 0; k--) {
      const j = Math.floor(rng() * (k + 1));
      [out[k], out[j]] = [out[j], out[k]];
    }
    ids.push(...out.map((l) => l.id));
  }
  return ids;
}
const PASSED = 64;
const movies = LEVELS.filter((l) => l.cat === 'movie').slice(0, 20).map((l) => l.id);
const FOUND = [...new Set([...adventureIds(1).slice(0, PASSED), ...movies, ...LEVELS.filter((_, i) => i % 9 === 0).map((l) => l.id)])];
const STARS = Object.fromEntries(FOUND.map((id, i) => [id, i % 5 === 2 ? 2 : i % 7 === 3 ? 1 : 3]));
// Every trophy already won: no "trophy unlocked" toast over the shots.
const ACH = fs.readFileSync(path.join(root, 'mobile/src/game/achievements.ts'), 'utf8').match(/id: '[a-z_0-9]+'/g).map((s) => s.slice(5, -1));

const profile = (extra = {}) => ({
  lang,
  tutorialDone: true,
  name: 'Popi',
  avatar: '😎',
  coins: 2450,
  hints: 12,
  shields: 0,
  skips: 2,
  doubles: 2,
  sound: false,
  music: false,
  reduceMotion: false,
  best: { classic: 4210, chrono: 1860, hardcore: 950 },
  stats: { levels: 57, coinsEarned: 3100, daily: 4, spins: 3, hintsUsed: 6, fevers: 5, bestCombo: 9, bestTier: 3 },
  achievements: ACH,
  dailyLast: yesterday,
  dailyStreak: 4,
  dailyBestStreak: 4,
  lastRun: { ids: [36, 1, 6, 16, 24], score: 1450 },
  save: null,
  loginLast: today,
  loginDay: 3,
  found: FOUND,
  stars: STARS,
  adventure: { 1: PASSED, 2: 0, 3: 0 },
  ...extra,
});
// The level of the opening, then the one that starts Fever, then the next one.
const PLAY = [36, 1, 24, 7, 10, 11];
const playSave = (combo) => ({
  save: { mode: 'classic', difficulty: 1, ids: [5, 6, 14, ...PLAY], index: 3, lives: 4, score: 1840, combo, continued: false },
});

// ─── Recorder ───
const clock = fs.readFileSync(path.join(here, 'clock.js'), 'utf8');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 440, height: 902 }, deviceScaleFactor: 3 });
await ctx.addInitScript(clock);
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('pageerror', e.message));

const advance = (ms) => page.evaluate((v) => window.__advance(v), ms);
async function open(route, extra) {
  await page.goto(BASE);
  await page.evaluate((s) => localStorage.setItem('popcorn-profile', JSON.stringify({ state: s, version: 1 })), profile(extra));
  await page.goto(BASE + route);
  // Fonts and code load in real time; screens settle in virtual time.
  for (let i = 0; i < 16; i++) {
    await advance(250);
    await page.waitForTimeout(80);
  }
}

const clips = fs.existsSync(path.join(WORK, 'clips.json')) ? JSON.parse(fs.readFileSync(path.join(WORK, 'clips.json'), 'utf8')) : {};
let cur = null;
function start(name) {
  const dir = path.join(WORK, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  cur = { name, dir, frames: 0, events: [] };
}
async function frame() {
  await advance(STEP);
  cur.frames++;
  await page.screenshot({ path: path.join(cur.dir, `${String(cur.frames).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
}
const hold = async (sec) => {
  for (let i = 0, n = Math.round(sec * FPS); i < n; i++) await frame();
};
/** A sound of the app, at the current frame (+ `delay` seconds). */
const sound = (name, delay = 0) => cur.events.push({ t: +(cur.frames / FPS + delay).toFixed(3), sound: name });
function done() {
  clips[cur.name] = { frames: cur.frames, fps: FPS, events: cur.events };
  fs.writeFileSync(path.join(WORK, 'clips.json'), JSON.stringify(clips, null, 1));
  console.log(`${lang}/${cur.name}: ${cur.frames} frames`);
}
async function tap(emoji) {
  const t = page.locator(`[role="button"][aria-label="${emoji}"]:not([aria-disabled="true"])`).filter({ visible: true });
  await t.nth((await t.count()) - 1).click();
  sound('pop');
}
const fuse = () => page.getByText(FUSE[lang] ?? FUSE.en, { exact: false }).filter({ visible: true }).last().click();
/** The scrolling element of the screen (the biggest one). */
const findScroller = () =>
  page.evaluate(() => {
    const all = [...document.querySelectorAll('div')].filter((d) => d.scrollHeight - d.clientHeight > 40 && getComputedStyle(d).overflowY !== 'visible');
    all.sort((a, b) => b.scrollHeight - a.scrollHeight);
    window.__sc = all[0];
    return all[0] ? { top: all[0].scrollTop, max: all[0].scrollHeight - all[0].clientHeight } : null;
  });
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** Scrolls smoothly from `from` to `to` (pixels) in `sec` seconds, recording every frame. */
async function scroll(from, to, sec, curve = ease) {
  const n = Math.round(sec * FPS);
  for (let i = 1; i <= n; i++) {
    const y = from + (to - from) * curve(i / n);
    await page.evaluate((v) => {
      window.__sc.scrollTop = v;
      window.__sc.dispatchEvent(new Event('scroll'));
    }, y);
    await frame();
  }
}
const want = (name) => !ONLY || ONLY.includes(name);

// ─── 1. Gameplay: Le Roi Lion (combo 3 → 4), Titanic (→ Fever), then the next level ───
if (want('play')) {
  await open('/jeu?resume=1', playSave(3));
  start('play');
  await hold(0.7);
  for (const e of byId(PLAY[0]).sol) {
    await tap(e);
    await hold(0.55);
  }
  await fuse();
  sound('combo4');
  sound('coin', 0.38);
  await hold(1.15);
  sound('whoosh');
  await hold(0.9);
  for (const e of byId(PLAY[1]).sol) {
    await tap(e);
    await hold(0.45);
  }
  await fuse();
  sound('fever');
  sound('coin', 0.38);
  await hold(1.15);
  sound('whoosh');
  await hold(1.2);
  done();
}

// ─── 2. The adventure map: from the first worlds up to Popi ───
if (want('map')) {
  await open('/aventure?diff=1');
  const sc = await findScroller();
  start('map');
  const from = Math.min(sc.max, sc.top + 4200);
  await page.evaluate((v) => {
    window.__sc.scrollTop = v;
    window.__sc.dispatchEvent(new Event('scroll'));
  }, from);
  for (let i = 0; i < 6; i++) await advance(STEP);
  await hold(0.2);
  await scroll(from, sc.top, 3.6);
  await hold(0.8);
  done();
}

// ─── 3. The worlds list ───
if (want('worlds')) {
  await open('/mondes?diff=1');
  const sc = await findScroller();
  start('worlds');
  await hold(0.3);
  if (sc) await scroll(0, Math.min(sc.max, 1500), 2.4);
  await hold(0.4);
  done();
}

// ─── 4. New game: adventures and the 16 categories ───
if (want('categories')) {
  await open('/categories');
  const sc = await findScroller();
  start('categories');
  await hold(0.3);
  if (sc) await scroll(0, Math.min(sc.max, 900), 1.8);
  await hold(0.4);
  done();
}

// ─── 5. The Pop-Cornédex ───
if (want('dex')) {
  await open('/popcornedex/movie');
  const sc = await findScroller();
  start('dex');
  await hold(0.3);
  if (sc) await scroll(0, Math.min(sc.max, 500), 1.6);
  await hold(0.3);
  done();
}

// ─── 6. Daily challenge ───
if (want('daily')) {
  await open('/defi');
  start('daily');
  await hold(1.6);
  done();
}

// ─── 7. The lucky wheel ───
if (want('wheel')) {
  await open('/roue', { wheelLast: yesterday });
  start('wheel');
  await hold(0.4);
  // A real prize of the wheel, a common one: 100 coins (1 chance in 10).
  await page.evaluate(() => window.__nextRandom(0.75));
  await page.getByText(SPIN[lang] ?? SPIN.en, { exact: false }).filter({ visible: true }).last().click();
  sound('spin');
  await hold(4.4);
  sound('win');
  await hold(1.2);
  done();
}

// ─── 8. Home screen ───
if (want('home')) {
  await open('/');
  start('home');
  await hold(1.4);
  done();
}

// ─── 9. One still of the opening level, for the "13 languages" shot (run with APP_LANG=xx ONLY=still) ───
if (want('still')) {
  await open('/jeu?resume=1', playSave(3));
  start('still');
  await hold(0.2);
  await tap(byId(PLAY[0]).sol[0]);
  cur.events = [];
  await hold(0.6);
  done();
}

await browser.close();
