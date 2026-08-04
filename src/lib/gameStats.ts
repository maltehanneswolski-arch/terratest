/**
 * Per-browser game statistics.
 *
 * Stats live in localStorage, so they survive tab closes, browser restarts and
 * reboots with no account and no backend. Every visitor accumulates their own
 * numbers independently — this is per-visitor, not global. What it deliberately
 * does NOT do:
 *
 *   - follow a player across devices or browsers (that needs real accounts)
 *   - compare players against each other (that needs a server)
 *
 * Storage caveats worth knowing: localStorage is scoped to the origin, so
 * changing domain loses everything; incognito windows are wiped on close; and
 * Safari may purge script-writable storage for sites left unvisited for ~7 days.
 */

import { readStoredJson } from '@/lib/storage';
import { useCallback, useEffect, useState } from 'react';

/** Bump only on a breaking shape change — old keys are then simply ignored. */
const STATS_VERSION = 'v1';

const keyFor = (gameId: string) => `terratest_stats_${STATS_VERSION}_${gameId}`;

/** Fired on every write so open panels re-read without prop plumbing. */
const STATS_EVENT = 'terratest:stats-changed';

export interface GameStats {
  /** Completed rounds. Incremented once per finished round. */
  gamesPlayed: number;
  /** Highest single-round score. */
  bestScore: number;
  /** Sum of every round's score, for deriving an average. */
  totalScore: number;
  /** Highest points obtainable, for showing "12 / 18"-style averages. */
  maxScore: number;
  /** Consecutive wins right now. Only meaningful for streak-based games. */
  currentStreak: number;
  /** Best consecutive-win run ever. */
  bestStreak: number;
  /** Rounds counted as a win. */
  wins: number;
  /** ISO date (YYYY-MM-DD) of the last completed round, or null. */
  lastPlayed: string | null;
}

export const EMPTY_STATS: GameStats = {
  gamesPlayed: 0,
  bestScore: 0,
  totalScore: 0,
  maxScore: 0,
  currentStreak: 0,
  bestStreak: 0,
  wins: 0,
  lastPlayed: null,
};

/**
 * Coerces whatever is in storage into a valid GameStats. Anything missing or
 * non-numeric falls back to its empty value, so a partial or hand-edited entry
 * degrades to zeroes instead of rendering NaN.
 */
function normalise(raw: unknown): GameStats {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_STATS };
  const source = raw as Record<string, unknown>;
  const num = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

  return {
    gamesPlayed: num(source.gamesPlayed),
    bestScore: num(source.bestScore),
    totalScore: num(source.totalScore),
    maxScore: num(source.maxScore),
    currentStreak: num(source.currentStreak),
    bestStreak: num(source.bestStreak),
    wins: num(source.wins),
    lastPlayed: typeof source.lastPlayed === 'string' ? source.lastPlayed : null,
  };
}

export function readGameStats(gameId: string): GameStats {
  return normalise(readStoredJson<unknown>(keyFor(gameId), null));
}

function writeGameStats(gameId: string, stats: GameStats) {
  try {
    localStorage.setItem(keyFor(gameId), JSON.stringify(stats));
  } catch {
    // Storage full or unavailable (private mode, disabled cookies). Stats are a
    // nice-to-have, so never let a failed write break gameplay.
    return;
  }
  window.dispatchEvent(new CustomEvent(STATS_EVENT, { detail: { gameId } }));
}

export interface RoundOutcome {
  /** Points scored this round. Omit for pass/fail games. */
  score?: number;
  /** Points available this round, for average-out-of display. */
  maxScore?: number;
  /**
   * Whether this round counts as a win, which drives the streak. Omit entirely
   * for games with no win/lose notion — the streak is then left untouched
   * rather than being reset to zero.
   */
  won?: boolean;
}

/**
 * Records one completed round. Call exactly once per round — see
 * `useGameStats().record`, which guards against double-recording under React
 * StrictMode's double effect invocation.
 */
export function recordRound(gameId: string, outcome: RoundOutcome): GameStats {
  const prev = readGameStats(gameId);
  const score = typeof outcome.score === 'number' && Number.isFinite(outcome.score)
    ? outcome.score
    : 0;

  const currentStreak =
    outcome.won === undefined
      ? prev.currentStreak
      : outcome.won
        ? prev.currentStreak + 1
        : 0;

  const next: GameStats = {
    gamesPlayed: prev.gamesPlayed + 1,
    bestScore: Math.max(prev.bestScore, score),
    totalScore: prev.totalScore + score,
    maxScore: Math.max(prev.maxScore, outcome.maxScore ?? prev.maxScore),
    currentStreak,
    bestStreak: Math.max(prev.bestStreak, currentStreak),
    wins: prev.wins + (outcome.won ? 1 : 0),
    lastPlayed: new Date().toISOString().slice(0, 10),
  };

  writeGameStats(gameId, next);
  return next;
}

export function resetGameStats(gameId: string) {
  writeGameStats(gameId, { ...EMPTY_STATS });
}

/** Mean score per round, or null before any round has been completed. */
export function averageScore(stats: GameStats): number | null {
  if (stats.gamesPlayed === 0) return null;
  return stats.totalScore / stats.gamesPlayed;
}

/**
 * Reactive access to one game's stats.
 *
 * `record` is idempotent per `roundKey`: passing the same key twice is a no-op,
 * which is what makes it safe to call from an effect that StrictMode runs twice.
 */
export function useGameStats(gameId: string) {
  const [stats, setStats] = useState<GameStats>(() => readGameStats(gameId));

  useEffect(() => {
    const sync = () => setStats(readGameStats(gameId));
    sync();

    // Same-tab writes (our own CustomEvent) and other-tab writes ('storage').
    window.addEventListener(STATS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(STATS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [gameId]);

  const record = useCallback(
    (outcome: RoundOutcome, roundKey?: string) => {
      if (roundKey !== undefined) {
        const guardKey = `${gameId}::${roundKey}`;
        if (recordedRounds.has(guardKey)) return;
        recordedRounds.add(guardKey);
      }
      setStats(recordRound(gameId, outcome));
    },
    [gameId],
  );

  const reset = useCallback(() => {
    resetGameStats(gameId);
    setStats(readGameStats(gameId));
  }, [gameId]);

  return { stats, record, reset };
}

/**
 * Round keys already recorded this page load. Module-level rather than a ref so
 * the guard survives the component remount StrictMode performs in development.
 */
const recordedRounds = new Set<string>();
