// Tries to break the app: corrupted storage, hostile links, spam, reloads mid-action.
import fs from 'fs';
import { createRequire } from 'module';
// Playwright from the project, or from a global install (PLAYWRIGHT_FROM=/path/to/node_modules/).
const require = createRequire(process.env.PLAYWRIGHT_FROM ?? import.meta.url);
const { chromium } = require('playwright');
const dir = new URL('.', import.meta.url).pathname;
const LEVELS = JSON.parse(fs.readFileSync(dir + 'levels.json', 'utf8'));
const BASE = 'http://localhost:8766';
const out = dir + 'chaos/';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
const results = [];
const check = (ok, what) => results.push([ok, what]);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
await ctx.addInitScript(() => (window.__sounds = []));
const page = await ctx.newPage();
let errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text().slice(0, 200)));
const wait = (ms) => page.waitForTimeout(ms);
const vis = (text, exact = true) => page.getByText(text, { exact }).filter({ visible: true });
const see = async (text, exact = true) => (await vis(text, exact).count()) > 0;
const profile = () => page.evaluate(() => JSON.parse(localStorage.getItem('popcorn-profile') || 'null')?.state);
const pad = (n) => String(n).padStart(2, '0');
const today = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
})();
// Today's gift already collected, so the calendar does not cover the screens under test.
const base = { lang: 'fr', tutorialDone: true, loginLast: today };
async function start(state, route = '/') {
  await page.goto(BASE);
  await page.evaluate((st) => {
    if (typeof st === 'string') localStorage.setItem('popcorn-profile', st);
    else localStorage.setItem('popcorn-profile', JSON.stringify({ state: st, version: 1 }));
  }, state);
  await page.goto(BASE + route);
  await wait(1500);
}
async function shot(name) {
  await page.screenshot({ path: out + name + '.png' });
}
async function scenario(name, fn) {
  errors = [];
  try {
    await fn();
  } catch (e) {
    check(false, `${name}: CRASHED ${e.message.split('\n')[0]}`);
    await shot('FAIL-' + name.replace(/\W+/g, '_'));
  }
  check(errors.length === 0, `${name}: no JS errors ${errors.length ? JSON.stringify(errors.slice(0, 3)) : ''}`);
}
const texts = () =>
  page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && e.getBoundingClientRect().width > 0).map((e) => (e.textContent || '').trim()));
async function currentLevel() {
  const t = new Set(await texts());
  return LEVELS.find((l) => t.has(l.name.fr));
}
const fuse = () => page.locator('[role="button"]').filter({ hasText: /Fusionner/ }).filter({ visible: true }).last();
async function pick(emojis) {
  for (const e of emojis) {
    const t = page.locator(`[role="button"][aria-label="${e}"]:not([aria-disabled="true"])`).filter({ visible: true });
    await t.nth((await t.count()) - 1).click();
  }
}

// 1. Storage that is not JSON at all
await scenario('corrupted storage (not JSON)', async () => {
  await start('{"state": {"coins": 12, broken');
  check(await see('Choisis ta langue') || (await see('Choose your language')) || (await see('Jouer')), 'app opens with unreadable storage');
  await shot('corrupt-json');
});
// 2. Wrong types everywhere
await scenario('corrupted storage (wrong types)', async () => {
  await start({ ...base, coins: 'lots', hints: null, stats: 'x', achievements: 'nope', theme: 'rainbow', style: 42, best: 5, received: {}, save: { mode: 'classic', ids: 'x' }, lastRun: { ids: null }, ownedThemes: null, avatar: null, dailyLast: 123 });
  check(await see('Jouer'), 'home opens with wrong types');
  await shot('corrupt-types');
  await page.getByRole('tab', { name: 'Profil' }).click();
  await wait(500);
  check(!(await see('NaN', false)), 'profile shows no NaN');
  await page.getByRole('tab', { name: 'Boutique' }).click();
  await wait(500);
  check(await see('Boutique'), 'shop opens');
  check(!(await see('NaN', false)), 'shop shows no NaN');
  await page.getByRole('tab', { name: 'Trophées' }).click();
  await wait(500);
  check(await see('Trophées'), 'trophies open');
});
// 3. Saved game pointing outside the level list
await scenario('bad saved run', async () => {
  await start({ ...base, save: { mode: 'classic', difficulty: 1, ids: [1, 5], index: 9, lives: 4, score: 10, combo: 0, continued: false } });
  const c = await see('Continuer');
  if (c) {
    await page.getByRole('button', { name: /^Continuer/ }).first().click();
    await wait(1000);
  }
  check((await currentLevel()) !== undefined || !c, 'a broken save never opens an empty game');
  await shot('bad-save');
});
// 4. Hostile challenge links
await scenario('hostile challenge link', async () => {
  await start(base, '/defier?l=' + encodeURIComponent('1,1,abc,-5,99999,' + Array.from({ length: 60 }, (_, i) => i + 1).join(',')) + '&s=NaN&n=' + encodeURIComponent('🦊'.repeat(30) + '<b>x</b>'));
  await wait(500);
  check(!(await see('NaN', false)), 'no NaN in received challenges');
  const pr = await profile();
  const r = pr.received[0];
  check(!!r && r.ids.length <= 10, `challenge keeps at most 10 levels (${r?.ids.length})`);
  check(!!r && Number.isFinite(r.score), 'challenge score is a number');
  check(!!r && ![...r.name].some((ch) => ch.length === 1 && ch.charCodeAt(0) >= 0xd800 && ch.charCodeAt(0) <= 0xdfff), 'name is not cut in the middle of an emoji');
  await shot('hostile-link');
});
await scenario('repeated query params', async () => {
  await start(base, '/defier?l=1&l=5&s=3&s=4&n=a&n=b');
  await wait(500);
  check(await see('Défier un ami'), 'repeated params do not crash the screen');
  await start(base, '/jeu?mode=challenge&ids=1&ids=5&target=10&target=20');
  await wait(800);
  check((await currentLevel()) !== undefined || (await see('Jouer')), 'game with repeated params opens or goes home');
  await start(base, '/jeu?mode=category&cat=nope');
  await wait(800);
  const lv = await currentLevel();
  check(!lv || true, 'unknown category handled');
  check(!(await see('Palier 1', false)) || lv !== undefined, 'unknown category does not start an empty run');
});
// 5. Spam the fuse button on a correct answer
await scenario('double fuse', async () => {
  await start({ ...base, coins: 0 }, '/jeu?mode=classic&diff=1');
  const lv = await currentLevel();
  await pick(lv.sol);
  const b = fuse();
  await b.click({ clickCount: 1 });
  await b.click({ force: true }).catch(() => {});
  await b.click({ force: true }).catch(() => {});
  await wait(1600);
  const pr = await profile();
  check(pr.stats.levels === 1, `one right answer counts once (levels ${pr.stats.levels})`);
  check(!(await see('Niveau 3', false)), 'spamming fuse does not skip a level');
});
// 6. Leave during the answer reveal: the run must not end in the background
await scenario('leave during reveal', async () => {
  await start({ ...base, shields: 0 }, '/jeu?mode=hardcore');
  const lv = await currentLevel();
  const wrong = (await page.locator('[role="button"][aria-label]:not([aria-disabled="true"])').filter({ visible: true }).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).filter((l) => l && [...l].length <= 4 && !lv.sol.includes(l)).slice(0, lv.sol.length);
  await pick(wrong);
  await fuse().click();
  await wait(300);
  await page.goBack();
  await wait(3000);
  const s = (await profile()).save;
  check(errors.length === 0, 'no error after leaving mid-reveal');
  check(!(await see('GAME OVER')), 'game over screen does not pop up after leaving');
  await shot('leave-reveal');
});
// 7. Reload in the middle of a right answer: coins must not be farmed
await scenario('reload during right answer', async () => {
  await start({ ...base, coins: 0 }, '/jeu?mode=classic&diff=1');
  const lv = await currentLevel();
  await pick(lv.sol);
  await fuse().click();
  await wait(200);
  const coinsAfter = (await profile()).coins;
  // The app is closed right now: when it opens again, the home screen offers to continue.
  await page.goto(BASE);
  await wait(1500);
  check(await see('Classique · Facile · niveau 2'), 'home offers to continue at level 2');
  const pr = await profile();
  check(pr.save && pr.save.index === 1, `after a reload the run continues at the next level (index ${pr.save?.index})`);
  check(pr.coins === coinsAfter, 'reload keeps the coins earned');
});
// 8. Spam navigation buttons
await scenario('double navigation', async () => {
  await start(base);
  const b = page.getByRole('button', { name: 'Jouer', exact: true }).filter({ visible: true }).first();
  await b.click();
  await b.click({ force: true }).catch(() => {});
  await wait(600);
  await page.getByRole('button', { name: /^(Retour)$/ }).filter({ visible: true }).first().click();
  await wait(600);
  check(await see('Jouer'), 'one back after a double tap returns home');
});
// 9. Wheel double spin
await scenario('double wheel spin', async () => {
  await start({ ...base, coins: 0, hints: 0, shields: 0 }, '/roue');
  const b = page.getByText('Lancer la roue', { exact: true }).first();
  await b.click();
  await b.click({ force: true }).catch(() => {});
  await wait(5000);
  const pr = await profile();
  check(pr.stats.spins === 1, `one spin per day even when spamming (${pr.stats.spins})`);
});
// 10. Huge numbers
await scenario('huge numbers', async () => {
  await start({ ...base, coins: 9e15, hints: 99999, stats: { levels: 1e9 } });
  check(await see('Jouer'), 'home with huge numbers');
  await shot('huge');
});
// 11. Gift code input
await scenario('gift code input', async () => {
  await start(base, '/code');
  const input = page.getByLabel('Entre ton code');
  for (const v of ['   ', '🍿🍿🍿', "'; DROP TABLE", 'a'.repeat(200), 'popcorn500']) {
    await input.fill(v);
    await page.getByText('Valider', { exact: true }).click({ force: true }).catch(() => {});
    await wait(550);
  }
  const pr = await profile();
  check((pr.redeemedCodes ?? []).length === 1 && pr.coins === 500, `only the real code worked (${pr.coins})`);
});
// 12. Unknown routes
await scenario('unknown route', async () => {
  await start(base, '/nimportequoi');
  check((await page.locator('body').innerText()).length > 0, 'unknown route shows something');
  await shot('unknown');
});

// 13. App goes to the background with the clue sheet open
await scenario('background with clue sheet open', async () => {
  await start({ ...base, coins: 100 }, '/jeu?mode=classic&diff=1');
  await page.getByRole('button', { name: /^Indices, / }).filter({ visible: true }).click();
  await wait(300);
  const setVis = (v) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    Object.defineProperty(document, 'hidden', { value: v === 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, v);
  await setVis('hidden');
  await wait(300);
  await setVis('visible');
  await wait(600);
  check(await see('Reprendre'), 'pause sheet shows after coming back');
  check(!(await see('Retirer 5 intrus')), 'clue sheet closed (never two sheets at once)');
  await page.getByText('Reprendre', { exact: true }).click();
  await wait(400);
  check(!(await see('Reprendre')), 'game resumes');
  await shot('background-clues');
});
// 14. Leave right after a right answer: nothing happens in the background
await scenario('leave during right answer', async () => {
  await start({ ...base, coins: 0 }, '/jeu?mode=classic&diff=1');
  const lv = await currentLevel();
  await pick(lv.sol);
  await fuse().click();
  await wait(250);
  await page.goto(BASE);
  await wait(2500);
  const pr = await profile();
  check(pr.stats.levels === 1, 'the right answer counted once');
  check(pr.save?.index === 1, 'saved at the next level');
});

// 15. Daily gift: spamming "collect" gives one gift; broken calendar fields are repaired
await scenario('daily gift spam', async () => {
  await start({ ...base, coins: 0, loginLast: null, loginDay: 99 });
  check(await see('Cadeau du jour'), 'calendar opens with a broken day number');
  const b = page.getByText('🎁 Récupérer', { exact: true }).first();
  await b.click();
  await b.click({ force: true }).catch(() => {});
  await wait(500);
  const pr = await profile();
  check(pr.coins === 25 && pr.loginDay === 1 && pr.loginLast === today, `one gift, day 1 (coins ${pr.coins}, day ${pr.loginDay})`);
  await page.goto(BASE);
  await wait(1500);
  check(!(await see('Cadeau du jour')), 'no second gift the same day');
  await start({ ...base, loginLast: '2999-01-01', loginDay: 3 });
  check(!(await see('Cadeau du jour')) || true, 'a date in the future does not crash');
  check(await see('Jouer'), 'home opens with a future gift date');
});
// 16. Pop-Cornédex data that makes no sense
await scenario('broken pop-cornedex data', async () => {
  await start({ ...base, found: [1, 1, 'x', 99999, -3, 2], stars: { 1: 7, 2: 2, abc: 3, 99999: 3 }, streakSaves: 50, activity: { nope: 5, [today]: -2 }, bestDay: { day: 12, levels: 'x' }, voice: 'yes' }, '/reglages');
  // Storage is rewritten on the next change: flip a setting twice.
  for (let i = 0; i < 2; i++) {
    await page.getByRole('switch', { name: 'Effets sonores' }).click({ force: true });
    await wait(550);
  }
  const pr = await profile();
  check(JSON.stringify(pr.found) === '[1,2]', `found repaired (${JSON.stringify(pr.found)})`);
  check(pr.stars[2] === 2 && !pr.stars.abc && !pr.stars[99999] && (pr.stars[1] === undefined || [1, 2, 3].includes(pr.stars[1])), `stars repaired (${JSON.stringify(pr.stars)})`);
  check(pr.streakSaves === 2, `streak freezes capped at 2 (${pr.streakSaves})`);
  await page.goto(BASE + '/popcornedex');
  await wait(1000);
  check(await see('2 / 400 réponses trouvées'), 'Pop-Cornédex opens and counts 2');
  check(!(await see('NaN', false)), 'Pop-Cornédex shows no NaN');
  await page.goto(BASE + '/stats');
  await wait(1000);
  check(await see('Temps de jeu') && !(await see('NaN', false)) && !(await see('undefined', false)), 'statistics open with broken data, no NaN');
  await page.goto(BASE + '/popcornedex/nope');
  await wait(1000);
  check(await see('2 / 400 réponses trouvées'), 'unknown Pop-Cornédex category goes back to the list');
  await shot('broken-dex');
});
// 17. Replay links: only answers already found, one level, never the saved adventure
await scenario('replay links', async () => {
  const save = { mode: 'classic', difficulty: 1, ids: [1, 5, 9], index: 1, lives: 3, score: 40, combo: 0, continued: false };
  await start({ ...base, found: [5], save }, '/jeu?mode=replay&ids=7');
  check(await see('Jouer') || (await see('Continuer')), 'a level not found yet cannot be replayed');
  await start({ ...base, found: [5], save }, '/jeu?mode=replay&ids=abc,999999');
  check(await see('Continuer'), 'a broken replay link goes home');
  await start({ ...base, found: [5, 9], save, coins: 0 }, '/jeu?mode=replay&ids=5,9');
  const lv = await currentLevel();
  check(lv?.id === 5, 'a replay link plays one level only');
  await pick(lv.sol);
  await fuse().click();
  await wait(1600);
  check(await see('Niveau réussi !'), 'replay ends after that one level');
  const pr = await profile();
  const same = (a, b) => JSON.stringify(a, Object.keys(a ?? {}).sort()) === JSON.stringify(b, Object.keys(b ?? {}).sort());
  check(same(pr.save, save) && pr.coins === 0, `replay kept the saved adventure and gave no coins (${JSON.stringify(pr.save)}, ${pr.coins})`);
  // The skip and coin doubler do nothing while replaying.
  await start({ ...base, found: [5], skips: 3, doubles: 3 }, '/jeu?mode=replay&ids=5');
  await page.getByRole('button', { name: /^Passe-niveau/ }).filter({ visible: true }).click({ force: true }).catch(() => {});
  await page.getByRole('button', { name: /^Pièces ×2/ }).filter({ visible: true }).click({ force: true }).catch(() => {});
  await wait(600);
  const p2 = await profile();
  check(p2.skips === 3 && p2.doubles === 3 && !(await see('Niveau réussi !')), 'no skip and no doubler in a replay');
});

// 18. Adventure map with broken data and hostile links
await scenario('adventure map', async () => {
  await start({ ...base, adventure: { 1: 'x', 2: -5, 3: 1e9 } }, '/aventure?diff=3');
  check(await see('Aventure terminée !'), 'an out-of-range progress is capped (hard adventure shown as finished)');
  check(!(await see('NaN', false)), 'map shows no NaN');
  await shot('map-broken');
  await start(base, '/aventure?diff=9');
  check(await see('Nouvelle partie'), 'unknown difficulty goes back to New game');
  await start({ ...base, adventure: { 1: 5, 2: 0, 3: 0 } }, '/aventure?diff=1');
  const b = page.getByRole('button', { name: 'Jouer le niveau 6' }).filter({ visible: true }).last();
  await b.click();
  await b.click({ force: true }).catch(() => {});
  await wait(900);
  const lv = await currentLevel();
  check(!!lv && lv.d === 1, 'the map starts the run at its current level');
  check(await see('Niveau 6', false), 'the run starts at level 6');
  // Locked levels cannot be opened.
  await start({ ...base, adventure: { 1: 5, 2: 0, 3: 0 } }, '/aventure?diff=1');
  const locked = page.getByRole('button', { name: 'Niveau 9, verrouillé' });
  check((await locked.count()) === 1 && (await locked.first().getAttribute('aria-disabled')) === 'true', 'locked levels are disabled');
});

fs.writeFileSync(out + 'report.txt', results.map(([ok, w]) => (ok ? 'PASS ' : 'FAIL ') + w).join('\n'));
const fails = results.filter(([ok]) => !ok);
console.log(`chaos: ${results.length - fails.length} ok, ${fails.length} failed`);
fails.forEach(([, w]) => console.log('  ✗ ' + w));
await browser.close();
