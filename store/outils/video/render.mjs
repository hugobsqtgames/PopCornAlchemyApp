// Edits the App Store preview from the clips filmed by capture.mjs: films compose.html frame by
// frame, builds the soundtrack from the app's own music and sounds, and encodes the final video.
//
//   node store/outils/video/render.mjs                  → store/apercu/apercu-fr.mp4 (App Store, 886×1920)
//   DEVICE=1 node store/outils/video/render.mjs         → store/apercu/apercu-fr-reseaux.mp4 (inside an iPhone, 1080×2340)
//   APP_LANG=en …                                       → the English version (clips filmed with APP_LANG=en)
//   SHEET=1 …                                           → only a contact sheet of the storyboard (fast check)
//
// Needs ffmpeg with libx264 (FFMPEG=/path/to/ffmpeg) and Playwright.
import { execFileSync, spawn } from 'child_process';
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(process.env.PLAYWRIGHT_FROM ?? '/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '../../..');
const WORK = process.env.WORK ?? '/tmp/pca-video';
const LANG = process.env.APP_LANG ?? 'fr';
const DEVICE = process.env.DEVICE === '1';
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const FPS = 30;
const outDir = path.join(root, 'store/apercu');
const OUT = path.join(outDir, `apercu-${LANG}${DEVICE ? '-reseaux' : ''}.mp4`);
fs.mkdirSync(outDir, { recursive: true });

// Every filmed clip, as "lang/clip" (and "clip" for the language of the video).
const clips = {};
for (const l of fs.readdirSync(WORK)) {
  const f = path.join(WORK, l, 'clips.json');
  if (!fs.existsSync(f)) continue;
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(f, 'utf8')))) {
    clips[`${l}/${k}`] = v;
    if (l === LANG) clips[k] = v;
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 886, height: 1920 }, deviceScaleFactor: DEVICE ? 1080 / 886 : 1 });
page.on('pageerror', (e) => console.error('pageerror', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('console', m.text()));
await page.goto(`file://${path.join(here, 'compose.html')}?work=${encodeURIComponent(WORK)}&lang=${LANG}&device=${DEVICE ? 1 : 0}`);
await page.evaluate((c) => window.setup(c), clips);
const DURATION = await page.evaluate(() => window.DURATION);
const total = Math.round(DURATION * FPS);

// ─── Contact sheet only ───
if (process.env.SHEET) {
  const dir = fs.mkdtempSync('/tmp/pca-sheet-');
  const times = (process.env.SHEET === '1' ? [] : process.env.SHEET.split(',').map(Number));
  const list = times.length ? times : Array.from({ length: Math.ceil(DURATION / 0.5) }, (_, i) => i * 0.5);
  for (const t of list) {
    await page.evaluate((v) => window.render(v), t);
    await page.screenshot({ path: path.join(dir, `${t.toFixed(2).padStart(6, '0')}.jpg`), type: 'jpeg', quality: 80 });
  }
  console.log(dir);
  await browser.close();
  process.exit(0);
}

// ─── Soundtrack: the app's music, and its sounds where the app plays them ───
const SOUNDS = path.join(root, 'mobile/assets/sounds');
const MUSIC = path.join(root, 'mobile/assets/music/menu.wav');
// Shots that show a clip with sounds: video start/end, clip speed and clip time at the start.
const SHOTS = [
  { clip: 'play', start: 0, end: 7.0, speed: 1, from: 0 },
  { clip: 'wheel', start: 16.35, end: 20.45, speed: 1.33, from: 0.25 },
];
const cues = [];
for (const s of SHOTS) {
  for (const e of clips[s.clip]?.events ?? []) {
    const t = (e.t - s.from) / s.speed + s.start;
    if (t >= s.start && t < s.end) cues.push({ t, sound: e.sound });
    // The announcer says "Fever!" when Fever starts, like in the game.
    if (e.sound === 'fever' && t < s.end) cues.push({ t: t + 0.12, sound: 'voice_fever', gain: 1.1 });
  }
  if (s.clip === 'wheel') {
    // The ticks slow down with the wheel (same curve as the app: ease-out cubic over 4.2 s).
    const R = 1935;
    for (let a = 45; a < R; a += 45) {
      const ct = 0.4 + 4.2 * (1 - Math.cbrt(1 - a / R));
      const t = (ct - s.from) / s.speed + s.start;
      if (t < s.end) cues.push({ t, sound: 'tick', gain: 0.55 });
    }
  }
}
// Transitions and the end card.
for (const t of [6.85, 10.3, 16.2, 20.5]) cues.push({ t, sound: 'whoosh', gain: 0.45 });
cues.push({ t: 24.05, sound: 'sparkle', gain: 0.8 }, { t: 24.45, sound: 'win', gain: 0.8 });

const audio = path.join(WORK, `soundtrack-${LANG}.wav`);
{
  const args = ['-y', '-stream_loop', '2', '-i', MUSIC];
  for (const c of cues) args.push('-i', path.join(SOUNDS, `${c.sound}.wav`));
  const parts = [`[0:a]atrim=0:${DURATION},volume=0.34,afade=t=in:d=0.4,afade=t=out:st=${DURATION - 1.6}:d=1.6,aresample=48000,aformat=channel_layouts=stereo[m]`];
  cues.forEach((c, i) => {
    const ms = Math.max(0, Math.round(c.t * 1000));
    parts.push(`[${i + 1}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${(c.gain ?? 0.85).toFixed(2)},adelay=${ms}|${ms}[s${i}]`);
  });
  parts.push(`[m]${cues.map((_, i) => `[s${i}]`).join('')}amix=inputs=${cues.length + 1}:normalize=0:duration=first,alimiter=limit=0.9[out]`);
  args.push('-filter_complex', parts.join(';'), '-map', '[out]', '-t', String(DURATION), '-ar', '48000', '-ac', '2', audio);
  execFileSync(FFMPEG, args, { stdio: ['ignore', 'ignore', 'inherit'] });
}

// ─── Picture: every frame of the edit, straight into the encoder ───
const size = DEVICE ? '1080x2340' : '886x1920';
const enc = spawn(FFMPEG, [
  '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-i', audio,
  '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p',
  '-b:v', '11M', '-maxrate', '12M', '-bufsize', '24M', '-r', String(FPS), '-s', size,
  '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2',
  '-movflags', '+faststart', '-shortest', OUT,
], { stdio: ['pipe', 'ignore', 'inherit'] });
const write = (buf) => new Promise((r) => (enc.stdin.write(buf) ? r() : enc.stdin.once('drain', r)));
const t0 = Date.now();
for (let f = 0; f < total; f++) {
  await page.evaluate((v) => window.render(v), f / FPS);
  await write(await page.screenshot({ type: 'jpeg', quality: 96 }));
  if (f % 60 === 0) console.log(`frame ${f}/${total} (${Math.round((Date.now() - t0) / 1000)} s)`);
}
enc.stdin.end();
await new Promise((r) => enc.on('close', r));
await browser.close();
console.log('wrote', path.relative(root, OUT));
