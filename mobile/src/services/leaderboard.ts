import { Alert } from 'react-native';

import type { TFunction } from '@/hooks/use-app';
import type { Mode } from '@/game/types';
import { useProfile } from '@/store/profile';

import { GAME_CENTER_READY } from './store-services';

const MODES: Mode[] = ['classic', 'chrono', 'hardcore', 'category'];

/** Opens the Game Center leaderboard, or lists local best scores until it is wired. */
export function showLeaderboard(t: TFunction) {
  if (GAME_CENTER_READY) return;
  const best = useProfile.getState().best;
  const list = MODES.map((m) => `${t(`mode_${m}` as const)} : ${best[m] ? t('record_line', { n: best[m] ?? 0 }) : '—'}`).join('\n');
  Alert.alert(t('leaderboard'), t('leaderboard_soon', { list }));
}
