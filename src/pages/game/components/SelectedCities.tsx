import { BonusData, City } from '@/pages/game/data/gameRules';
import { getCountryCode } from '@/pages/game/data/countryMetadata';

interface SelectedCitiesProps {
  cities: City[];
  onRemoveCity: (city: City) => void;
  onSubmitGuess: () => void;
  bonusData: BonusData;
  checkBonusQualification: (city: City) => boolean;
}

export function SelectedCities({ cities, onRemoveCity, onSubmitGuess, bonusData, checkBonusQualification }: SelectedCitiesProps) {
  const hasBonusCity = cities.some((city) => checkBonusQualification(city));

  return (
    <div className="space-y-4">
      {hasBonusCity && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-center text-amber-700 dark:text-amber-300">
            <i className="ri-star-fill mr-2 text-amber-400"></i>
            <span className="font-semibold text-sm">Bonus Active!</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{bonusData.description} — your accuracy gap will be halved!</p>
        </div>
      )}

      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Selected Cities ({cities.length}/3)</h3>

      <div className="space-y-3">
        {cities.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl">
            <i className="ri-map-pin-line text-3xl mb-2"></i>
            <p className="font-medium">No cities selected yet</p>
            <p className="text-sm">Search and select 3 cities</p>
          </div>
        ) : (
          cities.map((city, index) => (
            <div
              key={`${city.name}-${city.country}-${index}`}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={`https://flagcdn.com/w40/${getCountryCode(city.country)}.png`}
                  alt={`${city.country} flag`}
                  className="w-8 h-6 object-cover rounded"
                />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                    {city.name}
                    {checkBonusQualification(city) && <i className="ri-star-fill text-amber-400 text-sm"></i>}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{city.country}</div>
                </div>
              </div>
              <button
                onClick={() => onRemoveCity(city)}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
          ))
        )}
      </div>

      <button
        onClick={onSubmitGuess}
        disabled={cities.length !== 3}
        className={`w-full py-3 px-6 rounded-full font-semibold transition-all duration-200 whitespace-nowrap ${
          cities.length === 3
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
        }`}
      >
        {cities.length === 3 ? 'Submit Guess' : `Select ${3 - cities.length} more ${3 - cities.length === 1 ? 'city' : 'cities'}`}
      </button>
    </div>
  );
}