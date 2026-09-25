/**
 * Ads, in-app purchases and Game Center.
 *
 * Expo Go cannot load AdMob, StoreKit or Game Center, so this first version keeps
 * one small interface for each and a stand-in implementation:
 *  - rewarded ads show a clearly labelled placeholder, then give the reward;
 *  - purchases explain they arrive with the App Store version and give nothing;
 *  - Game Center calls do nothing.
 * The real SDKs plug in here, behind the same functions, once the app runs as a
 * development build.
 */
import { Alert } from 'react-native';

import { useUi } from '@/store/ui';

/** Shows a rewarded ad. Resolves true when the player watched it to the end. */
export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => useUi.getState().openAd(resolve));
}

/** Buys a product by its App Store id. Resolves true when the purchase went through. */
export async function purchase(_productId: string, unavailableMessage: string): Promise<boolean> {
  Alert.alert('', unavailableMessage);
  return false;
}

export async function restorePurchases(unavailableMessage: string): Promise<void> {
  Alert.alert('', unavailableMessage);
}

export const GAME_CENTER_READY = false;

export function submitScore(_leaderboard: string, _score: number): void {
  // Wired to Game Center in the App Store build.
}
