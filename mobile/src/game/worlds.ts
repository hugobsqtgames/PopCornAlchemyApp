import type { Difficulty, Lang } from './types';

/** Small drawings placed along the path (see components/world-deco.tsx). */
export type Deco =
  | 'corn'
  | 'fence'
  | 'palm'
  | 'parasol'
  | 'mushroom'
  | 'pine'
  | 'building'
  | 'neon'
  | 'snowman'
  | 'fir'
  | 'pyramid'
  | 'cactus'
  | 'leaf'
  | 'flower'
  | 'clapper'
  | 'star'
  | 'planet'
  | 'rocket'
  | 'tower'
  | 'crown'
  | 'ship'
  | 'chest'
  | 'dino'
  | 'bone'
  | 'fish'
  | 'seaweed'
  | 'ferris'
  | 'balloon'
  | 'volcano'
  | 'rock'
  | 'column'
  | 'amphora'
  | 'cloud'
  | 'rainbow'
  | 'robot'
  | 'gear'
  | 'crystal'
  | 'iceblock'
  | 'temple'
  | 'lightning'
  | 'flame'
  | 'sunburst';

export interface World {
  name: Record<Lang, string>;
  /** Ground colour of the map in this world. */
  bg: string;
  /** Night worlds: light text and a softer trail. */
  dark: boolean;
  /** Trail dots still to walk. */
  road: string;
  /** The wooden sign at the entrance, and its text colour. */
  sign: string;
  signText: string;
  decos: [Deco, Deco];
}

const w = (fr: string, en: string, es: string, bg: string, road: string, sign: string, decos: [Deco, Deco], dark = false, signText = '#FFFFFF'): World => ({
  name: { fr, en, es },
  bg,
  dark,
  road,
  sign,
  signText,
  decos,
});

/**
 * One world per tier of 20 levels, never the same twice: a trip around the world (easy),
 * an extraordinary journey (medium), legends (hard).
 */
export const WORLDS: Record<Difficulty, World[]> = {
  1: [
    w('Le Champ de maïs', 'The Corn Field', 'El Campo de Maíz', '#CDEBB0', '#9CC47A', '#8B5A2B', ['corn', 'fence']),
    w('La Plage Caramel', 'Caramel Beach', 'La Playa Caramelo', '#F9E3B0', '#E0C084', '#2F8FC0', ['palm', 'parasol']),
    w('La Forêt Enchantée', 'The Enchanted Forest', 'El Bosque Encantado', '#BFE0C8', '#86B894', '#2F6B3D', ['mushroom', 'pine']),
    w('La Ville Néon', 'Neon City', 'La Ciudad Neón', '#2A1A4E', '#5B4A8A', '#FF4FA3', ['building', 'neon'], true),
    w('Les Neiges Givrées', 'The Frosty Snows', 'Las Nieves Heladas', '#E6F4FB', '#A9CBE0', '#3E8EDB', ['snowman', 'fir']),
    w('Le Désert des Pharaons', "The Pharaohs' Desert", 'El Desierto de los Faraones', '#F7D29C', '#D9A866', '#B5651D', ['pyramid', 'cactus']),
    w('La Jungle Sauvage', 'The Wild Jungle', 'La Selva Salvaje', '#9FD7A6', '#5FA56B', '#1F7A4A', ['leaf', 'flower']),
    w('Le Studio Hollywood', 'The Hollywood Studio', 'El Estudio Hollywood', '#F6D3D3', '#D98C8C', '#B32626', ['clapper', 'star']),
    w("L'Espace Pop", 'Pop Space', 'El Espacio Pop', '#1A1F4A', '#3E4B8A', '#7B6CF6', ['planet', 'rocket'], true),
    w('Le Château Doré', 'The Golden Castle', 'El Castillo Dorado', '#FFEBB0', '#E0C06A', '#D9A01A', ['tower', 'crown'], false, '#1F1B2D'),
  ],
  2: [
    w("L'Île aux Pirates", 'Pirate Island', 'La Isla Pirata', '#7CC8E6', '#3C8FB5', '#6B4423', ['ship', 'chest']),
    w('La Vallée des Dinosaures', 'Dinosaur Valley', 'El Valle de los Dinosaurios', '#CFE3A0', '#9DB86A', '#6FA83E', ['dino', 'bone']),
    w('Le Fond des Mers', 'The Deep Sea', 'El Fondo del Mar', '#1C5D8C', '#2E7BB0', '#0B3F66', ['fish', 'seaweed'], true),
    w('La Fête Foraine', 'The Funfair', 'La Feria', '#FBD3E6', '#E39BBE', '#7B3FA0', ['ferris', 'balloon']),
    w('Le Volcan', 'The Volcano', 'El Volcán', '#4A1C1C', '#7A3A2A', '#FF7A1A', ['volcano', 'rock'], true),
    w('La Cité Romaine', 'The Roman City', 'La Ciudad Romana', '#F3E3C0', '#D6BE8C', '#B48A4E', ['column', 'amphora']),
    w('Le Royaume des Nuages', 'The Cloud Kingdom', 'El Reino de las Nubes', '#E3DBFB', '#B9AAE8', '#7B6CF6', ['cloud', 'rainbow']),
  ],
  3: [
    w('La Cité des Robots', 'Robot City', 'La Ciudad de los Robots', '#1B2A44', '#34507A', '#45E3FF', ['robot', 'gear'], true, '#1F1B2D'),
    w('Le Labyrinthe de Glace', 'The Ice Maze', 'El Laberinto de Hielo', '#D5EEF9', '#9CCDE6', '#3E8EDB', ['crystal', 'iceblock']),
    w('Le Mont Olympe', 'Mount Olympus', 'El Monte Olimpo', '#5B3F9E', '#8069C0', '#FFC93C', ['temple', 'lightning'], true, '#1F1B2D'),
    w('Le Cœur du Soleil', 'The Heart of the Sun', 'El Corazón del Sol', '#7A2A12', '#B0502A', '#FF7A1A', ['flame', 'sunburst'], true),
  ],
};

/** The world of tier `tier` (0-based) in the adventure of difficulty `d`. */
export function worldOf(d: Difficulty, tier: number): World {
  const list = WORLDS[d];
  return list[Math.max(0, Math.min(list.length - 1, tier))];
}
