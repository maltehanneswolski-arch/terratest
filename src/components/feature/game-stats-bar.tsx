import { useTranslation } from 'react-i18next';
import { averageScore, useGameStats } from '@/lib/gameStats';

interface GameStatsBarProps {
  /** Stable storage id for the game. Never change it — stats are keyed on it. */
  gameId: string;
  /** Show the streak pair. Off for games with no win/lose notion per round. */
  showStreak?: boolean;
  /** Show best and average score. Off for purely streak-based games. */
  showScore?: boolean;
  className?: string;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-1">
      <span className="text-base font-bold leading-none text-slate-800 dark:text-white">
        {value}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
        {label}
      </span>
    </div>
  );
}

/**
 * Compact "your stats on this browser" strip.
 *
 * Renders nothing until a first round has been completed, so a new visitor
 * isn't greeted by a row of zeroes.
 */
export function GameStatsBar({
  gameId,
  showStreak = true,
  showScore = true,
  className = '',
}: GameStatsBarProps) {
  const { t } = useTranslation();
  const { stats, reset } = useGameStats(gameId);

  if (stats.gamesPlayed === 0) return null;

  const average = averageScore(stats);
  // Only qualify the average with "/ max" once a max is actually known.
  const averageLabel =
    average === null
      ? '—'
      : stats.maxScore > 0
        ? `${average.toFixed(1)} / ${stats.maxScore}`
        : average.toFixed(1);

  return (
    <section
      aria-label={t('statsAriaLabel')}
      className={`flex flex-wrap items-center justify-center gap-x-1 gap-y-2 rounded-lg border-2 border-[#101820]/15 bg-white/60 px-2 py-2 dark:border-[#fff8e7]/15 dark:bg-slate-800/60 ${className}`}
    >
      <Stat label={t('statsPlayed')} value={String(stats.gamesPlayed)} />

      {showStreak && (
        <>
          <Stat label={t('statsStreak')} value={String(stats.currentStreak)} />
          <Stat label={t('statsBestStreak')} value={String(stats.bestStreak)} />
        </>
      )}

      {showScore && (
        <>
          <Stat label={t('statsBest')} value={String(stats.bestScore)} />
          <Stat label={t('statsAverage')} value={averageLabel} />
        </>
      )}

      <button
        type="button"
        onClick={() => {
          if (window.confirm(t('statsResetConfirm'))) {
            reset();
          }
        }}
        className="ml-1 min-h-11 rounded px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600 underline decoration-dotted hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        {t('statsReset')}
      </button>
    </section>
  );
}
