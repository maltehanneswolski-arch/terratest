import { useEffect, useMemo, useRef, useState } from 'react';
import { GameNavbar } from '@/components/ui/game-navbar';
import { LatitudeLadderCity, loadLatitudeLadderCities } from './data';
import { RulesModal } from '@/components/feature/rules-modal';
import { GameStatsBar } from '@/components/feature/game-stats-bar';
import { useGameStats } from '@/lib/gameStats';

const ROUND_SIZE = 5;
const MAX_SCORE = 18;
const MIN_LAT_GAP = 2.2;

const INK = '#101820';
const GREEN = '#2f8f46';
const YELLOW = '#f0c533';
const ORANGE = '#d96a3a';
const RED = '#d04231';

interface PlacementResult {
  city: LatitudeLadderCity;
  guessedIndex: number;
  actualIndex: number;
  points: number;
}

type DragSource =
  | { from: 'pool'; cityId: string }
  | { from: 'slot'; slotIndex: number };

function cryptoRandFloat(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / 0xffffffff;
}

function cryptoShuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(cryptoRandFloat() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function scorePlacement(guessedIndex: number, actualIndex: number) {
  const distance = Math.abs(guessedIndex - actualIndex);
  if (distance === 0) return 3;
  if (distance === 1) return 2;
  if (distance === 2) return 1;
  return 0;
}

function flagUrl(iso2: string) {
  return `https://flagcdn.com/w40/${iso2.trim().toLowerCase()}.png`;
}

function formatPopulation(population: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(population);
}

function formatLatitude(lat: number) {
  return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
}

function buildRound(
  allCities: LatitudeLadderCity[],
  excludeIds: Set<string>
): LatitudeLadderCity[] {
  const fresh = allCities.filter((c) => !excludeIds.has(c.id));
  const pool = fresh.length >= ROUND_SIZE * 3 ? fresh : allCities;
  const shuffled = cryptoShuffle(pool);
  const selected: LatitudeLadderCity[] = [];

  for (const city of shuffled) {
    const tooClose = selected.some((p) => Math.abs(p.lat - city.lat) < MIN_LAT_GAP);
    const dupCountry = selected.some((p) => p.country === city.country);
    if (tooClose || dupCountry) continue;
    selected.push(city);
    if (selected.length === ROUND_SIZE) break;
  }

  if (selected.length < ROUND_SIZE) {
    for (const city of shuffled) {
      if (selected.some((p) => p.id === city.id)) continue;
      if (selected.some((p) => Math.abs(p.lat - city.lat) < 1.1)) continue;
      selected.push(city);
      if (selected.length === ROUND_SIZE) break;
    }
  }

  return selected.length >= ROUND_SIZE
    ? cryptoShuffle(selected.slice(0, ROUND_SIZE))
    : cryptoShuffle(shuffled.slice(0, ROUND_SIZE));
}

function scoreBadgeStyle(points: number): { bg: string; color: string } {
  if (points === 3) return { bg: `${GREEN}22`, color: GREEN };
  if (points === 2) return { bg: `${YELLOW}33`, color: '#9a7a00' };
  if (points === 1) return { bg: `${ORANGE}22`, color: ORANGE };
  return { bg: `${RED}22`, color: RED };
}

function slotBorderColor(
  submitted: boolean,
  result: PlacementResult | undefined
): string {
  if (!submitted || !result) return `${INK}20`;
  if (result.actualIndex === result.guessedIndex) return GREEN;
  if (Math.abs(result.actualIndex - result.guessedIndex) === 1) return YELLOW;
  return RED;
}

function slotBg(
  submitted: boolean,
  result: PlacementResult | undefined
): string {
  if (!submitted || !result) return 'transparent';
  if (result.actualIndex === result.guessedIndex) return `${GREEN}0d`;
  if (Math.abs(result.actualIndex - result.guessedIndex) === 1) return `${YELLOW}18`;
  return `${RED}0d`;
}

export default function LatitudeLadderPage() {
  const [cities, setCities] = useState<LatitudeLadderCity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [roundCities, setRoundCities] = useState<LatitudeLadderCity[]>([]);
  const [pool, setPool] = useState<LatitudeLadderCity[]>([]);
  const [slots, setSlots] = useState<(LatitudeLadderCity | null)[]>(
    Array(ROUND_SIZE).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());
  const [showRules, setShowRules] = useState(false);
  const dragSource = useRef<DragSource | null>(null);
  // Tap-to-place selection. The page uses native HTML5 drag-and-drop, which has
  // no touch support at all, so on a phone dragging is inert and the game was
  // unplayable — even though the rules already promise "tap a city then tap a
  // slot". Unlike dragSource this is state, not a ref, because the selection has
  // to be visible.
  const [selected, setSelected] = useState<DragSource | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('latitude-ladder-rules-seen')) {
      setShowRules(true);
    }
    let isMounted = true;

    async function hydrateCities() {
      try {
        const nextCities = await loadLatitudeLadderCities();
        if (!isMounted) return;
        setCities(nextCities);
        setLoadError(null);
        startNewRound(nextCities, new Set());
      } catch (error) {
        if (!isMounted) return;
        setLoadError(
          error instanceof Error ? error.message : 'Failed to load city data.'
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    hydrateCities();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startNewRound(
    allCities: LatitudeLadderCity[],
    prevRecentIds: Set<string>
  ) {
    const next = buildRound(allCities, prevRecentIds);
    const nextRecent = new Set(prevRecentIds);

    next.forEach((c) => nextRecent.add(c.id));

    if (nextRecent.size > 15) {
      const arr = [...nextRecent];
      arr.splice(0, nextRecent.size - 15);
      nextRecent.clear();
      arr.forEach((id) => nextRecent.add(id));
    }

    setRecentIds(nextRecent);
    setRoundCities(next);
    setPool(cryptoShuffle(next));
    setSlots(Array(ROUND_SIZE).fill(null));
    setSubmitted(false);
    dragSource.current = null;
  }

  const actualOrder = useMemo(
    () => [...roundCities].sort((l, r) => r.lat - l.lat),
    [roundCities]
  );

  const allPlaced = slots.every((s) => s !== null);

  const results = useMemo<PlacementResult[]>(() => {
    if (!allPlaced) return [];

    const actualPositions = new Map(actualOrder.map((city, i) => [city.id, i]));

    return slots.map((city, guessedIndex) => {
      const c = city!;
      const actualIndex = actualPositions.get(c.id) ?? guessedIndex;
      return {
        city: c,
        guessedIndex,
        actualIndex,
        points: scorePlacement(guessedIndex, actualIndex),
      };
    });
  }, [actualOrder, slots, allPlaced]);

  const totalScore = results.reduce((s, r) => s + r.points, 0);
  const perfectBonus =
    results.length === ROUND_SIZE &&
    results.every((r) => r.actualIndex === r.guessedIndex)
      ? 3
      : 0;
  const finalScore = totalScore + perfectBonus;

  const resultLookup = useMemo(
    () => new Map(results.map((r) => [r.city.id, r])),
    [results]
  );

  // Record the round once it has been submitted and scored. The round's city ids
  // form the idempotency key, so re-renders — and StrictMode's double effect
  // pass — can't count the same round twice.
  const { record: recordRoundStats } = useGameStats('latitude-ladder');
  const roundKey = roundCities.map((c) => c.id).join('|');

  useEffect(() => {
    if (!submitted || results.length !== ROUND_SIZE) return;
    recordRoundStats({ score: finalScore, maxScore: MAX_SCORE }, roundKey);
  }, [submitted, results.length, finalScore, roundKey, recordRoundStats]);

  const handleNewRound = () => startNewRound(cities, recentIds);

  const handleDragStartPool = (cityId: string) => {
    dragSource.current = { from: 'pool', cityId };
  };

  const handleDragStartSlot = (slotIndex: number) => {
    dragSource.current = { from: 'slot', slotIndex };
  };

  /** Moves `src` into the given slot. Shared by drag-and-drop and tap-to-place. */
  function placeIntoSlot(src: DragSource | null, targetSlotIndex: number) {
    if (!src) return;

    if (src.from === 'pool') {
      const dragged = pool.find((c) => c.id === src.cityId);
      if (!dragged) return;

      const displaced = slots[targetSlotIndex];
      const nextSlots = [...slots];
      nextSlots[targetSlotIndex] = dragged;

      const nextPool = pool.filter((c) => c.id !== src.cityId);
      if (displaced) nextPool.push(displaced);

      setPool(nextPool);
      setSlots(nextSlots);
    } else {
      const fromIndex = src.slotIndex;
      if (fromIndex === targetSlotIndex) return;

      const nextSlots = [...slots];
      [nextSlots[fromIndex], nextSlots[targetSlotIndex]] = [
        nextSlots[targetSlotIndex],
        nextSlots[fromIndex],
      ];
      setSlots(nextSlots);
    }

    dragSource.current = null;
    setSelected(null);
  }

  /** Returns a slotted city to the pool. Shared by drag-and-drop and tap. */
  function returnToPool(src: DragSource | null) {
    if (!src || src.from !== 'slot') return;

    const city = slots[src.slotIndex];
    if (!city) return;

    const nextSlots = [...slots];
    nextSlots[src.slotIndex] = null;
    setSlots(nextSlots);
    setPool((prev) => [...prev, city]);
    dragSource.current = null;
    setSelected(null);
  }

  function handleDropOnSlot(targetSlotIndex: number) {
    placeIntoSlot(dragSource.current, targetSlotIndex);
  }

  function handleDropOnPool() {
    returnToPool(dragSource.current);
  }

  const isSelected = (src: DragSource) =>
    selected !== null &&
    (src.from === 'pool'
      ? selected.from === 'pool' && selected.cityId === src.cityId
      : selected.from === 'slot' && selected.slotIndex === src.slotIndex);

  /** Tap a pool card: select it, or deselect if it was already selected. */
  function handleTapPoolCity(cityId: string) {
    if (submitted) return;
    setSelected((prev) =>
      prev?.from === 'pool' && prev.cityId === cityId ? null : { from: 'pool', cityId }
    );
  }

  /**
   * Tap a slot: place the pending selection, or — with nothing selected — pick up
   * the city already sitting there so it can be moved or returned.
   */
  function handleTapSlot(slotIndex: number) {
    if (submitted) return;
    if (selected) {
      placeIntoSlot(selected, slotIndex);
      return;
    }
    if (slots[slotIndex]) setSelected({ from: 'slot', slotIndex });
  }

  /** Tap the pool area while holding a slotted city: send it back. */
  function handleTapPoolArea() {
    if (submitted) return;
    if (selected?.from === 'slot') returnToPool(selected);
  }

  function handleMove(slotIndex: number, direction: -1 | 1) {
    if (submitted) return;
    const nextIndex = slotIndex + direction;
    if (nextIndex < 0 || nextIndex >= ROUND_SIZE) return;

    const nextSlots = [...slots];
    [nextSlots[slotIndex], nextSlots[nextIndex]] = [
      nextSlots[nextIndex],
      nextSlots[slotIndex],
    ];
    setSlots(nextSlots);
  }

  const shell =
    'app-page-shell relative min-h-screen bg-gradient-to-br from-[#fff8e7] via-yellow-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 text-slate-800 dark:text-white';
  const panel =
    'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700';
  const label =
    'text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500';
  const btn =
    'whitespace-nowrap rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition hover:bg-yellow-400 hover:border-yellow-400 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed';

  if (isLoading) {
    return (
      <div className={shell}>
        <div className="pointer-events-none fixed inset-0 z-[1] bg-[#fff8e7]/60 dark:bg-[#101820]/65" />
        <div className="relative z-10">
          <GameNavbar currentPath="/latitude-ladder" />
          <div className="grid min-h-[calc(100vh-48px)] place-items-center px-4">
            <div className="text-center">
              <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent" />
              <p className={label}>Loading Latitude Ladder</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || roundCities.length < ROUND_SIZE) {
    return (
      <div className={shell}>
        <div className="pointer-events-none fixed inset-0 z-[1] bg-[#fff8e7]/60 dark:bg-[#101820]/65" />
        <div className="relative z-10">
          <GameNavbar currentPath="/latitude-ladder" />
          <div className="grid min-h-[calc(100vh-48px)] place-items-center px-4">
            <div
              className="max-w-md w-full rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 p-8 text-center"
            >
              <i className="ri-error-warning-line text-4xl mb-4 block text-red-500" />
              <h1 className="text-xl font-bold mb-2">Could not start</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {loadError ?? 'Not enough city rows.'}
              </p>
              <button onClick={() => window.location.reload()} className={btn}>
                Reload
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[#fff8e7]/60 dark:bg-[#101820]/65" />

      <div className="relative z-10">
        <GameNavbar currentPath="/latitude-ladder" />

        <div className="mx-auto max-w-6xl px-4 py-10">
          <RulesModal
            open={showRules}
            onClose={() => {
              setShowRules(false);
              localStorage.setItem('latitude-ladder-rules-seen', '1');
            }}
            title="How Latitude Ladder works"
            icon="ri-arrow-up-down-line"
            iconGradient="from-yellow-400 to-amber-500"
            description="Five cities appear in random order. Drag them into the correct north-to-south ladder — Slot 1 is farthest north, Slot 5 is farthest south."
            rules={[
              { icon: 'ri-drag-move-2-line', text: 'Drag each city card into a slot, or tap a city then tap a slot to place it.' },
              { icon: 'ri-lock-line', text: 'All 5 slots must be filled before you can submit. You can move cards around as much as you like first.' },
              { icon: 'ri-medal-line', text: 'Scoring: exact spot = 3 pts; off by 1 = 2 pts; off by 2 = 1 pt; 3+ slots away = 0 pts.' },
              { icon: 'ri-star-line', text: 'Perfect ladder bonus: all 5 exact placements earns +3 bonus points, for a maximum of 18.' },
            ]}
            tip="Extreme latitudes are easiest — cities near the equator or in the same region are the trickiest to order."
            ctaLabel="Start ranking!"
            ctaGradient="from-yellow-400 to-amber-500"
          />

          {/* Header */}
          <div className="text-center py-4 mb-8">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2 flex items-center justify-center gap-3">
              <i className="ri-arrow-up-line text-yellow-600 dark:text-yellow-400" />
              Latitude Ladder
              <i className="ri-arrow-down-line text-yellow-600 dark:text-yellow-400" />
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Tap or drag all five cities into a strict north-to-south ladder. Slot 1 is farthest north.
            </p>
            <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setShowRules(true)}
                className="inline-flex items-center gap-1.5 px-0 py-0 text-sm font-medium text-yellow-600 transition-colors hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 !border-0 !bg-transparent !shadow-none outline-none ring-0"
              >
                <i className="ri-question-line" />
                How to play
              </button>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              <button onClick={handleNewRound} className={btn}>
                <i className="ri-refresh-line mr-1.5" />
                New round
              </button>
            </div>
          </div>

          {/* Streak / Score card */}
          <div className="max-w-sm mx-auto mb-8">
            <div className={`${panel} p-4 text-center`}>
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Score</div>
              <div className="text-4xl font-bold text-slate-800 dark:text-white">
                {submitted ? finalScore : '—'}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">/ {MAX_SCORE} pts</div>

              {submitted && (
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  Base {totalScore}/{MAX_SCORE - 3} · Perfect bonus {perfectBonus}/3
                </p>
              )}

              {/* Progress bar */}
              <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-yellow-500 transition-all duration-300"
                  style={{ width: `${(slots.filter(Boolean).length / ROUND_SIZE) * 100}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                {slots.filter(Boolean).length} / {ROUND_SIZE} placed
              </div>
            </div>

            <GameStatsBar gameId="latitude-ladder" showStreak={false} className="mt-3" />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            {/* Main play area */}
            <div className="flex flex-col gap-4">
              {/* City pool */}
              <div
                className={`${panel} p-4`}
                onDragOver={(e) => { if (!submitted) e.preventDefault(); }}
                onDrop={handleDropOnPool}
                onClick={handleTapPoolArea}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className={label}>City pool</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {pool.length} remaining
                  </span>
                </div>

                {pool.length === 0 && !submitted ? (
                  <div className="flex h-16 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
                    All placed — tap a card, or drag one back
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {pool.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        draggable={!submitted}
                        onDragStart={() => handleDragStartPool(city.id)}
                        onClick={() => handleTapPoolCity(city.id)}
                        disabled={submitted}
                        aria-pressed={isSelected({ from: 'pool', cityId: city.id })}
                        aria-label={`${city.city}, ${city.country}. Select, then choose a slot.`}
                        className={`flex min-h-11 cursor-grab items-center gap-2 rounded-lg border bg-slate-50 dark:bg-slate-700/50 px-3 py-2 text-left active:cursor-grabbing hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-slate-700 transition-colors ${
                          isSelected({ from: 'pool', cityId: city.id })
                            ? 'border-yellow-500 ring-2 ring-yellow-400 bg-yellow-50 dark:bg-slate-700'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="h-4 w-6 shrink-0 overflow-hidden rounded-sm">
                          <img
                            src={flagUrl(city.iso2)}
                            alt={city.country}
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-semibold leading-none text-slate-800 dark:text-white">
                            {city.city}
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                            {city.country} · {formatPopulation(city.population)}
                          </div>
                        </div>
                        <i className="ri-draggable text-slate-500 dark:text-slate-400 text-sm ml-0.5" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Ladder slots */}
              <div className={`${panel} p-4`}>
                <div className="mb-3 flex items-center justify-between">
                  <span className={label}>Your ladder</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {submitted
                      ? `Score ${finalScore} / ${MAX_SCORE}`
                      : `${slots.filter(Boolean).length} / ${ROUND_SIZE} placed`}
                  </span>
                </div>

                <div className="mb-3 flex justify-between px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <span>↑ North</span>
                  <span>South ↓</span>
                </div>

                <div className="flex flex-col gap-2">
                  {slots.map((city, index) => {
                    const result = city ? resultLookup.get(city.id) : undefined;

                    return (
                      <div
                        key={`slot-${index}`}
                        onDragOver={(e) => { if (!submitted) e.preventDefault(); }}
                        onDrop={() => handleDropOnSlot(index)}
                        onClick={() => handleTapSlot(index)}
                        className={`rounded-lg border transition-all duration-200 ${
                          !submitted && selected ? 'cursor-pointer' : ''
                        } ${
                          isSelected({ from: 'slot', slotIndex: index })
                            ? 'ring-2 ring-yellow-400'
                            : ''
                        }`}
                        style={{
                          borderColor: slotBorderColor(submitted, result),
                          background: slotBg(submitted, result),
                        }}
                      >
                        {city ? (
                          <article
                            draggable={!submitted}
                            onDragStart={() => handleDragStartSlot(index)}
                            className="cursor-grab p-3 active:cursor-grabbing"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                {index + 1}
                              </div>

                              <div className="h-6 w-9 shrink-0 overflow-hidden rounded-sm">
                                <img
                                  src={flagUrl(city.iso2)}
                                  alt={city.country}
                                  className="h-full w-full object-cover"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-slate-800 dark:text-white truncate">
                                    {city.city}
                                  </span>

                                  {submitted && result && (() => {
                                    const style = scoreBadgeStyle(result.points);
                                    return (
                                      <span
                                        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                                        style={{ background: style.bg, color: style.color }}
                                      >
                                        +{result.points}
                                      </span>
                                    );
                                  })()}
                                </div>

                                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                                  {city.country} · {formatPopulation(city.population)}
                                </div>

                                {submitted && result && (
                                  <div className="mt-2 flex gap-2 flex-wrap">
                                    {[
                                      { k: 'Latitude', v: formatLatitude(city.lat) },
                                      { k: 'Your rank', v: `#${result.guessedIndex + 1}` },
                                      { k: 'Actual', v: `#${result.actualIndex + 1}` },
                                    ].map(({ k, v }) => (
                                      <div
                                        key={k}
                                        className="rounded-md bg-slate-50 dark:bg-slate-700/60 border border-slate-100 dark:border-slate-700 px-2 py-1"
                                      >
                                        <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                          {k}
                                        </div>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                          {v}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-1 shrink-0">
                                <button
                                  onClick={() => handleMove(index, -1)}
                                  disabled={index === 0 || submitted}
                                  className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700 text-xs hover:bg-yellow-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  <i className="ri-arrow-up-s-line" />
                                </button>
                                <button
                                  onClick={() => handleMove(index, 1)}
                                  disabled={index === ROUND_SIZE - 1 || submitted}
                                  className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700 text-xs hover:bg-yellow-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  <i className="ri-arrow-down-s-line" />
                                </button>
                              </div>
                            </div>
                          </article>
                        ) : (
                          <div className="flex h-14 items-center gap-3 px-3">
                            {/* Slot number is the primary positional cue, so it
                                needs real contrast — it was slate-300 (1.16:1). */}
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                              {index + 1}
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                              {selected ? 'Tap to place here' : 'Tap a city, or drag one here'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => setSubmitted(true)}
                    disabled={submitted || !allPlaced}
                    className="whitespace-nowrap rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-900 px-5 py-2.5 text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed w-full"
                  >
                    {allPlaced ? 'Check order' : `Place all ${ROUND_SIZE} cities first`}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              {/* Scoring reference */}
              <div className={`${panel} p-4`}>
                <span className={label}>Scoring</span>
                <div className="mt-3 flex flex-col gap-2">
                  {[
                    { label: 'Exact spot', pts: '3 pts', color: GREEN },
                    { label: 'Off by 1', pts: '2 pts', color: '#9a7a00' },
                    { label: 'Off by 2', pts: '1 pt', color: ORANGE },
                    { label: 'Perfect ladder bonus', pts: '+3 pts', color: '#b45309' },
                  ].map(({ label: l, pts, color }) => (
                    <div
                      key={l}
                      className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 px-3 py-2"
                    >
                      <span className="text-xs text-slate-600 dark:text-slate-300">{l}</span>
                      <span className="text-xs font-bold" style={{ color }}>{pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div className={`${panel} p-4`}>
                <span className={label}>How it works</span>
                <div className="mt-3 flex flex-col gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  <p>Drag city cards into the numbered slots. Slot 1 = farthest north, slot 5 = farthest south.</p>
                  <p>Use the arrow buttons to nudge a placed card up or down. Drag back to the pool to unplace.</p>
                  <p>Exact = 3 pts · off by 1 = 2 pts · off by 2 = 1 pt · perfect ladder = +3 bonus.</p>
                </div>
              </div>

              {/* Answer key */}
              <div className={`${panel} p-4`}>
                <span className={label}>Answer key</span>
                {submitted ? (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {actualOrder.map((city, i) => (
                      <div
                        key={`${city.id}-answer`}
                        className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 px-3 py-2"
                      >
                        <span className="w-5 shrink-0 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          #{i + 1}
                        </span>
                        <div className="h-4 w-6 shrink-0 overflow-hidden rounded-sm">
                          <img
                            src={flagUrl(city.iso2)}
                            alt={city.country}
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-slate-800 dark:text-white">
                            {city.city}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            {city.country}
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          {formatLatitude(city.lat)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    Submit your order to reveal the correct ranking.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}