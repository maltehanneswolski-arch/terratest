import { useState, useEffect } from 'react';
import { GameNavbar } from '@/components/ui/game-navbar';
import { CitySearch } from '@/pages/game/components/CitySearch';
import { CountdownTimer } from '@/pages/game/components/CountdownTimer';
import { SelectedCities } from '@/pages/game/components/SelectedCities';
import { GameResult } from '@/pages/game/components/GameResult';
import { RulesModal } from '@/components/feature/rules-modal';
import { brusselsDate, hashString } from '@/lib/brusselsTime';
import { readStoredJson } from '@/lib/storage';
import { GameStatsBar } from '@/components/feature/game-stats-bar';
import { useGameStats } from '@/lib/gameStats';
import {
  ALL_CITIES,
  BonusData,
  City,
  RestrictionData,
  cityMatchesBonus,
  cityMatchesRestriction,
  generateCompatibleBonus,
  generateRestriction,
  seededRandom,
} from '@/pages/game/data/gameRules';

interface DailyGameResult {
  cities: City[];
  total: number;
  difference: number;
  hasBonusCountry: boolean;
  bonusCountry?: string;
}


const STORAGE_VERSION = 'v2';
const LAST_PLAYED_KEY = `popstack_${STORAGE_VERSION}_last_played`;
const RESULT_KEY = `popstack_${STORAGE_VERSION}_result`;

function makeSeededRandom(seed: number) {
  let state = Math.abs(Math.floor(seed)) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function pickReachableTarget(seed: number, restriction: RestrictionData): number {
  const eligibleCities = ALL_CITIES.filter((city) => cityMatchesRestriction(city, restriction));

  if (eligibleCities.length < 3) {
    return 12_000_000;
  }

  const descending = [...eligibleCities].sort((a, b) => b.population - a.population);
  const ascending = [...eligibleCities].sort((a, b) => a.population - b.population);
  const minReachable = ascending.slice(0, 3).reduce((sum, city) => sum + city.population, 0);
  const maxReachable = descending.slice(0, 3).reduce((sum, city) => sum + city.population, 0);

  const shuffled = [...eligibleCities];
  const seeded = makeSeededRandom(seed * 97 + eligibleCities.length * 13);
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seeded() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const poolMap = new Map<string, City>();
  descending.slice(0, Math.min(140, descending.length)).forEach((city) => {
    poolMap.set(`${city.name}|${city.country}|${city.population}`, city);
  });
  shuffled.slice(0, Math.min(80, shuffled.length)).forEach((city) => {
    poolMap.set(`${city.name}|${city.country}|${city.population}`, city);
  });

  const pool = [...poolMap.values()];
  const range = Math.max(1, maxReachable - minReachable);
  const sums: number[] = [];
  const seenSums = new Set<number>();

  const sampleCount = Math.min(5000, Math.max(1200, pool.length * 18));
  for (let attempt = 0; attempt < sampleCount; attempt += 1) {
    let i = Math.floor(seeded() * pool.length);
    let j = Math.floor(seeded() * pool.length);
    let k = Math.floor(seeded() * pool.length);

    while (j === i) j = Math.floor(seeded() * pool.length);
    while (k === i || k === j) k = Math.floor(seeded() * pool.length);

    const sum = pool[i].population + pool[j].population + pool[k].population;
    const ratio = (sum - minReachable) / range;

    if (ratio < 0.1 || ratio > 0.94) continue;
    if (!seenSums.has(sum)) {
      seenSums.add(sum);
      sums.push(sum);
    }
  }

  if (sums.length === 0) {
    return Math.min(maxReachable, Math.max(minReachable, Math.round((minReachable + maxReachable) / 2)));
  }

  sums.sort((a, b) => a - b);
  return sums[Math.floor(seeded() * sums.length)];
}


export default function GamePage() {
  const [selectedCities, setSelectedCities] = useState<City[]>([]);
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [bonusData, setBonusData] = useState<BonusData>({ id: '', type: 'country', value: '', label: '', description: '' });
  const [restrictionData, setRestrictionData] = useState<RestrictionData>({ id: '', type: 'continent', value: '', label: '', icon: '', description: '' });
  const [gameResult, setGameResult] = useState<DailyGameResult | null>(null);
  const { record: recordDaily } = useGameStats('popstack');
  const [showRules, setShowRules] = useState(true);

  // Get current date in Brussels timezone
  const getCurrentBrusselsDate = () => brusselsDate();



  // Generate daily challenge
  const generateDailyChallenge = () => {
    const dateString = getCurrentBrusselsDate();
    // Hash the whole date string. Summing the y/m/d components instead would
    // collide heavily — 2026 has only 42 distinct sums across 365 days, so
    // e.g. 2026-07-05 and 2026-08-04 would serve the identical challenge.
    const seed = hashString(dateString);

    const restriction = generateRestriction(seed);
    const bonus = generateCompatibleBonus(seed, restriction);
    const target = pickReachableTarget(seed, restriction);

    setRestrictionData(restriction);
    setBonusData(bonus);
    setTargetNumber(target);
  };

  useEffect(() => {
    // Check if user has played today
    const lastPlayedDate = localStorage.getItem(LAST_PLAYED_KEY);
    const currentDate = getCurrentBrusselsDate();

    if (lastPlayedDate === currentDate) {
      const savedResult = readStoredJson<DailyGameResult | null>(RESULT_KEY, null);
      if (savedResult) {
        setGameResult(savedResult);
      }
    }

    generateDailyChallenge();
  }, []);

  const handleCitySelect = (city: City) => {
    if (!checkRestrictionQualification(city)) {
      return;
    }

    const alreadySelected = selectedCities.some(
      (selectedCity) =>
        selectedCity.name === city.name &&
        selectedCity.country === city.country &&
        selectedCity.population === city.population,
    );

    if (selectedCities.length < 3 && !alreadySelected) {
      setSelectedCities([...selectedCities, city]);
    }
  };

  const handleRemoveCity = (city: City) => {
    setSelectedCities(
      selectedCities.filter(
        (selectedCity) =>
          !(
            selectedCity.name === city.name &&
            selectedCity.country === city.country &&
            selectedCity.population === city.population
          ),
      ),
    );
  };

  const checkBonusQualification = (city: City): boolean => cityMatchesBonus(city, bonusData);

  const checkRestrictionQualification = (city: City): boolean => cityMatchesRestriction(city, restrictionData);

  const handleSubmitGuess = () => {
    if (selectedCities.length !== 3 || selectedCities.some((city) => !checkRestrictionQualification(city))) {
      return;
    }

    const total = selectedCities.reduce((sum, city) => sum + city.population, 0);
    const difference = total - targetNumber;
    const hasBonusCity = selectedCities.some(city => checkBonusQualification(city));

    const result: DailyGameResult = {
      cities: selectedCities,
      total,
      difference,
      hasBonusCountry: hasBonusCity,
      bonusCountry: hasBonusCity ? bonusData.value : undefined
    };

    setGameResult(result);

    // One record per day. Score is closeness to the target, expressed as a
    // percentage so it's comparable across days with different targets.
    const accuracy = Math.max(0, Math.round(100 - (Math.abs(difference) / targetNumber) * 100));
    recordDaily({ score: accuracy, maxScore: 100 }, getCurrentBrusselsDate());

    // Save to localStorage
    const currentDate = getCurrentBrusselsDate();
    localStorage.setItem(LAST_PLAYED_KEY, currentDate);
    localStorage.setItem(RESULT_KEY, JSON.stringify(result));
  };

  const handleNewGame = () => {
    setSelectedCities([]);
    setGameResult(null);
    localStorage.removeItem(LAST_PLAYED_KEY);
    localStorage.removeItem(RESULT_KEY);
    generateDailyChallenge();
  };


  return (
    <div className="app-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <GameNavbar currentPath="/game" />

      <RulesModal
        open={showRules}
        onClose={() => { setShowRules(false); }}
        title="How PopStack works"
        icon="ri-stack-line"
        iconGradient="from-red-500 to-rose-600"
        accent="red"
        description="Each day brings a new target population. Pick exactly 3 cities whose combined population is as close as possible to the target."
        rules={[
          { icon: 'ri-lock-line', text: 'A restriction limits you to cities from a specific region or continent. Only qualifying cities can be selected.' },
          { icon: 'ri-star-line', text: 'A bonus country is revealed each round. Including a city from that country halves your accuracy penalty.' },
          { icon: 'ri-number-3', text: 'You must select exactly 3 cities — no more, no less. Submit when you are happy with your stack.' },
        ]}
        scoring={[
          { pts: '100%', label: 'Perfect', sub: 'exact match', color: 'green' },
          { pts: 'Near', label: 'Great', sub: 'small difference', color: 'yellow' },
          { pts: '÷2', label: 'Bonus city', sub: 'halves your gap', color: 'purple' },
        ]}
        tip="Start with the largest city you can find in the restricted region, then fine-tune with smaller cities."
        ctaLabel="Stack some cities!"
        ctaGradient="from-red-500 to-rose-600"
      />

      {/* Header Banner */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2 flex items-center justify-center gap-3">
          <i className="ri-stack-line text-red-500 dark:text-red-400"></i>
          PopStack
          <i className="ri-bar-chart-line text-red-500 dark:text-red-400"></i>
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Stack cities to match the target population!</p>
        <button
          onClick={() => setShowRules(true)}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors cursor-pointer font-medium"
          style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
        >
          <i className="ri-question-line"></i>
          How to play
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Row - Target Display */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Today&apos;s Target</h2>
              <div className="text-5xl font-bold text-red-500 dark:text-red-400 mb-2">
                {targetNumber.toLocaleString()}
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                Combined population to match
              </div>
              <div className="mt-4 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <i className="ri-map-pin-2-line text-red-400"></i>
                Select 3 cities whose total population matches this number
              </div>
            </div>

            {/* Bonus and Restriction */}
            <div className="grid grid-cols-2 gap-4">
              {/* Bonus */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                  <i className="ri-star-fill text-amber-400"></i>
                  Bonus
                </h3>
                <div className="text-center mb-2">
                  {bonusData.flag && bonusData.flag.startsWith('http') ? (
                    <img src={bonusData.flag} alt="Bonus flag" className="w-12 h-8 object-cover rounded mx-auto mb-1" />
                  ) : (
                    <div className="text-3xl mb-1">{bonusData.flag}</div>
                  )}
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {bonusData.label}
                  </div>
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300 text-center">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                    Halves your accuracy gap!
                  </div>
                </div>
              </div>

              {/* Restriction */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                  <i className="ri-lock-line text-red-500 dark:text-red-400"></i>
                  Restriction
                </h3>
                <div className="text-center mb-2">
                  <div className="text-3xl mb-1">{restrictionData.icon}</div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {restrictionData.label}
                  </div>
                </div>
                <div className="text-xs text-red-700 dark:text-red-300 text-center">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                    Only these cities allowed!
                  </div>
                </div>
              </div>
            </div>

            {/* Game Content */}
            {!gameResult ? (
              <>
                {/* Bottom Left - City Search */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <CitySearch 
                    onCitySelect={handleCitySelect}
                    restrictionData={restrictionData}
                    checkRestrictionQualification={checkRestrictionQualification}
                  />
                </div>

                {/* Bottom Right - Selected Cities */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <SelectedCities
                    cities={selectedCities}
                    onRemoveCity={handleRemoveCity}
                    onSubmitGuess={handleSubmitGuess}
                    bonusData={bonusData}
                    checkBonusQualification={checkBonusQualification}
                  />
                </div>
              </>
            ) : (
              /* Game Result - Full Width */
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <GameResult
                      result={gameResult}
                      targetNumber={targetNumber}
                      onNewGame={handleNewGame}
                    />
                  </div>
                  
                  <GameStatsBar gameId="popstack" showStreak={false} className="mx-auto max-w-md" />

                  <div className="max-w-md mx-auto">
                    <CountdownTimer />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
