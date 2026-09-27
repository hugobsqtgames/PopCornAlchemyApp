/**
 * Daily challenge reminder, at 6 pm local time, as local notifications (no server, no data sent).
 * The next 7 evenings are scheduled each time the app opens or the daily is done, skipping
 * today when the daily is already done: someone who stops playing gets no more than a week of reminders.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { dayKey } from '@/game/dates';
import { STRINGS } from '@/i18n/strings';
import { useProfile } from '@/store/profile';

const WEB = Platform.OS === 'web';
const HOUR = 18;
const DAYS = 7;

if (!WEB) {
  // A reminder that fires while the app is open still shows as a banner.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
  });
}

/** Asks the iPhone for permission and turns the reminder on. Resolves false if the player said no. */
export async function enableReminder(): Promise<boolean> {
  useProfile.getState().set({ reminderAsked: true });
  if (WEB) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    useProfile.getState().set({ reminder: granted });
    await scheduleReminders();
    return granted;
  } catch {
    return false;
  }
}

export async function disableReminder() {
  useProfile.getState().set({ reminder: false });
  if (!WEB) await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

/** Replaces the scheduled reminders with the next evenings. Safe to call often. */
export async function scheduleReminders() {
  if (WEB) return;
  const s = useProfile.getState();
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!s.reminder) return;
    const text = STRINGS[s.lang ?? 'fr'];
    const now = new Date();
    for (let i = 0; i <= DAYS; i++) {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, HOUR, 0, 0);
      if (at <= now) continue;
      if (i === 0 && s.dailyLast === dayKey(now)) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: text.notif_title, body: text.notif_body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
      });
    }
  } catch {
    // Reminders are a bonus: never break the game for them.
  }
}
