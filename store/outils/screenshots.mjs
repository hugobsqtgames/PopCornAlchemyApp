// Makes the App Store screenshots (iPhone 6.9" and iPad 13", FR/EN/ES, 7 each) from the web build.
//
//   cd mobile && npx expo export --platform web --output-dir /tmp/pca-web
//   serve /tmp/pca-web on http://localhost:8766 with a single-page fallback
//   node ../store/outils/screenshots.mjs
//
// Needs Playwright. Output: store/screenshots/<lang>/<device>/NN.jpg
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(process.env.PLAYWRIGHT_FROM ?? '/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const BASE = process.env.BASE ?? 'http://localhost:8766';
const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '../..');
const outDir = path.join(root, 'store/screenshots');
const fonts = path.join(root, 'mobile/node_modules/@expo-google-fonts');
const tmp = fs.mkdtempSync('/tmp/pca-shots-');

const src = fs.readFileSync(path.join(root, 'mobile/src/game/levels.ts'), 'utf8');
const LEVELS = [...src.matchAll(/id: (\d+), cat: '(\w+)', d: (\d), sol: (\[.*?\]), name: (\{.*?\}) \}/g)].map((m) => ({
  id: +m[1],
  d: +m[3],
  sol: JSON.parse(m[4]),
  name: JSON.parse(m[5]),
}));
const byId = (id) => LEVELS.find((l) => l.id === id);

// Final sizes required by App Store Connect, and the CSS size the app is rendered at.
const DEVICES = {
  'iphone-6.9': { W: 1320, H: 2868, view: { width: 440, height: 902 }, scale: 3, status: 54 },
  'ipad-13': { W: 2064, H: 2752, view: { width: 1032, height: 1352 }, scale: 2, status: 24 },
};

const TEXT = {
  fr: [
    ['Devine en emojis', 'Combine les bons emojis pour trouver le film, la série, le pays…'],
    ["La carte de l'aventure", 'Avance niveau par niveau avec Popi, ta progression est gardée'],
    ['Enchaîne les combos', 'Déclenche le mode Fever et décroche les 3 étoiles'],
    ['400 niveaux, 16 catégories', "Suis l'aventure ou joue la catégorie que tu veux"],
    ['Complète ton Pop-Cornédex', 'Toutes tes réponses trouvées, rangées par catégorie'],
    ['Un défi chaque jour', '10 niveaux, les mêmes pour tout le monde'],
    ['Défie tes amis', 'Envoie ton score et vois qui est le meilleur alchimiste'],
  ],
  en: [
    ['Guess it in emojis', 'Combine the right emojis to find the movie, the show, the country…'],
    ['The adventure map', 'Move forward level by level with Popi, your progress is saved'],
    ['Chain the combos', 'Trigger Fever mode and earn all 3 stars'],
    ['400 levels, 16 categories', 'Follow the adventure or play the category you like'],
    ['Fill your Pop-Cornédex', 'Every answer you find, sorted by category'],
    ['A new challenge every day', '10 levels, the same for everyone'],
    ['Challenge your friends', 'Send your score and see who is the best alchemist'],
  ],
  es: [
    ['Adivina con emojis', 'Combina los emojis correctos para encontrar la película, la serie, el país…'],
    ['El mapa de la aventura', 'Avanza nivel a nivel con Popi, tu progreso se guarda'],
    ['Encadena combos', 'Activa el modo Fever y consigue las 3 estrellas'],
    ['400 niveles, 16 categorías', 'Sigue la aventura o juega la categoría que quieras'],
    ['Completa tu Pop-Cornédex', 'Todas tus respuestas encontradas, por categoría'],
    ['Un reto nuevo cada día', '10 niveles, los mismos para todos'],
    ['Reta a tus amigos', 'Envía tu puntuación y descubre quién es el mejor alquimista'],
  ],
};
const WORDS = {
  fr: { fuse: 'Fusionner', spin: 'Lancer la roue', name: 'Hugo' },
  en: { fuse: 'Fuse', spin: 'Spin the wheel', name: 'Hugo' },
  es: { fuse: 'Fusionar', spin: 'Girar la ruleta', name: 'Hugo' },
};
// Background and text color of each slide.
const COLORS = [
  ['#D93A3A', '#FFFFFF'],
  ['#1FA463', '#FFFFFF'],
  ['#FFC93C', '#1F1B2D'],
  ['#FBF6EC', '#1F1B2D'],
  ['#7B6CF6', '#FFFFFF'],
  ['#FDE9E6', '#1F1B2D'],
  ['#1F1B2D', '#FFFFFF'],
];

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = dayKey(new Date());
const yesterday = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
})();
// The map order of the app (rules.ts adventureIds): same seeded shuffle inside each tier of 20.
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
function shuffle(items, rng) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function adventureIds(d) {
  const levels = LEVELS.filter((l) => l.d === d);
  const rng = mulberry32(1000 + d);
  const ids = [];
  for (let i = 0; i < levels.length; i += 20) ids.push(...shuffle(levels.slice(i, i + 20), rng).map((l) => l.id));
  return ids;
}
// A believable player: the first 64 levels of the easy map, some movies, a few others.
const PASSED = 64;
const movies = LEVELS.filter((l) => l.cat === 'movie').slice(0, 20).map((l) => l.id);
const FOUND = [...new Set([...adventureIds(1).slice(0, PASSED), ...movies, ...LEVELS.filter((_, i) => i % 9 === 0).map((l) => l.id)])];
const STARS = Object.fromEntries(FOUND.map((id, i) => [id, i % 5 === 2 ? 2 : i % 7 === 3 ? 1 : 3]));

function profile(lang, extra = {}) {
  return {
    lang,
    tutorialDone: true,
    name: WORDS[lang].name,
    avatar: '😎',
    coins: 2450,
    hints: 12,
    shields: 3,
    skips: 2,
    doubles: 2,
    sound: false,
    music: false,
    best: { classic: 4210, chrono: 1860, hardcore: 950 },
    stats: {
      levels: 57, coinsEarned: 3100, daily: 4, spins: 3, hintsUsed: 6, shieldsUsed: 2, skipsUsed: 1, doublesUsed: 1,
      fevers: 5, bestCombo: 9, bestTier: 3, victories: 0, bestHardcore: 4,
      cat: { movie: 14, series: 6, game: 5, music: 3, geo: 12, brand: 8, nature: 11, youtube: 0, anime: 4, food: 9, sport: 7, job: 5, tale: 4, home: 3, party: 6, place: 2 },
    },
    achievements: ['first_fusion', 'level_10', 'level_50', 'combo_5', 'rich', 'daily_streak_3', 'lucky_spin'],
    dailyLast: yesterday,
    dailyStreak: 4,
    dailyBestStreak: 4,
    lastRun: { ids: [36, 1, 6, 16, 24], score: 1450 },
    save: null,
    // Today's gift already taken: no calendar over the screens.
    loginLast: today,
    loginDay: 3,
    found: FOUND,
    stars: STARS,
    adventure: { 1: PASSED, 2: 0, 3: 0 },
    ...extra,
  };
}

/** Easy level ids, with `id` at `index`. */
function runIds(id, index) {
  const easy = LEVELS.filter((l) => l.d === 1 && l.id !== id).map((l) => l.id);
  return [...easy.slice(0, index), id, ...easy.slice(index)];
}

async function open(page, lang, route, extra) {
  await page.goto(BASE);
  await page.evaluate((state) => localStorage.setItem('popcorn-profile', JSON.stringify({ state, version: 1 })), profile(lang, extra));
  await page.goto(BASE + route);
  await page.waitForTimeout(1600);
}

async function tapEmoji(page, e) {
  const t = page.locator(`[role="button"][aria-label="${e}"]:not([aria-disabled="true"])`).filter({ visible: true });
  await t.nth((await t.count()) - 1).click();
  await page.waitForTimeout(120);
}

const SCENES = [
  // 1. A level in progress: one emoji already picked.
  async (page, lang) => {
    await open(page, lang, '/jeu?resume=1', {
      save: { mode: 'classic', difficulty: 1, ids: runIds(36, 11), index: 11, lives: 4, score: 1840, combo: 2, continued: false },
    });
    await tapEmoji(page, byId(36).sol[0]);
  },
  // 2. Fever combo, right after a good answer.
  async (page, lang) => {
    await open(page, lang, '/jeu?resume=1', {
      save: { mode: 'classic', difficulty: 1, ids: runIds(9, 14), index: 14, lives: 3, score: 3120, combo: 6, continued: false },
    });
    for (const e of byId(9).sol) await tapEmoji(page, e);
    await page.getByText(WORDS[lang].fuse, { exact: false }).filter({ visible: true }).last().click();
    await page.waitForTimeout(450);
  },
  // 4. New game: the adventures and the categories.
  async (page, lang) => open(page, lang, '/categories'),
  // 5. The Pop-Cornédex, movies.
  async (page, lang) => open(page, lang, '/popcornedex/movie'),
  // 6. Daily challenge.
  async (page, lang) => open(page, lang, '/defi'),
  // 7. Challenge a friend.
  async (page, lang) => open(page, lang, '/defier'),
];
// 2. The adventure map, on the current level with Popi (right after the first level).
SCENES.splice(1, 0, async (page, lang) => open(page, lang, '/aventure?diff=1'));

const statusBar = (h, scale) => `
  <div class="status" style="height:${h * scale}px;font-size:${16 * scale}px;padding:0 ${30 * scale}px">
    <span>9:41</span>
    <svg height="${12 * scale}" viewBox="0 0 70 12"><g fill="#1F1B2D">
      <rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/>
      <path d="M31 11.5l-2.4-2.6a3.5 3.5 0 0 1 4.8 0zM26.5 6.7a6.6 6.6 0 0 1 9 0l-1.3 1.4a4.7 4.7 0 0 0-6.4 0zM24.4 4.5a9.7 9.7 0 0 1 13.2 0l-1.3 1.4a7.8 7.8 0 0 0-10.6 0z"/>
      <rect x="43" y="1" width="23" height="10" rx="3" fill="none" stroke="#1F1B2D" stroke-opacity=".4"/><rect x="45" y="3" width="19" height="6" rx="1.5"/><rect x="67" y="4" width="1.5" height="4" rx=".7" fill-opacity=".4"/>
    </g></svg>
  </div>`;

function slide({ W, H, status, scale, view }, shot, [title, sub], [bg, fg]) {
  const tablet = W > 1500;
  const screenW = view.width * scale;
  const screenH = (view.height + status) * scale;
  const bezel = tablet ? 36 : 30;
  const top = tablet ? 470 : 610;
  const room = H - top - 90;
  const k = Math.min(1, room / (screenH + bezel * 2), (W - 160) / (screenW + bezel * 2));
  const radius = tablet ? 70 : 150;
  return `<!doctype html><html><head><style>
    @font-face { font-family: R8; src: url(file://${fonts}/rubik/800ExtraBold/Rubik_800ExtraBold.ttf); }
    @font-face { font-family: R5; src: url(file://${fonts}/rubik/500Medium/Rubik_500Medium.ttf); }
    * { margin: 0; box-sizing: border-box; }
    body { width: ${W}px; height: ${H}px; background: ${bg}; overflow: hidden; position: relative; font-family: R8; }
    .cap { position: absolute; left: 0; right: 0; top: ${tablet ? 110 : 170}px; text-align: center; color: ${fg}; padding: 0 90px; }
    h1 { font-family: R8; font-size: ${tablet ? 118 : 116}px; line-height: 1.08; letter-spacing: -1px; }
    p { font-family: R5; font-size: ${tablet ? 52 : 54}px; line-height: 1.3; margin-top: 28px; opacity: .88; }
    .dev { position: absolute; left: 50%; top: ${top}px; transform: translateX(-50%) scale(${k}); transform-origin: top center;
      background: #1F1B2D; padding: ${bezel}px; border-radius: ${radius + bezel}px; box-shadow: 0 40px 90px rgba(0,0,0,.28); }
    .screen { width: ${screenW}px; height: ${screenH}px; border-radius: ${radius}px; overflow: hidden; background: #FBF6EC; }
    .status { display: flex; align-items: center; justify-content: space-between; font-family: R8; color: #1F1B2D; background: #FBF6EC; }
    .screen img { display: block; width: ${screenW}px; }
  </style></head><body>
    <div class="cap"><h1>${title}</h1><p>${sub}</p></div>
    <div class="dev"><div class="screen">${statusBar(status, scale)}<img src="file://${shot}"></div></div>
  </body></html>`;
}

const browser = await chromium.launch();
for (const [device, spec] of Object.entries(DEVICES)) {
  const ctx = await browser.newContext({ viewport: spec.view, deviceScaleFactor: spec.scale });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  const composer = await browser.newPage({ viewport: { width: spec.W, height: spec.H } });
  for (const lang of Object.keys(TEXT)) {
    const dir = path.join(outDir, lang, device);
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < SCENES.length; i++) {
      await SCENES[i](page, lang);
      const shot = path.join(tmp, `${device}-${lang}-${i}.png`);
      await page.screenshot({ path: shot });
      const html = path.join(tmp, 'slide.html');
      fs.writeFileSync(html, slide(spec, shot, TEXT[lang][i], COLORS[i]));
      await composer.goto('file://' + html);
      await composer.waitForTimeout(300);
      const file = path.join(dir, `${String(i + 1).padStart(2, '0')}.jpg`);
      await composer.screenshot({ path: file, type: 'jpeg', quality: 90 });
      console.log('wrote', path.relative(root, file));
    }
  }
  await ctx.close();
  await composer.close();
}
await browser.close();
