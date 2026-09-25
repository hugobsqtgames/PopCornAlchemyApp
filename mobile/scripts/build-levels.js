// Builds src/game/levels.ts from the original web levels (web-original/index.html),
// the levels added for 1.0 below and the ones in levels-more.js. Run: node scripts/build-levels.js
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../../web-original/index.html'), 'utf8');
const la = html.indexOf('const LEVELS = [') + 'const LEVELS = '.length;
const WEB = eval('(' + html.slice(la, html.indexOf('];', la) + 1) + ')');
const ta = html.indexOf('objectiveTranslations: {') + 'objectiveTranslations: '.length;
const TR = eval('(' + html.slice(ta, html.indexOf('updateStats(key')).trim().replace(/,\s*$/, '') + ')');

const DROPPED = new Set([
  "L'Exorciste", 'Saw', 'Gravity', 'Seul sur Mars', 'Blade Runner', 'Mad Max: Fury Road', 'Avatar',
  'Black Panther', 'Terminator', 'King Kong', 'Cars', 'Mission Impossible', 'Fast & Furious', 'Casey Neistat',
]);

// Names the web version never translated.
const EXTRA_TR = {
  Pizza: ['Pizza', 'Pizza', 'Pizza'], Sushi: ['Sushi', 'Sushi', 'Sushi'], Burger: ['Burger', 'Burger', 'Hamburguesa'],
  Tacos: ['Tacos', 'Tacos', 'Tacos'], Croissant: ['Croissant', 'Croissant', 'Cruasán'], Paella: ['Paella', 'Paella', 'Paella'],
  Ramen: ['Ramen', 'Ramen', 'Ramen'], Glace: ['Glace', 'Ice cream', 'Helado'], 'Pâtes': ['Pâtes', 'Pasta', 'Pasta'],
  Fondue: ['Fondue', 'Fondue', 'Fondue'], 'Logan Paul': ['Logan Paul', 'Logan Paul', 'Logan Paul'],
  Markiplier: ['Markiplier', 'Markiplier', 'Markiplier'], Cyprien: ['Cyprien', 'Cyprien', 'Cyprien'], Norman: ['Norman', 'Norman', 'Norman'],
};

// [fr, en, es, category, solution]
const NEW = [
  ['Beyoncé', 'Beyoncé', 'Beyoncé', 'music', '🐝👑🎤'],
  ['Friends', 'Friends', 'Friends', 'series', '🛋️☕👯'],
  ['The Office', 'The Office', 'The Office', 'series', '🏢📎🖨️'],
  ['Les Simpson', 'The Simpsons', 'Los Simpson', 'series', '🍩🟡👨‍👩‍👧‍👦'],
  ['Lupin', 'Lupin', 'Lupin', 'series', '🎩💎🇫🇷'],
  ['Mercredi', 'Wednesday', 'Miércoles', 'series', '🖤🖐️🎻'],
  ['The Mandalorian', 'The Mandalorian', 'The Mandalorian', 'series', '🪖👶🟢'],
  ['Dark', 'Dark', 'Dark', 'series', '⏳🕳️🌲'],
  ['Sherlock', 'Sherlock', 'Sherlock', 'series', '🔍🎻🇬🇧'],
  ['Prison Break', 'Prison Break', 'Prison Break', 'series', '🔒🏃🗺️'],
  ['Emily in Paris', 'Emily in Paris', 'Emily en París', 'series', '🗼👠📱'],
  ['The Crown', 'The Crown', 'The Crown', 'series', '👑🏰🇬🇧'],
  ['LEGO', 'LEGO', 'LEGO', 'brand', '🧱🟥🟨'],
  ['Ferrari', 'Ferrari', 'Ferrari', 'brand', '🏎️🐎🇮🇹'],
  ['Red Bull', 'Red Bull', 'Red Bull', 'brand', '🐂🐂🥫'],
  ['Nintendo', 'Nintendo', 'Nintendo', 'brand', '🎮🍄🇯🇵'],
  ['IKEA', 'IKEA', 'IKEA', 'brand', '🪑🇸🇪📦'],
  ['Spotify', 'Spotify', 'Spotify', 'brand', '🎧🟢🎵'],
  ['Lacoste', 'Lacoste', 'Lacoste', 'brand', '🐊👕🇫🇷'],
  ['PlayStation', 'PlayStation', 'PlayStation', 'brand', '🎮🔺⭕'],
  ['Espagne', 'Spain', 'España', 'geo', '🇪🇸💃'],
  ['Allemagne', 'Germany', 'Alemania', 'geo', '🇩🇪🥨'],
  ['Inde', 'India', 'India', 'geo', '🇮🇳🐘'],
  ['Mexique', 'Mexico', 'México', 'geo', '🇲🇽🌵'],
  ['Grèce', 'Greece', 'Grecia', 'geo', '🇬🇷🏛️'],
  ['Russie', 'Russia', 'Rusia', 'geo', '🇷🇺🪆'],
  ['Suisse', 'Switzerland', 'Suiza', 'geo', '🇨🇭🏔️'],
  ['Pays-Bas', 'Netherlands', 'Países Bajos', 'geo', '🇳🇱🌷'],
  ['Éléphant', 'Elephant', 'Elefante', 'nature', '🐘💦'],
  ['Panda', 'Panda', 'Panda', 'nature', '🐼🎋'],
  ['Requin', 'Shark', 'Tiburón', 'nature', '🦈🐟'],
  ['Koala', 'Koala', 'Koala', 'nature', '🐨🌿'],
  ['Écureuil', 'Squirrel', 'Ardilla', 'nature', '🐿️🌰'],
  ['Araignée', 'Spider', 'Araña', 'nature', '🕷️🕸️'],
  ['Flamant rose', 'Flamingo', 'Flamenco', 'nature', '🦩🦐'],
  ['Volcan', 'Volcano', 'Volcán', 'nature', '🌋🔥'],
  ['Arc-en-ciel', 'Rainbow', 'Arcoíris', 'nature', '☔☀️'],
  ['Crêpe', 'Crêpe', 'Crepe', 'food', '🥞🇫🇷🍫'],
  ['Hot-dog', 'Hot dog', 'Perrito caliente', 'food', '🌭🇺🇸'],
  ['Kebab', 'Kebab', 'Kebab', 'food', '🥙🇹🇷'],
  ['Donut', 'Donut', 'Dónut', 'food', '🍩🍫☕'],
  ['Raclette', 'Raclette', 'Raclette', 'food', '🧀🥔🔥'],
  ['Sailor Moon', 'Sailor Moon', 'Sailor Moon', 'anime', '🌙👧🎀'],
  ['Mon voisin Totoro', 'My Neighbor Totoro', 'Mi vecino Totoro', 'anime', '🌳☔🐾'],
  ['Le Voyage de Chihiro', 'Spirited Away', 'El viaje de Chihiro', 'anime', '🐉🛁👧'],
  ['Doraemon', 'Doraemon', 'Doraemon', 'anime', '🐱🔵🔔'],
  ['One Punch Man', 'One Punch Man', 'One Punch Man', 'anime', '👊👨‍🦲🦸'],
  ['Chainsaw Man', 'Chainsaw Man', 'Chainsaw Man', 'anime', '🪚🐶😈'],
  ['Spy x Family', 'Spy x Family', 'Spy x Family', 'anime', '🕵️🔫🥜'],
  ['Blue Lock', 'Blue Lock', 'Blue Lock', 'anime', '⚽🔒🔵'],
];

// Difficulty of the first 200 levels: 1 easy, 3 hard, 2 for everything else.
const EASY = new Set([
  1, 10, 19, 27, 36, 53, 60, 61, 69, 70, 77, 86, 87, 90, 91, 95, 101, // movies
  5, 14, 23, 40, 49, 57, 64, 213, // brands
  6, 15, 24, 32, 41, 50, 58, 65, 74, 82, 221, 222, 223, 224, // countries
  7, 16, 33, 42, 59, 66, 92, 229, 230, 231, 232, 233, 234, 236, // nature
  239, 240, 9, 18, 26, 35, 44, 76, 85, 238, 241, // food
  162, 204, 3, 12, 55, 62, // Dragon Ball, Simpsons, Mario, Pokémon, Pac-Man, Tetris
]);
const HARD = new Set([
  120, 129, 133, 134, 138, 143, 147, // movies
  113, // Poutine
  39, 48, 63, 80, 89, 98, 111, 117, 124, 137, // music
  8, 25, 34, 43, 51, 67, 75, 84, 93, 107, 119, 125, 135, 144, 158, 159, 170, // YouTubers (MrBeast stays medium)
  163, 164, 165, 166, 167, 168, 169, 247, 248, 249, 250, // anime
  207, 208, 20, 28, 37, 46, 54, // series
  79, 88, 97, 103, 110, 116, 123, 130, 136, // video games
]);
const diff = (id) => (EASY.has(id) ? 1 : HARD.has(id) ? 3 : 2);

const seg = new Intl.Segmenter('fr', { granularity: 'grapheme' });
const split = (s) => [...seg.segment(s)].map((x) => x.segment);

const seen = new Set();
const all = [];
WEB.forEach((l, i) => {
  if (seen.has(l.objective) || DROPPED.has(l.objective)) return;
  seen.add(l.objective);
  const t = TR[l.objective] ? [TR[l.objective].fr, TR[l.objective].en, TR[l.objective].es] : EXTRA_TR[l.objective];
  if (!t) throw new Error('No translation for ' + l.objective);
  all.push({ id: l.id, cat: l.category, sol: l.solution, name: t, d: diff(l.id), order: i });
});
NEW.forEach((n, i) => all.push({ id: 201 + i, cat: n[3], sol: split(n[4]), name: n.slice(0, 3), d: diff(201 + i), order: 1000 + i }));
require('./levels-more').forEach((n, i) =>
  all.push({ id: 251 + i, cat: n[3], sol: split(n[4]), name: n.slice(0, 3), d: n[5], order: 2000 + i })
);

if (all.length !== 400) throw new Error('Expected 400 levels, got ' + all.length);
// Easy levels first, then fewer emojis first, then the original order.
all.sort((a, b) => a.d - b.d || a.sol.length - b.sol.length || a.order - b.order);

// Two levels with the same answer would be confusing.
const answers = new Map();
for (const l of all) {
  const key = [...l.sol].sort().join('');
  if (answers.has(key)) throw new Error(`Same solution for ${answers.get(key)} and ${l.name[0]}`);
  answers.set(key, l.name[0]);
}

const counts = {};
all.forEach((l) => (counts[l.cat] = (counts[l.cat] || 0) + 1));
console.log(counts, [1, 2, 3].map((d) => all.filter((l) => l.d === d).length));

const lines = all.map(
  (l) => `  { id: ${l.id}, cat: '${l.cat}', d: ${l.d}, sol: ${JSON.stringify(l.sol)}, name: ${JSON.stringify({ fr: l.name[0], en: l.name[1], es: l.name[2] })} },`
);
const out = `// Generated by scripts/build-levels.js — edit that script, not this file.
import type { Level } from './types';

/** 400 levels, easy (d: 1) then medium then hard, fewer emojis first inside each difficulty. */
export const LEVELS: Level[] = [
${lines.join('\n')}
];
`;
fs.writeFileSync(path.join(__dirname, '../src/game/levels.ts'), out);
console.log('wrote', all.length, 'levels');
