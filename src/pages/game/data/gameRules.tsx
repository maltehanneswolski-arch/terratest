import { CITY_DATABASE } from '@/pages/game/data/cityDatabase';
import {
  getCountryCode,
  getCountryContinent,
  isCountryInEasternHemisphere,
  isCountryInNorthernHemisphere,
  isCountryInSouthernHemisphere,
  isCountryInWesternHemisphere,
} from '@/pages/game/data/countryMetadata';

export interface City {
  name: string;
  country: string;
  population: number;
}

export interface BonusData {
  id: string;
  type: 'country' | 'continent' | 'population' | 'city-name' | 'country-name';
  value: string;
  label: string;
  description: string;
  flag?: string;
}

export interface RestrictionData {
  id: string;
  type: 'continent' | 'population' | 'hemisphere' | 'city-name' | 'country-name';
  value: string;
  label: string;
  icon: string;
  description: string;
}

interface BonusTemplate {
  id: string;
  type: BonusData['type'];
  label: string;
  icon: string;
  description: string;
  matches: (city: City) => boolean;
}

interface RestrictionTemplate {
  id: string;
  type: RestrictionData['type'];
  value: string;
  label: string;
  icon: string;
  description: string;
  matches: (city: City) => boolean;
}

export const ALL_CITIES: City[] = CITY_DATABASE.map(([name, country, population]) => ({
  name,
  country,
  population,
}));

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const normalizedLettersOnly = (value: string): string => normalizeText(value).replace(/[^a-z]/g, '');

const isSingleWordCity = (city: City): boolean => !city.name.trim().includes(' ');

const getCityNameLetters = (city: City): string => normalizedLettersOnly(city.name);

const bonusTemplates: BonusTemplate[] = [
  {
    id: 'population-below-2m',
    type: 'population',
    label: 'Below 2M',
    icon: '📉',
    description: 'Use a city below 2,000,000 population',
    matches: (city) => city.population < 2_000_000,
  },
  {
    id: 'population-above-10m',
    type: 'population',
    label: 'Above 10M',
    icon: '📈',
    description: 'Use a city above 10,000,000 population',
    matches: (city) => city.population > 10_000_000,
  },
  {
    id: 'city-starts-b',
    type: 'city-name',
    label: 'Starts with B',
    icon: '🅱️',
    description: 'Use a city starting with B',
    matches: (city) => getCityNameLetters(city).startsWith('b'),
  },
  {
    id: 'city-starts-vowel',
    type: 'city-name',
    label: 'Starts with a vowel',
    icon: '🔤',
    description: 'Use a city starting with A, E, I, O, or U',
    matches: (city) => /^[aeiou]/.test(getCityNameLetters(city)),
  },
  {
    id: 'city-name-long',
    type: 'city-name',
    label: '10+ letters',
    icon: '🔠',
    description: 'Use a city name with 10 or more letters',
    matches: (city) => getCityNameLetters(city).length >= 10,
  },
  {
    id: 'city-name-short',
    type: 'city-name',
    label: '6 or fewer letters',
    icon: '↔️',
    description: 'Use a city name with 6 or fewer letters',
    matches: (city) => getCityNameLetters(city).length <= 6,
  },
  {
    id: 'city-multi-word',
    type: 'city-name',
    label: 'Multi-word city',
    icon: '🏙️',
    description: 'Use a city with a multi-word name',
    matches: (city) => city.name.trim().includes(' '),
  },
  {
    id: 'city-double-letter',
    type: 'city-name',
    label: 'Double letter',
    icon: '🔁',
    description: 'Use a city name with a repeated letter',
    matches: (city) => /(.)\1/.test(getCityNameLetters(city)),
  },
  {
    id: 'city-ends-a',
    type: 'city-name',
    label: 'Ends with A',
    icon: '🅰️',
    description: 'Use a city ending with A',
    matches: (city) => getCityNameLetters(city).endsWith('a'),
  },
  {
    id: 'country-starts-h',
    type: 'country-name',
    label: 'Country starts with H',
    icon: '🇭',
    description: 'Use a city in a country starting with H',
    matches: (city) => normalizedLettersOnly(city.country).startsWith('h'),
  },
  {
    id: 'country-contains-land',
    type: 'country-name',
    label: 'Country contains “land”',
    icon: '🏳️',
    description: 'Use a city in a country containing “land”',
    matches: (city) => normalizeText(city.country).includes('land'),
  },
  {
    id: 'continent-europe',
    type: 'continent',
    label: 'Europe',
    icon: '🌍',
    description: 'Use a city in Europe',
    matches: (city) => getCountryContinent(city.country) === 'Europe',
  },
  {
    id: 'continent-africa',
    type: 'continent',
    label: 'Africa',
    icon: '🌍',
    description: 'Use a city in Africa',
    matches: (city) => getCountryContinent(city.country) === 'Africa',
  },
  {
    id: 'continent-asia',
    type: 'continent',
    label: 'Asia',
    icon: '🌏',
    description: 'Use a city in Asia',
    matches: (city) => getCountryContinent(city.country) === 'Asia',
  },
  {
    id: 'country-dynamic',
    type: 'country',
    label: 'Country bonus',
    icon: '🏳️',
    description: 'Use a city from a compatible country',
    matches: () => true,
  },
];

const restrictionTemplates: RestrictionTemplate[] = [
  {
    id: 'continent-europe-only',
    type: 'continent',
    value: 'Europe',
    label: 'Europe only',
    icon: '🌍',
    description: 'Only cities in Europe can be selected',
    matches: (city) => getCountryContinent(city.country) === 'Europe',
  },
  {
    id: 'continent-africa-only',
    type: 'continent',
    value: 'Africa',
    label: 'Africa only',
    icon: '🌍',
    description: 'Only cities in Africa can be selected',
    matches: (city) => getCountryContinent(city.country) === 'Africa',
  },
  {
    id: 'continent-asia-only',
    type: 'continent',
    value: 'Asia',
    label: 'Asia only',
    icon: '🌏',
    description: 'Only cities in Asia can be selected',
    matches: (city) => getCountryContinent(city.country) === 'Asia',
  },
  {
    id: 'continent-north-america-only',
    type: 'continent',
    value: 'North America',
    label: 'North America only',
    icon: '🌎',
    description: 'Only cities in North America can be selected',
    matches: (city) => getCountryContinent(city.country) === 'North America',
  },
  {
    id: 'continent-south-america-only',
    type: 'continent',
    value: 'South America',
    label: 'South America only',
    icon: '🌎',
    description: 'Only cities in South America can be selected',
    matches: (city) => getCountryContinent(city.country) === 'South America',
  },
  {
    id: 'continent-oceania-only',
    type: 'continent',
    value: 'Oceania',
    label: 'Oceania only',
    icon: '🌏',
    description: 'Only cities in Oceania can be selected',
    matches: (city) => getCountryContinent(city.country) === 'Oceania',
  },
  {
    id: 'hemisphere-northern-only',
    type: 'hemisphere',
    value: 'Northern Hemisphere',
    label: 'Northern Hemisphere only',
    icon: '🧭',
    description: 'Only cities in countries centered in the Northern Hemisphere can be selected',
    matches: (city) => isCountryInNorthernHemisphere(city.country),
  },
  {
    id: 'hemisphere-southern-only',
    type: 'hemisphere',
    value: 'Southern Hemisphere',
    label: 'Southern Hemisphere only',
    icon: '🧭',
    description: 'Only cities in countries centered in the Southern Hemisphere can be selected',
    matches: (city) => isCountryInSouthernHemisphere(city.country),
  },
  {
    id: 'hemisphere-western-only',
    type: 'hemisphere',
    value: 'Western Hemisphere',
    label: 'Western Hemisphere only',
    icon: '🧭',
    description: 'Only cities in countries centered in the Western Hemisphere can be selected',
    matches: (city) => isCountryInWesternHemisphere(city.country),
  },
  {
    id: 'hemisphere-eastern-only',
    type: 'hemisphere',
    value: 'Eastern Hemisphere',
    label: 'Eastern Hemisphere only',
    icon: '🧭',
    description: 'Only cities in countries centered in the Eastern Hemisphere can be selected',
    matches: (city) => isCountryInEasternHemisphere(city.country),
  },
  {
    id: 'country-starts-h-only',
    type: 'country-name',
    value: 'H',
    label: 'Countries starting with H only',
    icon: '🇭',
    description: 'Only cities in countries starting with H can be selected',
    matches: (city) => normalizedLettersOnly(city.country).startsWith('h'),
  },
  {
    id: 'country-contains-a-only',
    type: 'country-name',
    value: 'A',
    label: 'Countries containing A only',
    icon: '🔤',
    description: 'Only cities in countries containing A can be selected',
    matches: (city) => normalizedLettersOnly(city.country).includes('a'),
  },
  {
    id: 'city-single-word-only',
    type: 'city-name',
    value: 'single-word',
    label: 'Single-word cities only',
    icon: '🏙️',
    description: 'Only single-word city names can be selected',
    matches: (city) => isSingleWordCity(city),
  },
  {
    id: 'population-under-5m-only',
    type: 'population',
    value: '5000000',
    label: 'Cities under 5M only',
    icon: '📉',
    description: 'Only cities below 5,000,000 population can be selected',
    matches: (city) => city.population < 5_000_000,
  },
  {
    id: 'population-above-3m-only',
    type: 'population',
    value: '3000000',
    label: 'Cities above 3M only',
    icon: '📈',
    description: 'Only cities above 3,000,000 population can be selected',
    matches: (city) => city.population > 3_000_000,
  },
];

export const cityMatchesRestriction = (city: City, restriction: RestrictionData): boolean => {
  const template = restrictionTemplates.find((candidate) => candidate.id === restriction.id);
  return template ? template.matches(city) : true;
};

export const cityMatchesBonus = (city: City, bonus: BonusData): boolean => {
  if (bonus.id === 'country-dynamic') {
    return city.country === bonus.value;
  }

  const template = bonusTemplates.find((candidate) => candidate.id === bonus.id);
  return template ? template.matches(city) : false;
};

const getEligibleCitiesForRestriction = (restriction: RestrictionData): City[] =>
  ALL_CITIES.filter((city) => cityMatchesRestriction(city, restriction));


const stableIndex = (seed: number, length: number, multiplier = 1): number => {
  if (length <= 0) return 0;
  return Math.abs(Math.floor(seed * multiplier)) % length;
};

const isRedundantBonusForRestriction = (bonus: BonusTemplate, restriction: RestrictionData): boolean => {
  if (restriction.id === 'country-starts-h-only' && bonus.id === 'country-starts-h') {
    return true;
  }

  if (
    restriction.type === 'continent' &&
    bonus.type === 'continent' &&
    bonus.id.includes(restriction.value.toLowerCase())
  ) {
    return true;
  }

  return false;
};


export const generateRestriction = (seed: number): RestrictionData => {
  const viableRestrictions = restrictionTemplates.filter((restriction) => {
    const eligibleCityCount = ALL_CITIES.reduce(
      (count, city) => count + (restriction.matches(city) ? 1 : 0),
      0,
    );
    return eligibleCityCount >= 3;
  });

  const restrictionIndex = stableIndex(seed, viableRestrictions.length, 17);
  const selectedRestriction = viableRestrictions[restrictionIndex];

  return {
    id: selectedRestriction.id,
    type: selectedRestriction.type,
    value: selectedRestriction.value,
    label: selectedRestriction.label,
    icon: selectedRestriction.icon,
    description: selectedRestriction.description,
  };
};

export const generateCompatibleBonus = (seed: number, restriction: RestrictionData): BonusData => {
  const eligibleCities = getEligibleCitiesForRestriction(restriction);
  const compatibleBonuses = bonusTemplates.filter((bonus) => {
    if (bonus.id === 'country-dynamic') {
      return new Set(eligibleCities.map((city) => city.country)).size > 0;
    }

    return eligibleCities.some((city) => bonus.matches(city));
  });

  const curatedBonuses = compatibleBonuses.filter((bonus) => !isRedundantBonusForRestriction(bonus, restriction));
  const bonusPool = curatedBonuses.length > 0 ? curatedBonuses : compatibleBonuses;
  const bonusIndex = stableIndex(seed + compatibleBonuses.length, bonusPool.length, 23);
  const selectedBonus = bonusPool[bonusIndex];

  if (selectedBonus.id === 'country-dynamic') {
    const countries = Array.from(new Set(eligibleCities.map((city) => city.country))).sort();
    const countryIndex = stableIndex(seed + countries.length, countries.length, 31);
    const selectedCountry = countries[countryIndex];

    return {
      id: 'country-dynamic',
      type: 'country',
      value: selectedCountry,
      label: selectedCountry,
      description: `Use a city from ${selectedCountry}`,
      flag: `https://flagcdn.com/w80/${getCountryCode(selectedCountry)}.png`,
    };
  }

  return {
    id: selectedBonus.id,
    type: selectedBonus.type,
    value: selectedBonus.id,
    label: selectedBonus.label,
    description: selectedBonus.description,
    flag: selectedBonus.icon,
  };
};

export const seededRandom = (seed: number): number => {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
};
