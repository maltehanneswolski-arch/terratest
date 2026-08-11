import { getCountryCode } from '@/pages/game/data/countryMetadata';
import { percentLine } from '@/lib/shareResult';
import { ShareButtons } from '@/components/feature/share-buttons';

interface City {
  name: string;
  country: string;
  population: number;
}

interface GameResult {
  cities: City[];
  total: number;
  difference: number;
  hasBonusCountry: boolean;
  bonusCountry?: string;
}

interface GameResultProps {
  result: GameResult;
  targetNumber: number;
  onNewGame: () => void;
  /** The day's restriction label, e.g. "South America only" — named in the share headline. */
  restrictionLabel?: string;
}


export function GameResult({ result, targetNumber, onNewGame, restrictionLabel }: GameResultProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };


  const rawAccuracy = Math.abs(result.difference);
  const finalAccuracy = result.hasBonusCountry ? rawAccuracy / 2 : rawAccuracy;
  const accuracyPercentage = ((1 - (finalAccuracy / targetNumber)) * 100).toFixed(2);

  const getAccuracyRating = () => {
    const percentage = parseFloat(accuracyPercentage);
    if (percentage >= 99) return { text: 'Perfect!', color: 'text-emerald-600 dark:text-emerald-400', emoji: '🎯' };
    if (percentage >= 95) return { text: 'Excellent!', color: 'text-green-600 dark:text-green-400', emoji: '⭐' };
    if (percentage >= 90) return { text: 'Great!', color: 'text-red-500 dark:text-red-400', emoji: '👏' };
    if (percentage >= 80) return { text: 'Good!', color: 'text-slate-700 dark:text-slate-300', emoji: '👍' };
    if (percentage >= 70) return { text: 'Not bad!', color: 'text-slate-600 dark:text-slate-400', emoji: '🙂' };
    return { text: 'Keep trying!', color: 'text-slate-500 dark:text-slate-400', emoji: '💪' };
  };

  const rating = getAccuracyRating();

  const sharePayload = {
    game: 'PopStack',
    result: restrictionLabel
      ? `${restrictionLabel} — ${percentLine(parseFloat(accuracyPercentage))}`
      : percentLine(parseFloat(accuracyPercentage)),
    details: [
      `Target: ${formatNumber(targetNumber)}`,
      `My total: ${formatNumber(result.total)} (${result.difference > 0 ? '+' : ''}${formatNumber(result.difference)})`,
      result.hasBonusCountry && '⭐ Bonus claimed — gap halved',
      '',
      'My cities:',
      ...result.cities.map((c) => `🏙️ ${c.name}, ${c.country} — ${formatNumber(c.population)}`),
    ],
    path: '/game',
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">{rating.emoji}</div>
        <h2 className={`text-3xl font-bold ${rating.color} mb-2`}>{rating.text}</h2>
        <div className="text-5xl font-bold text-slate-800 dark:text-white mb-2">
          {accuracyPercentage}%
        </div>
        <p className="text-slate-600 dark:text-slate-400">Accuracy Score</p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Target</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">
              {formatNumber(targetNumber)}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Your Total</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">
              {formatNumber(result.total)}
            </div>
          </div>
        </div>

        <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-600">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Difference</div>
          <div className={`text-xl font-bold ${result.difference > 0 ? 'text-red-500 dark:text-red-400' : result.difference < 0 ? 'text-slate-600 dark:text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {result.difference > 0 ? '+' : ''}{formatNumber(result.difference)}
          </div>
        </div>

        {result.hasBonusCountry && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-center text-amber-600 dark:text-amber-300">
              <i className="ri-star-fill mr-2 text-amber-400"></i>
              <span className="font-semibold">Bonus Applied!</span>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400 text-center mt-2">
              Your accuracy gap was halved from {formatNumber(rawAccuracy)} to {formatNumber(finalAccuracy)}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Your Cities</h3>
        {result.cities.map((city, index) => (
          <div key={index} className="bg-white dark:bg-slate-700 rounded-xl p-4 flex items-center space-x-4 shadow-sm">
            <img 
              src={`https://flagcdn.com/w80/${getCountryCode(city.country)}.png`}
              alt={`${city.country} flag`}
              className="w-12 h-9 object-cover rounded shadow-sm flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800 dark:text-white truncate">{city.name}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 truncate">{city.country}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-slate-800 dark:text-white whitespace-nowrap">
                {formatNumber(city.population)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <ShareButtons share={sharePayload} className="flex-1" />
        <button
          onClick={onNewGame}
          className="flex-1 py-3 px-6 rounded-full font-semibold bg-red-500 hover:bg-red-600 text-white transition-all duration-200 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-refresh-line mr-2"></i>
          New Game
        </button>
      </div>

      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        Come back tomorrow for a new challenge!
      </div>
    </div>
  );
}
