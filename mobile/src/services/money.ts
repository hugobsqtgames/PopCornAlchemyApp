/**
 * Stand-in for the web build: no App Store, no AdMob. The phone uses money.native.ts.
 */
import type { MoneyBackend } from './money-types';

export const backend: MoneyBackend = {
  start: async () => {},
  prices: async () => ({}),
  buy: async () => 'failed',
  restore: async () => false,
  showRewarded: async () => 'unavailable',
  privacyChoicesRequired: async () => false,
  showPrivacyChoices: async () => {},
};
