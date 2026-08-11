import { useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  ALL_METRIC_DATASETS,
  MetricDataset,
  MetricEntry,
  getMeaningfulDifference,
  publicMetricLabel,
} from '@/lib/metricData';
import { GameNavbar } from '@/components/ui/game-navbar';
import { DraggableCountry } from './components/DraggableCountry';
import { SlotRow } from './components/SlotRow';
import { ResultScreen } from './components/ResultScreen';
import { GameStatsBar } from '@/components/feature/game-stats-bar';
import { useGameStats } from '@/lib/gameStats';
import { scoreLine, gradeSquare } from '@/lib/shareResult';
import { ShareButtons } from '@/components/feature/share-buttons';

const TOTAL_ROUNDS = 1;
const PER_ROUND_MAX = 18; // 5 * 3 + 3 perfect bonus

type BlindRankingRound = {
  metric: MetricDataset;
  queue: MetricEntry[];
  actualOrder: MetricEntry[];
  dateKey: string;
};

type RoundResult = {
  entry: MetricEntry;
  guessedPosition: number;
  actualPosition: number;
  points: number;
};

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: string) {
  let state = hashString(seed) || 1;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: readonly T[], seed: string) {
  const shuffled = [...items];
  const random = createSeededRandom(seed);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]];
  }
  return shuffled;
}

function metricSelectionWeight(metric: MetricDataset) {
  const id = metric.id.toLowerCase();
  const label = metric.label.toLowerCase();

  if (id.includes('pm25') || label.includes('pm2.5')) return 0;
  if (id.includes('amphibian')) return 0.28;
  if (metric.source === 'Imported') return 2.2;
  if (id.includes('plant')) return 0.85;
  return 1;
}

function weightedMetricShuffle(metrics: readonly MetricDataset[], seed: string) {
  return metrics
    .map((metric, index) => {
      const weight = metricSelectionWeight(metric);
      const random = createSeededRandom(`${seed}:${index}:${metric.id}`)();
      return { metric, score: weight <= 0 ? Number.POSITIVE_INFINITY : -Math.log(Math.max(random, 1e-9)) / weight };
    })
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => a.score - b.score || a.metric.label.localeCompare(b.metric.label))
    .map((entry) => entry.metric);
}

function brusselsDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Groups metrics into "families" so the game never picks two metrics that are
 * too similar (e.g. four different Olympic medal counts) in the same session.
 */
function getMetricFamily(metric: MetricDataset): string {
  const id = metric.id;

  // Olympic / sports families
  if (id === 'det-summer-olympics' || id === 'det-summer-gold' || id === 'det-olympic-appearances' || id === 'det-olympic-medals') return 'olympics';
  if (id === 'det-world-cup-appearances' || id === 'det-world-cup-streak') return 'world-cup';

  // Religion families
  if (id === 'det-buddhist-share' || id === 'det-buddhist-pop') return 'buddhism';
  if (id === 'det-christian-pop' || id === 'det-christian-share') return 'christianity';
  if (id === 'det-hindu-pop' || id === 'det-hindu-share') return 'hinduism';
  if (id === 'det-muslim-pop') return 'islam';

  // CO2 / emissions
  if (id === 'det-co2-2023' || id === 'det-co2-2000') return 'co2-emissions';

  // Roads
  if (id === 'det-paved-roads' || id === 'det-unpaved-roads' || id === 'det-paved-share' || id === 'det-unpaved-share') return 'road-types';
  if (id === 'det-road-length' || id === 'det-total-road') return 'road-length';

  // Biodiversity sub-families
  if (id === 'det-amphibian-species' || id === 'det-threatened-amphibians' || id === 'det-endemic-amphibians') return 'amphibians';
  if (id === 'det-plant-species' || id === 'det-threatened-plants' || id === 'det-endemic-plants') return 'plants';

  // Urban population vs share
  if (id === 'urban-population' || id === 'urban-population-share') return 'urban-pop';

  // HDI vs detective HDI
  if (id === 'hdi' || id === 'det-detective-hdi') return 'hdi';

  // Population vs detective population
  if (id === 'population' || id === 'det-detective-population') return 'population';

  // Land area duplicates
  if (id === 'land-area' || id === 'det-detective-land-area') return 'land-area';

  // Compass metrics — group by their category to avoid 3 compass rounds
  if (id.startsWith('compass-')) return `compass-${metric.category}`;

  // Default: unique per metric id
  return id;
}

function scorePlacement(placedIndex: number, actualIndex: number) {
  const distance = Math.abs(placedIndex - actualIndex);
  if (distance === 0) return 3;
  if (distance === 1) return 2;
  if (distance === 2) return 1;
  return 0;
}

function hasGoodSeparation(metric: MetricDataset, entries: MetricEntry[]) {
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (previous.displayValue === current.displayValue) return false;
    const minGap = getMeaningfulDifference(metric, previous.value, current.value) * 0.9;
    if (Math.abs(previous.value - current.value) < minGap) return false;
  }
  return true;
}

function pickEntriesFromWindow(metric: MetricDataset, window: MetricEntry[], random: () => number) {
  const picks: MetricEntry[] = [];
  const segmentCount = 5;
  for (let segment = 0; segment < segmentCount; segment += 1) {
    const start = Math.floor((segment * window.length) / segmentCount);
    const end = Math.max(start + 1, Math.floor(((segment + 1) * window.length) / segmentCount));
    const slice = seededShuffle(
      window.slice(start, end),
      `${metric.id}:${segment}:${window[start]?.canonicalCountry ?? start}:${window.length}`,
    );
    const choice = slice[Math.floor(random() * slice.length)] ?? window[start];
    if (choice) picks.push(choice);
  }
  const unique = picks.filter(
    (entry, index, list) =>
      list.findIndex((item) => item.canonicalCountry === entry.canonicalCountry) === index,
  );
  if (unique.length < 5) return null;
  const finalEntries = unique.slice(0, 5).sort((a, b) => b.value - a.value);
  return hasGoodSeparation(metric, finalEntries) ? finalEntries : null;
}

function buildDailyRound(metric: MetricDataset, dateKey: string, roundIdx: number): BlindRankingRound {
  const source = metric.entries;
  const seedKey = `${dateKey}:${metric.id}:r${roundIdx}`;
  const random = createSeededRandom(seedKey);
  const windowSizes = [30, 36, 44, 52, Math.min(source.length, 70)].filter(
    (size, index, list) => size <= source.length && list.indexOf(size) === index,
  );

  for (const windowSize of windowSizes) {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const maxStart = Math.max(0, source.length - windowSize);
      const start = maxStart > 0 ? Math.floor(random() * (maxStart + 1)) : 0;
      const window = source.slice(start, start + windowSize);
      const picked = pickEntriesFromWindow(metric, window, random);
      if (!picked) continue;
      return {
        metric,
        actualOrder: picked,
        queue: seededShuffle(picked, `${seedKey}:queue`),
        dateKey,
      };
    }
  }

  const fallback = source
    .filter((entry, index, entries) => index === 0 || entry.displayValue !== entries[index - 1].displayValue)
    .slice(0, 25);
  const picked = [fallback[1], fallback[5], fallback[9], fallback[13], fallback[17]]
    .filter(Boolean).slice(0, 5).sort((a, b) => b.value - a.value) as MetricEntry[];

  return {
    metric,
    actualOrder: picked,
    queue: seededShuffle(picked, `${seedKey}:queue:fallback`),
    dateKey,
  };
}

function InstructionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-yellow-200 bg-white p-7 shadow-2xl dark:border-yellow-900/70 dark:bg-slate-800">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg">
            <i className="ri-layout-column-line text-2xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">How Blind Ranking works</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Play <strong>3 rounds</strong> today. Each round gives you a different metric and five countries appearing one by one. Drag each country into the correct slot — you do not know who comes next.
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <div className="rounded-2xl bg-yellow-50/70 border border-yellow-100 dark:border-yellow-900/50 dark:bg-yellow-950/20 px-4 py-3 flex items-start gap-3">
            <i className="ri-sort-desc text-yellow-500 dark:text-yellow-400 mt-0.5 shrink-0"></i>
            <span>Slot #1 = highest value. Slot #5 = lowest. Once a slot is filled it&apos;s locked — choose wisely!</span>
          </div>
          <div className="rounded-2xl bg-yellow-50/70 border border-yellow-100 dark:border-yellow-900/50 dark:bg-yellow-950/20 px-4 py-3 flex items-start gap-3">
            <i className="ri-question-line text-yellow-500 dark:text-yellow-400 mt-0.5 shrink-0"></i>
            <span>Countries appear one by one. You place each before seeing the next.</span>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-2.5">Scoring per placement</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/30">
              <span className="font-black text-emerald-700 dark:text-emerald-400 whitespace-nowrap">3 pts</span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 whitespace-nowrap">Exact spot</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/30">
              <span className="font-black text-amber-700 dark:text-amber-400 whitespace-nowrap">2 pts</span>
              <span className="text-xs text-amber-700 dark:text-amber-400 whitespace-nowrap">Off by 1</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 dark:border-orange-800 dark:bg-orange-950/30">
              <span className="font-black text-orange-700 dark:text-orange-400 whitespace-nowrap">1 pt</span>
              <span className="text-xs text-orange-700 dark:text-orange-400 whitespace-nowrap">Off by 2</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 dark:border-rose-800 dark:bg-rose-950/30">
              <span className="font-black text-rose-700 dark:text-rose-400 whitespace-nowrap">0 pts</span>
              <span className="text-xs text-rose-700 dark:text-rose-400 whitespace-nowrap">Further off</span>
            </div>
            <div className="col-span-2 flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2.5 dark:border-yellow-800 dark:bg-yellow-950/30">
              <span className="font-black text-yellow-700 dark:text-yellow-400 whitespace-nowrap">+3 bonus</span>
              <span className="text-xs text-yellow-700 dark:text-yellow-400">Perfect round — all 5 exact → max 18 pts/round · 54 pts total</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="whitespace-nowrap rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 px-5 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] cursor-pointer"
          >
            Start today&apos;s challenge
          </button>
        </div>
      </div>
    </div>
  );
}

function FinalResultScreen({
  roundScores,
  roundResults,
  rounds,
  onRetry,
}: {
  roundScores: number[];
  roundResults: RoundResult[][];
  rounds: BlindRankingRound[];
  onRetry: () => void;
}) {
  const total = roundScores.reduce((s, r) => s + r, 0);
  const maxTotal = TOTAL_ROUNDS * PER_ROUND_MAX;
  const pct = Math.round((total / maxTotal) * 100);

  const grade = () => {
    if (pct >= 95) return { label: 'Perfect!', emoji: '🏆' };
    if (pct >= 78) return { label: 'Excellent', emoji: '🌟' };
    if (pct >= 55) return { label: 'Great', emoji: '🎯' };
    if (pct >= 33) return { label: 'Good', emoji: '👍' };
    return { label: 'Keep going', emoji: '💪' };
  };

  const g = grade();

  const sharePayload = {
    game: 'Blind Ranking',
    result: `${publicMetricLabel(rounds[0].metric.label)} — ${scoreLine(total, maxTotal)}`,
    details: [
      ...roundResults.map((results, i) => {
        const tiles = results.map((r) => gradeSquare((r.points / 3) * 100)).join('');
        return `${tiles} ${publicMetricLabel(rounds[i].metric.label)} — ${roundScores[i]}/${PER_ROUND_MAX}`;
      }),
    ],
    path: '/blind-ranking',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm overflow-y-auto py-8">
      <div className="w-full max-w-xl rounded-3xl border border-yellow-200 bg-white shadow-2xl dark:border-yellow-900/60 dark:bg-slate-900 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-7 py-7 text-white text-center">
          <div className="text-5xl mb-3">{g.emoji}</div>
          <h2 className="text-3xl font-black">{g.label}</h2>
          <div className="mt-4 text-6xl font-black">{total}</div>
          <div className="text-amber-100 text-sm mt-1">out of {maxTotal} total</div>
          <div className="mt-4 h-3 w-full rounded-full bg-white/20">
            <div
              className="h-3 rounded-full bg-white transition-all duration-700"
              style={{ width: `${pct}%` }}
            ></div>
          </div>
        </div>
        <div className="px-7 py-6 flex flex-col gap-4">
          {roundScores.map((score, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Round {i + 1}</div>
                <div className="mt-0.5 font-bold text-slate-800 dark:text-white">{publicMetricLabel(rounds[i].metric.label)}</div>
              </div>
              <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{score}<span className="text-sm font-normal text-slate-400 dark:text-slate-500">/{PER_ROUND_MAX}</span></div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 border-t border-slate-100 px-7 py-5 dark:border-slate-800">
          <button
            onClick={onRetry}
            className="whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <i className="ri-refresh-line mr-2"></i>Retry
          </button>
          <ShareButtons share={sharePayload} className="flex-1" />
        </div>

        <GameStatsBar gameId="blind-ranking" showStreak={false} className="mt-4" />
      </div>
    </div>
  );
}

export default function BlindRankingPage() {
  const dateKey = useMemo(() => brusselsDate(), []);

  const eligibleMetrics = useMemo(
    () => ALL_METRIC_DATASETS.filter((m) => m.entries.length >= 30 && metricSelectionWeight(m) > 0),
    [],
  );

  const threeMetrics = useMemo(() => {
    if (eligibleMetrics.length < 1) return eligibleMetrics.slice(0, Math.min(TOTAL_ROUNDS, eligibleMetrics.length));

    const shuffled = weightedMetricShuffle(eligibleMetrics, `blind-ranking-1r:${dateKey}`);
    const selected: MetricDataset[] = [];
    const usedFamilies = new Set<string>();
    const usedCategories = new Set<string>();

    // Pass 1 — strict: unique family AND unique category
    for (const metric of shuffled) {
      if (selected.length >= TOTAL_ROUNDS) break;
      const family = getMetricFamily(metric);
      const category = metric.category;
      if (usedFamilies.has(family) || usedCategories.has(category)) continue;
      selected.push(metric);
      usedFamilies.add(family);
      usedCategories.add(category);
    }

    // Pass 2 — relaxed: unique family, category may repeat
    if (selected.length < TOTAL_ROUNDS) {
      for (const metric of shuffled) {
        if (selected.length >= TOTAL_ROUNDS) break;
        if (selected.some((m) => m.id === metric.id)) continue;
        const family = getMetricFamily(metric);
        if (usedFamilies.has(family)) continue;
        selected.push(metric);
        usedFamilies.add(family);
      }
    }

    // Pass 3 — last resort: just fill up
    if (selected.length < TOTAL_ROUNDS) {
      for (const metric of shuffled) {
        if (selected.length >= TOTAL_ROUNDS) break;
        if (selected.some((m) => m.id === metric.id)) continue;
        selected.push(metric);
      }
    }

    return selected;
  }, [eligibleMetrics, dateKey]);

  const dailyRounds = useMemo(
    () => threeMetrics.map((metric, idx) => buildDailyRound(metric, dateKey, idx)),
    [threeMetrics, dateKey],
  );

  // Per-round state stored as arrays
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [allPlacements, setAllPlacements] = useState<Array<Array<MetricEntry | null>>>(
    () => Array(TOTAL_ROUNDS).fill(null).map(() => Array(5).fill(null)),
  );
  const [allQueueIndices, setAllQueueIndices] = useState<number[]>(() => Array(TOTAL_ROUNDS).fill(0));
  const [allRoundsComplete, setAllRoundsComplete] = useState<boolean[]>(() => Array(TOTAL_ROUNDS).fill(false));
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [showFinalResult, setShowFinalResult] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [activeEntry, setActiveEntry] = useState<MetricEntry | null>(null);

  const round = dailyRounds[currentRoundIdx] ?? null;
  const placements = allPlacements[currentRoundIdx] ?? Array(5).fill(null);
  const queueIndex = allQueueIndices[currentRoundIdx] ?? 0;
  const roundComplete = allRoundsComplete[currentRoundIdx] ?? false;
  const currentCountry = round?.queue[queueIndex] ?? null;

  const results = useMemo<RoundResult[]>(() => {
    if (!round) return [];
    const actualPositions = new Map(round.actualOrder.map((entry, index) => [entry.canonicalCountry, index]));
    return placements
      .map((entry, index) => {
        if (!entry) return null;
        const actualIndex = actualPositions.get(entry.canonicalCountry) ?? index;
        return {
          entry,
          guessedPosition: index,
          actualPosition: actualIndex,
          points: scorePlacement(index, actualIndex),
        } satisfies RoundResult;
      })
      .filter(Boolean) as RoundResult[];
  }, [placements, round]);

  const totalScore = results.reduce((sum, r) => sum + r.points, 0);
  const perfectBonus = results.length === 5 && results.every((r) => r.guessedPosition === r.actualPosition) ? 3 : 0;
  const roundScore = totalScore + perfectBonus;

  // Record each completed round once, keyed on the puzzle date plus round index
  // so replaying the same day's round can't inflate the totals.
  const { record: recordRoundStats } = useGameStats('blind-ranking');

  useEffect(() => {
    if (!allRoundsComplete[currentRoundIdx] || results.length !== 5) return;
    recordRoundStats(
      { score: roundScore, maxScore: PER_ROUND_MAX },
      `${brusselsDate()}-r${currentRoundIdx}`,
    );
  }, [allRoundsComplete, currentRoundIdx, results.length, roundScore, recordRoundStats]);

  // All round results and scores (including current)
  const allRoundResults = useMemo<RoundResult[][]>(() => {
    return dailyRounds.map((r, rIdx) => {
      if (!r || !allRoundsComplete[rIdx]) return [];
      const actualPositions = new Map(r.actualOrder.map((entry, index) => [entry.canonicalCountry, index]));
      return (allPlacements[rIdx] ?? [])
        .map((entry, index) => {
          if (!entry) return null;
          const actualIndex = actualPositions.get(entry.canonicalCountry) ?? index;
          return {
            entry,
            guessedPosition: index,
            actualPosition: actualIndex,
            points: scorePlacement(index, actualIndex),
          } satisfies RoundResult;
        })
        .filter(Boolean) as RoundResult[];
    });
  }, [dailyRounds, allPlacements, allRoundsComplete]);

  const allRoundScores = useMemo(() =>
    allRoundResults.map((res) => {
      const base = res.reduce((s, r) => s + r.points, 0);
      const bonus = res.length === 5 && res.every((r) => r.guessedPosition === r.actualPosition) ? 3 : 0;
      return base + bonus;
    }),
    [allRoundResults],
  );

  useEffect(() => {
    if (roundComplete && !showRoundResult) {
      const timer = setTimeout(() => setShowRoundResult(true), 800);
      return () => clearTimeout(timer);
    }
  }, [roundComplete, showRoundResult]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragStart = (_event: DragStartEvent) => {
    if (currentCountry) setActiveEntry(currentCountry);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveEntry(null);
    const { over } = event;
    if (!over || !round || !currentCountry || roundComplete) return;
    const slotIdStr = over.id.toString();
    if (!slotIdStr.startsWith('slot-')) return;
    const slotIndex = parseInt(slotIdStr.replace('slot-', ''), 10);
    if (isNaN(slotIndex) || placements[slotIndex]) return;

    const nextPlacements = placements.map((p, i) => (i === slotIndex ? currentCountry : p));
    const nextIndex = queueIndex + 1;
    const newAllPlacements = allPlacements.map((p, i) => (i === currentRoundIdx ? nextPlacements : p));
    const newAllQueueIndices = allQueueIndices.map((q, i) => (i === currentRoundIdx ? nextIndex : q));

    setAllPlacements(newAllPlacements);
    setAllQueueIndices(newAllQueueIndices);

    if (nextIndex >= round.queue.length) {
      setAllRoundsComplete((prev) => prev.map((r, i) => (i === currentRoundIdx ? true : r)));
    }
  };

  const handleNextRound = () => {
    setShowRoundResult(false);
    const nextIdx = currentRoundIdx + 1;
    if (nextIdx >= TOTAL_ROUNDS) {
      setShowFinalResult(true);
    } else {
      setCurrentRoundIdx(nextIdx);
    }
  };

  const resetAll = () => {
    setAllPlacements(Array(TOTAL_ROUNDS).fill(null).map(() => Array(5).fill(null)));
    setAllQueueIndices(Array(TOTAL_ROUNDS).fill(0));
    setAllRoundsComplete(Array(TOTAL_ROUNDS).fill(false));
    setCurrentRoundIdx(0);
    setShowRoundResult(false);
    setShowFinalResult(false);
  };

  if (!round) {
    return <div className="app-page-shell grid min-h-screen place-items-center bg-slate-950 text-slate-200">Loading…</div>;
  }

  return (
    <div className="app-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-amber-50 text-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-slate-100">
      <InstructionModal open={showHelp} onClose={() => setShowHelp(false)} />

      {showRoundResult && round && !showFinalResult && (
        <ResultScreen
          results={results}
          totalScore={roundScore}
          perfectBonus={perfectBonus}
          metric={round.metric}
          actualOrder={round.actualOrder}
          onRetry={resetAll}
          onNext={handleNextRound}
          roundInfo={{ current: currentRoundIdx + 1, total: TOTAL_ROUNDS }}
        />
      )}

      {showFinalResult && (
        <FinalResultScreen
          roundScores={allRoundScores}
          roundResults={allRoundResults}
          rounds={dailyRounds}
          onRetry={resetAll}
        />
      )}

      <GameNavbar currentPath="/blind-ranking" />

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Page header */}
        <div className="mb-8 text-center">
          <h1 className="flex items-center justify-center gap-3 text-4xl font-bold text-slate-800 dark:text-white">
            <i className="ri-layout-column-line text-yellow-500 dark:text-yellow-400"></i>
            Blind Ranking
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            Drag each country into the correct slot — from highest to lowest{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {publicMetricLabel(round.metric.label).toLowerCase()}
            </span>
            .
          </p>
          <button
            onClick={() => setShowHelp(true)}
            className="unstyled-button mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-yellow-600 transition hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 cursor-pointer"
          >
            <i className="ri-question-line"></i>
            How to play
          </button>
        </div>

        {/* Round indicator */}
        <div className="mb-6 flex items-center gap-3 max-w-md mx-auto">
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`h-2 w-full rounded-full transition-all duration-500 ${
                  i < currentRoundIdx
                    ? 'bg-yellow-500'
                    : i === currentRoundIdx
                    ? 'bg-yellow-400'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              ></div>
              <span className={`text-xs font-semibold ${i === currentRoundIdx ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-600'}`}>
                Round {i + 1}
              </span>
            </div>
          ))}
        </div>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* ─── Left: ranking board ─── */}
            <section className="flex flex-col gap-5">
              {/* Metric header */}
              <div className="rounded-3xl bg-gradient-to-r from-yellow-400 to-amber-500 p-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.22em] text-amber-100">Round {currentRoundIdx + 1} of {TOTAL_ROUNDS}</div>
                    <h2 className="mt-1 text-2xl font-bold">{publicMetricLabel(round.metric.label)}</h2>
                    <p className="mt-1 text-sm text-amber-50/90">
                      {round.metric.description || 'Place the countries from highest to lowest value.'}
                    </p>
                  </div>
                  <button
                    onClick={resetAll}
                    className="whitespace-nowrap shrink-0 rounded-2xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              </div>

              {/* Current country */}
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Current country — drag it to the right slot
                </div>
                {currentCountry ? (
                  <DraggableCountry entry={currentCountry} isDone={roundComplete} />
                ) : (
                  <div className="flex items-center gap-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
                      <i className="ri-check-double-line text-2xl text-emerald-600 dark:text-emerald-400"></i>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">All countries placed!</div>
                      <div className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                        Round complete — see your results
                      </div>
                    </div>
                    {roundComplete && (
                      <button
                        onClick={() => setShowRoundResult(true)}
                        className="whitespace-nowrap ml-auto rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 cursor-pointer"
                      >
                        See results
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Slots */}
              <div className="flex flex-col gap-2.5">
                {placements.map((entry, slotIndex) => {
                  const result = results.find((r) => r.guessedPosition === slotIndex);
                  return (
                    <SlotRow
                      key={slotIndex}
                      slotIndex={slotIndex}
                      entry={entry}
                      canDrop={!entry && !!currentCountry && !roundComplete}
                      roundComplete={roundComplete}
                      actualPosition={result?.actualPosition}
                      points={result?.points}
                    />
                  );
                })}
              </div>
            </section>

            {/* ─── Right: sidebar ─── */}
            <section className="flex flex-col gap-5">
              {/* Progress */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Progress
                </div>
                <div className="mt-3 flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${
                        i < queueIndex ? 'bg-yellow-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    ></div>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {queueIndex}/5 countries placed this round
                </p>
              </div>

              {/* Running score */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-3">
                  Score so far
                </div>
                <div className="flex flex-col gap-2">
                  {allRoundScores.map((score, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${i === currentRoundIdx ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        Round {i + 1}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {allRoundsComplete[i] ? `${score}/${PER_ROUND_MAX}` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoring guide */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Scoring
                </div>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 dark:bg-emerald-950/30">
                    <span className="text-slate-700 dark:text-slate-300">Exact spot</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">3 pts</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-2.5 dark:bg-amber-950/30">
                    <span className="text-slate-700 dark:text-slate-300">Off by 1</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">2 pts</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-2.5 dark:bg-orange-950/30">
                    <span className="text-slate-700 dark:text-slate-300">Off by 2</span>
                    <span className="font-bold text-orange-700 dark:text-orange-400">1 pt</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-rose-50 px-4 py-2.5 dark:bg-rose-950/30">
                    <span className="text-slate-700 dark:text-slate-300">Further off</span>
                    <span className="font-bold text-rose-700 dark:text-rose-400">0 pts</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-yellow-50 px-4 py-2.5 dark:bg-yellow-950/30">
                    <span className="text-slate-700 dark:text-slate-300">Perfect row</span>
                    <span className="font-bold text-yellow-700 dark:text-yellow-400">+3 bonus</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-yellow-100 bg-yellow-50 p-5 dark:border-yellow-900/40 dark:bg-yellow-950/20">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-600 dark:text-yellow-400">
                  How to play
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  Drag the card above into one of the 5 slots. Slot #1 = highest, slot #5 = lowest. Once locked, slots can&apos;t change — choose wisely!
                </p>
              </div>
            </section>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeEntry ? <DraggableCountry entry={activeEntry} isDone={false} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
