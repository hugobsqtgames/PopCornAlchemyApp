/** Everything the shop sells for coins. */

export const STYLES = ['🍿', '🍦', '🍕', '🌮', '🍩', '🍔', '🍣', '🍫', '🍪', '🍰', '🧁', '🥧', '🥨', '🥞', '🧇', '🥓'];

export function stylePrice(index: number): number {
  return index * 150;
}

/** +5 % score per style rank. */
export function styleBonus(style: string): number {
  return 1 + Math.max(0, STYLES.indexOf(style)) * 0.05;
}

export const AVATARS = ['🍿', '😎', '🧙', '🧛', '🤖', '👽', '👻', '🦄', '🦁', '🐯', '🐼', '🦊', '🐨', '🐸', '🐙', '🐲'];

export type ThemeId = 'popcorn' | 'mint' | 'lavender' | 'midnight' | 'cinema' | 'retro';

export const THEMES: { id: ThemeId; price: number }[] = [
  { id: 'popcorn', price: 0 },
  { id: 'mint', price: 400 },
  { id: 'lavender', price: 600 },
  { id: 'midnight', price: 800 },
  { id: 'cinema', price: 1200 },
  { id: 'retro', price: 2000 },
];

/** Real-money packs. Ids must match the products created in App Store Connect. */
export const COIN_PACKS = [
  { id: 'coins_500', coins: 500, icon: '🍿', price: '0,99 €', bonus: 0 },
  { id: 'coins_1200', coins: 1200, icon: '🥡', price: '1,99 €', bonus: 20 },
  { id: 'coins_3500', coins: 3500, icon: '🪣', price: '4,99 €', bonus: 40, flag: 'popular' as const },
  { id: 'coins_8000', coins: 8000, icon: '🎬', price: '9,99 €', bonus: 60, flag: 'best' as const },
];

export const NO_ADS_PACK = { id: 'no_ads', coins: 1000, price: '3,99 €' };

/** App Store product ids: the bundle id, then the pack id (e.g. com.hugobsqt.popcornalchemy.coins_500). */
export const PRODUCT_PREFIX = 'com.hugobsqt.popcornalchemy.';
export const productId = (packId: string) => PRODUCT_PREFIX + packId;
export const PRODUCT_IDS = [...COIN_PACKS.map((p) => p.id), NO_ADS_PACK.id].map(productId);

/** What a pack gives, from its App Store id or its short id; null for an unknown product. */
export function packGoods(id: string): { coins: number; noAds: boolean } | null {
  const short = id.startsWith(PRODUCT_PREFIX) ? id.slice(PRODUCT_PREFIX.length) : id;
  if (short === NO_ADS_PACK.id) return { coins: NO_ADS_PACK.coins, noAds: true };
  const pack = COIN_PACKS.find((p) => p.id === short);
  return pack ? { coins: pack.coins, noAds: false } : null;
}
