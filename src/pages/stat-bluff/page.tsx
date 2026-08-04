import { useEffect, useMemo, useState } from 'react';
import { formatMetricValue, getCountryMetricPool, getMeaningfulDifference, getMetricById, publicMetricLabel, MetricDataset } from '@/lib/metricData';
import { GameNavbar } from '@/components/ui/game-navbar';
import { getCountryCode } from '@/lib/countryFlags';
import { RulesModal } from '@/components/feature/rules-modal';
import { GameStatsBar } from '@/components/feature/game-stats-bar';
import { useGameStats } from '@/lib/gameStats';

type BluffCard = {
  datasetId: string;
  label: string;
  description?: string;
  shownValue: string;
  actualValue: string;
  isFake: boolean;
  category: string;
};

type BluffRound = {
  country: string;
  cards: BluffCard[];
};

function shuffle<T>(items: readonly T[]) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getFakeValue(dataset: MetricDataset, canonicalCountry: string, trueValue: number, actualDisplayValue: string) {
  const currentIndex = dataset.entries.findIndex((e) => e.canonicalCountry === canonicalCountry);
  const minimumGap = getMeaningfulDifference(dataset, trueValue) * 1.15;

  const rankCandidates = dataset.entries.filter((e, i) => {
    if (e.canonicalCountry === canonicalCountry) return false;
    if (e.displayValue === actualDisplayValue) return false;
    if (Math.abs(e.value - trueValue) < minimumGap) return false;
    const dist = Math.abs(i - currentIndex);
    return dist >= 6 && dist <= 28;
  });

  const fallbackCandidates = dataset.entries.filter((e) => {
    if (e.canonicalCountry === canonicalCountry) return false;
    if (e.displayValue === actualDisplayValue) return false;
    return Math.abs(e.value - trueValue) >= minimumGap;
  });

  const picked = shuffle(rankCandidates)[0] ?? shuffle(fallbackCandidates)[0];
  if (picked) return picked.displayValue;

  const dir = Math.random() > 0.5 ? 1 : -1;
  let fakeValue = trueValue + minimumGap * dir;
  if ((dataset.unit ?? '') === '%') fakeValue = Math.max(0, Math.min(100, fakeValue));
  if ((dataset.precision ?? 0) >= 3 && trueValue <= 1.5) fakeValue = trueValue + 0.06 * dir;
  if (Math.abs(fakeValue - trueValue) < minimumGap) fakeValue = trueValue + minimumGap * 1.35 * dir;

  const formatted = formatMetricValue(fakeValue, dataset.unit, dataset.precision ?? 0);
  if (!formatted || formatted === actualDisplayValue) return null;
  return formatted;
}

function createRound() {
  const countries = shuffle(
    Array.from(getCountryMetricPool().values()).filter((e) => e.metrics.length >= 8),
  );

  for (const countryBucket of countries) {
    // Deduplicate by label and filter out zero values (which indicate missing data)
    const uniqueMetrics = countryBucket.metrics.filter((metric, index, list) => {
      if (metric.value === 0) return false; // 0 almost always means no data in this context
      return list.findIndex((item) => publicMetricLabel(item.label) === publicMetricLabel(metric.label)) === index;
    });

    if (uniqueMetrics.length < 3) continue;

    const fakeOptions = uniqueMetrics.map((metric) => {
      const dataset = getMetricById(metric.datasetId);
      if (!dataset) return null;
      const fakeValue = getFakeValue(dataset, countryBucket.canonicalCountry, metric.value, metric.displayValue);
      if (!fakeValue) return null;
      return { metric, fakeValue, dataset };
    }).filter(Boolean) as Array<{ metric: (typeof uniqueMetrics)[number]; fakeValue: string; dataset: MetricDataset }>;

    if (!fakeOptions.length) continue;

    const fakePick = shuffle(fakeOptions)[0];
    const trueCards = shuffle(
      uniqueMetrics.filter((m) => m.datasetId !== fakePick.metric.datasetId),
    ).slice(0, 2);
    if (trueCards.length < 2) continue;

    const cards = shuffle([
      {
        datasetId: fakePick.metric.datasetId,
        label: publicMetricLabel(fakePick.metric.label),
        description: fakePick.dataset.description,
        shownValue: fakePick.fakeValue,
        actualValue: fakePick.metric.displayValue,
        isFake: true,
        category: fakePick.metric.category,
      },
      ...trueCards.map((metric) => {
        const ds = getMetricById(metric.datasetId);
        return {
          datasetId: metric.datasetId,
          label: publicMetricLabel(metric.label),
          description: ds?.description,
          shownValue: metric.displayValue,
          actualValue: metric.displayValue,
          isFake: false,
          category: metric.category,
        };
      }),
    ]) as BluffCard[];

    return { country: countryBucket.country, cards } satisfies BluffRound;
  }

  return null;
}

function FriendlyFlag({ country, size = 96 }: { country: string; size?: number }) {
  const code = getCountryCode(country).toLowerCase();
  // flagcdn only supports these widths: 20, 40, 80, 160, 320
  const cdnWidth = size <= 40 ? 40 : size <= 80 ? 80 : size <= 160 ? 160 : 320;
  const src = code !== 'un' ? `https://flagcdn.com/w${cdnWidth}/${code}.png` : null;

  const [failed, setFailed] = useState(false);

  // Reset failure flag whenever the country changes
  useEffect(() => {
    setFailed(false);
  }, [country]);

  if (!src || failed) {
    return (
      <div
        className="rounded-lg border border-white/20 bg-white/20 flex items-center justify-center shrink-0"
        style={{ width: size, height: Math.round(size * 0.67) }}
      >
        <span className="text-white font-bold text-lg">{country.charAt(0)}</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden border border-white/20 shrink-0"
      style={{ width: size, height: Math.round(size * 0.67) }}
    >
      <img
        src={src}
        alt={`${country} flag`}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

// Category → colour token
const CATEGORY_COLOURS: Record<string, { bg: string; text: string; dot: string }> = {
  Geography:     { bg: 'bg-sky-50 dark:bg-sky-950/30',     text: 'text-sky-700 dark:text-sky-300',     dot: 'bg-sky-500' },
  Society:       { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  Development:   { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  Climate:       { bg: 'bg-cyan-50 dark:bg-cyan-950/30',    text: 'text-cyan-700 dark:text-cyan-300',    dot: 'bg-cyan-500' },
  Culture:       { bg: 'bg-amber-50 dark:bg-amber-950/30',  text: 'text-amber-700 dark:text-amber-300',  dot: 'bg-amber-500' },
  Infrastructure:{ bg: 'bg-orange-50 dark:bg-orange-950/30',text: 'text-orange-700 dark:text-orange-300',dot: 'bg-orange-500' },
  Nature:        { bg: 'bg-lime-50 dark:bg-lime-950/30',    text: 'text-lime-700 dark:text-lime-300',    dot: 'bg-lime-500' },
  Religion:      { bg: 'bg-rose-50 dark:bg-rose-950/30',    text: 'text-rose-700 dark:text-rose-300',    dot: 'bg-rose-500' },
  Sports:        { bg: 'bg-yellow-50 dark:bg-yellow-950/30',text: 'text-yellow-700 dark:text-yellow-300',dot: 'bg-yellow-500' },
  Agriculture:   { bg: 'bg-teal-50 dark:bg-teal-950/30',   text: 'text-teal-700 dark:text-teal-300',   dot: 'bg-teal-500' },
};
const DEFAULT_COLOUR = { bg: 'bg-slate-50 dark:bg-slate-900/40', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' };

function categoryColour(category: string) {
  return CATEGORY_COLOURS[category] ?? DEFAULT_COLOUR;
}

export default function StatBluffPage() {
  const [round, setRound] = useState<BluffRound | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const { record: recordAnswer } = useGameStats('stat-bluff');
  const [totalPlayed, setTotalPlayed] = useState(0);
  const [showRules, setShowRules] = useState(true);

  useEffect(() => {
    setRound(createRound());
  }, []);

  const fakeCardIndex = useMemo(() => round?.cards.findIndex((c) => c.isFake) ?? -1, [round]);
  const isCorrect = revealed && selectedIndex === fakeCardIndex;

  // Clicking a card immediately reveals — no separate submit step
  function handleCardClick(index: number) {
    if (revealed) return;
    const correct = index === fakeCardIndex;
    setSelectedIndex(index);
    setRevealed(true);
    setTotalPlayed((p) => p + 1);
    setStreak(correct ? (s) => s + 1 : () => 0);
    // Each card reveal is a win or a loss, so `won` drives the shared streak.
    // Keyed on the round id so a double render can't count it twice.
    recordAnswer({ won: correct }, `answer-${totalPlayed}`);
  }

  function nextRound() {
    setRound(createRound());
    setSelectedIndex(null);
    setRevealed(false);
  }

  if (!round) {
    return <div className="app-page-shell grid min-h-screen place-items-center bg-slate-950 text-slate-200">Loading…</div>;
  }

  return (
    <div className="app-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-fuchsia-50 to-rose-50 text-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-slate-100">
      <GameNavbar currentPath="/stat-bluff" />

      <RulesModal
        open={showRules}
        onClose={() => { setShowRules(false); }}
        title="How Stat Bluff works"
        icon="ri-file-warning-line"
        iconGradient="from-fuchsia-500 to-rose-600"
        accent="fuchsia"
        description="One country, three stat cards. Two values are real — one has been quietly swapped for a plausible impostor. Tap the fake."
        rules={[
          { icon: 'ri-spy-line', text: 'One card shows a fabricated value that looks believable but is actually wrong.' },
          { icon: 'ri-fingerprint-line', text: 'The fake value is chosen from nearby ranks, so the difference can be subtle. Read carefully!' },
          { icon: 'ri-lightning-flash-line', text: 'Tap a card to reveal instantly — no submit step. Build your streak by spotting the bluff.' },
        ]}
        scoring={[
          { pts: '+1', label: 'Correct', sub: 'streak grows', color: 'green' },
          { pts: '0', label: 'Wrong', sub: 'streak resets', color: 'red' },
          { pts: '🔥', label: 'Streak', sub: 'keep it going!', color: 'amber' },
        ]}
        tip="The fake is often close in value but slightly off. Compare all three cards before tapping."
        ctaLabel="Spot the bluff!"
        ctaGradient="from-fuchsia-500 to-rose-600"
      />

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="flex items-center justify-center gap-3 text-4xl font-bold text-slate-800 dark:text-white">
            <i className="ri-file-warning-line text-fuchsia-600 dark:text-fuchsia-400"></i>
            Stat Bluff
            <i className="ri-spy-line text-fuchsia-600 dark:text-fuchsia-400"></i>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            One country. Three stat cards. Two are real — one is bluffing. Tap the fake.
          </p>
          <button
            onClick={() => setShowRules(true)}
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-800 dark:hover:text-fuchsia-300 transition-colors cursor-pointer font-medium"
            style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
          >
            <i className="ri-question-line"></i>
            How to play
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left: game */}
          <section className="rounded-3xl border border-fuchsia-200 bg-white p-6 dark:border-fuchsia-900/60 dark:bg-slate-800">
            {/* Country header */}
            <div className="rounded-3xl bg-gradient-to-r from-fuchsia-600 to-rose-600 p-6 text-white">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                  <FriendlyFlag key={round.country} country={round.country} size={96} />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-100">Current country</div>
                    <h2 className="mt-1 text-3xl font-bold">{round.country}</h2>
                    <p className="mt-2 text-sm text-fuchsia-50/80">Tap the card that does NOT belong.</p>
                  </div>
                </div>
                <button onClick={nextRound}
                  className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 whitespace-nowrap cursor-pointer">
                  New round
                </button>
              </div>
            </div>

            {/* Cards — horizontal layout, stacked, no overflow risk */}
            <div className="mt-6 space-y-3">
              {round.cards.map((card, index) => {
                const selected = selectedIndex === index;
                const isFake = card.isFake;
                const col = categoryColour(card.category);

                // Before reveal: highlight selection
                // After reveal: fake = red, real = green
                let borderClass = 'border-slate-200 dark:border-slate-700 hover:border-fuchsia-400 dark:hover:border-fuchsia-500 cursor-pointer';
                if (revealed) {
                  if (isFake) {
                    borderClass = 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-950/40';
                  } else {
                    borderClass = 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/40';
                  }
                } else if (selected) {
                  borderClass = 'border-fuchsia-500 bg-fuchsia-50/60 dark:border-fuchsia-400 dark:bg-fuchsia-950/30';
                }

                const ringClass = revealed && selected ? (isFake ? 'ring-2 ring-red-400/60' : 'ring-2 ring-emerald-400/60') : '';

                return (
                  <button
                    key={`${card.datasetId}-${index}`}
                    onClick={() => handleCardClick(index)}
                    disabled={revealed}
                    className={`w-full rounded-2xl border-2 p-5 text-left transition bg-white dark:bg-slate-900 disabled:cursor-default ${borderClass} ${ringClass}`}
                  >
                    <div className="flex items-start justify-between gap-6">
                      {/* Left: label + description + status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${col.bg} ${col.text}`}>
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${col.dot}`}></div>
                            {card.category}
                          </div>
                          {revealed && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${isFake ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'}`}>
                              <i className={isFake ? 'ri-close-circle-fill' : 'ri-checkbox-circle-fill'}></i>
                              {isFake ? 'FAKE' : 'REAL'}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 text-lg font-bold text-slate-900 dark:text-white leading-snug">{card.label}</div>
                        {card.description && (
                          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 italic leading-relaxed">{card.description}</div>
                        )}
                        {revealed && isFake && (
                          <div className="mt-3 text-sm font-medium">
                            <span className="text-emerald-600 dark:text-emerald-400">Real value: <span className="font-bold">{card.actualValue}</span></span>
                          </div>
                        )}
                        {revealed && !isFake && selected && (
                          <div className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">You picked this — but it's genuine.</div>
                        )}
                      </div>

                      {/* Right: stat value */}
                      <div className="shrink-0 text-right max-w-[40%] flex flex-col items-end gap-2">
                        {revealed && (
                          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold ${isFake ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                            <i className={isFake ? 'ri-close-line' : 'ri-check-line'}></i>
                          </div>
                        )}
                        <div className={`text-3xl font-bold break-all leading-tight ${revealed && isFake ? 'line-through text-red-400 dark:text-red-500' : 'text-slate-900 dark:text-white'}`}>
                          {card.shownValue}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-wrap gap-3">
              {!revealed && (
                <button onClick={nextRound}
                  className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap">
                  Skip
                </button>
              )}
              {revealed && (
                <button onClick={nextRound}
                  className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-rose-600 px-6 py-3 font-semibold text-white transition hover:scale-[1.02] cursor-pointer whitespace-nowrap flex items-center gap-2">
                  Next round
                  <i className="ri-arrow-right-line"></i>
                </button>
              )}
            </div>
          </section>

          {/* Right: streak + result */}
          <section className="space-y-5">
            {/* Streak counter */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-3">Current streak</div>
              <div className="flex items-end gap-3">
                <div className="text-6xl font-bold text-slate-900 dark:text-white leading-none">{streak}</div>
                <div className="pb-1 text-slate-500 dark:text-slate-400 text-sm">correct in a row</div>
              </div>
              {streak > 0 && (
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {Array.from({ length: Math.min(streak, 10) }).map((_, i) => (
                    <div key={i} className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                  ))}
                  {streak > 10 && <span className="text-xs text-slate-400">+{streak - 10} more</span>}
                </div>
              )}
              {totalPlayed > 0 && (
                <div className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                  {totalPlayed} round{totalPlayed !== 1 ? 's' : ''} played this session
                </div>
              )}

              <GameStatsBar gameId="stat-bluff" showScore={false} className="mt-3" />
            </div>

            {/* Result after reveal */}
            {revealed && (
              <div className={`rounded-3xl border p-6 dark:bg-slate-800 ${isCorrect ? 'border-emerald-200 bg-white dark:border-emerald-900/60' : 'border-rose-200 bg-white dark:border-rose-900/60'}`}>
                <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${isCorrect ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                  {isCorrect ? 'Correct!' : 'Not quite'}
                </div>
                <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {isCorrect ? 'Nailed it' : 'Bluffed!'}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  The bluff was <span className="font-semibold text-slate-900 dark:text-white">{round.cards[fakeCardIndex]?.label}</span>.
                  {!isCorrect && <> Real value was <span className="font-semibold">{round.cards[fakeCardIndex]?.actualValue}</span>.</>}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
