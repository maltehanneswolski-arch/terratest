import { Fragment, useEffect, useMemo, useState } from 'react';
import { GameNavbar } from '@/components/ui/game-navbar';
import { WORLD_ORDER_METRICS, type WorldOrderCountryData, type WorldOrderMetric } from './world-order-metrics';
import { readStoredJson } from '@/lib/storage';
import { scoreLine } from '@/lib/shareResult';
import { ShareButtons } from '@/components/feature/share-buttons';
import { GameStatsBar } from '@/components/feature/game-stats-bar';
import { useGameStats } from '@/lib/gameStats';

type GuessPosition = 'above1' | 'above2' | 'below1' | 'below2';

interface Guess {
  country: string;
  position: GuessPosition;
}

interface Result {
  guess: string;
  position: GuessPosition;
  guessedRank: number;
  actualRank: number;
  points: number;
  color: string;
  label: string;
  value: number;
  displayValue: string;
}

interface Question {
  metricId: string;
  centerCountry: string;
}

interface RoundResult {
  question: Question;
  results: Result[];
  totalScore: number;
}

interface PersistedGameState {
  questions: Question[];
  currentQuestionIndex: number;
  roundResults: RoundResult[];
  totalScore: number;
  gameComplete: boolean;
  showResults: boolean;
  results: Result[];
}

const getCurrentBrusselsDate = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const getDailySeed = () => {
  const brusselsDate = getCurrentBrusselsDate();
  let hash = 0;
  const dateStr = `${brusselsDate}worldorder-v2`;
  for (let i = 0; i < dateStr.length; i += 1) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const shuffleWithSeed = <T,>(array: T[], seed: number): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const metricSelectionWeight = (metric: WorldOrderMetric) => {
  const id = metric.id.toLowerCase();
  const label = metric.label.toLowerCase();

  if (id.includes('pm25') || label.includes('pm2.5')) return 0;
  if (id.includes('amphibian')) return 0.28;
  if (id.startsWith('imp-')) return 2.4;
  if (id.includes('plant')) return 0.85;
  return 1;
};

const weightedMetricShuffle = (metrics: WorldOrderMetric[], seed: number) => metrics
  .map((metric, index) => ({
    metric,
    score: metricSelectionWeight(metric) <= 0
      ? Number.POSITIVE_INFINITY
      : -Math.log(Math.max(seededRandom(seed + index * 101 + 1), 1e-9)) / metricSelectionWeight(metric),
  }))
  .filter((entry) => Number.isFinite(entry.score))
  .sort((a, b) => a.score - b.score || a.metric.label.localeCompare(b.metric.label))
  .map((entry) => entry.metric);

const METRIC_MAP = new Map(WORLD_ORDER_METRICS.map(metric => [metric.id, metric]));

const getMetric = (metricId: string) => METRIC_MAP.get(metricId) ?? null;

const getQuestionData = (question: Question | undefined | null) => {
  if (!question) return null;
  const metric = getMetric(question.metricId);
  if (!metric) return null;
  const centerCountry = metric.data.find(country => country.country === question.centerCountry) ?? null;
  if (!centerCountry) return null;
  return { metric, centerCountry };
};

const positionOrder: GuessPosition[] = ['above2', 'above1', 'below1', 'below2'];

const getPositionLabel = (position: GuessPosition) => {
  if (position === 'above2') return 'Above 2';
  if (position === 'above1') return 'Above 1';
  if (position === 'below1') return 'Below 1';
  return 'Below 2';
};

const getResultEmoji = (points: number) => {
  if (points === 10) return '🟣';
  if (points >= 6) return '🟢';
  if (points >= 5) return '🟡';
  if (points >= 4) return '🟠';
  return '🔴';
};

const createDailyQuestions = (): Question[] => {
  const seed = getDailySeed();
  const metrics = weightedMetricShuffle(WORLD_ORDER_METRICS, seed).slice(0, 1);

  return metrics.map((metric, index) => {
    const minIndex = 10;
    const maxIndex = Math.max(minIndex, metric.data.length - 11);
    const chosenIndex =
      maxIndex <= minIndex
        ? Math.floor(metric.data.length / 2)
        : Math.floor(seededRandom(seed + index * 997) * (maxIndex - minIndex + 1)) + minIndex;

    return {
      metricId: metric.id,
      centerCountry: metric.data[chosenIndex].country,
    };
  });
};

const calculateScore = (guessedRank: number, actualRank: number, isCorrectOrientation: boolean) => {
  if (!isCorrectOrientation) return { points: 0, color: 'bg-red-500', label: 'Wrong direction' };

  const distance = Math.abs(guessedRank - actualRank);
  if (distance <= 2) return { points: 10, color: 'bg-purple-500', label: 'Perfect' };
  if (distance <= 10) return { points: 6, color: 'bg-green-500', label: 'Excellent' };
  if (distance <= 20) return { points: 5, color: 'bg-lime-500', label: 'Great' };
  if (distance <= 40) return { points: 4, color: 'bg-yellow-500', label: 'Good' };
  return { points: 3, color: 'bg-orange-500', label: 'Right side' };
};

const getActualNeighbors = (metric: WorldOrderMetric, centerCountry: WorldOrderCountryData) => {
  const above = metric.data.filter(country => country.rank === centerCountry.rank - 2 || country.rank === centerCountry.rank - 1);
  const below = metric.data.filter(country => country.rank === centerCountry.rank + 1 || country.rank === centerCountry.rank + 2);
  return { above, below };
};

const storageKeyForToday = () => `worldOrderResult_${getCurrentBrusselsDate()}`;

export default function WorldOrderPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [searchTerms, setSearchTerms] = useState<Record<GuessPosition, string>>({
    above1: '',
    above2: '',
    below1: '',
    below2: '',
  });
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<GuessPosition | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const { record: recordRun } = useGameStats('world-order');
  const [showInstructionModal, setShowInstructionModal] = useState(true);
  const [showInlineInstructions, setShowInlineInstructions] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionData = useMemo(() => getQuestionData(currentQuestion), [currentQuestion]);
  const currentMetric = currentQuestionData?.metric ?? null;
  const centerCountry = currentQuestionData?.centerCountry ?? null;
  const currentRoundResult = showResults
    ? (roundResults[roundResults.length - 1] ?? null)
    : null;

  const saveGameState = (state: PersistedGameState) => {
    localStorage.setItem(storageKeyForToday(), JSON.stringify(state));
    localStorage.setItem('worldOrderLastPlayed', getCurrentBrusselsDate());
  };

  useEffect(() => {
    const savedDate = localStorage.getItem('worldOrderLastPlayed');
    const today = getCurrentBrusselsDate();
    const savedRaw = localStorage.getItem(storageKeyForToday());

    const saved = savedDate === today && savedRaw
      ? readStoredJson<PersistedGameState | null>(storageKeyForToday(), null)
      : null;

    if (saved) {
      setQuestions(saved.questions);
      setCurrentQuestionIndex(saved.currentQuestionIndex);
      setRoundResults(saved.roundResults);
      setTotalScore(saved.totalScore);
      setGameComplete(saved.gameComplete);
      setShowResults(saved.showResults);
      setResults(saved.results);
      return;
    }

    setQuestions(createDailyQuestions());
  }, []);

  const handleCloseModal = () => {
    setShowInstructionModal(false);
  };

  const handleSearch = (position: GuessPosition, value: string) => {
    setSearchTerms(prev => ({ ...prev, [position]: value }));
    setOpenDropdown(position);
  };

  const handleSelectCountry = (position: GuessPosition, country: string) => {
    setGuesses(prev => {
      const existing = prev.find(guess => guess.position === position);
      if (existing) {
        return prev.map(guess => (guess.position === position ? { ...guess, country } : guess));
      }
      return [...prev, { country, position }];
    });

    setSearchTerms(prev => ({ ...prev, [position]: country }));
    setOpenDropdown(null);
  };

  const getFilteredCountries = (position: GuessPosition) => {
    if (!currentMetric || !centerCountry) return [];
    const searchTerm = searchTerms[position].trim().toLowerCase();
    if (!searchTerm) return [];

    const alreadySelected = new Set(guesses.map(guess => guess.country));
    alreadySelected.add(centerCountry.country);

    return currentMetric.data
      .filter(country => country.country.toLowerCase().includes(searchTerm) && !alreadySelected.has(country.country))
      .slice(0, 6);
  };

  const handleSubmit = () => {
    if (!currentMetric || !centerCountry || guesses.length !== 4) return;

    const roundResultsForSubmit = guesses
      .map(guess => {
        const guessedCountry = currentMetric.data.find(country => country.country === guess.country);
        if (!guessedCountry) return null;

        const playerPutItAbove = guess.position === 'above1' || guess.position === 'above2';
        const actuallyAbove = guessedCountry.rank < centerCountry.rank;
        const score = calculateScore(guessedCountry.rank, centerCountry.rank, playerPutItAbove === actuallyAbove);

        return {
          guess: guessedCountry.country,
          position: guess.position,
          guessedRank: guessedCountry.rank,
          actualRank: centerCountry.rank,
          points: score.points,
          color: score.color,
          label: score.label,
          value: guessedCountry.value,
          displayValue: guessedCountry.displayValue,
        } satisfies Result;
      })
      .filter((result): result is Result => result !== null);

    const roundScore = roundResultsForSubmit.reduce((sum, result) => sum + result.points, 0);
    const updatedRoundResults = [...roundResults, { question: currentQuestion, results: roundResultsForSubmit, totalScore: roundScore }];
    const updatedTotalScore = totalScore + roundScore;
    const isLastQuestion = currentQuestionIndex >= questions.length - 1;

    setResults(roundResultsForSubmit);
    setRoundResults(updatedRoundResults);
    setTotalScore(updatedTotalScore);
    setShowResults(true);
    setGameComplete(isLastQuestion);

    if (isLastQuestion) {
      // One record per completed daily game. Max is 4 guesses x 10 points per
      // question. Keyed on the date so replaying today can't inflate totals.
      recordRun(
        { score: updatedTotalScore, maxScore: questions.length * 40 },
        getCurrentBrusselsDate(),
      );
    }

    saveGameState({
      questions,
      currentQuestionIndex,
      roundResults: updatedRoundResults,
      totalScore: updatedTotalScore,
      gameComplete: isLastQuestion,
      showResults: true,
      results: roundResultsForSubmit,
    });
  };

  const handleContinue = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questions.length) return;

    setCurrentQuestionIndex(nextIndex);
    setGuesses([]);
    setSearchTerms({ above1: '', above2: '', below1: '', below2: '' });
    setOpenDropdown(null);
    setResults([]);
    setShowResults(false);

    saveGameState({
      questions,
      currentQuestionIndex: nextIndex,
      roundResults,
      totalScore,
      gameComplete: false,
      showResults: false,
      results: [],
    });
  };

  const shareMaxPoints = Math.max(questions.length, 1) * 40;
  const sharePayload = {
    game: 'World Order',
    result: scoreLine(totalScore, shareMaxPoints),
    details: roundResults.flatMap((round, index) => {
      const metric = getMetric(round.question.metricId);
      const ordered = round.results
        .slice()
        .sort((a, b) => positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position));
      const tiles = ordered.map((r) => getResultEmoji(r.points)).join('');
      return [
        `${tiles} ${metric?.shortLabel ?? 'Round'} — ${round.totalScore}/40`,
        `🎯 Centre: ${round.question.centerCountry}`,
        ...ordered.map((r) => `   ${getResultEmoji(r.points)} ${getPositionLabel(r.position)}: ${r.guess} (#${r.guessedRank})`),
        index < roundResults.length - 1 ? '' : false,
      ];
    }),
    path: '/world-order',
  };

  const InstructionsContent = () => (
    <div className="space-y-5 text-slate-700 dark:text-slate-300">
      <div>
        <p className="font-semibold mb-1 text-slate-800 dark:text-white">🎯 Objective</p>
        <p className="text-sm leading-relaxed">
          Each round gives you one ordered world list and a center country. Put <strong>2 countries above</strong> it and
          <strong> 2 countries below</strong> it. "Above" always means a <strong>larger value</strong> in that round's list.
          "Below" always means a <strong>smaller value</strong>.
        </p>
      </div>

      <div>
        <p className="font-semibold mb-2 text-slate-800 dark:text-white">📌 Example — UNESCO World Heritage Sites</p>
        <div className="bg-slate-100 dark:bg-slate-700/60 rounded-xl p-4 space-y-2 text-sm border border-slate-200 dark:border-slate-600">
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-3">
            Higher = more UNESCO World Heritage sites
          </div>
          <div className="space-y-1.5">
            <div className="bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white px-3 py-2 rounded-lg flex justify-between items-center">
              <span className="font-medium">Above 2 · China</span>
              <span className="text-xs opacity-80">57 sites</span>
            </div>
            <div className="bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white px-3 py-2 rounded-lg flex justify-between items-center">
              <span className="font-medium">Above 1 · Italy</span>
              <span className="text-xs opacity-80">55 sites</span>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 border-2 border-purple-300 dark:border-purple-600 text-slate-800 dark:text-white px-3 py-2 rounded-lg flex justify-between items-center">
              <span className="font-bold">Germany <span className="text-xs font-normal text-purple-600 dark:text-purple-400">(center)</span></span>
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">52 sites · Rank #3</span>
            </div>
            <div className="bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white px-3 py-2 rounded-lg flex justify-between items-center">
              <span className="font-medium">Below 1 · France</span>
              <span className="text-xs opacity-80">49 sites</span>
            </div>
            <div className="bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white px-3 py-2 rounded-lg flex justify-between items-center">
              <span className="font-medium">Below 2 · Mexico</span>
              <span className="text-xs opacity-80">35 sites</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
            China (57) and Italy (55) go above Germany (52). France (49) and Mexico (35) go below — as long as the direction is right, you score points. The closer to rank #3, the more points you get.
          </p>
        </div>
      </div>

      <div>
        <p className="font-semibold mb-2 text-slate-800 dark:text-white">🏆 Scoring</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            { pts: '10', label: 'Perfect', sub: 'within 2 ranks', color: 'text-purple-600 dark:text-purple-400' },
            { pts: '6', label: 'Excellent', sub: 'within 10 ranks', color: 'text-green-600 dark:text-green-400' },
            { pts: '5', label: 'Great', sub: 'within 20 ranks', color: 'text-lime-600 dark:text-lime-400' },
            { pts: '4', label: 'Good', sub: 'within 40 ranks', color: 'text-yellow-600 dark:text-yellow-400' },
            { pts: '3', label: 'Right side', sub: 'further away', color: 'text-orange-600 dark:text-orange-400' },
            { pts: '0', label: 'Wrong direction', sub: 'above/below flipped', color: 'text-red-600 dark:text-red-400' },
          ].map(item => (
            <div key={item.pts} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
              <span className={`font-bold text-base w-7 shrink-0 ${item.color}`}>{item.pts}</span>
              <div>
                <div className="font-medium text-slate-800 dark:text-white leading-tight">{item.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-4 py-3 border border-purple-200 dark:border-purple-700 text-sm">
        <strong>💡 Tip:</strong> Use the center country's displayed value as your anchor. If the round says "higher means more UNESCO sites,"
        then countries above it should simply have a larger site count.
      </div>
    </div>
  );

  const renderRoundCard = (round: RoundResult, heading: string, subtitle: string) => {
    const questionData = getQuestionData(round.question);
    if (!questionData) return null;
    const { metric, centerCountry: roundCenter } = questionData;
    const neighbors = getActualNeighbors(metric, roundCenter);

    const sortedResults = round.results
      .slice()
      .sort((a, b) => positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position));

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-purple-200 dark:border-purple-700">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2 text-purple-600 dark:text-purple-400">{heading}</h3>
          <div className="text-lg text-gray-700 dark:text-gray-300">{subtitle}</div>
          <div className="mt-3 inline-flex flex-col items-center gap-1 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 px-4 py-3">
            <div className="text-sm font-semibold text-slate-800 dark:text-white">{metric.label}</div>
            <div className="text-xs text-slate-600 dark:text-slate-300">{metric.description}</div>
            <div className="text-xs font-medium text-purple-700 dark:text-purple-300">{metric.higherMeans}</div>
          </div>
        </div>

        <GameStatsBar gameId="world-order" showStreak={false} className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Your picks</h4>
            <div className="space-y-2">
              {sortedResults.map((result, index) => (
                // The key belongs on the outermost element returned by map() —
                // on the inner div it does nothing for reconciliation.
                <Fragment key={`${result.position}-${result.guess}`}>
                  <div className={`${result.color} text-white px-4 py-3 rounded-lg`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{getPositionLabel(result.position)} · {result.guess}</div>
                        <div className="text-xs opacity-90">Rank #{result.guessedRank} · {result.displayValue}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">+{result.points}</div>
                        <div className="text-xs opacity-90">{result.label}</div>
                      </div>
                    </div>
                  </div>
                  {index === 1 && (
                    <div className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 border-2 border-purple-300 dark:border-purple-600 px-4 py-3 rounded-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white">
                            {roundCenter.country}
                            <span className="ml-2 text-xs font-normal text-purple-600 dark:text-purple-400">(center)</span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300">Rank #{roundCenter.rank} · {roundCenter.displayValue}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Actual neighbours</h4>
            <div className="space-y-2">
              {neighbors.above.map(country => (
                <div key={`above-${country.country}`} className="bg-slate-200 dark:bg-slate-600 text-gray-900 dark:text-white px-4 py-3 rounded-lg">
                  <div className="font-semibold">{country.country}</div>
                  <div className="text-sm">Rank #{country.rank}</div>
                  <div className="text-xs mt-1">{country.displayValue}</div>
                </div>
              ))}

              <div className="bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 px-4 py-3 rounded-lg">
                <div className="font-bold text-gray-900 dark:text-white">{roundCenter.country}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">Rank #{roundCenter.rank}</div>
                <div className="text-xs mt-1 text-gray-700 dark:text-gray-300">{roundCenter.displayValue}</div>
              </div>

              {neighbors.below.map(country => (
                <div key={`below-${country.country}`} className="bg-slate-200 dark:bg-slate-600 text-gray-900 dark:text-white px-4 py-3 rounded-lg">
                  <div className="font-semibold">{country.country}</div>
                  <div className="text-sm">Rank #{country.rank}</div>
                  <div className="text-xs mt-1">{country.displayValue}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!currentMetric || !centerCountry) {
    return (
      <div className="app-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-300 text-lg">Loading World Order…</div>
      </div>
    );
  }

  const isFormComplete = guesses.length === 4;

  return (
    <div className="app-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <GameNavbar currentPath="/world-order" />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 text-slate-800 dark:text-white flex items-center justify-center gap-3">
            <i className="ri-bar-chart-line text-purple-600 dark:text-purple-400"></i>
            World Order
            <i className="ri-earth-line text-purple-600 dark:text-purple-400"></i>
          </h1>
          <div className="flex items-center justify-center gap-4 text-lg text-gray-600 dark:text-gray-300">
            <span className="font-semibold">Question 1/1</span>
          </div>


          {!gameComplete && (
            <button
              onClick={() => setShowInlineInstructions(prev => !prev)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors cursor-pointer font-medium border-0 outline-none bg-transparent"
              style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
            >
              <i className={showInlineInstructions ? 'ri-eye-off-line' : 'ri-question-line'}></i>
              {showInlineInstructions ? 'Hide instructions' : 'How to play'}
            </button>
          )}
        </div>

        {showInlineInstructions && !gameComplete && (
          <div className="max-w-2xl mx-auto mb-8 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
            <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-5">
              <i className="ri-information-line"></i>
              How to Play
            </h2>
            <InstructionsContent />
          </div>
        )}

        {showInstructionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-purple-200 dark:border-purple-700 relative">
              <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <i className="ri-information-line"></i>
                  How to Play
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              <div className="px-6 py-5">
                <InstructionsContent />
                <button
                  onClick={handleCloseModal}
                  className="mt-6 w-full py-3 rounded-full bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Got it — let’s play
                </button>
              </div>
            </div>
          </div>
        )}

        {showResults && currentRoundResult ? (
          <div className="max-w-4xl mx-auto space-y-8">
            {renderRoundCard(
              currentRoundResult,
              gameComplete ? `Round 1 · ${currentMetric.label}` : `Round 1 · ${currentMetric.label}`,
              `${currentRoundResult.totalScore}/40 points`
            )}

            {gameComplete ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-purple-200 dark:border-purple-700">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-3xl font-bold mb-4 text-purple-600 dark:text-purple-400">Daily summary</h3>
                  <div className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Total Score: {totalScore}/{questions.length * 40}</div>
                  <div className="text-xl text-gray-700 dark:text-gray-300">All 1 question completed</div>
                </div>

                <div className="space-y-3">
                  {roundResults.map((round, index) => {
                    const metric = getMetric(round.question.metricId);
                    return (
                      <div key={`${round.question.metricId}-${index}`} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 px-4 py-3">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-white">Round {index + 1} · {metric?.shortLabel ?? 'Metric'}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{metric?.higherMeans}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-800 dark:text-white">{round.totalScore}/40</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {round.results.map(result => getResultEmoji(result.points)).join('')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <ShareButtons share={sharePayload} className="mt-8" />

                <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                  Come back tomorrow for a new challenge.
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={handleContinue}
                  className="px-8 py-3 rounded-full font-semibold bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap cursor-pointer"
                >
                  Continue to round {currentQuestionIndex + 2}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto mb-8 bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="inline-block bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 px-8 py-4 rounded-xl border-2 border-violet-200 dark:border-violet-700">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
                  {currentMetric.label}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{currentMetric.description}</p>
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mt-2">
                  {currentMetric.aboveMeansLarger === false
                    ? 'Above = countries with a smaller value (safer).'
                    : 'Above = countries with a larger value.'}{' '}
                  {currentMetric.higherMeans}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {positionOrder.slice(0, 2).map(position => (
                <div key={position} className="relative">
                  <input
                    type="text"
                    value={searchTerms[position]}
                    onChange={event => handleSearch(position, event.target.value)}
                    onFocus={() => setOpenDropdown(position)}
                    placeholder={`${getPositionLabel(position)} · Search country...`}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  {openDropdown === position && getFilteredCountries(position).length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {getFilteredCountries(position).map(country => (
                        <button
                          key={country.country}
                          onClick={() => handleSelectCountry(position, country.country)}
                          className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600 text-gray-900 dark:text-white cursor-pointer"
                        >
                          {country.country}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 px-6 py-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{centerCountry.country}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">Rank #{centerCountry.rank}</div>
                <div className="text-sm text-purple-700 dark:text-purple-300 font-semibold mt-1">{centerCountry.displayValue}</div>
              </div>

              {positionOrder.slice(2).map(position => (
                <div key={position} className="relative">
                  <input
                    type="text"
                    value={searchTerms[position]}
                    onChange={event => handleSearch(position, event.target.value)}
                    onFocus={() => setOpenDropdown(position)}
                    placeholder={`${getPositionLabel(position)} · Search country...`}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  {openDropdown === position && getFilteredCountries(position).length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {getFilteredCountries(position).map(country => (
                        <button
                          key={country.country}
                          onClick={() => handleSelectCountry(position, country.country)}
                          className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600 text-gray-900 dark:text-white cursor-pointer"
                        >
                          {country.country}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {guesses.length}/4 slots filled
              </div>
              <button
                onClick={handleSubmit}
                disabled={!isFormComplete}
                className="px-8 py-3 rounded-full font-semibold bg-purple-500 hover:bg-purple-600 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 text-white shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
              >
                Check answers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
