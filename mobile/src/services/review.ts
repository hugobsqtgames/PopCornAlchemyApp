/**
 * Asks for an App Store rating with Apple's own window, after a win: never from a button and
 * never with a question first (App Review rule). iOS itself shows it at most 3 times a year.
 */
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

import { dayKey, daysBetween } from '@/game/dates';
import { useProfile } from '@/store/profile';

/** Wins before the first request, and days between two requests. */
const FIRST_AFTER = 3;
const EVERY_DAYS = 60;

export async function celebrate() {
  const s = useProfile.getState();
  const moments = s.happyMoments + 1;
  s.set({ happyMoments: moments });
  if (Platform.OS === 'web' || moments < FIRST_AFTER) return;
  const today = dayKey();
  if (s.reviewAskedAt && daysBetween(s.reviewAskedAt, today) < EVERY_DAYS) return;
  try {
    if (!(await StoreReview.isAvailableAsync())) return;
    s.set({ reviewAskedAt: today });
    await StoreReview.requestReview();
  } catch {
    // No rating window today; we will try after a later win.
  }
}
