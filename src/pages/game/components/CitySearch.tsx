import { useEffect, useRef, useState } from 'react';
import { CITY_DATABASE } from '@/pages/game/data/cityDatabase';
import { City, RestrictionData } from '@/pages/game/data/gameRules';
import { getCountryCode } from '@/pages/game/data/countryMetadata';

interface CitySearchProps {
  onCitySelect: (city: City) => void;
  restrictionData?: RestrictionData;
  checkRestrictionQualification?: (city: City) => boolean;
}

export function CitySearch({ onCitySelect, restrictionData, checkRestrictionQualification }: CitySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const searchCities = (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    setIsLoading(true);

    const normalizedQuery = query.toLowerCase();
    const filteredCities = CITY_DATABASE
      .map(([name, country, population]) => ({ name, country, population }))
      .filter((city) => {
        const matchesSearch =
          city.name.toLowerCase().includes(normalizedQuery) ||
          city.country.toLowerCase().includes(normalizedQuery);

        const matchesRestriction = checkRestrictionQualification
          ? checkRestrictionQualification(city)
          : true;

        return matchesSearch && matchesRestriction;
      })
      .sort((a, b) => b.population - a.population)
      .slice(0, 3);

    setSearchResults(filteredCities);
    setIsDropdownOpen(true);
    setIsLoading(false);
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchCities(searchTerm);
      }, 200);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
      setIsLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, restrictionData, checkRestrictionQualification]);

  const handleCitySelect = (city: City) => {
    if (checkRestrictionQualification && !checkRestrictionQualification(city)) {
      return;
    }

    onCitySelect(city);
    setSearchTerm('');
    setSearchResults([]);
    setIsDropdownOpen(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Search Cities</h3>

      {restrictionData?.label && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <span className="font-semibold flex items-center gap-1.5"><i className="ri-lock-line"></i> Restriction active:</span>
          <span className="mt-0.5 block">{restrictionData.label}</span>
        </div>
      )}

      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type city name..."
            className="w-full px-4 py-3 pl-12 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
          />
          <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm"></i>
          {isLoading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent"></div>
            </div>
          )}
        </div>

        {isDropdownOpen && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl">
            {searchResults.map((city, index) => (
              <button
                key={`${city.name}-${city.country}-${city.population}-${index}`}
                onClick={() => handleCitySelect(city)}
                className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-600 last:border-b-0 transition-colors first:rounded-t-xl last:rounded-b-xl cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={`https://flagcdn.com/w40/${getCountryCode(city.country)}.png`}
                    alt={`${city.country} flag`}
                    className="w-8 h-6 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-800 dark:text-white">{city.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{city.country}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {isDropdownOpen && searchResults.length === 0 && !isLoading && searchTerm.length >= 2 && (
          <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
            No cities found matching the restriction. Try another name.
          </div>
        )}
      </div>

      <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <i className="ri-information-line text-red-400"></i>
        Search and select 3 cities to make your guess
      </div>
    </div>
  );
}