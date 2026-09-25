import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useProfile } from '@/store/profile';

/** Each sound: file, how many copies can overlap, and volume. */
const SOUNDS = {
  pop: { src: require('@/assets/sounds/pop.wav'), voices: 5, volume: 0.8 },
  unpop: { src: require('@/assets/sounds/unpop.wav'), voices: 3, volume: 0.7 },
  click: { src: require('@/assets/sounds/click.wav'), voices: 4, volume: 0.6 },
  toggle: { src: require('@/assets/sounds/toggle.wav'), voices: 2, volume: 0.6 },
  whoosh: { src: require('@/assets/sounds/whoosh.wav'), voices: 2, volume: 0.45 },
  success: { src: require('@/assets/sounds/success.wav'), voices: 2, volume: 0.8 },
  combo2: { src: require('@/assets/sounds/combo2.wav'), voices: 1, volume: 0.8 },
  combo3: { src: require('@/assets/sounds/combo3.wav'), voices: 1, volume: 0.8 },
  combo4: { src: require('@/assets/sounds/combo4.wav'), voices: 1, volume: 0.8 },
  combo5: { src: require('@/assets/sounds/combo5.wav'), voices: 1, volume: 0.8 },
  fever: { src: require('@/assets/sounds/fever.wav'), voices: 1, volume: 0.8 },
  error: { src: require('@/assets/sounds/error.wav'), voices: 2, volume: 0.8 },
  coin: { src: require('@/assets/sounds/coin.wav'), voices: 3, volume: 0.6 },
  sparkle: { src: require('@/assets/sounds/sparkle.wav'), voices: 2, volume: 0.7 },
  timeup: { src: require('@/assets/sounds/timeup.wav'), voices: 1, volume: 0.6 },
  countdown: { src: require('@/assets/sounds/countdown.wav'), voices: 2, volume: 0.6 },
  powerup: { src: require('@/assets/sounds/powerup.wav'), voices: 2, volume: 0.8 },
  buy: { src: require('@/assets/sounds/buy.wav'), voices: 2, volume: 0.8 },
  victory: { src: require('@/assets/sounds/victory.wav'), voices: 1, volume: 0.8 },
  gameover: { src: require('@/assets/sounds/gameover.wav'), voices: 1, volume: 0.8 },
  win: { src: require('@/assets/sounds/win.wav'), voices: 2, volume: 0.8 },
  tick: { src: require('@/assets/sounds/tick.wav'), voices: 6, volume: 0.7 },
  spin: { src: require('@/assets/sounds/spin.wav'), voices: 1, volume: 0.6 },
};

export type SoundName = keyof typeof SOUNDS;

const pools: Partial<Record<SoundName, { players: AudioPlayer[]; next: number }>> = {};

/** The web build is only used for previews and tests: it records sounds instead of playing them. */
const WEB = Platform.OS === 'web';
declare global {
  var __sounds: string[] | undefined;
}

/** Loads every sound once, at startup. Sounds follow the silent switch and mix with other apps. */
export function initSounds() {
  if (WEB) return;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  for (const name of Object.keys(SOUNDS) as SoundName[]) {
    const { src, voices, volume } = SOUNDS[name];
    const players: AudioPlayer[] = [];
    for (let i = 0; i < voices; i++) {
      try {
        const p = createAudioPlayer(src);
        p.volume = volume;
        players.push(p);
      } catch {
        // A missing player only means no sound.
      }
    }
    pools[name] = { players, next: 0 };
  }
}

/**
 * Plays a sound. Voices take turns so quick repeats (tiles, wheel ticks) all play,
 * and each voice is rewound before it plays: `seekTo` is asynchronous, playing
 * before it resolves would restart from the end and stay silent.
 */
export function play(name: SoundName) {
  if (!useProfile.getState().sound) return;
  if (WEB) {
    globalThis.__sounds?.push(name);
    return;
  }
  const pool = pools[name];
  if (!pool || pool.players.length === 0) return;
  const p = pool.players[pool.next];
  pool.next = (pool.next + 1) % pool.players.length;
  p.seekTo(0)
    .then(() => p.play())
    .catch(() => {});
}

/** Plays a sound after a delay (to space out a small sequence). */
export function playLater(name: SoundName, ms: number) {
  setTimeout(() => play(name), ms);
}

type Buzz = 'tap' | 'select' | 'success' | 'error' | 'heavy';

export function buzz(kind: Buzz) {
  if (!useProfile.getState().haptics || WEB) return;
  const run = () => {
    switch (kind) {
      case 'tap':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      case 'select':
        return Haptics.selectionAsync();
      case 'success':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'error':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      case 'heavy':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };
  run().catch(() => {});
}
