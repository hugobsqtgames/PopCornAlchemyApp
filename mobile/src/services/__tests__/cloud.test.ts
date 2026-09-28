import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { sharedPart } from '@/store/cloud-merge';
import { useProfile } from '@/store/profile';

import { CLOUD_KEY, createCloudSync, type KeyValueStore } from '../cloud';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

/** A fake iCloud: one value per key, and a log of what was written. */
function fakeCloud(initial: Record<string, string> = {}) {
  const values = { ...initial };
  const writes: string[] = [];
  const kv: KeyValueStore = {
    getAsync: async (k) => values[k] ?? null,
    setAsync: async (k, v) => {
      values[k] = v;
      writes.push(v);
    },
  };
  return { kv, values, writes };
}
const copy = (at: number, patch: object) => JSON.stringify({ at, data: { ...sharedPart(useProfile.getInitialState()), tutorialDone: true, ...patch } });
const state = () => useProfile.getState();
const flush = () => new Promise<void>((r) => jest.requireActual<typeof import('timers')>('timers').setImmediate(r));

let clock = 1_000_000;
const now = () => clock;
let stop: (() => void) | null = null;

beforeEach(() => {
  jest.useFakeTimers();
  clock = 1_000_000;
  useProfile.setState({ ...useProfile.getInitialState(), lang: 'fr', tutorialDone: true });
});
afterEach(() => {
  stop?.();
  stop = null;
  jest.useRealTimers();
});

describe('iCloud sync', () => {
  it('brings the other device progress to this one', async () => {
    const cloud = fakeCloud({ [CLOUD_KEY]: copy(2_000_000, { coins: 777, found: [4, 5], stats: { ...state().stats, levels: 30 } }) });
    const sync = createCloudSync(cloud.kv, now);
    stop = sync.start();
    await flush();
    expect(state().coins).toBe(777);
    expect(state().found).toEqual([4, 5]);
    // Nothing new to send back.
    jest.advanceTimersByTime(5000);
    await flush();
    expect(cloud.writes).toHaveLength(0);
  });

  it('sends this device progress a few seconds after a change', async () => {
    const cloud = fakeCloud({ [CLOUD_KEY]: copy(500, { found: [1] }) });
    stop = createCloudSync(cloud.kv, now).start();
    await flush();
    clock += 10_000;
    state().recordSolve(9, 3);
    jest.advanceTimersByTime(3500);
    await flush();
    const sent = JSON.parse(cloud.values[CLOUD_KEY]);
    expect(sent.data.found).toEqual(expect.arrayContaining([1, 9]));
    expect(sent.at).toBe(clock);
    expect(sent.data.sound).toBeUndefined();
  });

  it('never sends an empty new install over iCloud before hearing from it', async () => {
    const cloud = fakeCloud();
    stop = createCloudSync(cloud.kv, now).start();
    await flush();
    state().set({ coins: 150 });
    jest.advanceTimersByTime(3500);
    await flush();
    expect(cloud.writes).toHaveLength(0);
    // Once a level is cleared, the progress is real and can be sent.
    state().bumpStats({ levels: 1 });
    jest.advanceTimersByTime(3500);
    await flush();
    expect(cloud.writes).toHaveLength(1);
  });

  it('ignores a damaged iCloud copy', async () => {
    const cloud = fakeCloud({ [CLOUD_KEY]: '{"at": "x", broken' });
    state().set({ coins: 42 });
    stop = createCloudSync(cloud.kv, now).start();
    await flush();
    expect(state().coins).toBe(42);
  });

  it('cleans a copy with wrong values before using it', async () => {
    const cloud = fakeCloud({ [CLOUD_KEY]: JSON.stringify({ at: 9e12, data: { coins: -5, found: [1, 'x', 99999], stars: { 1: 9 } } }) });
    stop = createCloudSync(cloud.kv, now).start();
    await flush();
    expect(state().coins).toBeGreaterThanOrEqual(0);
    expect(state().found).toEqual([1]);
    expect(state().stars[1]).toBeUndefined();
  });

  it('does not send device settings changes', async () => {
    const cloud = fakeCloud({ [CLOUD_KEY]: copy(500, {}) });
    stop = createCloudSync(cloud.kv, now).start();
    await flush();
    const before = cloud.writes.length;
    state().set({ sound: false, music: false });
    jest.advanceTimersByTime(3500);
    await flush();
    expect(cloud.writes.length).toBe(before);
  });
});
