import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useProfile } from '@/store/profile';

const SOURCES = {
  pop: require('@/assets/sounds/pop.wav'),
  success: require('@/assets/sounds/success.wav'),
  error: require('@/assets/sounds/error.wav'),
  victory: require('@/assets/sounds/victory.wav'),
  gameover: require('@/assets/sounds/gameover.wav'),
  tick: require('@/assets/sounds/tick.wav'),
  win: require('@/assets/sounds/win.wav'),
  buy: require('@/assets/sounds/buy.wav'),
  powerup: require('@/assets/sounds/powerup.wav'),
};

export type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};

/** Loads the sound effects once, at startup. Sounds respect the silent switch. */
export function initSounds() {
  setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
  for (const name of Object.keys(SOURCES) as SoundName[]) {
    try {
      players[name] = createAudioPlayer(SOURCES[name]);
    } catch {
      // A missing player only means no sound.
    }
  }
}

export function play(name: SoundName) {
  if (!useProfile.getState().sound) return;
  const p = players[name];
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {
    // Ignore playback errors: sound is a nice-to-have.
  }
}

type Buzz = 'tap' | 'select' | 'success' | 'error' | 'heavy';

export function buzz(kind: Buzz) {
  if (!useProfile.getState().haptics || Platform.OS === 'web') return;
  switch (kind) {
    case 'tap':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'select':
      Haptics.selectionAsync();
      break;
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'heavy':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
  }
}
