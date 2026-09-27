import { safeIncomingPath } from '@/game/links';

/** Every link that opens the app goes through here first (see safeIncomingPath). */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    return safeIncomingPath(path);
  } catch {
    return '/';
  }
}
