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

/** The big scenery along both edges of the map, one per world. */
export type Terrain =
  | 'hills'
  | 'sea'
  | 'forest'
  | 'skyline'
  | 'mountains'
  | 'dunes'
  | 'jungle'
  | 'curtain'
  | 'space'
  | 'castle'
  | 'island'
  | 'cliffs'
  | 'reef'
  | 'tents'
  | 'lava'
  | 'ruins'
  | 'clouds'
  | 'crystals'
  | 'flares';

/** Small marks spread over the ground. */
export type Texture = 'tuft' | 'dot' | 'sparkle' | 'star' | 'bubble' | 'wave' | 'crack' | 'confetti';

export interface Scene {
  terrain: Terrain;
  /** Main colour of the edge scenery, and its detail colour (foam, snow, lights, roofs…). */
  near: string;
  accent: string;
  texture: Texture;
}

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
  scene: Scene;
}

const w = (
  fr: string,
  en: string,
  es: string,
  bg: string,
  road: string,
  sign: string,
  decos: [Deco, Deco],
  scene: Scene,
  dark = false,
  signText = '#FFFFFF',
): World => ({
  name: { fr, en, es },
  bg,
  dark,
  road,
  sign,
  signText,
  decos,
  scene,
});

const sc = (terrain: Terrain, near: string, accent: string, texture: Texture): Scene => ({ terrain, near, accent, texture });

/**
 * One world per tier of 20 levels, never the same twice: a trip around the world (easy),
 * an extraordinary journey (medium), legends (hard).
 */
export const WORLDS: Record<Difficulty, World[]> = {
  1: [
    w('Le Champ de maïs', 'The Corn Field', 'El Campo de Maíz', '#CDEBB0', '#9CC47A', '#8B5A2B', ['corn', 'fence'], sc('hills', '#A6DB82', '#86C062', 'tuft')),
    w('La Plage Caramel', 'Caramel Beach', 'La Playa Caramelo', '#F9E3B0', '#E0C084', '#2F8FC0', ['palm', 'parasol'], sc('sea', '#5BC0EB', '#FFFFFF', 'dot')),
    w('La Forêt Enchantée', 'The Enchanted Forest', 'El Bosque Encantado', '#BFE0C8', '#86B894', '#2F6B3D', ['mushroom', 'pine'], sc('forest', '#2F7A43', '#4E9E5F', 'tuft')),
    w('La Ville Néon', 'Neon City', 'La Ciudad Neón', '#2A1A4E', '#5B4A8A', '#FF4FA3', ['building', 'neon'], sc('skyline', '#170D33', '#FF4FA3', 'star'), true),
    w('Les Neiges Givrées', 'The Frosty Snows', 'Las Nieves Heladas', '#E6F4FB', '#A9CBE0', '#3E8EDB', ['snowman', 'fir'], sc('mountains', '#A9CBE0', '#FFFFFF', 'sparkle')),
    w('Le Désert des Pharaons', "The Pharaohs' Desert", 'El Desierto de los Faraones', '#F7D29C', '#D9A866', '#B5651D', ['pyramid', 'cactus'], sc('dunes', '#EBAE62', '#FFE0A8', 'dot')),
    w('La Jungle Sauvage', 'The Wild Jungle', 'La Selva Salvaje', '#9FD7A6', '#5FA56B', '#1F7A4A', ['leaf', 'flower'], sc('jungle', '#2E8B4F', '#57B86F', 'tuft')),
    w('Le Studio Hollywood', 'The Hollywood Studio', 'El Estudio Hollywood', '#F6D3D3', '#D98C8C', '#B32626', ['clapper', 'star'], sc('curtain', '#B32626', '#FFC93C', 'star')),
    w("L'Espace Pop", 'Pop Space', 'El Espacio Pop', '#1A1F4A', '#3E4B8A', '#7B6CF6', ['planet', 'rocket'], sc('space', '#7B6CF6', '#FF7AB6', 'star'), true),
    w('Le Château Doré', 'The Golden Castle', 'El Castillo Dorado', '#FFEBB0', '#E0C06A', '#D9A01A', ['tower', 'crown'], sc('castle', '#E8C766', '#D93A3A', 'sparkle'), false, '#1F1B2D'),
  ],
  2: [
    w("L'Île aux Pirates", 'Pirate Island', 'La Isla Pirata', '#7CC8E6', '#3C8FB5', '#6B4423', ['ship', 'chest'], sc('island', '#F3D9A0', '#FFFFFF', 'wave')),
    w('La Vallée des Dinosaures', 'Dinosaur Valley', 'El Valle de los Dinosaurios', '#CFE3A0', '#9DB86A', '#6FA83E', ['dino', 'bone'], sc('cliffs', '#B89B72', '#7DB85A', 'tuft')),
    w('Le Fond des Mers', 'The Deep Sea', 'El Fondo del Mar', '#1C5D8C', '#2E7BB0', '#0B3F66', ['fish', 'seaweed'], sc('reef', '#123E60', '#FF7A8A', 'bubble'), true),
    w('La Fête Foraine', 'The Funfair', 'La Feria', '#FBD3E6', '#E39BBE', '#7B3FA0', ['ferris', 'balloon'], sc('tents', '#E8455E', '#FFFFFF', 'confetti')),
    w('Le Volcan', 'The Volcano', 'El Volcán', '#4A1C1C', '#7A3A2A', '#FF7A1A', ['volcano', 'rock'], sc('lava', '#240A0A', '#FF7A1A', 'crack'), true),
    w('La Cité Romaine', 'The Roman City', 'La Ciudad Romana', '#F3E3C0', '#D6BE8C', '#B48A4E', ['column', 'amphora'], sc('ruins', '#E8D6A8', '#C4A874', 'dot')),
    w('Le Royaume des Nuages', 'The Cloud Kingdom', 'El Reino de las Nubes', '#E3DBFB', '#B9AAE8', '#7B6CF6', ['cloud', 'rainbow'], sc('clouds', '#FFFFFF', '#CFC4F3', 'sparkle')),
  ],
  3: [
    w('La Cité des Robots', 'Robot City', 'La Ciudad de los Robots', '#1B2A44', '#34507A', '#45E3FF', ['robot', 'gear'], sc('skyline', '#0C1424', '#45E3FF', 'dot'), true, '#1F1B2D'),
    w('Le Labyrinthe de Glace', 'The Ice Maze', 'El Laberinto de Hielo', '#D5EEF9', '#9CCDE6', '#3E8EDB', ['crystal', 'iceblock'], sc('crystals', '#8FD0EE', '#E6F8FF', 'sparkle')),
    w('Le Mont Olympe', 'Mount Olympus', 'El Monte Olimpo', '#5B3F9E', '#8069C0', '#FFC93C', ['temple', 'lightning'], sc('clouds', '#EDE6FF', '#FFC93C', 'sparkle'), true, '#1F1B2D'),
    w('Le Cœur du Soleil', 'The Heart of the Sun', 'El Corazón del Sol', '#7A2A12', '#B0502A', '#FF7A1A', ['flame', 'sunburst'], sc('flares', '#FF9A3C', '#FFD34D', 'crack'), true),
  ],
};

/** The world of tier `tier` (0-based) in the adventure of difficulty `d`. */
export function worldOf(d: Difficulty, tier: number): World {
  const list = WORLDS[d];
  return list[Math.max(0, Math.min(list.length - 1, tier))];
}
