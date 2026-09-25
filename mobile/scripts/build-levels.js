// Builds src/game/levels.ts from the original web levels (web-original/index.html)
// plus the new levels below. Run: node scripts/build-levels.js
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

const seg = new Intl.Segmenter('fr', { granularity: 'grapheme' });
const split = (s) => [...seg.segment(s)].map((x) => x.segment);

const seen = new Set();
const all = [];
WEB.forEach((l, i) => {
  if (seen.has(l.objective) || DROPPED.has(l.objective)) return;
  seen.add(l.objective);
  const t = TR[l.objective] ? [TR[l.objective].fr, TR[l.objective].en, TR[l.objective].es] : EXTRA_TR[l.objective];
  if (!t) throw new Error('No translation for ' + l.objective);
  all.push({ id: l.id, cat: l.category, sol: l.solution, name: t, order: i });
});
NEW.forEach((n, i) => all.push({ id: 201 + i, cat: n[3], sol: split(n[4]), name: n.slice(0, 3), order: 1000 + i }));

if (all.length !== 200) throw new Error('Expected 200 levels, got ' + all.length);
// Difficulty: fewer emojis first, then the original order.
all.sort((a, b) => a.sol.length - b.sol.length || a.order - b.order);

const counts = {};
all.forEach((l) => (counts[l.cat] = (counts[l.cat] || 0) + 1));
console.log(counts);

const lines = all.map(
  (l) => `  { id: ${l.id}, cat: '${l.cat}', sol: ${JSON.stringify(l.sol)}, name: ${JSON.stringify({ fr: l.name[0], en: l.name[1], es: l.name[2] })} },`
);
const out = `// Generated by scripts/build-levels.js — edit that script, not this file.
import type { Level } from './types';

/** 200 levels sorted by difficulty: tier N = levels [20·N, 20·N + 20). */
export const LEVELS: Level[] = [
${lines.join('\n')}
];
`;
fs.writeFileSync(path.join(__dirname, '../src/game/levels.ts'), out);
console.log('wrote', all.length, 'levels');
