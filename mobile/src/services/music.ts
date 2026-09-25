import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

import { useProfile } from '@/store/profile';

export type Track = 'menu' | 'game';

const SOURCES: Record<Track, number> = {
  menu: require('@/assets/music/menu.wav'),
  game: require('@/assets/music/game.wav'),
};

const VOLUME = 0.35;
const players: Partial<Record<Track, AudioPlayer>> = {};
let current: Track | null = null;
let wanted: Track | null = null;

function player(track: Track): AudioPlayer | undefined {
  if (!players[track]) {
    try {
      const p = createAudioPlayer(SOURCES[track]);
      p.loop = true;
      p.volume = VOLUME;
      players[track] = p;
    } catch {
      return undefined;
    }
  }
  return players[track];
}

function apply() {
  // Browsers block autoplay; the web build only serves previews, so it stays silent.
  const target = useProfile.getState().music && Platform.OS !== 'web' ? wanted : null;
  if (target === current) return;
  if (current) {
    try {
      players[current]?.pause();
    } catch {
      // Ignore: music is optional.
    }
  }
  current = target;
  if (target) {
    const p = player(target);
    try {
      p?.seekTo(0);
      p?.play();
    } catch {
      // Ignore: music is optional.
    }
  }
}

/** Chooses the background loop; null stops the music. */
export function setTrack(track: Track | null) {
  wanted = track;
  apply();
}

/** Pauses everything (app in background) and resumes the wanted track. */
export function suspendMusic(suspended: boolean) {
  if (suspended) {
    if (current) players[current]?.pause();
    current = null;
  } else {
    apply();
  }
}

// Turning the "Music" switch on or off takes effect immediately.
useProfile.subscribe((s, prev) => {
  if (s.music !== prev.music) apply();
});
