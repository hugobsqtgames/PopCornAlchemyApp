import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing } from 'react-native';

import { styleBonus } from '@/game/catalog';
import {
  bonusTimeMs,
  buildGrid,
  canSave,
  CHALLENGE_LENGTH,
  CHRONO_BONUS_SECONDS,
  CHRONO_PENALTY_SECONDS,
  CHRONO_SECONDS,
  coinsFor,
  decoysToRemove,
  hasTiers,
  isCorrect,
  isFever,
  isRelaxed,
  levelById,
  PRICES,
  pointsFor,
  REVEAL_MS,
  REWARDS,
  shuffleGrid,
  startLives,
  TIER_SIZE,
  tierOf,
  ZEN_TRIES,
} from '@/game/rules';
import type { Level, RunConfig } from '@/game/types';
import { useReduceMotion } from '@/hooks/use-app';
import { checkAchievements } from '@/services/achievements';
import { buzz, play, playLater, type SoundName } from '@/services/feedback';
import { enableReminder, scheduleReminders } from '@/services/reminder';
import { celebrate } from '@/services/review';
import { submitScore } from '@/services/store-services';
import { useProfile } from '@/store/profile';

/** reveal = the answer of a missed or skipped level is on screen. */
/** Seconds since `start` (a Date.now() value). */
const secondsSince = (start: number) => (Date.now() - start) / 1000;

export type Phase = 'play' | 'correct' | 'reveal' | 'tier' | 'over' | 'win';

export interface RunResult {
  newRecord: boolean;
  /** Daily: whether today's reward was given. Challenge: whether the target was beaten. */
  rewarded: boolean;
  chest: boolean;
  coins: number;
}

interface TierStats {
  bestCombo: number;
  flawless: number;
  mistakesThisLevel: number;
}

/** Everything that happens during one run: picks, answers, lives, timers, rewards. */
export function useRun(config: RunConfig, resume?: { index: number; lives: number; score: number; combo: number; continued: boolean }) {
  const profile = useProfile;
  const [index, setIndex] = useState(resume?.index ?? 0);
  const [lives, setLives] = useState(resume?.lives ?? startLives(config.mode));
  const [score, setScore] = useState(resume?.score ?? 0);
  const [combo, setCombo] = useState(resume?.combo ?? 0);
  const [continued, setContinued] = useState(resume?.continued ?? false);
  const [phase, setPhase] = useState<Phase>('play');
  const [paused, setPaused] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [hinted, setHinted] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [doubleOn, setDoubleOn] = useState(false);
  const [chronoLeft, setChronoLeft] = useState(CHRONO_SECONDS);
  const [last, setLast] = useState({ points: 0, coins: 0, seconds: 0 });
  const [result, setResult] = useState<RunResult | null>(null);
  const [tierStats, setTierStats] = useState<TierStats>({ bestCombo: 0, flawless: 0, mistakesThisLevel: 0 });
  const [cleared, setCleared] = useState<{ id: number; points: number }[]>([]);
  const [message, setMessage] = useState<{ text: string; key: number } | null>(null);
  /** The level whose answer is (or was last) shown: on the reveal card and the game over screen. */
  const [missed, setMissed] = useState<{ level: Level; skipped: boolean } | null>(null);
  const relaxed = isRelaxed(config.mode);
  const still = useReduceMotion();

  const level: Level | undefined = levelById(config.ids[index]);
  // The grid lives in state: clues can take tiles off it or shuffle it.
  const [grid, setGrid] = useState<string[]>(() => (level ? buildGrid(level) : []));
  const [removed, setRemoved] = useState<number[]>([]);
  const totalTiers = Math.ceil(config.ids.length / TIER_SIZE);

  // Speed bonus bar: 1 → 0 over the level's bonus time.
  const bonus = useState(() => new Animated.Value(1))[0];
  const bonusValue = useRef(1);
  const levelStart = useRef(0);
  const chronoRef = useRef(CHRONO_SECONDS);
  const endChronoRef = useRef<() => void>(() => {});
  const shake = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const id = bonus.addListener(({ value }) => (bonusValue.current = value));
    return () => bonus.removeListener(id);
  }, [bonus]);

  const runBonus = useCallback(
    (from: number) => {
      // No clock in zen and in the guided level.
      if (relaxed) return;
      bonus.setValue(from);
      Animated.timing(bonus, {
        toValue: 0,
        duration: bonusTimeMs(index) * from,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) play('timeup');
      });
    },
    [bonus, index, relaxed]
  );

  const flash = (text: string) => setMessage({ text, key: Date.now() });

  /** Moves to another level and clears what belonged to the previous one. */
  const goTo = useCallback(
    (next: number) => {
      const nextLevel = levelById(config.ids[next]);
      setIndex(next);
      setGrid(nextLevel ? buildGrid(nextLevel) : []);
      setRemoved([]);
      setPicked([]);
      setHinted(null);
      setHintUsed(false);
      setTierStats((st) => ({ ...st, mistakesThisLevel: 0 }));
      setPhase('play');
    },
    [config.ids]
  );

  /** Chrono seconds live in a ref so the countdown interval always sees the latest value. */
  const addChrono = (delta: number) => {
    chronoRef.current += delta;
    setChronoLeft(chronoRef.current);
  };

  // New level: start the bonus bar and save the run.
  useEffect(() => {
    if (!level) return;
    levelStart.current = Date.now();
    if (index > 0) play('whoosh');
    runBonus(1);
    if (canSave(config.mode)) profile.getState().set({ save: { ...config, index, lives, score, combo, continued } });
    // Saving only on level change on purpose: lives/score are saved with the next level.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  // Pause stops the bonus bar and the chrono.
  useEffect(() => {
    if (phase !== 'play') return;
    if (paused) bonus.stopAnimation();
    else runBonus(bonusValue.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // Going to the background pauses the game.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active' && phase === 'play') setPaused(true);
    });
    return () => sub.remove();
  }, [phase]);

  const endRun = useCallback(
    (won: boolean, finalScore: number, clearedNow: { id: number; points: number }[]) => {
      const s = profile.getState();
      const mode = config.mode;
      const newRecord = mode !== 'tutorial' && s.setBest(mode, finalScore);
      submitScore(mode, finalScore);
      let rewarded = false;
      let chest = false;
      let coins = 0;
      if (won) {
        if (mode === 'classic') {
          coins = REWARDS.classicVictory;
          s.bumpStats({ victories: 1 });
        } else if (mode === 'category') coins = REWARDS.categoryVictory;
        else if (mode === 'daily') {
          const r = s.finishDaily();
          rewarded = r.rewarded;
          chest = r.chest;
          // Tonight's reminder is no longer needed. After the first daily, offer the reminder.
          if (s.reminderAsked) scheduleReminders();
          else setTimeout(enableReminder, 1500);
        } else if (mode === 'challenge') {
          rewarded = finalScore > (config.target ?? 0);
        }
        if (coins) s.addCoins(coins);
      }
      const recent = clearedNow.slice(-CHALLENGE_LENGTH);
      s.set({
        // A daily or friend challenge never touches the saved adventure.
        ...(canSave(mode) && { save: null }),
        lastRun: recent.length ? { ids: recent.map((c) => c.id), score: recent.reduce((a, c) => a + c.points, 0) } : s.lastRun,
      });
      setResult({ newRecord, rewarded, chest, coins });
      setPhase(won ? 'win' : 'over');
      play(won ? 'victory' : 'gameover');
      buzz(won ? 'success' : 'heavy');
      checkAchievements();
      if (won && mode !== 'tutorial' && (mode !== 'challenge' || rewarded)) celebrate();
    },
    [config, profile]
  );

  // Chrono mode countdown.
  useEffect(() => {
    endChronoRef.current = () => {
      bonus.stopAnimation();
      endRun(false, score, cleared);
    };
  });
  useEffect(() => {
    if (config.mode !== 'chrono' || phase !== 'play' || paused) return;
    const id = setInterval(() => {
      chronoRef.current -= 1;
      setChronoLeft(chronoRef.current);
      if (chronoRef.current > 0 && chronoRef.current <= 10) play('countdown');
      if (chronoRef.current <= 0) endChronoRef.current();
    }, 1000);
    return () => clearInterval(id);
  }, [config.mode, phase, paused]);

  const advance = useCallback(
    (nextScore: number, clearedNow: { id: number; points: number }[]) => {
      const lastIndex = config.ids.length - 1;
      if (index >= lastIndex) {
        endRun(true, nextScore, clearedNow);
        return;
      }
      if (hasTiers(config.mode) && (index + 1) % TIER_SIZE === 0) {
        const s = profile.getState();
        s.addCoins(REWARDS.tier.coins);
        s.addItem('hints', REWARDS.tier.hints);
        if (config.mode === 'classic') s.bumpStats({ bestTier: tierOf(index + 1) + 1 }, 'max');
        setLives(startLives(config.mode));
        setPhase('tier');
        play('victory');
        checkAchievements();
        celebrate();
        return;
      }
      goTo(index + 1);
    },
    [config, index, endRun, profile, goTo]
  );

  const tapTile = (tile: number) => {
    if (phase !== 'play' || paused || !level) return;
    if (picked.includes(tile) || removed.includes(tile) || picked.length >= level.sol.length) return;
    // The guided level only accepts the right emojis.
    if (config.mode === 'tutorial' && !level.sol.includes(grid[tile])) {
      buzz('error');
      return;
    }
    play('pop');
    buzz('tap');
    setPicked([...picked, tile]);
  };

  const removePick = (slot: number) => {
    if (phase !== 'play' || paused) return;
    buzz('select');
    play('unpop');
    setPicked(picked.filter((_, i) => i !== slot));
  };

  const fuse = () => {
    if (!level || phase !== 'play' || paused || picked.length < level.sol.length) return;
    const s = profile.getState();
    const timeLeft = relaxed ? 0 : bonusValue.current;
    bonus.stopAnimation();

    if (isCorrect(picked.map((i) => grid[i]), level.sol)) {
      const nextCombo = combo + 1;
      const points = pointsFor({ index, timeLeft, combo: nextCombo, styleBonus: styleBonus(s.style) });
      const coins = coinsFor({ timeLeft, combo: nextCombo, mode: config.mode, double: doubleOn });
      const nextScore = score + points;
      const clearedNow = [...cleared, { id: level.id, points }];
      s.addCoins(coins);
      const recent = clearedNow.slice(-CHALLENGE_LENGTH);
      s.set({ lastRun: { ids: recent.map((c) => c.id), score: recent.reduce((sum, c) => sum + c.points, 0) } });
      s.bumpStats({ levels: 1, cat: { [level.cat]: 1 } });
      s.bumpStats({ bestCombo: nextCombo, ...(config.mode === 'hardcore' ? { bestHardcore: index + 1 } : {}) }, 'max');
      if (nextCombo === 5) s.bumpStats({ fevers: 1 });
      setCombo(nextCombo);
      setScore(nextScore);
      setCleared(clearedNow);
      setDoubleOn(false);
      setTierStats((t) => ({
        bestCombo: Math.max(t.bestCombo, nextCombo),
        flawless: t.flawless + (t.mistakesThisLevel === 0 ? 1 : 0),
        mistakesThisLevel: 0,
      }));
      setLast({ points, coins, seconds: secondsSince(levelStart.current) });
      if (config.mode === 'chrono') addChrono(CHRONO_BONUS_SECONDS);
      setPhase('correct');
      // The chime climbs with the combo; reaching 5 starts Fever.
      const chime: SoundName = nextCombo === 5 ? 'fever' : nextCombo >= 2 ? (`combo${Math.min(nextCombo, 5)}` as SoundName) : 'success';
      play(chime);
      playLater('coin', 380);
      buzz('success');
      checkAchievements();
      setTimeout(() => advance(nextScore, clearedNow), 1100);
      return;
    }

    // Wrong answer.
    setPicked([]);
    setCombo(0);
    setTierStats((t) => ({ ...t, mistakesThisLevel: t.mistakesThisLevel + 1 }));
    if (!still) {
      Animated.sequence(
        [10, -10, 8, -8, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 50, useNativeDriver: true }))
      ).start();
    }

    if (config.mode === 'chrono') {
      play('error');
      buzz('error');
      addChrono(-CHRONO_PENALTY_SECONDS);
      if (chronoRef.current <= 0) endRun(false, score, cleared);
      else runBonus(timeLeft);
      return;
    }
    if (relaxed) {
      // No lives: try again, and after a few tries the answer shows.
      play('error');
      buzz('error');
      const tries = tierStats.mistakesThisLevel + 1;
      if (tries >= ZEN_TRIES) reveal(level, false, () => advance(score, cleared));
      return;
    }
    if (config.mode !== 'hardcore' && s.useItem('shields')) {
      s.bumpStats({ shieldsUsed: 1 });
      play('powerup');
      buzz('select');
      flash('shield_saved');
      runBonus(timeLeft);
      return;
    }
    // A life is lost: show the answer, then move on (or end the run).
    play('error');
    buzz('error');
    const left = lives - 1;
    setLives(left);
    reveal(level, false, () => (left <= 0 ? endRun(false, score, cleared) : advance(score, cleared)));
  };

  /** Shows the answer of `lvl` for a moment, then runs `then`. */
  const reveal = (lvl: Level, skipped: boolean, then: () => void) => {
    setMissed({ level: lvl, skipped });
    setPhase('reveal');
    setTimeout(then, REVEAL_MS);
  };

  const giveHint = () => {
    if (!level || phase !== 'play' || paused || hintUsed) return;
    const s = profile.getState();
    const missing = [...level.sol];
    for (const i of picked) {
      const k = missing.indexOf(grid[i]);
      if (k >= 0) missing.splice(k, 1);
    }
    const target = grid.findIndex((e, i) => e === missing[0] && !picked.includes(i) && !removed.includes(i));
    if (target < 0) return;
    if (!s.useItem('hints')) {
      flash('no_hints');
      return;
    }
    s.bumpStats({ hintsUsed: 1 });
    setHintUsed(true);
    setHinted(target);
    play('sparkle');
    buzz('select');
    // Wrong picks are cleared so the hint always leads towards the answer.
    const keep = picked.filter((i) => level.sol.includes(grid[i]));
    setTimeout(() => {
      setHinted(null);
      setPicked([...keep, target].slice(0, level.sol.length));
    }, 650);
  };

  /** Cheaper clue: takes 5 wrong emojis off the grid, paid in coins. Once per level. */
  const removeDecoys = () => {
    if (!level || phase !== 'play' || paused || removed.length > 0) return false;
    const s = profile.getState();
    if (!s.spend(PRICES.removeDecoys)) {
      flash('no_coins');
      return false;
    }
    const gone = decoysToRemove(grid, level.sol, picked, removed);
    setRemoved(gone);
    play('whoosh');
    buzz('select');
    return true;
  };

  /** Free clue: shuffles the tiles, which often makes the answer jump out. */
  const shuffleTiles = () => {
    if (phase !== 'play' || paused) return;
    const next = shuffleGrid(grid, picked, removed);
    setGrid(next.grid);
    setPicked(next.picked);
    setRemoved(next.removed);
    play('whoosh');
    buzz('tap');
  };

  const skip = () => {
    if (!level || phase !== 'play' || paused) return;
    const s = profile.getState();
    if (!s.useItem('skips')) return;
    s.bumpStats({ skipsUsed: 1 });
    bonus.stopAnimation();
    play('powerup');
    reveal(level, true, () => advance(score, cleared));
  };

  const double = () => {
    if (phase !== 'play' || paused || doubleOn) return;
    const s = profile.getState();
    if (!s.useItem('doubles')) return;
    s.bumpStats({ doublesUsed: 1 });
    setDoubleOn(true);
    play('powerup');
    flash('double_on');
  };

  const nextTier = () => {
    setTierStats({ bestCombo: 0, flawless: 0, mistakesThisLevel: 0 });
    setCombo(0);
    goTo(index + 1);
  };

  /** Continue after a game over with one life (ad or coins); once per run. */
  const revive = (withCoins: boolean) => {
    if (continued) return false;
    if (withCoins && !profile.getState().spend(PRICES.continue)) return false;
    setContinued(true);
    play('powerup');
    setLives(1);
    setResult(null);
    setMissed(null);
    // The run goes on with the next level: the missed one was already shown.
    const next = Math.min(index + 1, config.ids.length - 1);
    goTo(next);
    if (canSave(config.mode)) profile.getState().set({ save: { ...config, index: next, lives: 1, score, combo: 0, continued: true } });
    return true;
  };

  return {
    config,
    level,
    grid,
    removed,
    missed,
    relaxed,
    index,
    lives,
    score,
    combo,
    fever: isFever(combo),
    phase,
    paused,
    setPaused,
    picked,
    hinted,
    hintUsed,
    doubleOn,
    chronoLeft,
    bonus,
    shake,
    last,
    result,
    tierStats,
    totalTiers,
    message,
    continued,
    tapTile,
    removePick,
    fuse,
    giveHint,
    removeDecoys,
    shuffleTiles,
    skip,
    double,
    nextTier,
    revive,
  };
}

export type Run = ReturnType<typeof useRun>;
