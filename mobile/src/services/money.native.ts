/**
 * Real money on the phone: App Store purchases (expo-iap, StoreKit 2) and AdMob rewarded videos.
 *
 * Loaded only when MONEY_READY is on and the app runs as a real build (TestFlight / App Store):
 * Expo Go does not contain these native modules. See store-services.ts.
 */
import {
  endConnection,
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Purchase,
} from 'expo-iap';
import { getTrackingPermissionsAsync, PermissionStatus, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

import { NO_ADS_PACK, packGoods, PRODUCT_IDS, productId } from '@/game/catalog';
import { useProfile } from '@/store/profile';

import { REWARDED_UNIT } from './money-config';
import type { MoneyBackend } from './money-types';

type BuyResult = Awaited<ReturnType<MoneyBackend['buy']>>;

// ───────────────────────── Purchases

/** The purchase sheet waiting for an answer, by product id (one at a time). */
const waiting = new Map<string, (r: BuyResult) => void>();
const answer = (product: string | null | undefined, r: BuyResult) => {
  if (!product) return;
  waiting.get(product)?.(r);
  waiting.delete(product);
};

/** Pays a purchase out once, then tells Apple it is delivered. */
async function deliver(p: Purchase) {
  if (p.purchaseState === 'pending') {
    // "Ask to Buy" (a parent must approve): it arrives later through this same listener.
    answer(p.productId, 'pending');
    return;
  }
  const result = useProfile.getState().grantPurchase(p.id, p.productId);
  // A product this version does not know stays unfinished, to be paid by a later version.
  if (result !== 'unknown') {
    await finishTransaction({ purchase: p, isConsumable: !packGoods(p.productId)?.noAds }).catch(() => {});
  }
  answer(p.productId, result === 'unknown' ? 'failed' : 'done');
}

/** Longest wait for an answer after the purchase sheet opens (Face ID, password…). */
const BUY_TIMEOUT_MS = 180_000;

let connecting: Promise<boolean> | null = null;
function connect(): Promise<boolean> {
  connecting ??= (async () => {
    try {
      purchaseUpdatedListener((p) => void deliver(p));
      purchaseErrorListener((e) => answer(e.productId, e.code === ErrorCode.UserCancelled ? 'cancelled' : 'failed'));
      await initConnection();
      return true;
    } catch {
      connecting = null;
      await endConnection().catch(() => {});
      return false;
    }
  })();
  return connecting;
}

// ───────────────────────── Rewarded ads

let adsReady: Promise<boolean> | null = null;
/** European consent form (Google's UMP), then Apple's tracking question, then AdMob itself. */
function startAds(): Promise<boolean> {
  adsReady ??= (async () => {
    try {
      await AdsConsent.gatherConsent().catch(() => {});
      const { canRequestAds } = await AdsConsent.getConsentInfo();
      if (!canRequestAds) {
        adsReady = null;
        return false;
      }
      if (Platform.OS === 'ios') {
        const att = await getTrackingPermissionsAsync();
        if (att.status === PermissionStatus.UNDETERMINED && att.canAskAgain) await requestTrackingPermissionsAsync();
      }
      await mobileAds().initialize();
      return true;
    } catch {
      adsReady = null;
      return false;
    }
  })();
  return adsReady;
}

const rewardedUnit = () => {
  const real = Platform.OS === 'ios' ? REWARDED_UNIT.ios : REWARDED_UNIT.android;
  return __DEV__ || !real ? TestIds.REWARDED : real;
};

/** Longest wait for an ad to load before giving up. */
const LOAD_TIMEOUT_MS = 15_000;

type AdResult = Awaited<ReturnType<MoneyBackend['showRewarded']>>;

function playRewarded(): Promise<AdResult> {
  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(rewardedUnit());
    let earned = false;
    let over = false;
    const finish = (r: AdResult) => {
      if (over) return;
      over = true;
      clearTimeout(timer);
      ad.removeAllListeners();
      ad.destroy();
      resolve(r);
    };
    const timer = setTimeout(() => finish('unavailable'), LOAD_TIMEOUT_MS);
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      clearTimeout(timer);
      ad.show().catch(() => finish('unavailable'));
    });
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned ? 'watched' : 'closed'));
    ad.addAdEventListener(AdEventType.ERROR, () => finish('unavailable'));
    ad.load();
  });
}

export const backend: MoneyBackend = {
  start: async () => {
    // Connecting replays purchases left unfinished through the listener above.
    await connect();
  },

  prices: async () => {
    if (!(await connect())) return {};
    try {
      const products = await fetchProducts({ skus: PRODUCT_IDS, type: 'in-app' });
      const out: Record<string, string> = {};
      for (const p of products ?? []) if ('displayPrice' in p) out[p.id] = p.displayPrice;
      return out;
    } catch {
      return {};
    }
  },

  buy: async (id) => {
    if (!(await connect())) return 'failed';
    if (waiting.has(id)) return 'failed';
    const result = new Promise<BuyResult>((resolve) => waiting.set(id, resolve));
    // Never leave the shop stuck if the store stays silent. A purchase that still goes through
    // later is paid out anyway by the listener.
    const timer = setTimeout(() => answer(id, 'cancelled'), BUY_TIMEOUT_MS);
    result.finally(() => clearTimeout(timer));
    try {
      await requestPurchase({ request: { apple: { sku: id }, google: { skus: [id] } }, type: 'in-app' });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      answer(id, code === ErrorCode.UserCancelled ? 'cancelled' : 'failed');
    }
    return result;
  },

  restore: async () => {
    if (!(await connect())) return false;
    try {
      await restorePurchases();
      const owned = await getAvailablePurchases();
      const noAds = owned.find((p) => p.productId === productId(NO_ADS_PACK.id));
      if (!noAds) return false;
      // Restoring gives the no-ads effect back, never a second pile of coins.
      if (!useProfile.getState().noAds) useProfile.getState().set({ noAds: true });
      return true;
    } catch {
      return false;
    }
  },

  showRewarded: async () => {
    if (!(await startAds())) return 'unavailable';
    try {
      return await playRewarded();
    } catch {
      return 'unavailable';
    }
  },

  privacyChoicesRequired: async () => {
    try {
      const info = await AdsConsent.getConsentInfo();
      return info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
    } catch {
      return false;
    }
  },

  showPrivacyChoices: async () => {
    try {
      await AdsConsent.showPrivacyOptionsForm();
    } catch {
      // Nothing to show (outside Europe, or no network).
    }
  },
};
