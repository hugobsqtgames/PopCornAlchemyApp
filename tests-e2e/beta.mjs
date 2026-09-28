// Beta pass over the web build: the flows the QA robot does not play end to end.
// Tier end and new world, final victory, game over then continue, the pause sheet, the three
// clues, the iPad landscape layout, one level in each of the 13 languages, the whole map
// scrolled in the 3 adventures, dark mode.
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(process.env.PLAYWRIGHT_FROM ?? import.meta.url);
const { chromium } = require('playwright');

const dir = new URL('.', import.meta.url).pathname;
const packs = new URL('../mobile/src/i18n/packs/', import.meta.url).pathname;
const LEVELS = JSON.parse(fs.readFileSync(dir + 'levels.json', 'utf8'));
const BASE = process.env.BASE ?? 'http://localhost:8766';
const out = dir + (process.env.OUT ?? 'beta/');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// Every level's answer in every language, to find the level on screen.
const NAMES = {};
for (const l of LEVELS) for (const [lang, n] of Object.entries(l.name)) (NAMES[lang] ??= {})[n] = l;
for (const f of fs.readdirSync(packs)) {
  const lang = f.replace('.json', '');
  const pack = JSON.parse(fs.readFileSync(packs + f, 'utf8'));
  NAMES[lang] = {};
  for (const [id, n] of Object.entries(pack.levels)) NAMES[lang][n] = LEVELS.find((l) => l.id === Number(id));
}

const failures = [];
const passes = [];
const check = (ok, what) => (ok ? passes : failures).push(what);
const pad = (n) => String(n).padStart(2, '0');
const today = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
})();

const browser = await chromium.launch();
let ctx;
let page;
let errors = [];
async function open(viewport = { width: 390, height: 844 }, colorScheme = 'light') {
  if (ctx) await ctx.close();
  ctx = await browser.newContext({ viewport, colorScheme, locale: 'fr-FR' });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
}
async function start(state, route) {
  await page.goto(BASE);
  await page.evaluate(
    (s) => localStorage.setItem('popcorn-profile', JSON.stringify({ state: s, version: 1 })),
    { lang: 'fr', tutorialDone: true, sound: false, music: false, loginLast: today, loginDay: 2, ...state },
  );
  await page.goto(BASE + route);
  await page.waitForTimeout(1200);
}
const vis = (text, exact = true) => page.getByText(text, { exact }).filter({ visible: true });
const see = async (text, exact = true) => (await vis(text, exact).count()) > 0;
const tap = async (text, exact = true) => {
  await vis(text, exact).first().click();
  await page.waitForTimeout(400);
};
const btn = async (name) => {
  await page.getByRole('button', { name, exact: true }).filter({ visible: true }).first().click();
  await page.waitForTimeout(400);
};
const profile = () => page.evaluate(() => JSON.parse(localStorage.getItem('popcorn-profile')).state);
let shotN = 0;
const shot = (name) => page.screenshot({ path: `${out}${pad(++shotN)}-${name}.png` });

async function currentLevel(lang = 'fr') {
  const texts = await page.evaluate(() =>
    [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && e.getBoundingClientRect().width > 0).map((e) => (e.textContent || '').trim()),
  );
  for (const t of texts) if (NAMES[lang][t]) return NAMES[lang][t];
  return undefined;
}
const tile = (e) => page.locator(`[role="button"][aria-label="${e}"]:not([aria-disabled="true"])`).filter({ visible: true });
async function pick(emojis) {
  for (const e of emojis) {
    const t = tile(e);
    await t.nth((await t.count()) - 1).click();
    await page.waitForTimeout(60);
  }
}
const fuseBtn = (label = 'Fusionner') => page.locator('[role="button"]').filter({ hasText: label }).filter({ visible: true }).last();
async function solve(lang = 'fr', label = 'Fusionner') {
  const level = await currentLevel(lang);
  if (!level) throw new Error('no level on screen');
  await pick(level.sol);
  await fuseBtn(label).click();
  await page.waitForTimeout(1400);
  return level;
}
async function wrong() {
  const level = await currentLevel();
  const labels = await page.locator('[role="button"][aria-label]:not([aria-disabled="true"])').filter({ visible: true }).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  await pick([...new Set(labels)].filter((l) => l && [...l].length <= 4 && !level.sol.includes(l)).slice(0, level.sol.length));
  await fuseBtn().click();
  await page.waitForTimeout(2900);
}
async function flow(name, fn) {
  errors = [];
  try {
    await fn();
  } catch (e) {
    failures.push(`${name}: CRASHED ${e.message.split('\n')[0]}`);
    await shot('FAIL-' + name.replace(/\W+/g, '_'));
  }
  check(errors.length === 0, `${name}: no errors ${errors.length ? JSON.stringify(errors.slice(0, 3)) : ''}`);
}

await open();

await flow('tier end opens a new world', async () => {
  await start({ adventure: { 1: 18, 2: 0, 3: 0 } }, '/jeu?mode=classic&diff=1&fresh=1');
  await solve();
  await solve();
  check(await see('Palier terminé !'), 'the 20th level ends the tier');
  check(await see('Nouveau monde débloqué !'.toUpperCase()), 'the tier screen announces the new world');
  check(await see('La Plage Caramel'), 'the new world is named');
  await shot('tier-new-world');
  check((await profile()).adventure['1'] === 20, 'the map knows the tier is passed');
  await tap('Palier suivant');
  check(!!(await currentLevel()), 'the next tier starts on a level');
  await page.goto(BASE + '/aventure?diff=1');
  await page.waitForTimeout(1200);
  check(await see('Monde 2 · La Plage Caramel'), 'the map now says world 2');
});

await flow('final victory of an adventure', async () => {
  await start({ adventure: { 1: 0, 2: 0, 3: 69 }, coins: 10 }, '/jeu?mode=classic&diff=3&fresh=1');
  await solve();
  await page.waitForTimeout(600);
  check(await see('VICTOIRE FINALE'), 'the last level shows the final victory');
  await shot('final-victory');
  const pr = await profile();
  check(pr.adventure['3'] === 70, `the hard adventure is complete (${pr.adventure['3']})`);
  check(pr.coins > 10, 'the victory pays coins');
  await page.goto(BASE + '/aventure?diff=3');
  await page.waitForTimeout(1200);
  check(await see('Aventure terminée !'), 'the map says the adventure is complete');
  check(await see('Rejouer depuis le niveau 1', false), 'the map offers to play again from level 1');
  await shot('map-complete');
});

await flow('game over then continue with coins', async () => {
  await start({ coins: 400 }, '/jeu?mode=hardcore&fresh=1');
  await solve();
  await wrong();
  check(await see('GAME OVER'), 'one mistake ends a hardcore run');
  check(await see('Continuer avec 1 vie ?'), 'continuing is offered');
  await shot('game-over');
  await tap('ou 150 💰');
  await page.waitForTimeout(600);
  check(!!(await currentLevel()), 'the run goes on after paying');
  check((await profile()).coins <= 400 - 150 + 60, 'the continue was paid');
  await wrong();
  check(await see('GAME OVER') && !(await see('Continuer avec 1 vie ?')), 'only one continue per run');
});

await flow('a miss keeps the same level', async () => {
  await start({ shields: 0 }, '/jeu?mode=classic&diff=1&fresh=1');
  const first = await currentLevel();
  for (let i = 1; i <= 3; i++) {
    await wrong();
    check((await currentLevel())?.id === first.id, `miss ${i}: still the same level`);
    check(!(await see('La réponse était', false)), `miss ${i}: the answer stays hidden`);
    check((await profile()).save?.index === 0 && (await profile()).save?.lives === 4 - i, `miss ${i}: one life less, saved on this level`);
  }
  await shot('miss-same-level');
  await wrong();
  check(await see('GAME OVER'), 'the last life ends the run');
  check(await see('La réponse était', false), 'the answer shows on the game over screen');
});

await flow('found after a miss', async () => {
  await start({ shields: 0 }, '/jeu?mode=classic&diff=1&fresh=1');
  const first = await currentLevel();
  await wrong();
  const lv = await solve();
  check(lv.id === first.id, 'the missed level can still be found');
  check((await currentLevel())?.id !== first.id, 'finding it goes to the next level');
  check((await profile()).stars?.[first.id] < 3, 'a miss costs a star');
});

await flow('pause sheet', async () => {
  await start({}, '/jeu?mode=classic&diff=1&fresh=1');
  await page.getByRole('button', { name: /pause/i }).filter({ visible: true }).first().click();
  await page.waitForTimeout(500);
  check(await see('PAUSE'), 'the pause sheet opens');
  await shot('pause');
  await tap('Reprendre');
  check(!(await see('PAUSE')), 'resume closes it');
  await page.getByRole('button', { name: /pause/i }).filter({ visible: true }).first().click();
  await page.waitForTimeout(400);
  await tap('Quitter · partie sauvegardée');
  check((await profile()).save !== null, 'quitting keeps the saved run');
  await page.goto(BASE + '/jeu?resume=1');
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /pause/i }).filter({ visible: true }).first().click();
  await page.waitForTimeout(400);
  await tap('Abandonner la partie');
  await tap('Oui, abandonner');
  await page.waitForTimeout(600);
  check((await profile()).save === null, 'giving up drops the saved run');
});

await flow('clues', async () => {
  await start({ hints: 3, coins: 200 }, '/jeu?mode=classic&diff=1&fresh=1');
  const level = await currentLevel();
  await page.getByRole('button', { name: /Indices/ }).filter({ visible: true }).first().click();
  await page.waitForTimeout(500);
  check(await see('Révéler un emoji'), 'the clue sheet opens');
  await shot('clues');
  await tap('Révéler un emoji');
  await page.waitForTimeout(900);
  const picked = await page.evaluate(() => document.body.innerText);
  check((await profile()).hints === 2, 'revealing costs a hint');
  await page.getByRole('button', { name: /Indices/ }).filter({ visible: true }).first().click();
  await page.waitForTimeout(400);
  await tap('Retirer 5 intrus');
  await page.waitForTimeout(600);
  check((await profile()).coins === 185, 'removing decoys costs 15 coins');
  const disabled = await page.locator('[role="button"][aria-disabled="true"]').count();
  check(disabled >= 5, `5 wrong emojis are gone (${disabled} disabled)`);
  await page.getByRole('button', { name: /Indices/ }).filter({ visible: true }).first().click();
  await page.waitForTimeout(400);
  await tap('Mélanger la grille');
  await page.waitForTimeout(500);
  // The level can still be solved after all three clues.
  await pick(level.sol.slice(1));
  await fuseBtn().click();
  await page.waitForTimeout(700);
  check(await see('BRAVO', false), `the level is solved after the clues ${picked ? '' : ''}`);
});

await flow('iPad landscape game', async () => {
  await open({ width: 1376, height: 1032 });
  await start({}, '/jeu?mode=classic&diff=1&fresh=1');
  await shot('ipad-landscape-game');
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!wide, 'the landscape game fits the screen');
  await solve();
  check(!!(await currentLevel()), 'a level is solved in landscape');
  await open();
});

await flow('dark mode game and results', async () => {
  await open({ width: 390, height: 844 }, 'dark');
  await start({ coins: 0 }, '/jeu?mode=hardcore&fresh=1');
  await shot('dark-game');
  await wrong();
  await shot('dark-game-over');
  check(await see('GAME OVER'), 'dark mode game over');
  await open();
});

const LANG_FUSE = {};
for (const f of fs.readdirSync(packs)) LANG_FUSE[f.replace('.json', '')] = JSON.parse(fs.readFileSync(packs + f, 'utf8')).strings.fusion;
Object.assign(LANG_FUSE, { fr: 'Fusionner', en: 'Fuse', es: 'Fusionar' });
for (const lang of ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'tr', 'ru', 'ja', 'ko', 'zh']) {
  await flow(`one level in ${lang}`, async () => {
    await start({ lang, adventure: { 1: 2, 2: 0, 3: 0 } }, '/jeu?mode=classic&diff=1&fresh=1');
    const level = await currentLevel(lang);
    check(!!level, `${lang}: the level name is in ${lang}`);
    await shot(`lang-${lang}-level`);
    await solve(lang, LANG_FUSE[lang]);
    const next = await currentLevel(lang);
    check(!!next && next.id !== level.id, `${lang}: the level is solved and the next one shows`);
  });
}

await flow('longest answers fit on a small iPhone', async () => {
  await open({ width: 375, height: 667 });
  for (const [lang, id] of [['es', 297], ['pt', 373], ['de', 373], ['en', 373], ['pl', 245], ['ru', 165], ['ja', 373]]) {
    await start({ lang }, `/jeu?mode=challenge&ids=${id},1&target=0`);
    const cut = await page.evaluate(() =>
      [...document.querySelectorAll('div')].filter((e) => e.children.length === 0 && (e.textContent ?? '').length > 12 && getComputedStyle(e).webkitLineClamp !== 'none' && e.scrollHeight > e.clientHeight + 2).map((e) => e.textContent),
    );
    check(cut.length === 0, `${lang} level ${id}: the answer is not cut ${cut.join(', ')}`);
    await shot(`long-name-${lang}-${id}`);
  }
  await open();
});

await flow('whole map scrolled', async () => {
  for (const d of [1, 2, 3]) {
    await start({ adventure: { 1: 0, 2: 0, 3: 0 } }, `/aventure?diff=${d}`);
    const scroller = page.locator('div').filter({ has: page.getByRole('button', { name: /^Niveau 1,|^Jouer le niveau 1$/ }) }).last();
    const height = await page.evaluate(() => Math.max(...[...document.querySelectorAll('div')].map((e) => e.scrollHeight)));
    let empty = 0;
    for (let y = 0; y < height; y += 700) {
      await page.evaluate((yy) => {
        const s = [...document.querySelectorAll('div')].filter((e) => e.scrollHeight > e.clientHeight + 50 && getComputedStyle(e).overflowY !== 'visible').sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
        s.scrollTop = yy;
      }, y);
      await page.waitForTimeout(250);
      // Scenery drawn on screen at every position.
      const drawn = await page.evaluate(() => [...document.querySelectorAll('svg')].filter((s) => { const r = s.getBoundingClientRect(); return r.height > 300 && r.bottom > 100 && r.top < window.innerHeight - 100; }).length);
      if (!drawn) empty++;
    }
    check(empty === 0, `adventure ${d}: scenery drawn all along the map (${empty} empty spots)`);
    await shot(`map-${d}-top`);
    void scroller;
  }
});

await flow('locked world is not a button that does something', async () => {
  await start({ adventure: { 1: 5, 2: 0, 3: 0 } }, '/mondes?diff=1');
  const locked = page.getByRole('button', { name: /Le Château Doré/ }).first();
  check((await locked.getAttribute('aria-disabled')) === 'true', 'a locked world is disabled');
});

await browser.close();
fs.writeFileSync(out + 'report.txt', [...failures.map((f) => '✗ ' + f), ...passes.map((p) => '✓ ' + p)].join('\n'));
console.log(`beta: ${passes.length} ok, ${failures.length} failed`);
for (const f of failures) console.log('  ✗ ' + f);
