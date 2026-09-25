import type { ThemeId } from '@/game/catalog';

export interface Palette {
  dark: boolean;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  line2: string;
  sunk: string;
  /** The single action colour (main buttons). */
  action: string;
  actionDeep: string;
  onAction: string;
  actionTint: string;
  gold: string;
  goldDeep: string;
  goldTint: string;
  green: string;
  greenDeep: string;
  greenTint: string;
  blueTint: string;
  lilacTint: string;
  mintTint: string;
  /** Border width of cards and tiles (the retro theme is chunkier). */
  border: number;
}

const popcornLight: Palette = {
  dark: false,
  bg: '#FBF6EC',
  surface: '#FFFFFF',
  ink: '#1F1B2D',
  muted: '#6E6882',
  line: '#ECE3D2',
  line2: '#DDD2BD',
  sunk: '#F3ECDF',
  action: '#D93A3A',
  actionDeep: '#A92A2A',
  onAction: '#FFFFFF',
  actionTint: '#FDE9E6',
  gold: '#FFC93C',
  goldDeep: '#D9A01A',
  goldTint: '#FFF3D1',
  green: '#1FA463',
  greenDeep: '#15803D',
  greenTint: '#DDF4E7',
  blueTint: '#E4EEFB',
  lilacTint: '#EEE8FB',
  mintTint: '#DFF5EF',
  border: 1.5,
};

const popcornDark: Palette = {
  ...popcornLight,
  dark: true,
  bg: '#15121E',
  surface: '#221E2E',
  ink: '#F5F0E6',
  muted: '#A9A2BC',
  line: '#302A40',
  line2: '#3D3652',
  sunk: '#1B1726',
  actionDeep: '#8E2222',
  actionTint: '#3A2129',
  goldDeep: '#A87B0F',
  goldTint: '#3A3120',
  green: '#2BB673',
  greenTint: '#1E3A2C',
  blueTint: '#1F2A3D',
  lilacTint: '#2A2440',
  mintTint: '#1C3531',
};

const PALETTES: Record<ThemeId, { light: Palette; dark: Palette }> = {
  popcorn: { light: popcornLight, dark: popcornDark },
  mint: {
    light: { ...popcornLight, bg: '#EAF6F1', sunk: '#DCEFE7', line: '#D3E9DF', line2: '#BCDCCF', action: '#1A7A62', actionDeep: '#115644', actionTint: '#D2EEE4' },
    dark: { ...popcornDark, bg: '#0F1D19', surface: '#172924', sunk: '#12231E', line: '#24403A', line2: '#2E5049', action: '#1A7A62', actionDeep: '#0E4A3B', actionTint: '#1C3A33' },
  },
  lavender: {
    light: { ...popcornLight, bg: '#F1EEFA', sunk: '#E7E2F6', line: '#E0DAF3', line2: '#CEC5EC', action: '#6A4FD8', actionDeep: '#4B35A8', actionTint: '#E6E0FA' },
    dark: { ...popcornDark, bg: '#15122A', surface: '#211C3B', sunk: '#1A1631', line: '#322B55', line2: '#3E366A', action: '#6A4FD8', actionDeep: '#40309A', actionTint: '#2C2552' },
  },
  midnight: {
    light: { ...popcornDark, bg: '#0F1B33', surface: '#1B2A4A', sunk: '#132341', line: '#27395E', line2: '#324870', action: '#FFC93C', actionDeep: '#B8860B', onAction: '#1F1B2D', actionTint: '#2A3656' },
    dark: { ...popcornDark, bg: '#0F1B33', surface: '#1B2A4A', sunk: '#132341', line: '#27395E', line2: '#324870', action: '#FFC93C', actionDeep: '#B8860B', onAction: '#1F1B2D', actionTint: '#2A3656' },
  },
  cinema: {
    light: { ...popcornDark, bg: '#2A0A12', surface: '#3D1420', sunk: '#330E19', line: '#5A2433', line2: '#6E2E40', action: '#FFC93C', actionDeep: '#B8860B', onAction: '#1F1B2D', actionTint: '#4A1A28' },
    dark: { ...popcornDark, bg: '#2A0A12', surface: '#3D1420', sunk: '#330E19', line: '#5A2433', line2: '#6E2E40', action: '#FFC93C', actionDeep: '#B8860B', onAction: '#1F1B2D', actionTint: '#4A1A28' },
  },
  retro: {
    light: { ...popcornLight, bg: '#FDF6E3', ink: '#2D2D2D', muted: '#5C5C5C', line: '#2D2D2D', line2: '#000000', action: '#C2185B', actionDeep: '#000000', actionTint: '#FCE4EC', gold: '#FFC107', goldDeep: '#000000', border: 3 },
    dark: { ...popcornLight, bg: '#1A1A1A', surface: '#2D2D2D', sunk: '#232323', ink: '#FDF6E3', muted: '#BDBDBD', line: '#FDF6E3', line2: '#000000', action: '#C2185B', actionDeep: '#000000', actionTint: '#4A1A2C', gold: '#FFC107', goldDeep: '#000000', dark: true, goldTint: '#3A3120', greenTint: '#1E3A2C', blueTint: '#1F2A3D', lilacTint: '#2A2440', mintTint: '#1C3531', border: 3 },
  },
};

export function paletteFor(theme: ThemeId, dark: boolean): Palette {
  const p = PALETTES[theme] ?? PALETTES.popcorn;
  return dark ? p.dark : p.light;
}

export const FONTS = {
  regular: 'Rubik_400Regular',
  medium: 'Rubik_500Medium',
  semibold: 'Rubik_600SemiBold',
  bold: 'Rubik_700Bold',
  heavy: 'Rubik_800ExtraBold',
  pixel: 'PressStart2P_400Regular',
} as const;
