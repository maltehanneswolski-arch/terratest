import { useState, useEffect, useRef } from 'react';
import { GameNavbar } from '@/components/ui/game-navbar';
import { HoverButton } from '@/components/ui/hover-button';
import { useTranslation } from 'react-i18next';
import { countriesData } from '@/mocks/countries-capitals';
import { RulesModal } from '@/components/feature/rules-modal';
import { shareResult as copyShareResult } from '@/lib/shareResult';
import { GameStatsBar } from '@/components/feature/game-stats-bar';
import { useGameStats } from '@/lib/gameStats';

interface CountryData {
  country: string;
  capital: string;
  cities: string[];
}

export default function DailyQuizPage() {
  const { t } = useTranslation();
  const [currentCountry, setCurrentCountry] = useState<CountryData | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [usedCountries, setUsedCountries] = useState<Set<string>>(new Set());
  const [showRules, setShowRules] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);

  const getCountryCode = (countryName: string): string => {
    const countryCodeMap: { [key: string]: string } = {
      'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Andorra': 'AD', 'Angola': 'AO',
      'Antigua and Barbuda': 'AG', 'Argentina': 'AR', 'Armenia': 'AM', 'Australia': 'AU', 'Austria': 'AT',
      'Azerbaijan': 'AZ', 'Bahamas': 'BS', 'Bahrain': 'BH', 'Bangladesh': 'BD', 'Barbados': 'BB',
      'Belarus': 'BY', 'Belgium': 'BE', 'Belize': 'BZ', 'Benin': 'BJ', 'Bhutan': 'BT',
      'Bolivia': 'BO', 'Bosnia and Herzegovina': 'BA', 'Botswana': 'BW', 'Brazil': 'BR', 'Brunei': 'BN',
      'Bulgaria': 'BG', 'Burkina Faso': 'BF', 'Burundi': 'BI', 'Cabo Verde': 'CV', 'Cambodia': 'KH',
      'Cameroon': 'CM', 'Canada': 'CA', 'Central African Republic': 'CF', 'Chad': 'TD', 'Chile': 'CL',
      'China': 'CN', 'Colombia': 'CO', 'Comoros': 'KM', 'Congo (Republic of the)': 'CG', 
      'Congo (Democratic Republic of the)': 'CD', 'Costa Rica': 'CR', 'Côte d\'Ivoire': 'CI', 
      'Croatia': 'HR', 'Cuba': 'CU', 'Cyprus': 'CY', 'Czechia': 'CZ', 'Denmark': 'DK',
      'Djibouti': 'DJ', 'Dominica': 'DM', 'Dominican Republic': 'DO', 'Ecuador': 'EC', 'Egypt': 'EG',
      'El Salvador': 'SV', 'Equatorial Guinea': 'GQ', 'Eritrea': 'ER', 'Estonia': 'EE', 'Eswatini': 'SZ',
      'Ethiopia': 'ET', 'Fiji': 'FJ', 'Finland': 'FI', 'France': 'FR', 'Gabon': 'GA',
      'Gambia': 'GM', 'Georgia': 'GE', 'Germany': 'DE', 'Ghana': 'GH', 'Greece': 'GR',
      'Grenada': 'GD', 'Guatemala': 'GT', 'Guinea': 'GN', 'Guinea-Bissau': 'GW', 'Guyana': 'GY',
      'Haiti': 'HT', 'Honduras': 'HN', 'Hungary': 'HU', 'Iceland': 'IS', 'India': 'IN',
      'Indonesia': 'ID', 'Iran': 'IR', 'Iraq': 'IQ', 'Ireland': 'IE', 'Israel': 'IL',
      'Italy': 'IT', 'Jamaica': 'JM', 'Japan': 'JP', 'Jordan': 'JO', 'Kazakhstan': 'KZ',
      'Kenya': 'KE', 'Kiribati': 'KI', 'North Korea': 'KP', 'South Korea': 'KR', 'Kuwait': 'KW',
      'Kyrgyzstan': 'KG', 'Laos': 'LA', 'Latvia': 'LV', 'Lebanon': 'LB', 'Lesotho': 'LS',
      'Liberia': 'LR', 'Libya': 'LY', 'Liechtenstein': 'LI', 'Lithuania': 'LT', 'Luxembourg': 'LU',
      'Madagascar': 'MG', 'Malawi': 'MW', 'Malaysia': 'MY', 'Maldives': 'MV', 'Mali': 'ML',
      'Malta': 'MT', 'Marshall Islands': 'MH', 'Mauritania': 'MR', 'Mauritius': 'MU', 'Mexico': 'MX',
      'Micronesia': 'FM', 'Moldova': 'MD', 'Monaco': 'MC', 'Mongolia': 'MN', 'Montenegro': 'ME',
      'Morocco': 'MA', 'Mozambique': 'MZ', 'Myanmar': 'MM', 'Namibia': 'NA', 'Nauru': 'NR',
      'Nepal': 'NP', 'Netherlands': 'NL', 'New Zealand': 'NZ', 'Nicaragua': 'NI', 'Niger': 'NE',
      'Nigeria': 'NG', 'North Macedonia': 'MK', 'Norway': 'NO', 'Oman': 'OM', 'Pakistan': 'PK',
      'Palau': 'PW', 'Panama': 'PA', 'Papua New Guinea': 'PG', 'Paraguay': 'PY', 'Peru': 'PE',
      'Philippines': 'PH', 'Poland': 'PL', 'Portugal': 'PT', 'Qatar': 'QA', 'Romania': 'RO',
      'Russia': 'RU', 'Rwanda': 'RW', 'Saint Kitts and Nevis': 'KN', 'Saint Lucia': 'LC',
      'Saint Vincent and the Grenadines': 'VC', 'Samoa': 'WS', 'San Marino': 'SM', 
      'Sao Tome and Principe': 'ST', 'Saudi Arabia': 'SA', 'Senegal': 'SN', 'Serbia': 'RS',
      'Seychelles': 'SC', 'Sierra Leone': 'SL', 'Singapore': 'SG', 'Slovakia': 'SK', 'Slovenia': 'SI',
      'Solomon Islands': 'SB', 'Somalia': 'SO', 'South Africa': 'ZA', 'South Sudan': 'SS', 'Spain': 'ES',
      'Sri Lanka': 'LK', 'Sudan': 'SD', 'Suriname': 'SR', 'Sweden': 'SE', 'Switzerland': 'CH',
      'Syria': 'SY', 'Tajikistan': 'TJ', 'Tanzania': 'TZ', 'Thailand': 'TH', 'Timor-Leste': 'TL',
      'Togo': 'TG', 'Tonga': 'TO', 'Trinidad and Tobago': 'TT', 'Tunisia': 'TN', 'Turkey': 'TR',
      'Turkmenistan': 'TM', 'Tuvalu': 'TV', 'Uganda': 'UG', 'Ukraine': 'UA', 'United Arab Emirates': 'AE',
      'United Kingdom': 'GB', 'United States': 'US', 'Uruguay': 'UY', 'Uzbekistan': 'UZ', 'Vanuatu': 'VU',
      'Venezuela': 'VE', 'Vietnam': 'VN', 'Yemen': 'YE', 'Zambia': 'ZM', 'Zimbabwe': 'ZW'
    };
    return countryCodeMap[countryName] || 'UN';
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const TOTAL_OPTIONS = 6;

  const generateNewQuestion = () => {
    let availableCountries = countriesData.filter(c => !usedCountries.has(c.country));

    // Pool exhausted after a 193-question streak. Reset to the full list here
    // rather than recursing: setUsedCountries wouldn't have applied yet, so the
    // recursive call would recompute the same empty pool and blow the stack.
    const poolWasExhausted = availableCountries.length === 0;
    if (poolWasExhausted) {
      availableCountries = countriesData;
    }

    const randomCountry = availableCountries[Math.floor(Math.random() * availableCountries.length)];
    setCurrentCountry(randomCountry);
    setUsedCountries(poolWasExhausted
      ? new Set([randomCountry.country])
      : prev => new Set([...prev, randomCountry.country]));

    // Collect decoys through a Set keyed on the option text, skipping anything
    // equal to the capital. Some decoy cities collide with another country's
    // capital (e.g. Panama's "Santiago" vs Chile's capital), which would render
    // two identical buttons and light both green on answer.
    const decoys = new Set<string>();
    const addDecoy = (city: string) => {
      if (city && city !== randomCountry.capital) decoys.add(city);
    };

    randomCountry.cities.forEach(addDecoy);

    // Top up from other countries until full, so deduplication can't shrink the
    // question below its usual number of choices.
    const otherCountries = shuffleArray(countriesData.filter(c => c.country !== randomCountry.country));
    for (const country of otherCountries) {
      if (decoys.size >= TOTAL_OPTIONS - 1) break;
      addDecoy(country.cities[Math.floor(Math.random() * country.cities.length)]);
    }

    const allOptions = shuffleArray([
      randomCountry.capital,
      ...Array.from(decoys).slice(0, TOTAL_OPTIONS - 1),
    ]);
    setOptions(allOptions);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  // Tracks the pending post-answer timeout so it can be cancelled. Without this,
  // hitting "Play again" inside the 1s delay lets a stale timeout fire and
  // generate a second question over the freshly reset game.
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { record: recordRun } = useGameStats('capital-clash');
  // Distinguishes successive runs so each is recorded once.
  const runIdRef = useRef(0);

  const scheduleAfterAnswer = (callback: () => void) => {
    if (answerTimeoutRef.current !== null) clearTimeout(answerTimeoutRef.current);
    answerTimeoutRef.current = setTimeout(() => {
      answerTimeoutRef.current = null;
      callback();
    }, 1000);
  };

  useEffect(() => {
    generateNewQuestion();
    return () => {
      if (answerTimeoutRef.current !== null) clearTimeout(answerTimeoutRef.current);
    };
  }, []);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct = answer === currentCountry?.capital;
    setIsCorrect(correct);

    if (correct) {
      setStreak(prev => prev + 1);
      scheduleAfterAnswer(generateNewQuestion);
    } else {
      // The run just ended, so the streak reached is this run's score. Recorded
      // here rather than in an effect on isGameOver so it fires exactly once.
      recordRun({ score: streak }, `run-${runIdRef.current}`);
      runIdRef.current += 1;
      scheduleAfterAnswer(() => setIsGameOver(true));
    }
  };

  const handlePlayAgain = () => {
    if (answerTimeoutRef.current !== null) {
      clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
    setStreak(0);
    setIsGameOver(false);
    setUsedCountries(new Set());
    generateNewQuestion();
  };

  const handleShare = async () => {
    
    const ok = await copyShareResult({
      game: 'Capital Clash',
      result: `a streak of ${streak}`,
      details: [`Capitals named correctly in a row: ${streak}`],
      path: '/daily-quiz',
    });
    setShareCopied(ok);
    window.setTimeout(() => setShareCopied(false), 2000);
  };

  if (isGameOver) {
    return (
      <div className="app-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <i className="ri-trophy-line text-6xl text-amber-500 dark:text-amber-400"></i>
          </div>
          
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            {t('gameOver')}
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your final streak
          </p>
          
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl p-6 mb-6">
            <div className="text-5xl font-bold text-amber-600 dark:text-amber-400 mb-2">
              {streak}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Correct answers in a row
            </div>
          </div>

          <GameStatsBar gameId="capital-clash" showStreak={false} className="mb-6" />

          {currentCountry && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">The correct answer was:</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {currentCountry.capital}
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={handlePlayAgain}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              <i className="ri-refresh-line mr-2"></i>
              {t('playAgain')}
            </button>
            
            <button
              onClick={handleShare}
              className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 whitespace-nowrap"
            >
              <i className={`${shareCopied ? 'ri-check-line' : 'ri-share-line'} mr-2`}></i>
              {shareCopied ? 'Copied!' : t('share')}
            </button>
          </div>

          <HoverButton
            href="/"
            glowColor="#3b82f6"
            backgroundColor="transparent"
            textColor="#64748b"
            hoverTextColor="#3b82f6"
            className="mt-6 dark:!text-slate-400 hover:dark:!text-blue-400"
          >
            <i className="ri-home-line mr-2"></i>
            {t('backToHome')}
          </HoverButton>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Navigation */}
      <GameNavbar currentPath="/daily-quiz" />

      <RulesModal
        open={showRules}
        onClose={() => { setShowRules(false); }}
        title="How Capital Clash works"
        icon="ri-trophy-line"
        iconGradient="from-amber-500 to-orange-500"
        accent="amber"
        description="A country appears with its flag. Pick the correct capital city from four options — and keep your streak alive!"
        rules={[
          { icon: 'ri-flag-line', text: 'Each question shows a country name and flag. Choose the correct capital from the four options.' },
          { icon: 'ri-fire-line', text: 'Answer correctly to grow your streak. One wrong answer ends the run.' },
          { icon: 'ri-refresh-line', text: 'Countries are drawn randomly — no repeats until the whole pool is exhausted.' },
        ]}
        scoring={[
          { pts: '+1', label: 'Correct answer', sub: 'streak grows', color: 'green' },
          { pts: '0', label: 'Wrong answer', sub: 'game over', color: 'red' },
          { pts: '🔥', label: 'Longest streak', sub: 'your personal best', color: 'amber' },
        ]}
        tip="When unsure, think about the continent — many capitals share naming patterns with their country."
        ctaLabel="Start the streak!"
        ctaGradient="from-amber-500 to-orange-500"
      />

      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2 flex items-center justify-center gap-3">
          <i className="ri-trophy-line text-amber-600 dark:text-amber-400"></i>
          Capital Clash
          <i className="ri-flag-line text-amber-600 dark:text-amber-400"></i>
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Guess the capital city and build your streak!</p>
        <button
          onClick={() => setShowRules(true)}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer font-medium"
          style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
        >
          <i className="ri-question-line"></i>
          How to play
        </button>
      </div>

      {/* Game Area */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Streak Counter */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6 text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <i className="ri-fire-line text-3xl text-orange-500"></i>
              <div>
                <div className="text-3xl font-bold text-slate-800 dark:text-white">{streak}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        {currentCountry && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
            <div className="text-center mb-8">
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                What is the capital of
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 px-5 py-4">
                <img
                  src={`https://flagcdn.com/w160/${getCountryCode(currentCountry.country).toLowerCase()}.png`}
                  alt={`${currentCountry.country} flag`}
                  className="w-16 h-12 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <h2 className="text-4xl font-bold text-slate-800 dark:text-white">
                  {currentCountry.country}
                </h2>
              </div>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrectAnswer = option === currentCountry.capital;
                const showResult = selectedAnswer !== null;

                let buttonClass = 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white';
                
                if (showResult) {
                  if (isSelected && isCorrect) {
                    buttonClass = 'bg-emerald-500 text-white';
                  } else if (isSelected && !isCorrect) {
                    buttonClass = 'bg-red-500 text-white';
                  } else if (isCorrectAnswer) {
                    buttonClass = 'bg-emerald-500 text-white';
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={selectedAnswer !== null}
                    className={`${buttonClass} font-semibold py-4 px-6 rounded-xl border border-slate-200 dark:border-slate-600 transition-all duration-300 shadow-md hover:shadow-lg disabled:cursor-not-allowed whitespace-nowrap text-left`}
                  >
                    <span className="text-slate-400 dark:text-slate-500 mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {selectedAnswer !== null && (
              <div className={`mt-6 p-4 rounded-xl text-center font-semibold ${
                isCorrect 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {isCorrect ? (
                  <>
                    <i className="ri-check-line text-2xl mr-2"></i>
                    {t('correct')}
                  </>
                ) : (
                  <>
                    <i className="ri-close-line text-2xl mr-2"></i>
                    {t('wrong')}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
