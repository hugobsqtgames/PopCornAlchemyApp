/** What the real store and ads code offers (money.native.ts), and its stand-in (money.ts). */
export interface MoneyBackend {
  /** Connects to the App Store and pays out purchases left unfinished (app closed mid-purchase…). */
  start(): Promise<void>;
  /** Local prices ("0,99 €", "$0.99"…) by App Store product id; empty when the store is unreachable. */
  prices(): Promise<Record<string, string>>;
  /** Opens Apple's purchase sheet. 'cancelled' when the player closed it. */
  buy(productId: string): Promise<'done' | 'cancelled' | 'pending' | 'failed'>;
  /** Restores the no-ads pack. Resolves true when it was found. */
  restore(): Promise<boolean>;
  /** Shows a rewarded video: watched to the end, closed early, or none could be shown. */
  showRewarded(): Promise<'watched' | 'closed' | 'unavailable'>;
  /** Whether the law requires a "privacy choices for ads" button (Europe…). */
  privacyChoicesRequired(): Promise<boolean>;
  showPrivacyChoices(): Promise<void>;
}
