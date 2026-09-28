/**
 * The same progress on iPhone and iPad: the shared part of the profile is kept in the iCloud
 * key-value store of the player's Apple account, and merged with this device's own copy
 * (see store/cloud-merge.ts for the rules). Nothing leaves Apple's servers: no account, no server.
 *
 * Only in a real iOS build: Expo Go, Android and the web have no CloudKv module, so nothing happens.
 */
import { AppState } from 'react-native';

import { requireOptionalNativeModule } from 'expo';
import { mergeProfiles, sharedPart, type SharedProfile } from '@/store/cloud-merge';
import { useProfile } from '@/store/profile';
import { sanitizeProfile } from '@/store/sanitize';

/** The key in iCloud. A new shape of the saved data gets a new key. */
export const CLOUD_KEY = 'profile-v1';
/** Changes are sent a few seconds after the last one (one upload for a burst of changes). */
const PUSH_DELAY_MS = 3000;
/**
 * A new install waits for iCloud's copy before sending anything, so it can never replace real
 * progress with an empty one. After this delay without any answer, iCloud is taken as empty.
 */
const FIRST_PULL_WAIT_MS = 30_000;

const SHARED_KEYS = Object.keys(sharedPart(useProfile.getInitialState())) as (keyof SharedProfile)[];

export interface KeyValueStore {
  getAsync(key: string): Promise<string | null>;
  setAsync(key: string, value: string): Promise<void>;
}

interface CloudCopy {
  at: number;
  data: SharedProfile;
}

/** JSON with sorted keys: two equal profiles give the same text whatever the key order. */
export function stableJson(v: unknown): string {
  return JSON.stringify(v, (_k, x) =>
    x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x
  );
}

/** Reads iCloud's copy; null when there is none or it cannot be read. Always cleaned first. */
export function parseCopy(raw: string | null): CloudCopy | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { at?: unknown; data?: unknown };
    if (typeof v?.at !== 'number' || !Number.isFinite(v.at) || !v.data || typeof v.data !== 'object') return null;
    // Same cleaning as a save read from this phone: a damaged copy can never break the game.
    return { at: v.at, data: sharedPart(sanitizeProfile(v.data, useProfile.getInitialState())) };
  } catch {
    return null;
  }
}

export function createCloudSync(kv: KeyValueStore, now: () => number = Date.now) {
  let applying = false;
  let heardFromCloud = false;
  let startedAt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastSent = '';

  const mayPush = () => heardFromCloud || now() - startedAt > FIRST_PULL_WAIT_MS || useProfile.getState().stats.levels > 0;

  async function push() {
    timer = null;
    if (!mayPush()) return;
    const s = useProfile.getState();
    const data = sharedPart(s);
    const text = stableJson(data);
    if (text === lastSent) return;
    try {
      await kv.setAsync(CLOUD_KEY, JSON.stringify({ at: s.changedAt, data }));
      lastSent = text;
    } catch {
      // No iCloud (signed out, no network…): the next change tries again.
    }
  }

  function schedulePush() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(push, PUSH_DELAY_MS);
  }

  /** Gets iCloud's copy and merges it into this device. */
  async function pull() {
    let raw: string | null;
    try {
      raw = await kv.getAsync(CLOUD_KEY);
    } catch {
      return;
    }
    const remote = parseCopy(raw);
    if (!remote) {
      schedulePush();
      return;
    }
    heardFromCloud = true;
    const s = useProfile.getState();
    const local = sharedPart(s);
    const merged = mergeProfiles(local, s.changedAt, remote.data, remote.at);
    const same = stableJson(merged) === stableJson(remote.data);
    applying = true;
    try {
      if (stableJson(merged) !== stableJson(local)) {
        // Taken as is from iCloud: this device is now as recent as iCloud's copy.
        useProfile.setState({ ...merged, changedAt: same ? remote.at : now() });
      } else if (!same) useProfile.setState({ changedAt: now() });
    } finally {
      applying = false;
    }
    if (same) lastSent = stableJson(merged);
    else schedulePush();
  }

  /** Starts syncing: first pull, then every change, every return to the app and every iCloud update. */
  function start() {
    startedAt = now();
    const unsubscribe = useProfile.subscribe((next, prev) => {
      if (applying) return;
      // Only real progress changes count, not device settings. The store never edits in place,
      // so comparing each value by reference is enough (and cheap).
      if (SHARED_KEYS.every((k) => next[k] === prev[k])) return;
      applying = true;
      useProfile.setState({ changedAt: now() });
      applying = false;
      schedulePush();
    });
    const appState = AppState.addEventListener('change', (st) => {
      if (st === 'active') void pull();
      // Leaving the app: send now rather than in a few seconds.
      else if (timer) {
        clearTimeout(timer);
        void push();
      }
    });
    void pull();
    return () => {
      unsubscribe();
      appState.remove();
      if (timer) clearTimeout(timer);
    };
  }

  return { start, pull, push };
}

/** The native iCloud module (modules/cloud-kv); null in Expo Go, on the web, or in a build without it. */
interface CloudKvModule extends KeyValueStore {
  addListener(event: 'onChange', listener: () => void): { remove(): void };
}
const CloudKv = requireOptionalNativeModule<CloudKvModule>('CloudKv');

/** Whether this build can sync with iCloud (a real iOS build). */
export const CLOUD_AVAILABLE = !!CloudKv;

/** Called once the saved profile is loaded. Does nothing without the native iCloud module. */
let started = false;
export function startCloud() {
  if (!CloudKv || started) return;
  started = true;
  const sync = createCloudSync(CloudKv);
  sync.start();
  // Another device changed the progress, or iCloud just delivered its copy to a new install.
  CloudKv.addListener('onChange', () => void sync.pull());
}
