import { MetricEntry, publicMetricLabel, MetricDataset } from '@/lib/metricData';
import { getFlagUrl } from '@/lib/countryFlags';
import { shareResult as copyShareResult } from '@/lib/shareResult';

interface RoundResult {
  entry: MetricEntry;
  guessedPosition: number;
  actualPosition: number;
  points: number;
}

interface Props {
  results: RoundResult[];
  totalScore: number;
  perfectBonus: number;
  metric: MetricDataset;
  actualOrder: MetricEntry[];
  onRetry: () => void;
  onNext?: () => void;
  roundInfo?: { current: number; total: number };
}

const PER_ROUND_MAX = 15 + 3; // 5 * 3 + perfect bonus

function getGrade(score: number, max: number): { label: string; color: string } {
  const pct = score / max;
  if (pct >= 1) return { label: 'Perfect!', color: 'text-emerald-600 dark:text-emerald-400' };
  if (pct >= 0.78) return { label: 'Excellent', color: 'text-teal-600 dark:text-teal-400' };
  if (pct >= 0.55) return { label: 'Great', color: 'text-yellow-600 dark:text-yellow-400' };
  if (pct >= 0.33) return { label: 'Good', color: 'text-amber-600 dark:text-amber-400' };
  return { label: 'Keep trying', color: 'text-rose-600 dark:text-rose-400' };
}

function FlagImg({ country, size = 48 }: { country: string; size?: number }) {
  return (
    <img
      src={getFlagUrl(country, size * 2)}
      alt={`${country} flag`}
      className="rounded object-cover shadow-sm shrink-0"
      style={{ width: size, height: Math.round(size * 0.68) }}
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    />
  );
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="mt-3 h-3 w-full rounded-full bg-slate-100 dark:bg-slate-700">
      <div
        className="h-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-700"
        style={{ width: `${pct}%` }}
      ></div>
    </div>
  );
}

function copyShareText(results: RoundResult[], totalScore: number, metricLabel: string) {
  const tiles = results.map((r) => {
    if (r.points === 3) return '🟩';
    if (r.points === 2) return '🟨';
    if (r.points === 1) return '🟧';
    return '🟥';
  });
  void copyShareResult({
    game: 'Blind Ranking',
    result: `${totalScore}/${PER_ROUND_MAX}`,
    details: [publicMetricLabel(metricLabel), tiles.join('')],
    path: '/blind-ranking',
  });
}

export function ResultScreen({ results, totalScore, perfectBonus, metric, actualOrder, onRetry, onNext, roundInfo }: Props) {
  const grade = getGrade(totalScore, PER_ROUND_MAX);
  const isLastRound = roundInfo ? roundInfo.current === roundInfo.total : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm overflow-y-auto py-8">
      <div className="w-full max-w-2xl rounded-3xl border border-yellow-200 bg-white shadow-2xl dark:border-yellow-900/60 dark:bg-slate-900 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-7 py-7 text-white">
          {roundInfo && (
            <div className="mb-2 flex items-center gap-2">
              {Array.from({ length: roundInfo.total }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${i < roundInfo.current ? 'bg-white' : 'bg-white/30'}`}
                ></div>
              ))}
            </div>
          )}
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-amber-100">
            {roundInfo ? `Round ${roundInfo.current} of ${roundInfo.total}` : "Today's result"}
          </div>
          <h2 className="mt-1 text-2xl font-bold">{publicMetricLabel(metric.label)}</h2>
          <div className="mt-5 flex items-end gap-5">
            <div>
              <div className="text-sm font-medium text-amber-100">Round score</div>
              <div className="text-6xl font-black leading-none">{totalScore}</div>
              <div className="mt-1 text-sm text-amber-100">out of {PER_ROUND_MAX}</div>
            </div>
            <div className="mb-1">
              <div className="text-3xl font-bold brightness-150">{grade.label}</div>
              {perfectBonus > 0 && (
                <div className="mt-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold">
                  Perfect bonus +{perfectBonus} included
                </div>
              )}
            </div>
          </div>
          <ScoreBar score={totalScore} max={PER_ROUND_MAX} />
        </div>

        {/* Comparison table */}
        <div className="px-7 py-6">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Correct ranking
          </div>

          <div className="flex flex-col gap-3">
            {actualOrder.map((entry, actualIndex) => {
              const guessResult = results.find((r) => r.actualPosition === actualIndex);
              const guessedPos = guessResult?.guessedPosition ?? null;
              const pts = guessResult?.points ?? 0;
              const isExact = guessedPos === actualIndex;
              const isClose = !isExact && guessedPos !== null && Math.abs(guessedPos - actualIndex) <= 2;

              return (
                <div
                  key={entry.canonicalCountry}
                  className={`flex items-center gap-4 rounded-2xl border px-4 py-3
                    ${isExact ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/20' :
                      isClose ? 'border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/20' :
                      'border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/20'}`}
                >
                  <div className="flex w-7 shrink-0 items-center justify-center">
                    <span className="text-lg font-black text-slate-300 dark:text-slate-600">#{actualIndex + 1}</span>
                  </div>
                  <FlagImg country={entry.country} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white">{entry.country}</div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{entry.displayValue}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    {guessedPos !== null ? (
                      <>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Your pick</div>
                        <div className={`mt-0.5 text-sm font-bold ${isExact ? 'text-emerald-600 dark:text-emerald-400' : isClose ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          Slot #{guessedPos + 1}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400">—</div>
                    )}
                  </div>
                  <div className="shrink-0 w-10 text-center">
                    {isExact ? (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white">+{pts}</span>
                    ) : isClose ? (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-black text-white">+{pts}</span>
                    ) : (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-400 text-sm font-black text-white">+{pts}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-emerald-400"></span> Exact (+3)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-amber-400"></span> Close (+1-2)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-rose-400"></span> Off (+0)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-slate-100 px-7 py-5 dark:border-slate-800">
          <button
            onClick={onRetry}
            className="whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <i className="ri-refresh-line mr-2"></i>Retry
          </button>
          {onNext ? (
            <button
              onClick={onNext}
              className="whitespace-nowrap flex-1 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 cursor-pointer"
            >
              {isLastRound ? (
                <><i className="ri-trophy-line mr-2"></i>See Final Score</>
              ) : (
                <><i className="ri-arrow-right-line mr-2"></i>Next Round</>
              )}
            </button>
          ) : (
            <button
              onClick={() => copyShareText(results, totalScore, metric.label)}
              className="whitespace-nowrap flex-1 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 cursor-pointer"
            >
              <i className="ri-share-line mr-2"></i>Copy result to share
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
