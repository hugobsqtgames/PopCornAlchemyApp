// Exhaustive QA pass over the web build: every screen, button and game mode.
import fs from 'fs';
import { createRequire } from 'module';
// Playwright from the project, or from a global install (PLAYWRIGHT_FROM=/path/to/node_modules/).
const require = createRequire(process.env.PLAYWRIGHT_FROM ?? import.meta.url);
const { chromium } = require('playwright');

const dir = new URL('.', import.meta.url).pathname;
const LEVELS = JSON.parse(fs.readFileSync(dir + 'levels.json', 'utf8'));
const BASE = 'http://localhost:8766';
const out = dir + (process.env.OUT ?? 'qa/');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const failures = [];
const passes = [];
const check = (ok, what) => (ok ? passes : failures).push(what);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
await ctx.addInitScript(() => {
  window.__sounds = [];
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));

let shotN = 0;
const shot = async (name) => {
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${out}${String(++shotN).padStart(2, '0')}-${name}.png` });
  // Nothing may stick out of the screen sideways.
  const wide = await page.evaluate(() =>
    [...document.querySelectorAll('body *')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && r.right > window.innerWidth + 1 && r.left < window.innerWidth && !e.closest('[role="tablist"]') && !(() => { for (let a = e.parentElement; a; a = a.parentElement) { const st = getComputedStyle(a); if (/(auto|scroll)/.test(st.overflowX) && a.scrollWidth > a.clientWidth) return true; } return false; })();
      })
      .map((e) => (e.textContent || '').trim().slice(0, 25))
      .filter((t) => t)
      .slice(0, 3)
  );
  check(wide.length === 0, `${name}: nothing overflows the screen ${wide.length ? JSON.stringify(wide) : ''}`);
};
const vis = (text, exact = true) => page.getByText(text, { exact }).filter({ visible: true });
const see = async (text, exact = true) => (await vis(text, exact).count()) > 0;
const tap = async (text, exact = true) => {
  await vis(text, exact).first().click();
  await page.waitForTimeout(350);
};
const btn = async (name) => {
  await page.getByRole('button', { name, exact: true }).filter({ visible: true }).first().click();
  await page.waitForTimeout(350);
};
/** From "New game": an adventure opens its map, then its big play button starts the run. */
const adventure = async (name) => {
  await btn(name);
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /^(Jouer le niveau|Continuer · niveau|Rejouer depuis)/ }).filter({ visible: true }).last().click();
  await page.waitForTimeout(600);
};
const tab = async (name) => {
  await page.getByRole('tab', { name }).click();
  await page.waitForTimeout(400);
};
const back = () => btn(/^(Retour|Back|Volver)$/);
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dayKey(d);
};
const toggle = (name) => page.getByRole('switch', { name, exact: true }).filter({ visible: true }).first().click({ force: true });
const sounds = () => page.evaluate(() => window.__sounds.splice(0));
const profile = () => page.evaluate(() => JSON.parse(localStorage.getItem('popcorn-profile')).state);
const patchProfile = async (patch) => {
  await page.evaluate((p) => {
    const v = JSON.parse(localStorage.getItem('popcorn-profile'));
    Object.assign(v.state, p);
    localStorage.setItem('popcorn-profile', JSON.stringify(v));
  }, patch);
  await page.reload();
  await page.waitForTimeout(1200);
};

/** The level on screen: its name is a whole text on its own (not a part of a category label). */
async function currentLevel() {
  const texts = new Set(
    await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter((e) => e.children.length === 0 && e.getBoundingClientRect().width > 0)
        .map((e) => (e.textContent || '').trim())
    )
  );
  return LEVELS.find((l) => texts.has(l.name.fr) || texts.has(l.name.en) || texts.has(l.name.es));
}
const tile = (e) => page.locator(`[role="button"][aria-label="${e}"]:not([aria-disabled="true"])`).filter({ visible: true });
async function pick(emojis) {
  for (const e of emojis) {
    const t = tile(e);
    await t.nth((await t.count()) - 1).click();
    await page.waitForTimeout(60);
  }
}
async function wrongPicks(level) {
  const labels = await page.locator('[role="button"][aria-label]:not([aria-disabled="true"])').filter({ visible: true }).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  return [...new Set(labels)].filter((l) => l && [...l].length <= 4 && !level.sol.includes(l)).slice(0, level.sol.length);
}
const fuseBtn = () => page.locator('[role="button"]').filter({ hasText: /Fusionner|Fuse|Fusionar/ }).filter({ visible: true }).last();
async function solve() {
  const level = await currentLevel();
  if (!level) throw new Error('no level on screen');
  await pick(level.sol);
  await fuseBtn().click();
  await page.waitForTimeout(1350);
  return level;
}
/** A wrong answer. Returns true when the answer was then shown (a life was lost). */
async function miss() {
  const level = await currentLevel();
  await pick(await wrongPicks(level));
  await fuseBtn().click();
  await page.waitForTimeout(450);
  const shown = await see('La réponse était', false);
  if (shown) await page.waitForTimeout(2300);
  return shown;
}
const hearts = async () => {
  const txt = await page.locator('[aria-label*="sur 4"][aria-label*="vie"]').filter({ visible: true }).first().getAttribute('aria-label');
  return Number(txt?.match(/\d+/)?.[0]);
};

async function step(name, fn, fresh = true) {
  try {
    if (fresh) {
      await page.goto(BASE);
      await page.waitForTimeout(1300);
    }
    await fn();
  } catch (e) {
    failures.push(`${name}: CRASHED ${e.message.split('\n')[0]} @ ${(e.stack.match(/qa\.mjs:(\d+)/g) || []).slice(0, 3).join(' ')} ${(e.message.match(/waiting for (.*)/) || [])[1] ?? ''}`);
    await page.screenshot({ path: `${out}FAIL-${name.replace(/\W+/g, '_')}.png` });
  }
}

// ───────────────────────── First launch & languages
await page.goto(BASE);
await page.waitForTimeout(1500);
await step('first launch', async () => {
  await shot('langue');
  await tap('English');
  check(await see('Choose your language'), 'language screen previews the picked language');
  await tap('Continue');
  await page.waitForTimeout(800);
  check(await see('Guess “Titanic” with emojis. Tap 🚢!'), 'first launch opens the guided level in English');
  await shot('niveau-guide');
  const wrongTile = page.locator('[role="button"][aria-label="🔥"]').filter({ visible: true });
  if (await wrongTile.count()) await wrongTile.first().click();
  check((await page.locator('[role="button"][aria-label="🚢"]').filter({ visible: true }).count()) >= 1, 'guided level shows the answer tiles');
  await pick(['🚢']);
  check(await see('Great! Now tap 🧊'), 'guide moves to the second emoji (a wrong tap is ignored)');
  await pick(['🧊']);
  check(await see('Tap Fuse to check your answer'), 'guide asks to fuse');
  await fuseBtn().click();
  await page.waitForTimeout(1500);
  check(await see('You got it! 🎉'), 'guided level ends with a summary');
  await shot('niveau-guide-fini');
  await tap("Let's go!");
  // First visit to home: the daily gift calendar opens, day 1.
  check(await see("Today's gift"), 'the daily gift calendar opens on home after the guided level');
  await shot('calendrier');
  const c0 = (await profile()).coins;
  await tap('🎁 Collect');
  check(await see('You get 25 💰'), 'day 1 gift is 25 coins');
  const g = await profile();
  check(g.coins === c0 + 25 && g.loginDay === 1 && g.loginLast === dayKey(), `day 1 collected (coins +${g.coins - c0}, day ${g.loginDay})`);
  await shot('calendrier-recu');
  await tap('Great!');
  check(!(await see("Today's gift")), 'the calendar closes');
  await page.reload();
  await page.waitForTimeout(1300);
  check(!(await see("Today's gift")), 'one gift a day: no calendar after a restart');
  check(await see('Play'), 'home in English after the guided level');
  check((await profile()).tutorialDone === true, 'guided level marks the tutorial as done');
  await btn('Settings');
  await tap('Language');
  await tap('Español');
  await tap('Continuar');
  check(await see('Ajustes'), 'settings switched to Spanish');
  await tap('Idioma');
  await tap('Français');
  await tap('Continuer');
  check(await see('Réglages'), 'settings back in French');
  await back();
  check(await see('Jouer'), 'home in French');
  await shot('accueil');
}, false);

// Give the tester coins to buy everything.
await patchProfile({ coins: 20000 });

// ───────────────────────── Home buttons
await step('home buttons', async () => {
  for (const [label, expect] of [
    ['Modes', 'Modes de jeu'],
    ['Roue', 'Roue de la chance'],
    ['Défier un ami', 'Défier un ami'],
    ['Défi du jour', '10 niveaux mystère'],
  ]) {
    await tap(label);
    check(await see(expect), `home → ${label} opens`);
    await back();
  }
  await btn('Réglages');
  check(await see('Effets sonores'), 'home → settings opens');
  await back();
  await page.getByRole('button', { name: /Pièces/ }).filter({ visible: true }).first().click();
  await page.waitForTimeout(400);
  check(await see('Boutique'), 'coins pill → shop');
  await tab('Jouer');
});

// ───────────────────────── Shop: boosts, themes, styles, avatars, free coins
await step('shop', async () => {
  await tab('Boutique');
  await shot('boutique');
  await tap('Bonus');
  for (const name of ['5 indices', 'Bouclier', 'Passe-niveau', 'Pièces ×2']) {
    await page.getByRole('button', { name }).filter({ visible: true }).click();
    await page.waitForTimeout(250);
  }
  await page.getByRole('button', { name: 'Bouclier' }).filter({ visible: true }).click();
  await page.waitForTimeout(250);
  const pr = await profile();
  check(pr.hints === 8 && pr.shields === 2 && pr.skips === 1 && pr.doubles === 1, `boosts bought (hints ${pr.hints}, shields ${pr.shields}, skips ${pr.skips}, doubles ${pr.doubles})`);
  check(pr.coins === 20000 - 100 - 150 - 200 - 250 - 150, `coins debited correctly (${pr.coins})`);
  check((await sounds()).filter((s) => s === 'buy').length === 5, 'purchase sound on every buy');
  await shot('boutique-bonus');
  // Streak freeze: 2 at most.
  // Taps are 500 ms apart: a button ignores a second tap within 450 ms.
  await page.getByRole('button', { name: 'Protection de série' }).filter({ visible: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Protection de série' }).filter({ visible: true }).click();
  await page.waitForTimeout(500);
  const c1 = (await profile()).coins;
  await page.getByRole('button', { name: 'Protection de série, Maximum atteint' }).filter({ visible: true }).click();
  await page.waitForTimeout(250);
  const pf = await profile();
  check(pf.streakSaves === 2 && pf.coins === c1 && c1 === pr.coins - 500, `streak freeze: 2 bought for 250 each, a third refused (${pf.streakSaves}, ${pr.coins - c1})`);

  await tap('Thèmes');
  await page.getByRole('button', { name: 'Menthe' }).click();
  await page.waitForTimeout(400);
  check((await profile()).theme === 'mint', 'mint theme bought and equipped');
  await shot('theme-menthe');
  await page.getByRole('button', { name: 'Pop-corn' }).click();
  check((await profile()).theme === 'popcorn', 'back to popcorn theme');

  await tap('Styles');
  await page.getByRole('button', { name: '🍦' }).click();
  await page.waitForTimeout(300);
  check((await profile()).style === '🍦', 'style bought');
  await shot('styles');
  await tap('Avatars');
  await page.getByRole('button', { name: '😎' }).click();
  await page.waitForTimeout(300);
  check((await profile()).avatar === '😎', 'avatar bought');
  await shot('avatars');

  check((await page.getByRole('tab', { name: 'Pièces' }).count()) === 0, 'no real-money coins tab while purchases are not wired');
  check(!(await see('0,99 €', false)), 'no price in euros anywhere in the shop');
  await tab('Jouer');
});

// ───────────────────────── Classic run: sounds, hint, unpick, shield, skip, double, lives, tier
await step('classic run', async () => {
  await btn('Jouer');
  check(await see('Contes') && await see('Monuments') && await see('Métiers'), 'new categories listed');
  check(!(await see('Ta partie en cours sera remplacée.')), 'no replace warning without a saved game');
  await shot('nouvelle-partie');
  await btn('Aventure Facile');
  await page.waitForTimeout(600);
  check(await see('Palier 1 · niveaux 1 à 20'), 'easy adventure opens its map at tier 1');
  await shot('carte');
  await page.getByRole('button', { name: 'Jouer le niveau 1' }).filter({ visible: true }).last().click();
  await page.waitForTimeout(600);
  check((await currentLevel()).d === 1, 'easy adventure starts with an easy level');
  await sounds();
  const level = await currentLevel();
  // Rapid taps: every tap must make a sound.
  const t1 = tile(level.sol[0]);
  const t2 = tile(level.sol[1]);
  await t1.nth((await t1.count()) - 1).click({ delay: 0 });
  await t2.nth((await t2.count()) - 1).click({ delay: 0 });
  const s1 = await sounds();
  check(s1.filter((s) => s === 'pop').length === 2, `two quick taps → two pop sounds (${s1.join(',')})`);
  // Remove a pick from its slot.
  await page.locator(`[role="button"][aria-label="${level.sol[0]}"]`).filter({ visible: true }).first().click();
  await page.waitForTimeout(200);
  check((await sounds()).includes('unpop'), 'removing a pick plays unpop');
  await shot('jeu');
  // Hint fills the missing emoji.
  await page.getByRole('button', { name: /^Indices, / }).filter({ visible: true }).click();
  await page.waitForTimeout(400);
  check(await see('Retirer 5 intrus') && await see('Mélanger la grille'), 'clue sheet offers three clues');
  await shot('indices');
  await tap('Révéler un emoji');
  await page.waitForTimeout(900);
  check((await sounds()).includes('sparkle'), 'hint plays sparkle');
  await shot('indice');
  const filled = await fuseBtn().getAttribute('aria-disabled');
  check(filled !== 'true', 'hint completes the answer on a 2-emoji level');
  await fuseBtn().click();
  await page.waitForTimeout(300);
  await shot('bonne-reponse');
  const s2 = await sounds();
  await page.waitForTimeout(1200);
  const s3 = await sounds();
  check(s2.includes('success') && [...s2, ...s3].includes('coin'), `correct answer plays success + coin (${[...s2, ...s3].join(',')})`);
  check(s3.includes('whoosh'), 'next level plays whoosh');

  // Shield absorbs a mistake.
  const lives0 = await hearts();
  await miss();
  check((await hearts()) === lives0, 'shield keeps lives');
  check((await profile()).shields === 1, 'shield consumed');
  await miss();
  const missedLevel = await currentLevel();
  const revealed = await miss();
  check(revealed, 'a lost life shows the answer');
  check((await currentLevel()).id !== missedLevel.id, 'after the answer, the next level starts');
  check((await hearts()) === lives0 - 1, 'mistake without shield costs a life');
  check((await sounds()).includes('error'), 'mistake plays error');
  await shot('vie-perdue');

  // Double then solve.
  await page.getByRole('button', { name: /^Pièces ×2/ }).filter({ visible: true }).click();
  await page.waitForTimeout(300);
  check(await see('✨ 💰×2', false), 'double coins badge shown');
  const coinsBefore = (await profile()).coins;
  await solve();
  const gained = (await profile()).coins - coinsBefore;
  check(gained >= 10 && gained % 2 === 0, `doubled coins (${gained})`);

  // Skip.
  const lvlBefore = await currentLevel();
  await page.getByRole('button', { name: /^Passe-niveau/ }).filter({ visible: true }).click();
  await page.waitForTimeout(500);
  check(await see('La réponse était', false), 'skip shows the answer');
  await page.waitForTimeout(2300);
  check((await currentLevel()).id !== lvlBefore.id, 'skip goes to another level');

  // Combo chimes & fever: solve until the tier ends.
  let fever = false;
  let tier = false;
  const heard = [];
  for (let i = 0; i < 20; i++) {
    if (await see('Palier terminé !')) {
      tier = true;
      break;
    }
    await solve();
    const s = await sounds();
    heard.push(...s);
    if (s.includes('fever')) fever = true;
    if (i === 4) await shot('fever');
  }
  tier = tier || (await see('Palier terminé !'));
  check(fever, 'fever chime plays at combo 5');
  check(heard.includes('voice_combo') && heard.includes('voice_fever'), `announcer says combo and fever (${[...new Set(heard.filter((x) => x.startsWith('voice')))].join(',')})`);
  check(tier, 'tier screen after 20 levels');
  await shot('palier');
  const pr = await profile();
  check(pr.achievements.includes('first_fusion') && pr.achievements.includes('combo_5'), 'achievements unlocked during play');
  await tap('Palier suivant');
  check(await see('Niveau 21', false), 'next tier starts at level 21');
  check((await hearts()) === 4, 'lives refilled for the new tier');

  // Pause: toggles, rules, quit.
  await btn('PAUSE');
  await shot('pause');
  await tap('Règles du jeu');
  check(await see('COMMENT JOUER'), 'pause → rules');
  await tap("C'est parti");
  check(await see('Niveau 21', false), 'back from rules to the same level');
  check(await see('Reprendre'), 'pause sheet shows again after the rules');
  await tap('Défier un ami');
  check(await see('Envoyer le défi'), 'pause → challenge a friend');
  await back();
  check(await see('Reprendre'), 'pause sheet shows again after the challenge screen');
  await tap('Reprendre');
  check(!(await see('Reprendre')), 'resume closes the pause sheet');
  await btn('PAUSE');
  await tap('Quitter · partie sauvegardée');
  check(await see('Continuer'), 'home offers to continue');
  check((await page.getByRole('button', { name: 'Nouvelle partie' }).filter({ visible: true }).count()) === 1, 'home shows a real New game button next to Continue');
  await shot('accueil-partie-en-cours');
});

// ───────────────────────── Persistence: reload and resume
await step('resume after reload', async () => {
  await page.reload();
  await page.waitForTimeout(1500);
  check(await see('Classique · Facile · niveau 21'), 'saved run survives a restart');
  await btn('Continuer, Classique · Facile · niveau 21');
  await page.waitForTimeout(600);
  check(await see('Niveau 21', false), 'resumed at level 21');
  await btn('PAUSE');
  await tap('Quitter · partie sauvegardée');
});

// ───────────────────────── Category run to victory
await step('category run', async () => {
  await btn('Nouvelle partie');
  check(await see('Ta partie en cours sera remplacée.'), 'new game warns that the saved game will be replaced');
  const coins0 = (await profile()).coins;
  await tap('Anime');
  await page.waitForTimeout(500);
  const firstD = (await currentLevel()).d;
  check(firstD === 1, 'category starts with its easy levels');
  for (let i = 0; i < 30 && !(await see('Catégorie terminée !')); i++) {
    if (await see('Palier terminé !')) await tap('Palier suivant');
    else await solve();
  }
  check(await see('Catégorie terminée !'), 'category victory screen');
  await shot('victoire-categorie');
  check((await profile()).coins - coins0 >= 100, 'category victory bonus');
  check((await profile()).save === null, 'no saved run after victory');
  await tap('Accueil');
});

// ───────────────────────── Daily challenge
await step('daily', async () => {
  await tap('Défi du jour');
  await tap('Jouer le défi');
  for (let i = 0; i < 10 && !(await see('Défi du jour réussi !')); i++) await solve();
  check(await see('Défi du jour réussi !'), 'daily victory');
  await shot('defi-reussi');
  const pr = await profile();
  check(pr.dailyStreak === 1 && pr.stats.daily === 1, 'daily streak and stats');
  await tap('Accueil');
  check(await see('Réussi ✓ · reviens demain'), 'home shows the daily as done');
  await tap('Défi du jour');
  await tap('Jouer le défi');
  for (let i = 0; i < 10 && !(await see('Défi du jour réussi !')); i++) await solve();
  check(await see('Déjà récompensé aujourd’hui'), 'second daily of the day gives no reward');
  await tap('Accueil');
});

// ───────────────────────── Saved games: hard adventure, a daily does not touch it, give up
await step('saved games', async () => {
  if (await see('Continuer')) await btn('Nouvelle partie');
  else await btn('Jouer');
  await adventure('Aventure Difficile');
  check((await currentLevel()).d === 3, 'hard adventure starts with a hard level');
  await btn('PAUSE');
  await tap('Quitter · partie sauvegardée');
  check((await profile()).save?.difficulty === 3, 'hard adventure saved');
  await tap('Défi du jour');
  await tap('Jouer le défi');
  await page.waitForTimeout(500);
  await btn('PAUSE');
  check(!(await see('Abandonner la partie')), 'no give-up option in the daily');
  await tap('Quitter');
  check((await profile()).save?.difficulty === 3, 'quitting the daily keeps the saved adventure');
  check(await see('Classique · Difficile · niveau 1'), 'home shows the saved hard adventure');
  await btn('Continuer, Classique · Difficile · niveau 1');
  await page.waitForTimeout(500);
  await btn('PAUSE');
  await tap('Abandonner la partie');
  check(await see('Tu perdras ta progression dans cette partie.'), 'give up asks for confirmation');
  await shot('pause-abandon');
  await tap('Oui, abandonner');
  check((await profile()).save === null, 'give up deletes the saved game');
  check(await see('Jouer') && !(await see('Continuer')), 'home back to Play after giving up');
});

// ───────────────────────── Chrono
await step('chrono', async () => {
  await tap('Modes');
  await tap('Chrono');
  await page.waitForTimeout(500);
  await solve();
  for (let i = 0; i < 16 && !(await see('Temps écoulé', false)); i++) await miss();
  await page.waitForTimeout(1500);
  check(await see('Temps écoulé', false), 'chrono ends when time runs out');
  check(!(await see('Continuer avec 1 vie ?')), 'no continue offer in chrono');
  await shot('chrono-fini');
  await tap('Accueil');
});

// ───────────────────────── Hardcore: game over, continue with coins, second game over
await step('hardcore', async () => {
  await tap('Modes');
  await tap('Hardcore');
  await page.waitForTimeout(500);
  await miss();
  await page.waitForTimeout(600);
  check(await see('GAME OVER'), 'hardcore game over after one mistake');
  const c0 = (await profile()).coins;
  await tap('ou 150 💰');
  await page.waitForTimeout(500);
  check((await profile()).coins === c0 - 150, 'continue costs 150 coins');
  check((await hearts()) === 1, 'continue gives one life');
  await miss();
  await page.waitForTimeout(600);
  check(await see('GAME OVER') && !(await see('Continuer avec 1 vie ?')), 'only one continue per run');
  check(await see('La réponse était', false), 'game over screen shows the missed answer');
  check(!(await see('Regarder une pub', false)), 'no ad button on game over');
  await shot('game-over');
  await tap('Rejouer');
  await page.waitForTimeout(600);
  check(await see('Niveau 1', false), 'replay starts a new run');
  await btn('PAUSE');
  await tap('Quitter · partie sauvegardée');
});

// ───────────────────────── Challenge a friend (+ opening a challenge link)
await step('challenge', async () => {
  await tap('Défier un ami');
  check(await see('Envoyer le défi'), 'a challenge is ready after playing');
  await shot('defier');
  await tap('Envoyer le défi');
  const ids = LEVELS.slice(0, 3).map((l) => l.id).join(',');
  await page.goto(`${BASE}/defier?l=${ids}&s=5&n=L%C3%A9a`);
  await page.waitForTimeout(1500);
  check(await see('Léa'), 'challenge link adds Léa to received challenges');
  await btn(/^Léa 5$/);
  await page.waitForTimeout(500);
  for (let i = 0; i < 3 && !(await see('Défi gagné !')); i++) await solve();
  check(await see('Défi gagné !'), 'beating the target wins the challenge');
  await shot('defi-gagne');
  await tap('Accueil');
});

// ───────────────────────── Wheel
await step('wheel', async () => {
  await tap('Roue');
  await sounds();
  await tap('Lancer la roue');
  await page.waitForTimeout(4700);
  const s = await sounds();
  const ticks = s.filter((x) => x === 'tick').length;
  check(s.includes('spin') && ticks >= 20, `wheel plays spin + ticks (${ticks} ticks)`);
  check(await see('Tu gagnes', false) || (await see('Cadeau surprise !', false)), 'wheel shows the prize');
  await shot('roue');
  check(!(await see('Tour bonus avec une pub')), 'no ad bonus spin while ads are not wired');
  check(!(await see('Lancer la roue')), 'one free spin a day');
  await back();
});

// ───────────────────────── Trophies, profile, settings
await step('trophies & profile', async () => {
  await tab('Trophées');
  await page.getByRole('button', { name: /^En feu|^Apprenti Combo/ }).first().click();
  check(await see('Débloqué'), 'trophy detail shows unlocked');
  await tap('Combos');
  await shot('trophees');
  check((await page.locator('body').innerText()).includes('/ 46'), 'trophy tree has the 7 new category trophies');
  await tab('Profil');
  const pr = await profile();
  check(await see(String(pr.stats.levels)), 'profile shows levels cleared');
  await shot('profil');
  await tap('🎖️ Succès');
  check(await see('Tous'), 'profile → achievements');
  await tab('Jouer');
});

// ───────────────────────── Pop-Cornédex, stars and replaying a level
await step('pop-cornedex & replay', async () => {
  await tab('Profil');
  const pr = await profile();
  check(pr.found.length > 0 && pr.found.every((id) => [1, 2, 3].includes(pr.stars[id])), `answers found are in the Pop-Cornédex with stars (${pr.found.length})`);
  await tap('Pop-Cornédex');
  check(await see(`${pr.found.length} / ${LEVELS.length} réponses trouvées`), 'Pop-Cornédex counts the answers found');
  await shot('popcornedex');
  await page.getByRole('button', { name: /, [1-9]\d* \/ \d+$/ }).filter({ visible: true }).first().click();
  await page.waitForTimeout(500);
  check(await see('???'), 'answers not found yet stay hidden');
  let target = null;
  for (const l of LEVELS.filter((x) => pr.found.includes(x.id))) if (await see(l.name.fr)) { target = l; break; }
  check(!!target, 'a found answer is listed by name in its category');
  await shot('popcornedex-categorie');
  const save0 = JSON.stringify(pr.save);
  const coins0 = pr.coins;
  const levels0 = pr.stats.levels;
  await sounds();
  await page.getByRole('button', { name: new RegExp(`^${target.name.fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, `) }).filter({ visible: true }).first().click();
  await page.waitForTimeout(700);
  check(await see('Rejouer un niveau', false), 'replay shows its mode in the top bar');
  check(!(await page.locator('[aria-label*="sur 4"]').filter({ visible: true }).count()), 'replay has no lives');
  check((await currentLevel())?.id === target.id, 'replay opens the chosen level');
  await pick(target.sol);
  await fuseBtn().click();
  await page.waitForTimeout(350);
  check((await page.locator('[aria-label="3 / 3 Étoiles"]').filter({ visible: true }).count()) > 0, 'a fast answer without clue or mistake shows 3 stars');
  await shot('etoiles');
  await page.waitForTimeout(1300);
  check(await see('Niveau réussi !'), 'replay ends on its own win screen');
  await shot('rejouer-reussi');
  const p1 = await profile();
  check(p1.coins === coins0 && p1.stats.levels === levels0, `replay gives no coins and no stats (coins ${p1.coins - coins0}, levels ${p1.stats.levels - levels0})`);
  check(p1.stars[target.id] === 3, 'best stars saved');
  check(JSON.stringify(p1.save) === save0, 'replay never touches the saved adventure');
  check((await sounds()).includes('voice_perfect'), 'announcer says perfect on 3 stars');
  // Replay again and miss three times: the answer shows, no continue offer.
  await tap('Rejouer');
  await page.waitForTimeout(600);
  await miss();
  await miss();
  await miss();
  await page.waitForTimeout(600);
  check(await see('GAME OVER') && !(await see('Continuer avec 1 vie ?')), 'a missed replay ends without a continue offer');
  check((await profile()).stars[target.id] === 3, 'a missed replay keeps the best stars');
  await shot('rejouer-rate');
  await tap('Retour au Pop-Cornédex');
  check(await see(target.name.fr), 'back to the Pop-Cornédex category');
  await back();
  await back();
  await tap('📊 Statistiques');
  check(await see('Temps de jeu') && await see('PRÉCISION PAR CATÉGORIE'), 'statistics page');
  check(!(await see('NaN', false)) && !(await see('undefined', false)), 'statistics show no NaN');
  const p2 = await profile();
  check(p2.stats.playSeconds > 0 && Object.values(p2.activity).length > 0 && p2.bestDay?.levels > 0, `play time and best day recorded (${p2.stats.playSeconds} s, best day ${p2.bestDay?.levels})`);
  await shot('statistiques');
  await back();
  await tab('Jouer');
});

// ───────────────────────── Adventure map: progress kept, levels to replay, Popi
await step('adventure map', async () => {
  const pr = await profile();
  check(pr.adventure['1'] >= 20, `the easy adventure progress is kept (${pr.adventure['1']} levels)`);
  if (await see('Continuer')) await btn('Nouvelle partie');
  else await btn('Jouer');
  check(await see('Continuer · niveau', false), 'new game shows where the easy adventure is');
  await shot('nouvelle-partie-carte');
  await btn('Aventure Facile');
  await page.waitForTimeout(700);
  check(await see('✓ Palier 1 terminé'), 'finished tier shows as done on the map');
  check(await see('À toi de jouer !'), 'Popi shows the level to play');
  const node = await page.getByRole('button', { name: /^(Jouer le niveau|Continuer · niveau) \d+$/ }).first().boundingBox();
  check(!!node && node.y > 60 && node.y < 560, `the map opens on the current level (y ${Math.round(node?.y ?? -1)})`);
  await shot('carte-progression');
  // A level already passed opens its sheet and can be replayed.
  await page.getByRole('button', { name: /^Niveau 1, / }).filter({ visible: true }).first().click();
  await page.waitForTimeout(500);
  check(await see('Rejouer'), 'a passed level opens its sheet');
  await shot('carte-niveau');
  await tap('Rejouer');
  await page.waitForTimeout(700);
  check(await see('Rejouer un niveau', false), 'replaying a map level');
  await solve();
  check(await see('Niveau réussi !'), 'map level replayed');
  await tap('Retour à la carte');
  check(await see('Aventure Facile'), 'back to the map after the replay');
  check((await profile()).adventure['1'] === pr.adventure['1'], 'a replay does not move the map progress');
  await back();
  await back();
});

// ───────────────────────── Streak freeze and the 7th day gift
await step('streak freeze & day 7', async () => {
  await patchProfile({ dailyLast: daysAgo(2), dailyStreak: 5, streakSaves: 1 });
  await tap('Défi du jour');
  check(await see('🧊 1 protection de série'), 'daily page shows the streak freezes');
  check(await see('Série : 5 jours', false), 'a missed day with a freeze keeps the streak alive');
  await tap('Jouer le défi');
  for (let i = 0; i < 10 && !(await see('Défi du jour réussi !')); i++) await solve();
  check(await see('🧊 Série sauvée !'), 'daily win says the streak was saved');
  const pr = await profile();
  check(pr.dailyStreak === 6 && pr.streakSaves === 0, `streak goes on with the freeze used (streak ${pr.dailyStreak}, freezes ${pr.streakSaves})`);
  await shot('serie-sauvee');
  await tap('Accueil');
  await patchProfile({ loginLast: daysAgo(1), loginDay: 6 });
  check(await see('Cadeau du jour'), 'calendar opens again the next day');
  const c0 = (await profile()).coins;
  await tap('🎁 Récupérer');
  check(await see('Tu reçois 200 💰 · 1 🧊'), 'day 7 is the big gift');
  const g = await profile();
  check(g.coins === c0 + 200 && g.streakSaves === 1 && g.loginDay === 0, `day 7 collected, calendar starts over (coins +${g.coins - c0}, day ${g.loginDay})`);
  await shot('calendrier-jour-7');
  await tap('Super !');
});

await step('settings', async () => {
  await btn('Réglages');
  await sounds();
  await page.getByRole('switch').filter({ visible: true }).nth(1).click({ force: true });
  check((await profile()).music === false, 'music switch');
  await page.getByRole('switch').filter({ visible: true }).nth(1).click({ force: true });
  await page.getByRole('switch').filter({ visible: true }).nth(0).click({ force: true });
  check((await profile()).sound === false, 'sound switch');
  await page.getByRole('switch').filter({ visible: true }).nth(0).click({ force: true });
  check((await profile()).sound === true, 'sound back on');
  await tap('Confidentialité');
  check(await see('Pop-Corn Alchemy ne collecte aucune donnée', false), 'privacy page');
  check(await see('ni publicité ni achat intégré', false), 'privacy text matches this version (no ads, no purchases)');
  await back();
  await tap('Conditions & mentions légales');
  check(await see('Éditeur : Hugo_BSQT', false), 'legal page');
  await back();
  await tap('Règles du jeu');
  check(await see('COMMENT JOUER'), 'rules page');
  await tap('Passer');
  check(!(await see('Restaurer mes achats')) && !(await see('Supprimer les pubs', false)), 'no purchase rows in settings');
  // Reduce motion
  await toggle('Réduire les animations');
  check((await profile()).reduceMotion === true, 'reduce motion switch');
  await toggle('Réduire les animations');
  // The announcer voice: a sample line when it is turned back on.
  await toggle("Voix d'annonceur");
  check((await profile()).voice === false, 'announcer voice switch off');
  await sounds();
  await toggle("Voix d'annonceur");
  await page.waitForTimeout(400);
  check((await profile()).voice === true && (await sounds()).includes('voice_combo'), 'announcer voice back on, with a sample line');
  // Reminder: no notifications on the web build, it must stay off without crashing.
  await toggle('Rappel du défi du jour');
  await page.waitForTimeout(300);
  check((await profile()).reminder === false && (await profile()).reminderAsked === true, 'reminder switch asks, stays off when refused');
  await shot('reglages');
  // Gift codes
  const c0 = (await profile()).coins;
  await tap('Code cadeau');
  await page.getByLabel('Entre ton code').fill('popcorn500');
  await tap('Valider');
  check(await see('Code activé : 500 💰'), 'gift code works');
  check((await profile()).coins === c0 + 500, 'gift code gives 500 coins');
  await shot('code-cadeau');
  await page.waitForTimeout(500);
  await page.getByLabel('Entre ton code').fill('POPCORN500');
  await tap('Valider');
  check(await see('Tu as déjà utilisé ce code.'), 'gift code works only once');
  await page.waitForTimeout(500);
  await page.getByLabel('Entre ton code').fill('FAUX');
  await tap('Valider');
  check(await see("Ce code n'existe pas ou a expiré."), 'unknown gift code refused');
  check((await profile()).coins === c0 + 500, 'refused codes give nothing');
  await back();
  await tap('Revoir le tutoriel');
  await page.waitForTimeout(600);
  check(await see('Titanic'), 'settings → guided level again');
  await tap('Passer');
  await page.waitForTimeout(500);
  check(await see('Jouer'), 'skipping the guided level goes home');
});

// ───────────────────────── Zen mode and clues
await step('zen', async () => {
  await page.getByRole('button', { name: 'Zen', exact: true }).filter({ visible: true }).first().click();
  await page.waitForTimeout(700);
  check(!(await page.locator('[aria-label*="sur 4"]').filter({ visible: true }).count()), 'zen has no lives');
  await shot('zen');
  const first = await currentLevel();
  await miss();
  await miss();
  check((await currentLevel()).id === first.id, 'zen: two wrong tries keep the same level');
  const shown = await miss();
  check(shown, 'zen: the answer shows after 3 tries');
  check((await currentLevel()).id !== first.id, 'zen: then the next level starts');
  // Clue: remove 5 wrong emojis
  const tiles = () => page.locator('[role="button"][aria-label]:not([aria-disabled="true"])').filter({ visible: true }).evaluateAll((els) => els.filter((e) => [...(e.getAttribute('aria-label') || '')].length <= 4).length);
  const before = await tiles();
  const coinsBefore = (await profile()).coins;
  await page.getByRole('button', { name: /^Indices, / }).filter({ visible: true }).click();
  await page.waitForTimeout(300);
  await tap('Retirer 5 intrus');
  await page.waitForTimeout(300);
  check(before - (await tiles()) === 5, `remove clue takes 5 tiles away (${before} → ${await tiles()})`);
  check((await profile()).coins === coinsBefore - 15, 'remove clue costs 15 coins');
  // Clue: shuffle keeps a pick in its slot
  const lvl = await currentLevel();
  await pick([lvl.sol[0]]);
  await page.getByRole('button', { name: /^Indices, / }).filter({ visible: true }).click();
  await page.waitForTimeout(300);
  await tap('Mélanger la grille');
  await page.waitForTimeout(300);
  check((await page.locator(`[role="button"][aria-label="${lvl.sol[0]}"]`).filter({ visible: true }).count()) >= 1, 'shuffle keeps the picked emoji');
  await pick(lvl.sol.slice(1));
  await fuseBtn().click();
  await page.waitForTimeout(1400);
  check((await currentLevel()).id !== lvl.id, 'zen: solved after the clues');
  await btn('PAUSE');
  await tap('Quitter');
  check((await profile()).save?.mode !== 'zen', 'zen never replaces the saved adventure');
});

// ───────────────────────── Other sizes and dark mode
for (const [w, h, name, scheme] of [
  [430, 932, 'pro-max', 'light'],
  [1180, 820, 'ipad', 'light'],
  [820, 1180, 'ipad-portrait', 'light'],
  [375, 667, 'sombre', 'dark'],
]) {
  await step(name, async () => {
    await page.setViewportSize({ width: w, height: h });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(BASE);
    await page.waitForTimeout(1200);
    await shot(`${name}-accueil`);
    if (await see('Nouvelle partie')) await tap('Nouvelle partie');
    else await btn('Jouer');
    await shot(`${name}-nouvelle-partie`);
    await adventure('Aventure Facile');
    await shot(`${name}-jeu`);
    await btn('PAUSE');
    await tap('Quitter · partie sauvegardée');
    await tab('Boutique');
    await shot(`${name}-boutique`);
    await tab('Jouer');
  });
}

fs.writeFileSync(out + 'report.txt', [`PASS ${passes.length}`, `FAIL ${failures.length}`, ...failures, '', 'ERRORS', ...errors].join('\n'));
console.log(`passed ${passes.length}, failed ${failures.length}`);
failures.forEach((f) => console.log('  ✗ ' + f));
console.log(errors.length ? 'errors:\n  ' + [...new Set(errors)].slice(0, 12).join('\n  ') : 'no page errors');
await browser.close();
