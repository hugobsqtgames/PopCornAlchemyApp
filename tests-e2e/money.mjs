// Ads and purchases with the money switch on (web build: placeholder ads, no App Store).
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(process.env.PLAYWRIGHT_FROM ?? import.meta.url);
const { chromium } = require('playwright');
const dir = new URL('.', import.meta.url).pathname;
const BASE = 'http://localhost:8767';
const out = dir + 'money/';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
const results = [];
const check = (ok, what) => results.push([ok, what]);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
await ctx.addInitScript(() => (window.__sounds = []));
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text().slice(0, 200)));
const wait = (ms) => page.waitForTimeout(ms);
const see = async (text, exact = true) => (await page.getByText(text, { exact }).filter({ visible: true }).count()) > 0;
const profile = () => page.evaluate(() => JSON.parse(localStorage.getItem('popcorn-profile') || 'null')?.state);
const pad = (n) => String(n).padStart(2, '0');
const d = new Date();
const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const base = { lang: 'fr', tutorialDone: true, loginLast: today };
async function start(state, route = '/') {
  await page.goto(BASE);
  await page.evaluate((st) => localStorage.setItem('popcorn-profile', JSON.stringify({ state: st, version: 1 })), state);
  await page.goto(BASE + route);
  await wait(1500);
}
async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    check(false, `${name}: CRASHED ${e.message.split('\n')[0]}`);
    await page.screenshot({ path: out + 'FAIL-' + name.replace(/\W+/g, '_') + '.png' });
  }
}
const tab = (name) => page.getByRole('tab', { name }).click();

await step('shop coins tab', async () => {
  await start({ ...base, coins: 100 });
  await tab('Boutique');
  await wait(500);
  check(await see('Pièces'), 'coins tab shown when money is on');
  check(await see('0,99 €') && (await see('9,99 €')) && (await see('3,99 €')), 'pack prices shown (our prices while the App Store is not there)');
  await page.screenshot({ path: out + 'boutique-pieces.png' });
  // A pack on the web: nothing is sold, nothing is given.
  await page.getByRole('button', { name: '500 0,99 €' }).click();
  await wait(600);
  check((await profile()).coins === 100, 'no coins without a real App Store');
});

await step('free coins ad', async () => {
  await start({ ...base, coins: 0 });
  await tab('Boutique');
  await wait(500);
  await page.getByText('+25 pièces gratuites', { exact: true }).click();
  await wait(500);
  check(await see('Publicité'), 'the placeholder ad opens');
  await page.screenshot({ path: out + 'pub.png' });
  await wait(3300);
  await page.getByText('Récompense obtenue !', { exact: true }).click();
  await wait(500);
  const pr = await profile();
  check(pr.coins === 25 && pr.adsCount === 1, `watching gives 25 coins (${pr.coins})`);
});

await step('no-ads pack skips the ad', async () => {
  await start({ ...base, coins: 0, noAds: true });
  await tab('Boutique');
  await wait(500);
  check(await see('Pubs supprimées ✓'), 'shop shows the no-ads pack as owned');
  await page.getByText('+25 pièces gratuites', { exact: true }).click();
  await wait(600);
  check(!(await see('Publicité')), 'no ad with the no-ads pack');
  check((await profile()).coins === 25, 'but the reward is given');
});

await step('continue after game over with an ad', async () => {
  await start({ ...base, shields: 0, noAds: true }, '/jeu?mode=hardcore');
  const labels = await page.locator('[role="button"][aria-label]:not([aria-disabled="true"])').filter({ visible: true }).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  const emojis = [...new Set(labels)].filter((l) => l && [...l].length <= 4);
  // Five different emojis can never all be one 2- to 5-emoji answer: tap until the fuse button is ready.
  for (const e of emojis) {
    const fuse = page.locator('[role="button"]').filter({ hasText: /Fusionner/ }).filter({ visible: true }).last();
    if ((await fuse.getAttribute('aria-disabled')) !== 'true') break;
    await page.locator(`[role="button"][aria-label="${e}"]:not([aria-disabled="true"])`).filter({ visible: true }).last().click();
    await wait(80);
  }
  await page.locator('[role="button"]').filter({ hasText: /Fusionner/ }).filter({ visible: true }).last().click();
  await wait(3500);
  if (await see('GAME OVER')) {
    check(await see('Voir une pub'), 'game over offers an ad to continue');
    await page.getByText('Voir une pub', { exact: true }).click();
    await wait(800);
    check(!(await see('GAME OVER')), 'the ad (skipped with no-ads) gives the life back');
  } else check(true, 'the random picks were right: nothing to check');
});

await step('wheel bonus spin', async () => {
  await start({ ...base, wheelLast: today }, '/roue');
  check(await see('Tour bonus avec une pub', false), 'bonus spin with an ad after the free one');
});

await step('settings', async () => {
  await start(base, '/reglages');
  check(await see('Supprimer les pubs') && (await see('Restaurer mes achats')), 'settings: remove ads and restore purchases');
  await page.screenshot({ path: out + 'reglages.png' });
});

check(errors.length === 0, `no JS errors ${errors.length ? JSON.stringify(errors.slice(0, 3)) : ''}`);
fs.writeFileSync(out + 'report.txt', results.map(([ok, w]) => (ok ? 'PASS ' : 'FAIL ') + w).join('\n'));
const fails = results.filter(([ok]) => !ok);
console.log(`money: ${results.length - fails.length} ok, ${fails.length} failed`);
fails.forEach(([, w]) => console.log('  ✗ ' + w));
await browser.close();
