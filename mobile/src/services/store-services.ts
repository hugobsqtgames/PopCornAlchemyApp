/**
 * Ads, in-app purchases and Game Center: the one place the rest of the app talks to.
 *
 * - MONEY_READY off (version 1.0): every button that would need money is hidden.
 * - MONEY_READY on, in a real build (TestFlight, App Store): App Store purchases and AdMob
 *   rewarded videos, from money.native.ts.
 * - MONEY_READY on, in Expo Go or on the web: those native modules do not exist there, so ads
 *   are a clearly labelled placeholder and purchases say they need the App Store version.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { packGoods, productId } from '@/game/catalog';
import { rewardText } from '@/game/codes';
import { STRINGS } from '@/i18n/strings';
import { useProfile } from '@/store/profile';
import { useUi } from '@/store/ui';
import { langOf } from '@/i18n/device';

import { buzz, play } from './feedback';
import type { MoneyBackend } from './money-types';
import { suspendMusic } from './music';

/**
 * Real ads and in-app purchases. While false, every button that would need them is hidden:
 * App Review rejects buttons that do nothing. Turn on for version 1.1 (see store/VERSION_1_1.md)
 * by changing `false` to `true`. EXPO_PUBLIC_TEST_MONEY=1 turns it on for the web tests only.
 */
export const MONEY_READY = false || process.env.EXPO_PUBLIC_TEST_MONEY === '1';

/** A build with the native store and ads modules inside (not Expo Go, not the web). */
const NATIVE = MONEY_READY && Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let loaded: Promise<MoneyBackend> | null = null;
/** The native modules are loaded only when they exist: importing them in Expo Go would crash. */
const backend = () => (loaded ??= import('./money').then((m) => m.backend));

const text = () => STRINGS[langOf(useProfile.getState().lang)];

/** At launch: pays out purchases that were interrupted (app closed during the purchase…). */
export function startMoney() {
  if (NATIVE) backend().then((b) => b.start()).catch(() => {});
}

let adBusy = false;
/**
 * Shows a rewarded ad. Resolves true when the player earned the reward.
 * With the no-ads pack, the reward comes straight away, without an ad.
 */
export async function showRewardedAd(): Promise<boolean> {
  if (useProfile.getState().noAds) return true;
  if (!NATIVE) return new Promise((resolve) => useUi.getState().openAd(resolve));
  if (adBusy) return false;
  adBusy = true;
  // The ad has its own sound: the game music waits.
  suspendMusic(true);
  try {
    const r = await (await backend()).showRewarded();
    if (r === 'unavailable') Alert.alert('', text().ad_unavailable);
    return r === 'watched';
  } catch {
    return false;
  } finally {
    suspendMusic(false);
    adBusy = false;
  }
}

let buying = false;
/** Buys a pack by its short id (coins_500, no_ads…). Resolves true when it was paid out. */
export async function purchase(packId: string): Promise<boolean> {
  if (!NATIVE) {
    Alert.alert('', text().iap_unavailable);
    return false;
  }
  if (buying) return false;
  buying = true;
  try {
    const r = await (await backend()).buy(productId(packId));
    if (r === 'done') {
      const goods = packGoods(packId);
      play('buy');
      buzz('success');
      useUi.getState().toast('🍿', text().purchase_done, goods?.coins ? rewardText({ coins: goods.coins }) : '');
    } else if (r === 'pending') Alert.alert('', text().purchase_pending);
    else if (r === 'failed') Alert.alert('', text().purchase_failed);
    return r === 'done';
  } catch {
    Alert.alert('', text().purchase_failed);
    return false;
  } finally {
    buying = false;
  }
}

/** "Restore purchases": gives the no-ads pack back on a new phone. */
export async function restorePurchases(): Promise<void> {
  if (!NATIVE) {
    Alert.alert('', text().iap_unavailable);
    return;
  }
  const found = await (await backend()).restore().catch(() => false);
  Alert.alert('', found ? text().restore_done : text().restore_none);
}

/** Prices in the player's currency from the App Store, by short pack id; {} until they arrive. */
export function useStorePrices(): Record<string, string> {
  const [prices, setPrices] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!NATIVE) return;
    let alive = true;
    backend()
      .then((b) => b.prices())
      .then((byId) => {
        if (!alive) return;
        const out: Record<string, string> = {};
        for (const [id, price] of Object.entries(byId)) out[id.replace(productId(''), '')] = price;
        setPrices(out);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return prices;
}

/** Whether to show "Privacy choices for ads" in the settings (required in Europe). */
export function useAdPrivacyChoices(): boolean {
  const [needed, setNeeded] = useState(false);
  useEffect(() => {
    if (!NATIVE) return;
    let alive = true;
    backend()
      .then((b) => b.privacyChoicesRequired())
      .then((v) => alive && setNeeded(v))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return needed;
}

export function showAdPrivacyChoices() {
  if (NATIVE) backend().then((b) => b.showPrivacyChoices()).catch(() => {});
}

/** Same for the Game Center leaderboard. */
export const GAME_CENTER_READY = false;

export function submitScore(_leaderboard: string, _score: number): void {
  // Wired to Game Center in the App Store build.
}
