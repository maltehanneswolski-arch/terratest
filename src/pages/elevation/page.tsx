import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { readStoredJson } from '@/lib/storage';
import { shareResult } from '@/lib/shareResult';
import { GameStatsBar } from '@/components/feature/game-stats-bar';
import { useGameStats } from '@/lib/gameStats';
import { CityCard } from './components/CityCard';
import { GameStats } from './components/GameStats';
import { GameOver } from './components/GameOver';
import { GameNavbar } from '@/components/ui/game-navbar';
import { RulesModal } from '@/components/feature/rules-modal';

interface City {
  name: string;
  country: string;
  elevation: number;
  geonameId?: string;
}

interface CityPair {
  city1: City;
  city2: City;
}

interface GameStats {
  totalGames: number;
  bestStreak: number;
  averageStreak: number;
  totalCorrect: number;
  totalAttempts: number;
}

// Country name to ISO code mapping
const countryToCode: { [key: string]: string } = {
  'Afghanistan': 'af',
  'Albania': 'al',
  'Algeria': 'dz',
  'Andorra': 'ad',
  'Angola': 'ao',
  'Argentina': 'ar',
  'Armenia': 'am',
  'Australia': 'au',
  'Austria': 'at',
  'Azerbaijan': 'az',
  'Bahrain': 'bh',
  'Bangladesh': 'bd',
  'Belarus': 'by',
  'Belgium': 'be',
  'Bhutan': 'bt',
  'Bolivia': 'bo',
  'Bosnia and Herzegovina': 'ba',
  'Botswana': 'bw',
  'Brazil': 'br',
  'Bulgaria': 'bg',
  'Burkina Faso': 'bf',
  'Cambodia': 'kh',
  'Cameroon': 'cm',
  'Canada': 'ca',
  'Chad': 'td',
  'Chile': 'cl',
  'China': 'cn',
  'Colombia': 'co',
  'Costa Rica': 'cr',
  'Croatia': 'hr',
  'Cuba': 'cu',
  'Cyprus': 'cy',
  'Czech Republic': 'cz',
  'Czechia': 'cz',
  'Denmark': 'dk',
  'Dominican Republic': 'do',
  'Ecuador': 'ec',
  'Egypt': 'eg',
  'Eritrea': 'er',
  'Estonia': 'ee',
  'Eswatini': 'sz',
  'Ethiopia': 'et',
  'Finland': 'fi',
  'France': 'fr',
  'Georgia': 'ge',
  'Germany': 'de',
  'Ghana': 'gh',
  'Greece': 'gr',
  'Hungary': 'hu',
  'Iceland': 'is',
  'India': 'in',
  'Indonesia': 'id',
  'Iran': 'ir',
  'Iraq': 'iq',
  'Ireland': 'ie',
  'Israel': 'il',
  'Italy': 'it',
  'Japan': 'jp',
  'Jordan': 'jo',
  'Kazakhstan': 'kz',
  'Kenya': 'ke',
  'Kosovo': 'xk',
  'Kuwait': 'kw',
  'Laos': 'la',
  'Latvia': 'lv',
  'Lebanon': 'lb',
  'Lesotho': 'ls',
  'Libya': 'ly',
  'Liechtenstein': 'li',
  'Lithuania': 'lt',
  'Luxembourg': 'lu',
  'Malaysia': 'my',
  'Malta': 'mt',
  'Mexico': 'mx',
  'Moldova': 'md',
  'Monaco': 'mc',
  'Mongolia': 'mn',
  'Montenegro': 'me',
  'Morocco': 'ma',
  'Myanmar': 'mm',
  'Namibia': 'na',
  'Nepal': 'np',
  'Netherlands': 'nl',
  'New Zealand': 'nz',
  'Nigeria': 'ng',
  'North Korea': 'kp',
  'North Macedonia': 'mk',
  'Norway': 'no',
  'Oman': 'om',
  'Pakistan': 'pk',
  'Peru': 'pe',
  'Philippines': 'ph',
  'Poland': 'pl',
  'Portugal': 'pt',
  'Romania': 'ro',
  'Russia': 'ru',
  'Rwanda': 'rw',
  'San Marino': 'sm',
  'Saudi Arabia': 'sa',
  'Senegal': 'sn',
  'Serbia': 'rs',
  'Singapore': 'sg',
  'Slovakia': 'sk',
  'Slovenia': 'si',
  'South Africa': 'za',
  'South Korea': 'kr',
  'South Sudan': 'ss',
  'Spain': 'es',
  'Sudan': 'sd',
  'Sweden': 'se',
  'Switzerland': 'ch',
  'Syria': 'sy',
  'Taiwan': 'tw',
  'Tajikistan': 'tj',
  'Tanzania': 'tz',
  'Thailand': 'th',
  'Tunisia': 'tn',
  'Turkey': 'tr',
  'Turkmenistan': 'tm',
  'Uganda': 'ug',
  'Ukraine': 'ua',
  'United Arab Emirates': 'ae',
  'UAE': 'ae',
  'United Kingdom': 'gb',
  'United States': 'us',
  'Uzbekistan': 'uz',
  'Vatican City': 'va',
  'Venezuela': 've',
  'Vietnam': 'vn',
  'Yemen': 'ye',
  'Zambia': 'zm',
  'Zimbabwe': 'zw'
};

// Expanded and more diverse city database with better country distribution
const cityDatabase: City[] = [
  // High elevation cities (2000m+)
  { name: 'La Paz', country: 'Bolivia', elevation: 3515 },
  { name: 'Cusco', country: 'Peru', elevation: 3399 },
  { name: 'Quito', country: 'Ecuador', elevation: 2850 },
  { name: 'Bogotá', country: 'Colombia', elevation: 2640 },
  { name: 'Addis Ababa', country: 'Ethiopia', elevation: 2355 },
  { name: 'Thimphu', country: 'Bhutan', elevation: 2334 },
  { name: 'Asmara', country: 'Eritrea', elevation: 2325 },
  { name: 'Sanaa', country: 'Yemen', elevation: 2300 },
  { name: 'Mexico City', country: 'Mexico', elevation: 2240 },

  // Medium-high elevation cities (1000-2000m)
  { name: 'Nairobi', country: 'Kenya', elevation: 1795 },
  { name: 'Kabul', country: 'Afghanistan', elevation: 1790 },
  { name: 'Johannesburg', country: 'South Africa', elevation: 1753 },
  { name: 'Windhoek', country: 'Namibia', elevation: 1721 },
  { name: 'Maseru', country: 'Lesotho', elevation: 1673 },
  { name: 'Denver', country: 'United States', elevation: 1609 },
  { name: 'Kigali', country: 'Rwanda', elevation: 1567 },
  { name: 'Harare', country: 'Zimbabwe', elevation: 1483 },
  { name: 'Kathmandu', country: 'Nepal', elevation: 1400 },
  { name: 'Lusaka', country: 'Zambia', elevation: 1279 },
  { name: 'Mbabane', country: 'Eswatini', elevation: 1243 },
  { name: 'Tehran', country: 'Iran', elevation: 1200 },
  { name: 'Kampala', country: 'Uganda', elevation: 1190 },
  { name: 'Calgary', country: 'Canada', elevation: 1045 },
  { name: 'Andorra la Vella', country: 'Andorra', elevation: 1023 },
  { name: 'Gaborone', country: 'Botswana', elevation: 1014 },

  // Medium elevation cities (500-1000m)
  { name: 'Yerevan', country: 'Armenia', elevation: 989 },
  { name: 'Ankara', country: 'Turkey', elevation: 938 },
  { name: 'Abuja', country: 'Nigeria', elevation: 840 },
  { name: 'Almaty', country: 'Kazakhstan', elevation: 830 },
  { name: 'San Marino', country: 'San Marino', elevation: 749 },
  { name: 'Madrid', country: 'Spain', elevation: 667 },
  { name: 'Pristina', country: 'Kosovo', elevation: 652 },
  { name: 'Innsbruck', country: 'Austria', elevation: 574 },
  { name: 'Sofia', country: 'Bulgaria', elevation: 550 },
  { name: 'Bern', country: 'Switzerland', elevation: 542 },
  { name: 'Munich', country: 'Germany', elevation: 519 },
  { name: 'Sarajevo', country: 'Bosnia and Herzegovina', elevation: 518 },

  // Lower elevation cities (100-500m)
  { name: 'Vaduz', country: 'Liechtenstein', elevation: 460 },
  { name: 'Salzburg', country: 'Austria', elevation: 424 },
  { name: 'Zurich', country: 'Switzerland', elevation: 408 },
  { name: 'Prague', country: 'Czech Republic', elevation: 399 },
  { name: 'Geneva', country: 'Switzerland', elevation: 373 },
  { name: 'Ljubljana', country: 'Slovenia', elevation: 295 },
  { name: 'Minsk', country: 'Belarus', elevation: 280 },
  { name: 'Skopje', country: 'North Macedonia', elevation: 245 },
  { name: 'Luxembourg', country: 'Luxembourg', elevation: 231 },
  { name: 'New Delhi', country: 'India', elevation: 216 },
  { name: 'Kiev', country: 'Ukraine', elevation: 179 },
  { name: 'Vientiane', country: 'Laos', elevation: 174 },
  { name: 'Lyon', country: 'France', elevation: 173 },
  { name: 'Vienna', country: 'Austria', elevation: 171 },
  { name: 'Monaco', country: 'Monaco', elevation: 163 },
  { name: 'Zagreb', country: 'Croatia', elevation: 158 },
  { name: 'Moscow', country: 'Russia', elevation: 156 },
  { name: 'Nicosia', country: 'Cyprus', elevation: 150 },
  { name: 'Cape Town', country: 'South Africa', elevation: 25 },
  { name: 'Algiers', country: 'Algeria', elevation: 24 },
  { name: 'Auckland', country: 'New Zealand', elevation: 20 },
  { name: 'Rabat', country: 'Morocco', elevation: 135 },
  { name: 'Milan', country: 'Italy', elevation: 122 },
  { name: 'Belgrade', country: 'Serbia', elevation: 117 },
  { name: 'Vilnius', country: 'Lithuania', elevation: 112 },
  { name: 'Tirana', country: 'Albania', elevation: 110 },
  { name: 'Budapest', country: 'Hungary', elevation: 102 },

  // Low elevation cities (0-100m)
  { name: 'Dublin', country: 'Ireland', elevation: 85 },
  { name: 'Athens', country: 'Greece', elevation: 70 },
  { name: 'Cardiff', country: 'United Kingdom', elevation: 62 },
  { name: 'Reykjavik', country: 'Iceland', elevation: 61 },
  { name: 'Accra', country: 'Ghana', elevation: 61 },
  { name: 'Bucharest', country: 'Romania', elevation: 60 },
  { name: 'Sydney', country: 'Australia', elevation: 58 },
  { name: 'Valletta', country: 'Malta', elevation: 56 },
  { name: 'Casablanca', country: 'Morocco', elevation: 50 },
  { name: 'Edinburgh', country: 'United Kingdom', elevation: 47 },
  { name: 'Perth', country: 'Australia', elevation: 46 },
  { name: 'Podgorica', country: 'Montenegro', elevation: 44 },
  { name: 'Beijing', country: 'China', elevation: 43 },
  { name: 'Tokyo', country: 'Japan', elevation: 40 },
  { name: 'Seoul', country: 'South Korea', elevation: 38 },
  { name: 'Paris', country: 'France', elevation: 35 },
  { name: 'Berlin', country: 'Germany', elevation: 34 },
  { name: 'Melbourne', country: 'Australia', elevation: 31 },
  { name: 'Wellington', country: 'New Zealand', elevation: 31 },
  { name: 'Stockholm', country: 'Sweden', elevation: 28 },
  { name: 'Helsinki', country: 'Finland', elevation: 26 },
  { name: 'Copenhagen', country: 'Denmark', elevation: 24 },
  { name: 'Oslo', country: 'Norway', elevation: 23 },
  { name: 'Yangon', country: 'Myanmar', elevation: 23 },
  { name: 'Dakar', country: 'Senegal', elevation: 22 },
  { name: 'Rome', country: 'Italy', elevation: 19 },
  { name: 'Kuala Lumpur', country: 'Malaysia', elevation: 19 },
  { name: 'Vatican City', country: 'Vatican City', elevation: 19 },
  { name: 'Manila', country: 'Philippines', elevation: 16 },
  { name: 'Singapore', country: 'Singapore', elevation: 15 },
  { name: 'Mumbai', country: 'India', elevation: 14 },
  { name: 'Brussels', country: 'Belgium', elevation: 13 },
  { name: 'Barcelona', country: 'Spain', elevation: 12 },
  { name: 'Marseille', country: 'France', elevation: 12 },
  { name: 'Hanoi', country: 'Vietnam', elevation: 12 },
  { name: 'Phnom Penh', country: 'Cambodia', elevation: 12 },
  { name: 'London', country: 'United Kingdom', elevation: 11 },
  { name: 'Nice', country: 'France', elevation: 10 },
  { name: 'Belfast', country: 'United Kingdom', elevation: 9 },
  { name: 'Tallinn', country: 'Estonia', elevation: 9 },
  { name: 'Kolkata', country: 'India', elevation: 9 },
  { name: 'Jakarta', country: 'Indonesia', elevation: 8 },
  { name: 'Dhaka', country: 'Bangladesh', elevation: 8 },
  { name: 'Riga', country: 'Latvia', elevation: 7 },
  { name: 'Shanghai', country: 'China', elevation: 4 },
  { name: 'Tunis', country: 'Tunisia', elevation: 4 },
  { name: 'St. Petersburg', country: 'Russia', elevation: 3 },
  { name: 'Lisbon', country: 'Portugal', elevation: 2 },
  { name: 'Bangkok', country: 'Thailand', elevation: 1 },
  { name: 'Amsterdam', country: 'Netherlands', elevation: -2 }
];

export default function ElevationPage() {
  const { t } = useTranslation();
  const [currentPair, setCurrentPair] = useState<CityPair | null>(null);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showElevation, setShowElevation] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalGames: 0,
    bestStreak: 0,
    averageStreak: 0,
    totalCorrect: 0,
    totalAttempts: 0
  });
  const [usedCities, setUsedCities] = useState<Set<string>>(new Set());
  const [showRules, setShowRules] = useState(true);

  // Guards the save effect until the initial load has run. Without it, the save
  // effect fires in the same commit with the still-zeroed initial state and
  // overwrites the stored stats — and under StrictMode's double effect pass it
  // wiped the user's best streak on every mount.
  const statsLoadedRef = useRef(false);
  const { record: recordRun } = useGameStats('elevation');
  const runIdRef = useRef(0);

  // Load stats from localStorage on component mount
  useEffect(() => {
    const savedStats = readStoredJson<GameStats | null>('elevationGameStats', null);
    if (savedStats) {
      setGameStats(savedStats);
    }

    statsLoadedRef.current = true;
  }, []);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    if (!statsLoadedRef.current) return;
    localStorage.setItem('elevationGameStats', JSON.stringify(gameStats));
  }, [gameStats]);

  /*
   * The former updateGlobalStats() built an "allPlayerStats" array in
   * localStorage and derived totalPlayers / averageScore / a score distribution
   * from it. Because localStorage is per-browser, that array only ever held this
   * one visitor, so "global" figures were always a sample of one. The values
   * were never rendered either. Real cross-player stats need a server; the
   * per-browser numbers now come from @/lib/gameStats instead.
   */

  // Improved random city selection with better diversity
  const getRandomCityPair = async (): Promise<[City, City]> => {
    // Filter out already used cities to avoid repetition
    const availableCities = cityDatabase.filter(city => 
      !usedCities.has(`${city.name}-${city.country}`)
    );
    
    // If we've used most cities, reset the used set but keep some variety
    if (availableCities.length < 10) {
      setUsedCities(new Set());
    }
    
    // Use available cities or full database if reset
    const citiesToUse = availableCities.length >= 10 ? availableCities : cityDatabase;
    
    // Multiple random shuffles for better randomization
    const shuffled1 = [...citiesToUse].sort(() => Math.random() - 0.5);
    const shuffled2 = [...citiesToUse].sort(() => Math.random() - 0.5);
    
    let city1 = shuffled1[Math.floor(Math.random() * shuffled1.length)];
    let city2 = shuffled2[Math.floor(Math.random() * shuffled2.length)];
    
    // Cities must differ in name, country AND elevation. Equal elevations make
    // "which city sits higher?" unanswerable — and because the check below uses
    // `>=`, a tie silently marked BOTH answers correct.
    let attempts = 0;
    while (
      (city1.name === city2.name ||
        city1.country === city2.country ||
        city1.elevation === city2.elevation) &&
      attempts < 20
    ) {
      const newShuffled = [...citiesToUse].sort(() => Math.random() - 0.5);
      city2 = newShuffled[Math.floor(Math.random() * newShuffled.length)];
      attempts++;
    }
    
    // Final fallback: guarantee a decidable pair even if the loop above gave up.
    if (city1.name === city2.name || city1.elevation === city2.elevation) {
      const differentCities = citiesToUse.filter(
        (c) => c.name !== city1.name && c.elevation !== city1.elevation,
      );
      if (differentCities.length > 0) {
        city2 = differentCities[Math.floor(Math.random() * differentCities.length)];
      }
    }
    
    // Mark these cities as used
    setUsedCities(prev => new Set([
      ...prev,
      `${city1.name}-${city1.country}`,
      `${city2.name}-${city2.country}`
    ]));
    
    return [city1, city2];
  };

  const startNewGame = async () => {
    setStreak(0);
    setGameOver(false);
    setIsRevealing(false);
    setSelectedCity(null);
    setShowElevation(false);
    setUsedCities(new Set()); // Reset used cities for new game
    
    // Add a small delay to prevent the switching bug
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newPair = await getRandomCityPair();
    setCurrentPair({ city1: newPair[0], city2: newPair[1] });
  };

  const handleCitySelect = async (city: City) => {
    if (!currentPair || isRevealing) return;
    
    setSelectedCity(city.name);
    setIsRevealing(true);
    setShowElevation(true);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const other = city === currentPair.city1 ? currentPair.city2 : currentPair.city1;
    const isCorrect = city.elevation >= other.elevation;
    
    if (isCorrect) {
      setStreak(prev => prev + 1);
      setGameStats(prev => ({
        ...prev,
        totalCorrect: prev.totalCorrect + 1,
        totalAttempts: prev.totalAttempts + 1,
        bestStreak: Math.max(prev.bestStreak, streak + 1),
      }));
      
      setTimeout(async () => {
        const newPair = await getRandomCityPair();
        setCurrentPair({ city1: newPair[0], city2: newPair[1] });
        setIsRevealing(false);
        setSelectedCity(null);
        setShowElevation(false);
      }, 1200);
    } else {
      // Shared per-browser stats: the streak reached is this run's score.
      recordRun({ score: streak }, `run-${runIdRef.current}`);
      runIdRef.current += 1;
      setGameOver(true);
      setGameStats(prev => ({
        ...prev,
        totalGames: prev.totalGames + 1,
        totalAttempts: prev.totalAttempts + 1,
        bestStreak: Math.max(prev.bestStreak, streak),
        averageStreak: prev.totalGames > 0 ? 
          ((prev.averageStreak * prev.totalGames) + streak) / (prev.totalGames + 1) : streak
      }));
    }
  };

  const getCountryFlag = (country: string) => {
    const code = countryToCode[country];
    if (code) {
      return code;
    }
    return 'xx'; // fallback code
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const shareResults = () => {
    const accuracy = gameStats.totalAttempts > 0 ? 
      Math.round((gameStats.totalCorrect / gameStats.totalAttempts) * 100) : 0;
    
    void shareResult({
      game: 'Elevation',
      result: `best streak ${gameStats.bestStreak}`,
      details: [
        `Accuracy: ${accuracy}%`,
        `Games played: ${gameStats.totalGames}`,
      ],
      path: '/elevation',
    });
  };

  return (
    <div className="app-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <GameNavbar currentPath="/elevation" />

      <RulesModal
        open={showRules}
        onClose={() => { setShowRules(false); }}
        title="How Elevation works"
        icon="ri-arrow-up-line"
        iconGradient="from-orange-500 to-amber-500"
        accent="orange"
        description="Two cities appear side by side. Pick which one sits at a higher elevation above sea level — and keep your streak alive!"
        rules={[
          { icon: 'ri-building-line', text: 'Each round shows two cities. Choose the one at a higher elevation.' },
          { icon: 'ri-fire-line', text: 'Get it right to grow your streak. One wrong answer ends the run.' },
          { icon: 'ri-information-line', text: 'After each pick the actual elevations are revealed so you can learn from it.' },
        ]}
        scoring={[
          { pts: '+1', label: 'Correct pick', sub: 'streak grows', color: 'green' },
          { pts: '0', label: 'Wrong pick', sub: 'game over', color: 'red' },
          { pts: '🏔️', label: 'Long streak', sub: 'geography master!', color: 'orange' },
        ]}
        tip="Coastal cities and low-lying capitals (like Amsterdam or Bangkok) are almost always lower than inland or mountainous ones."
        ctaLabel="Start climbing!"
        ctaGradient="from-orange-500 to-amber-500"
      />

      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2 flex items-center justify-center gap-3">
          <i className="ri-arrow-up-line text-orange-600 dark:text-orange-400"></i>
          {t('elevationTitle')}
          <i className="ri-arrow-down-line text-orange-600 dark:text-orange-400"></i>
        </h1>
        <p className="text-slate-600 dark:text-slate-400">{t('whichCityHigher')}</p>
        <button
          onClick={() => setShowRules(true)}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 transition-colors cursor-pointer font-medium"
          style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
        >
          <i className="ri-question-line"></i>
          How to play
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Game Content */}
          {gameOver ? (
            <>
              <GameOver 
                finalStreak={streak}
                stats={gameStats}
                onRestart={startNewGame}
                onShare={shareResults}
              />
              <GameStatsBar gameId="elevation" showStreak={false} className="mx-auto mt-4 max-w-md" />
            </>
          ) : (
            <div className="mt-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('whichCityHigher')}</h2>
                <p className="text-slate-600 dark:text-slate-400">{t('elevationDescription')}</p>
                
                {/* Current Streak Display - Only During Gameplay */}
                <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 max-w-md mx-auto border border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('score')}</div>
                    <div className={`text-3xl font-bold mb-2 ${
                      streak === 0 ? 'text-slate-400' :
                      streak <= 2 ? 'text-red-600 dark:text-red-400' :
                      streak <= 5 ? 'text-orange-600 dark:text-orange-400' :
                      streak <= 8 ? 'text-yellow-600 dark:text-yellow-400' :
                      streak <= 11 ? 'text-green-600 dark:text-green-400' :
                      streak <= 14 ? 'text-blue-600 dark:text-blue-400' :
                      streak <= 17 ? 'text-indigo-600 dark:text-indigo-400' :
                      streak <= 20 ? 'text-purple-600 dark:text-purple-400' :
                      'text-purple-800 dark:text-purple-300'
                    }`}>
                      {streak}
                    </div>
                    
                    {/* Streak Message */}
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {streak === 0 ? 'Start your streak!' :
                       streak <= 2 ? 'Great start!' :
                       streak <= 5 ? 'Keep the momentum going!' :
                       streak <= 8 ? "You're on fire! 🔥" :
                       streak <= 11 ? 'Unstoppable force! ⚡' :
                       streak <= 14 ? 'Geography genius! 🧠' :
                       streak <= 17 ? 'Legendary streak! 🌟' :
                       streak <= 20 ? 'EPIC MASTERY! 👑' :
                       "You're too good for the counting system! 🏆"}
                    </div>
                    
                    {/* Visual Streak Dots */}
                    <div className="flex flex-wrap justify-center gap-1 mt-2 max-w-xs mx-auto">
                      {streak <= 20 ? (
                        // Show individual dots up to 20 in rows
                        Array.from({ length: 20 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              i < streak
                                ? i < 2 ? 'bg-red-500' :
                                  i < 5 ? 'bg-orange-500' :
                                  i < 8 ? 'bg-yellow-500' :
                                  i < 11 ? 'bg-green-500' :
                                  i < 14 ? 'bg-blue-500' :
                                  i < 17 ? 'bg-indigo-500' :
                                  'bg-purple-500'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        ))
                      ) : streak <= 40 ? (
                        // Show expanding box formation for 21-40
                        <div className="flex flex-col items-center gap-1">
                          {/* First 20 dots in 4 rows of 5 */}
                          <div className="grid grid-cols-5 gap-1">
                            {Array.from({ length: 20 }, (_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${ 
                                  i < 2 ? 'bg-red-500' :
                                  i < 5 ? 'bg-orange-500' :
                                  i < 8 ? 'bg-yellow-500' :
                                  i < 11 ? 'bg-green-500' :
                                  i < 14 ? 'bg-blue-500' :
                                  i < 17 ? 'bg-indigo-500' :
                                  'bg-purple-500'
                                }`}
                              />
                            ))}
                          </div>
                          {/* Additional dots expanding the box */}
                          <div className="grid grid-cols-5 gap-1 mt-1">
                            {Array.from({ length: Math.min(streak - 20, 20) }, (_, i) => (
                              <div
                                key={i + 20}
                                className="w-2 h-2 rounded-full transition-all duration-300 bg-purple-600"
                              />
                            ))}
                            {Array.from({ length: Math.max(0, 20 - (streak - 20)) }, (_, i) => (
                              <div
                                key={i + streak}
                                className="w-2 h-2 rounded-full transition-all duration-300 bg-slate-200 dark:bg-slate-700"
                              />
                            ))}
                          </div>
                          <div className="text-purple-700 dark:text-purple-400 font-bold text-sm mt-2">
                            {streak} streak
                          </div>
                        </div>
                      ) : streak <= 80 ? (
                        // Show larger box formation for 41-80
                        <div className="flex flex-col items-center gap-1">
                          {/* 8x5 grid for first 40 */}
                          <div className="grid grid-cols-8 gap-1">
                            {Array.from({ length: 40 }, (_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                  i < 2 ? 'bg-red-500' :
                                  i < 5 ? 'bg-orange-500' :
                                  i < 8 ? 'bg-yellow-500' :
                                  i < 11 ? 'bg-green-500' :
                                  i < 14 ? 'bg-blue-500' :
                                  i < 17 ? 'bg-indigo-500' :
                                  i < 20 ? 'bg-purple-500' :
                                  i < 40 ? 'bg-purple-600' :
                                  'bg-purple-700'
                                }`}
                              />
                            ))}
                          </div>
                          {/* Additional rows for 41-80 */}
                          <div className="grid grid-cols-8 gap-1 mt-1">
                            {Array.from({ length: Math.min(streak - 40, 40) }, (_, i) => (
                              <div
                                key={i + 40}
                                className="w-2 h-2 rounded-full transition-all duration-300 bg-purple-700"
                              />
                            ))}
                            {Array.from({ length: Math.max(0, 40 - (streak - 40)) }, (_, i) => (
                              <div
                                key={i + streak}
                                className="w-2 h-2 rounded-full transition-all duration-300 bg-slate-200 dark:bg-slate-700"
                              />
                            ))}
                          </div>
                          <div className="text-purple-800 dark:text-purple-300 font-bold text-sm mt-2">
                            {streak} streak
                          </div>
                        </div>
                      ) : (
                        // Show compact representation for 81+
                        <div className="flex flex-col items-center gap-2">
                          {/* 10x8 filled grid representing 80 */}
                          <div className="grid grid-cols-10 gap-1">
                            {Array.from({ length: 80 }, (_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                  i < 2 ? 'bg-red-500' :
                                  i < 5 ? 'bg-orange-500' :
                                  i < 8 ? 'bg-yellow-500' :
                                  i < 11 ? 'bg-green-500' :
                                  i < 14 ? 'bg-blue-500' :
                                  i < 17 ? 'bg-indigo-500' :
                                  i < 20 ? 'bg-purple-500' :
                                  i < 40 ? 'bg-purple-600' :
                                  'bg-purple-700'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-purple-800 dark:text-purple-300 font-bold text-lg">
                            +{streak - 80}
                          </div>
                          <div className="text-purple-700 dark:text-purple-400 font-bold text-sm">
                            {streak} total streak
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {currentPair && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <CityCard
                    city={currentPair.city1}
                    onSelect={handleCitySelect}
                    isSelected={selectedCity === currentPair.city1.name}
                    showElevation={showElevation}
                    isCorrect={showElevation && selectedCity === currentPair.city1.name ? 
                      currentPair.city1.elevation >= currentPair.city2.elevation : undefined}
                    isLoading={isRevealing}
                    flag={getCountryFlag(currentPair.city1.country)}
                  />
                  
                  <div className="flex items-center justify-center md:hidden">
                    <div className="text-4xl font-bold text-slate-400 dark:text-slate-600">VS</div>
                  </div>
                  
                  <CityCard
                    city={currentPair.city2}
                    onSelect={handleCitySelect}
                    isSelected={selectedCity === currentPair.city2.name}
                    showElevation={showElevation}
                    isCorrect={showElevation && selectedCity === currentPair.city2.name ? 
                      currentPair.city2.elevation >= currentPair.city1.elevation : undefined}
                    isLoading={isRevealing}
                    flag={getCountryFlag(currentPair.city2.country)}
                  />
                </div>
              )}

              <div className="hidden md:flex items-center justify-center mt-8">
                <div className="text-6xl font-bold text-slate-400 dark:text-slate-600">VS</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
