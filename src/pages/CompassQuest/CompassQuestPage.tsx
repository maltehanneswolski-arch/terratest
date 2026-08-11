import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { GameNavbar } from '@/components/ui/game-navbar';
import { CAPITAL_ROWS } from './compass-capital-data';
import { RulesModal } from '@/components/feature/rules-modal';
import { brusselsDate } from '@/lib/brusselsTime';
import { shareResult as copyShareResult } from '@/lib/shareResult';
import { GameStatsBar } from '@/components/feature/game-stats-bar';
import { useGameStats } from '@/lib/gameStats';

type CapitalRecord = {
  countryName: string;
  capitalName: string;
  capitalLatitude: number;
  capitalLongitude: number;
  countryCode: string | null;
  continentName: string | null;
};

type Round = {
  reference: CapitalRecord;
  target: CapitalRecord;
  trueBearing: number;
  distanceKm: number;
};

type RoundResult = {
  round: number;
  reference: CapitalRecord;
  target: CapitalRecord;
  guessedBearing: number;
  trueBearing: number;
  error: number;
  score: number;
  distanceKm: number;
};

const MAX_ROUNDS = 3;
const MIN_DISTANCE_KM = 250;

const CAPITALS: CapitalRecord[] = CAPITAL_ROWS
  .map(([countryName, capitalName, capitalLatitude, capitalLongitude, countryCode, continentName]) => ({
    countryName, capitalName, capitalLatitude, capitalLongitude, countryCode, continentName,
  }))
  .filter((row): row is CapitalRecord =>
    Boolean(row.capitalName && typeof row.capitalLatitude === 'number' && typeof row.capitalLongitude === 'number'),
  )
  .filter((row) => !Number.isNaN(row.capitalLatitude) && !Number.isNaN(row.capitalLongitude));

/* ── Math helpers ───────────────────────────────────────────── */
function toRadians(deg: number) { return (deg * Math.PI) / 180; }
function toDegrees(rad: number) { return (rad * 180) / Math.PI; }
function normalizeAngle(angle: number) { return ((angle % 360) + 360) % 360; }
function angularDifference(a: number, b: number) {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(diff, 360 - diff);
}
function bearingBetween(from: CapitalRecord, to: CapitalRecord) {
  const lat1 = toRadians(from.capitalLatitude);
  const lat2 = toRadians(to.capitalLatitude);
  const dLon = toRadians(to.capitalLongitude - from.capitalLongitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return normalizeAngle(toDegrees(Math.atan2(y, x)));
}
function distanceBetweenKm(from: CapitalRecord, to: CapitalRecord) {
  const R = 6371;
  const dLat = toRadians(to.capitalLatitude - from.capitalLatitude);
  const dLon = toRadians(to.capitalLongitude - from.capitalLongitude);
  const lat1 = toRadians(from.capitalLatitude);
  const lat2 = toRadians(to.capitalLatitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Seeded RNG (LCG) for daily challenge ───────────────────── */
function getDailySeed(): number {
  // Keyed on the Europe/Brussels date, like every other daily game. Using the
  // viewer's local date instead would roll the puzzle over at local midnight,
  // so two players could get different puzzles on the same calendar day.
  const [year, month, day] = brusselsDate().split('-').map(Number);
  return year * 10000 + month * 100 + day;
}
function lcg(seed: number) {
  let s = (seed >>> 0) || 1;
  return function rand(): number {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ── Round builder ──────────────────────────────────────────── */
function buildRounds(count: number, rand: () => number = Math.random): Round[] {
  const pool = seededShuffle(CAPITALS, rand);
  const used = new Set<string>();
  const rounds: Round[] = [];

  for (const reference of pool) {
    if (rounds.length >= count) break;
    if (used.has(reference.countryName)) continue;
    const candidates = seededShuffle(
      pool.filter((t) => t.countryName !== reference.countryName && !used.has(t.countryName) && distanceBetweenKm(reference, t) >= MIN_DISTANCE_KM),
      rand,
    );
    const target = candidates[0];
    if (!target) continue;
    rounds.push({ reference, target, trueBearing: bearingBetween(reference, target), distanceKm: distanceBetweenKm(reference, target) });
    used.add(reference.countryName);
    used.add(target.countryName);
  }

  if (rounds.length < count) {
    const fallback = seededShuffle(CAPITALS, rand);
    while (rounds.length < count) {
      const ref = fallback[Math.floor(rand() * fallback.length)];
      const opts = fallback.filter((t) => t.countryName !== ref.countryName);
      const tgt = opts[Math.floor(rand() * opts.length)];
      rounds.push({ reference: ref, target: tgt, trueBearing: bearingBetween(ref, tgt), distanceKm: distanceBetweenKm(ref, tgt) });
    }
  }
  return rounds;
}

/* ── Scoring helpers ────────────────────────────────────────── */
function scoreFromError(error: number) { return Math.max(0, Math.round(100 - error)); }
function gradeForError(error: number) {
  if (error <= 5) return 'Perfect';
  if (error <= 15) return 'Excellent';
  if (error <= 30) return 'Strong';
  if (error <= 60) return 'Close';
  if (error <= 90) return 'Off course';
  return 'Lost at sea';
}
function directionLabel(angle: number) {
  const labels = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return labels[Math.round(normalizeAngle(angle) / 22.5) % 16];
}
function headingFromPoint(cx2: number, cy2: number, rect: DOMRect) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return normalizeAngle(toDegrees(Math.atan2(cx2 - cx, -(cy2 - cy))));
}
function n(value: number, digits = 0) {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
function dailyLabel(): string {
  return new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ── CountryFlag ────────────────────────────────────────────── */
function CountryFlag({ countryCode, countryName, size = 48 }: { countryCode: string | null; countryName: string; size?: number }) {
  const code = countryCode && countryCode.length === 2 ? countryCode.toLowerCase() : null;
  if (!code) {
    return (
      <div className="rounded overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600 bg-slate-200 dark:bg-slate-600 flex items-center justify-center"
        style={{ width: size, height: Math.round(size * 0.67) }}>
        <i className="ri-flag-line text-slate-400 text-xs"></i>
      </div>
    );
  }
  return (
    <div className="rounded overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600"
      style={{ width: size, height: Math.round(size * 0.67) }}>
      <img src={`https://flagcdn.com/w80/${code}.png`} alt={countryName} className="w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
    </div>
  );
}

/* ── ReviewCompass: shows guessed (sky) + true (emerald) needles ── */
function ReviewCompass({ guessed, truth, referenceCode, referenceName }: {
  guessed: number; truth: number; referenceCode: string | null; referenceName: string;
}) {
  const code = referenceCode && referenceCode.length === 2 ? referenceCode.toLowerCase() : null;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-52 w-52 rounded-full border-[8px] border-slate-200 dark:border-slate-600 bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 select-none">
        {/* Inner rings */}
        <div className="absolute inset-3 rounded-full border border-dashed border-slate-200 dark:border-slate-600"></div>
        {/* Tick marks */}
        {[...Array(24)].map((_, i) => {
          const a = i * 15;
          const major = a % 90 === 0;
          return (
            <div key={a}
              className={`absolute left-1/2 top-1/2 origin-bottom ${major ? 'h-20 w-1' : 'h-18 w-px'} ${major ? 'bg-slate-300 dark:bg-slate-400' : 'bg-slate-200 dark:bg-slate-600'}`}
              style={{ transform: `translate(-50%, -100%) rotate(${a}deg)` }}
            />
          );
        })}
        {/* Compass labels */}
        <div className="absolute inset-x-0 top-2 text-center text-base font-bold text-rose-500">N</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">E</div>
        <div className="absolute inset-x-0 bottom-2 text-center text-base font-bold text-slate-400">S</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">W</div>
        {/* True bearing — emerald, behind */}
        <div className="absolute left-1/2 top-1/2 h-[38%] w-2 origin-bottom rounded-full bg-emerald-500"
          style={{ transform: `translate(-50%, -100%) rotate(${truth}deg)` }} />
        <div className="absolute left-1/2 top-1/2 h-[15%] w-1.5 origin-top rounded-full bg-emerald-700"
          style={{ transform: `translate(-50%, 0%) rotate(${truth}deg)` }} />
        {/* Guessed bearing — sky, in front */}
        <div className="absolute left-1/2 top-1/2 h-[38%] w-2 origin-bottom rounded-full bg-sky-500"
          style={{ transform: `translate(-50%, -100%) rotate(${guessed}deg)` }} />
        <div className="absolute left-1/2 top-1/2 h-[15%] w-1.5 origin-top rounded-full bg-sky-700"
          style={{ transform: `translate(-50%, 0%) rotate(${guessed}deg)` }} />
        {/* Center flag */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 rounded-full border-2 border-white dark:border-slate-800 overflow-hidden bg-slate-200"
          style={{ width: 34, height: 34 }}>
          {code ? (
            <img src={`https://flagcdn.com/w80/${code}.png`} alt={referenceName} className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div className="w-full h-full bg-rose-500 flex items-center justify-center">
              <i className="ri-map-pin-2-fill text-white text-xs"></i>
            </div>
          )}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-5 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-sky-500 shrink-0"></div>
          <span className="text-slate-500 dark:text-slate-400">Your bearing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></div>
          <span className="text-slate-500 dark:text-slate-400">Perfect bearing</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function CompassQuestPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedAngle, setSelectedAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<'playing' | 'review' | 'finished'>('playing');
  const { record: recordRun } = useGameStats('compass-quest');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [latestResult, setLatestResult] = useState<RoundResult | null>(null);
  const [copyFeedback, setCopyFeedback] = useState('');
  const compassRef = useRef<HTMLDivElement | null>(null);
  const [showRules, setShowRules] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    startDailyGame();
  }, []);

  useEffect(() => {
    if (!copyFeedback) return undefined;
    const t = window.setTimeout(() => setCopyFeedback(''), 1600);
    return () => window.clearTimeout(t);
  }, [copyFeedback]);

  const currentRound = rounds[roundIndex] ?? null;
  const totalScore = useMemo(() => results.reduce((s, r) => s + r.score, 0), [results]);
  const averageError = useMemo(() => results.length ? results.reduce((s, r) => s + r.error, 0) / results.length : 0, [results]);

  function resetState() {
    setRoundIndex(0); setSelectedAngle(0); setDragging(false);
    setPhase('playing'); setResults([]); setLatestResult(null); setCopyFeedback('');
  }
  function startDailyGame() {
    setRounds(buildRounds(MAX_ROUNDS, lcg(getDailySeed())));
    resetState();
  }

  function updateFromPointer(x: number, y: number) {
    const rect = compassRef.current?.getBoundingClientRect();
    if (rect) setSelectedAngle(headingFromPoint(x, y, rect));
  }
  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault(); setDragging(true); updateFromPointer(e.clientX, e.clientY);
  }
  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragging) updateFromPointer(e.clientX, e.clientY);
  }
  function handlePointerEnd() { setDragging(false); }
  function nudge(delta: number) { setSelectedAngle((p) => normalizeAngle(p + delta)); }

  function submitGuess() {
    if (!currentRound || phase !== 'playing') return;
    const error = angularDifference(selectedAngle, currentRound.trueBearing);
    const result: RoundResult = {
      round: roundIndex + 1,
      reference: currentRound.reference,
      target: currentRound.target,
      guessedBearing: normalizeAngle(selectedAngle),
      trueBearing: currentRound.trueBearing,
      error,
      score: scoreFromError(error),
      distanceKm: currentRound.distanceKm,
    };
    setResults((prev) => [...prev, result]);
    setLatestResult(result);
    setPhase('review');
  }
  function nextRound() {
    if (phase !== 'review') return;
    if (roundIndex === MAX_ROUNDS - 1) {
      // One record per completed daily run, keyed on the puzzle date.
      recordRun({ score: totalScore, maxScore: MAX_ROUNDS * 100 }, dailyLabel());
      setPhase('finished');
    } else {
      setRoundIndex((p) => p + 1);
      setSelectedAngle(0);
      setLatestResult(null);
      setPhase('playing');
    }
  }

  async function shareResult() {
    const lines = results.map((r) => `R${r.round}: ${n(r.error, 0)}° off (${r.score}/100)`).join('\n');
    const ok = await copyShareResult({
      game: 'Compass Quest',
      result: `${totalScore}/${MAX_ROUNDS * 100} pts · avg error ${n(averageError, 1)}°`,
      details: [`Daily ${dailyLabel()}`, '', lines],
      path: '/compass-quest',
    });
    setCopyFeedback(ok ? 'Copied to clipboard!' : 'Copy failed — select the text and copy manually.');
  }

  return (
    <div className="app-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <GameNavbar currentPath="/compass-quest" />

      <RulesModal
        open={showRules}
        onClose={() => { setShowRules(false); }}
        title="How Compass Quest works"
        icon="ri-compass-3-line"
        iconGradient="from-rose-500 to-orange-500"
        accent="rose"
        description="A starting capital is shown. Rotate the compass needle to point in the direction of the target capital — then lock in your heading."
        rules={[
          { icon: 'ri-map-pin-2-line', text: 'You start at one capital city and must aim the needle toward another capital on the globe.' },
          { icon: 'ri-drag-move-line', text: 'Drag the compass or use the nudge buttons to fine-tune your heading. Degrees matter!' },
          { icon: 'ri-flag-line', text: 'Three rounds per day, each with a different pair of capitals. Come back tomorrow for a fresh challenge.' },
        ]}
        scoring={[
          { pts: '100', label: 'Perfect', sub: '0° off', color: 'green' },
          { pts: '85+', label: 'Excellent', sub: '≤ 15° off', color: 'yellow' },
          { pts: '70+', label: 'Strong', sub: '≤ 30° off', color: 'orange' },
          { pts: '40+', label: 'Close', sub: '≤ 60° off', color: 'amber' },
          { pts: '10+', label: 'Off course', sub: '≤ 90° off', color: 'rose' },
          { pts: '0', label: 'Lost at sea', sub: '90°+ off', color: 'red' },
        ]}
        tip="Visualise the globe: capitals in Europe point roughly northeast from South America, and east from the US East Coast."
        ctaLabel="Start navigating!"
        ctaGradient="from-rose-500 to-orange-500"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <i className="ri-compass-3-line text-rose-600 dark:text-rose-400"></i>
              Compass Quest
              <i className="ri-navigation-line text-rose-600 dark:text-rose-400"></i>
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm">
            One capital is your starting point. Rotate the compass so it points toward the target capital. Your score depends on how many degrees off you are.
          </p>
          <button
            onClick={() => setShowRules(true)}
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition-colors cursor-pointer font-medium"
            style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
          >
            <i className="ri-question-line"></i>
            How to play
          </button>
        </div>

        {/* Playing phase — always visible, overlay sits on top during review */}
        {phase !== 'finished' && currentRound && (
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-1">Round {roundIndex + 1} of {MAX_ROUNDS}</div>
                    <div className="mb-3 flex items-center gap-2">
                      {Array.from({ length: MAX_ROUNDS }, (_, index) => {
                        const isPast = index < roundIndex;
                        const isCurrent = index === roundIndex;
                        return (
                          <div
                            key={index}
                            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                              isCurrent
                                ? 'bg-rose-500 dark:bg-rose-400'
                                : isPast
                                  ? 'bg-emerald-500 dark:bg-emerald-400'
                                  : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                      From {currentRound.reference.capitalName}, where is {currentRound.target.capitalName}?
                    </h2>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Heading</div>
                    <div className="text-3xl font-bold text-slate-800 dark:text-white">{n(selectedAngle, 0)}°</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{directionLabel(selectedAngle)}</div>
                  </div>
                </div>

                {/* Country cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 dark:border-emerald-600 p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <i className="ri-map-pin-2-fill text-emerald-600 dark:text-emerald-400 text-base"></i>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">You are here</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CountryFlag countryCode={currentRound.reference.countryCode} countryName={currentRound.reference.countryName} size={52} />
                      <div className="min-w-0">
                        <div className="text-base font-bold text-slate-800 dark:text-white leading-tight truncate">{currentRound.reference.capitalName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentRound.reference.countryName}</div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-400 dark:border-rose-600 p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <i className="ri-crosshair-2-line text-rose-600 dark:text-rose-400 text-base"></i>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400">Aim for this</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CountryFlag countryCode={currentRound.target.countryCode} countryName={currentRound.target.countryName} size={52} />
                      <div className="min-w-0">
                        <div className="text-base font-bold text-slate-800 dark:text-white leading-tight truncate">{currentRound.target.capitalName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentRound.target.countryName}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive compass */}
                <div
                  ref={compassRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerLeave={handlePointerEnd}
                  className="relative mx-auto select-none touch-none cursor-grab active:cursor-grabbing"
                  style={{ width: 320, height: 320 }}
                >
                  <svg width="320" height="320" viewBox="0 0 320 320" className="w-full h-full">
                    <defs>
                      {/* Light mode: warm rose/orange matching page bg */}
                      <radialGradient id="cBgLight" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fff1f2" />
                        <stop offset="100%" stopColor="#fef6ee" />
                      </radialGradient>
                      {/* Dark mode: deep navy blue */}
                      <radialGradient id="cBgDark" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#112240" />
                        <stop offset="100%" stopColor="#0a1628" />
                      </radialGradient>
                    </defs>

                    {/* Face */}
                    <circle
                      cx="160" cy="160" r="150"
                      fill={isDark ? 'url(#cBgDark)' : 'url(#cBgLight)'}
                      stroke={isDark ? '#1e3a5f' : '#fecdd3'}
                      strokeWidth="10"
                    />

                    {/* Dashed inner ring */}
                    <circle cx="160" cy="160" r="128" fill="none"
                      stroke={isDark ? '#1e3a5f' : '#fecdd3'}
                      strokeWidth="1" strokeDasharray="4 3" />

                    {/* Solid inner ring */}
                    <circle cx="160" cy="160" r="100" fill="none"
                      stroke={isDark ? '#1e4976' : '#fed7aa'}
                      strokeWidth="1.5" />

                    {/* Tick marks — 72 × 5° */}
                    {Array.from({ length: 72 }).map((_, i) => {
                      const angle = i * 5;
                      const isMajor = angle % 90 === 0;
                      const isMed = angle % 45 === 0 && !isMajor;
                      const outerR = 142;
                      const innerR = isMajor ? 114 : isMed ? 126 : 133;
                      const rad = ((angle - 90) * Math.PI) / 180;
                      const majorColor = isDark ? '#e11d48' : '#f43f5e';
                      const medColor = isDark ? '#3b6cb7' : '#fda4af';
                      const minorColor = isDark ? '#1e3a5f' : '#fecdd3';
                      return (
                        <line
                          key={angle}
                          x1={160 + outerR * Math.cos(rad)}
                          y1={160 + outerR * Math.sin(rad)}
                          x2={160 + innerR * Math.cos(rad)}
                          y2={160 + innerR * Math.sin(rad)}
                          stroke={isMajor ? majorColor : isMed ? medColor : minorColor}
                          strokeWidth={isMajor ? 2.5 : isMed ? 1.5 : 1}
                          strokeLinecap="round"
                        />
                      );
                    })}

                    {/* Needle — larger north-pointing arrow */}
                    <g transform={`rotate(${selectedAngle}, 160, 160)`}>
                      {/* Main north arrow — taller and wider */}
                      <polygon points="160,72 150,164 170,164" fill="#0ea5e9" />
                      {/* Small south tail for visual balance */}
                      <polygon points="160,196 150,164 170,164" fill={isDark ? '#0369a1' : '#0369a1'} opacity="0.35" />
                      {/* Centre cap */}
                      <circle cx="160" cy="160" r="11"
                        fill={isDark ? '#112240' : 'white'}
                        stroke={isDark ? '#3b82f6' : '#fda4af'}
                        strokeWidth="2" />
                    </g>

                    {/* Cardinal labels — drawn LAST so they're always on top */}
                    {/* N */}
                    <circle cx="160" cy="19" r="13"
                      fill={isDark ? '#0f172a' : 'white'} fillOpacity="0.9" />
                    <text x="160" y="19" textAnchor="middle" dominantBaseline="middle"
                      style={{ font: 'bold 22px system-ui', fill: '#e11d48' }}>N</text>
                    {/* E */}
                    <circle cx="301" cy="160" r="13"
                      fill={isDark ? '#0f172a' : 'white'} fillOpacity="0.9" />
                    <text x="301" y="160" textAnchor="middle" dominantBaseline="middle"
                      style={{ font: 'bold 20px system-ui', fill: isDark ? '#94a3b8' : '#475569' }}>E</text>
                    {/* S */}
                    <circle cx="160" cy="301" r="13"
                      fill={isDark ? '#0f172a' : 'white'} fillOpacity="0.9" />
                    <text x="160" y="301" textAnchor="middle" dominantBaseline="middle"
                      style={{ font: 'bold 20px system-ui', fill: isDark ? '#94a3b8' : '#475569' }}>S</text>
                    {/* W */}
                    <circle cx="19" cy="160" r="13"
                      fill={isDark ? '#0f172a' : 'white'} fillOpacity="0.9" />
                    <text x="19" y="160" textAnchor="middle" dominantBaseline="middle"
                      style={{ font: 'bold 20px system-ui', fill: isDark ? '#94a3b8' : '#475569' }}>W</text>
                  </svg>

                  {/* Country flag on pivot */}
                  <div
                    className="absolute z-10 rounded-full overflow-hidden border-2 border-white bg-slate-200"
                    style={{ width: 28, height: 28, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  >
                    {currentRound.reference.countryCode ? (
                      <img
                        src={`https://flagcdn.com/w80/${currentRound.reference.countryCode.toLowerCase()}.png`}
                        alt={currentRound.reference.countryName}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-rose-500 flex items-center justify-center">
                        <i className="ri-map-pin-2-fill text-white text-xs"></i>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nudge */}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {[-10, -1, 1, 10].map((d) => (
                    <button key={d} onClick={() => nudge(d)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold transition-colors whitespace-nowrap cursor-pointer">
                      {d > 0 ? `+${d}°` : `${d}°`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right panel */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2">How scoring works</div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">The closer your bearing, the higher your score</h3>
                  <div className="space-y-2 text-slate-600 dark:text-slate-400 text-sm">
                    <p>Guess the direction from the green country to the red country. Every degree off costs 1 point.</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-200">0° off</span> = 100 pts. <span className="font-semibold text-slate-700 dark:text-slate-200">100° off</span> = 0 pts.</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-3">Session progress</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/10 p-4">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Rounds</div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-white">{results.length}/{MAX_ROUNDS}</div>
                    </div>
                    <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 p-4">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total</div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalScore}</div>
                    </div>
                    <div className="rounded-2xl bg-sky-50 dark:bg-sky-500/10 p-4">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Avg error</div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-white">{results.length ? `${n(averageError, 1)}°` : '—'}</div>
                    </div>
                  </div>
                </div>
                <button onClick={submitGuess} disabled={phase !== 'playing'}
                  className="w-full px-6 py-4 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer">
                  <i className="ri-check-line"></i>
                  Lock in heading
                </button>
              </div>
            </div>

            {/* Review overlay — shown on top of the playing grid after each round */}
            {phase === 'review' && latestResult && (
              <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl"
                style={{ background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(6px)' }}>
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 w-full max-w-xl mx-4 relative">
                  {/* Grade badge */}
                  <div className="text-center mb-5">
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500 dark:text-rose-400 mb-2">
                      Round {latestResult.round} of {MAX_ROUNDS}
                    </div>
                    <div className="text-5xl font-extrabold text-slate-800 dark:text-white mb-1">
                      {gradeForError(latestResult.error)}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      {latestResult.reference.capitalName} → {latestResult.target.capitalName}
                    </p>
                  </div>

                  {/* Mini compass */}
                  <div className="flex justify-center mb-5">
                    <ReviewCompass
                      guessed={latestResult.guessedBearing}
                      truth={latestResult.trueBearing}
                      referenceCode={latestResult.reference.countryCode}
                      referenceName={latestResult.reference.countryName}
                    />
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="rounded-2xl bg-sky-50 dark:bg-sky-500/10 p-4 text-center border border-sky-200 dark:border-sky-800">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0"></div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Your bearing</div>
                      </div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-white">{n(latestResult.guessedBearing, 0)}°</div>
                      <div className="text-xs text-slate-400">{directionLabel(latestResult.guessedBearing)}</div>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 p-4 text-center border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Perfect bearing</div>
                      </div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-white">{n(latestResult.trueBearing, 0)}°</div>
                      <div className="text-xs text-slate-400">{directionLabel(latestResult.trueBearing)}</div>
                    </div>
                    <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/10 p-4 text-center border border-rose-200 dark:border-rose-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Off by</div>
                      <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{n(latestResult.error, 0)}°</div>
                      <div className="text-xs text-slate-400 font-semibold">{latestResult.score}/100 pts</div>
                    </div>
                  </div>

                  {/* Fact line */}
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 p-3 mb-5 text-slate-600 dark:text-slate-400 text-sm text-center">
                    {latestResult.target.capitalName} is <span className="font-semibold text-slate-800 dark:text-white">{n(latestResult.distanceKm, 0)} km</span> away — true heading <span className="font-semibold text-slate-800 dark:text-white">{n(latestResult.trueBearing, 0)}° ({directionLabel(latestResult.trueBearing)})</span>
                  </div>

                  <button onClick={nextRound}
                    className="w-full px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer">
                    <i className={roundIndex === MAX_ROUNDS - 1 ? 'ri-flag-line' : 'ri-arrow-right-line'}></i>
                    {roundIndex === MAX_ROUNDS - 1 ? 'See Final Results' : `Continue to round ${roundIndex + 2}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Finished */}
        {phase === 'finished' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-6xl mb-4">🏁</div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Compass Quest complete</h2>
              <div className="inline-block mb-4 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-rose-200 dark:border-rose-800">Daily · {dailyLabel()}</div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Three bearings, one final score. Smaller error means a better run.</p>

              <GameStatsBar gameId="compass-quest" showStreak={false} className="mx-auto mb-6 max-w-md" />

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/10 p-5">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total score</div>
                  <div className="text-4xl font-bold text-slate-800 dark:text-white">{totalScore}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">out of {MAX_ROUNDS * 100}</div>
                </div>
                <div className="rounded-2xl bg-sky-50 dark:bg-sky-500/10 p-5">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Avg error</div>
                  <div className="text-4xl font-bold text-slate-800 dark:text-white">{n(averageError, 1)}°</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">across all rounds</div>
                </div>
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 p-5">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Best round</div>
                  <div className="text-4xl font-bold text-slate-800 dark:text-white">
                    {results.length ? `${n(Math.min(...results.map((r) => r.error)), 0)}°` : '—'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">closest heading</div>
                </div>
              </div>

              <div className="flex justify-center">
                <button onClick={shareResult}
                  className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer">
                  <i className="ri-share-line"></i> Share result
                </button>
              </div>
              {copyFeedback && <div className="mt-4 text-sm text-sky-600 dark:text-sky-400 font-medium">{copyFeedback}</div>}
            </div>

            {/* Round breakdown */}
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.round} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 mb-1">Round {result.round}</div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <CountryFlag countryCode={result.reference.countryCode} countryName={result.reference.countryName} size={32} />
                          <span className="font-bold text-slate-800 dark:text-white text-sm">{result.reference.capitalName}</span>
                        </div>
                        <i className="ri-arrow-right-line text-slate-400 text-sm"></i>
                        <div className="flex items-center gap-2">
                          <CountryFlag countryCode={result.target.countryCode} countryName={result.target.countryName} size={32} />
                          <span className="font-bold text-slate-800 dark:text-white text-sm">{result.target.capitalName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-bold text-slate-800 dark:text-white">{result.score}/100</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{gradeForError(result.error)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="rounded-2xl bg-sky-50 dark:bg-sky-500/10 p-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Your bearing</div>
                      <div className="text-xl font-bold text-slate-800 dark:text-white">{n(result.guessedBearing, 0)}°</div>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 p-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">True bearing</div>
                      <div className="text-xl font-bold text-slate-800 dark:text-white">{n(result.trueBearing, 0)}°</div>
                    </div>
                    <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/10 p-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Off by</div>
                      <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{n(result.error, 0)}°</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 p-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Distance</div>
                      <div className="text-xl font-bold text-slate-800 dark:text-white">{n(result.distanceKm, 0)} km</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
