import { ROWS } from '../country-detective/country-detective-data';
import { riceData } from '../../mocks/rice-data';
import { cocaineData } from '../../mocks/cocaine-data';
import { railData } from '../../mocks/rail-data';
import { firearmsData } from '../../mocks/firearms-data';
import { urbanPopulationData } from '../../mocks/urban-population-data';
import { educationSpendingData } from '../../mocks/education-spending-data';
import { disasterRiskData } from '../../mocks/disaster-risk-data';
import { linguisticDiversityData } from '../../mocks/linguistic-diversity-data';
import { landData } from '../../mocks/area-data';
import { IMPORTED_COUNTRY_LISTS } from '@/lib/imported-country-lists';
import { canonicalizeCountry, isPlayableCountryName } from '@/lib/metricData';

export interface WorldOrderCountryData {
  country: string;
  rank: number;
  value: number;
  displayValue: string;
}

export interface WorldOrderMetric {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  higherMeans: string;
  unitHint: string;
  aboveMeansLarger?: boolean;
  data: WorldOrderCountryData[];
}

const HEADERS = [
  'Country',
  'Islands total',
  'Islands inhabited',
  'Land borders length km',
  'No. of distinct land borders',
  'Elevation span',
  'Coastline km',
  'Land area km2',
  'Summer games',
  'Summer gold',
  'Combined games',
  'Combined total',
  'Amphibians Number Species',
  'Amphibians Number Threatened',
  'Amphibians Number Total Endemic',
  'plants Species',
  'plants Threatened',
  'plants Endemic',
  'average yearly temperature',
  'Budhist % Buddhist',
  'No. of Buddhists',
  'No of Christians',
  '% Christian of the Population',
  'Total population',
  'Hindu total',
  'Hindu Percentage of the entire population',
  'Hindu number total',
  'Muslim Population',
  'jewish  population',
  'CO2 Emissions per capita 2023 (tons per year)',
  'CO2 Emissions per capita 2000 (tons per year)',
  '% change from 2000',
  'Global Gender Gap Overall',
  'HDI Change',
  'HDI value',
  'perception mm',
  'press freedome index_TOTAL_PURGE_2025',
  'road network Total',
  'roadnetwork Paved km',
  'road Paved %',
  'road Unpaved km',
  'road Unpaved %',
  'FIFA WordlCup Men Appearances',
  'FIFA WordlCup Men Record streak',
  'Toursist annually',
  'unesco Total sites',
] as const;

type Field = (typeof HEADERS)[number];
const INDEX = Object.fromEntries(HEADERS.map((header, index) => [header, index])) as Record<Field, number>;

const getCell = (row: unknown[], field: Field) => row[INDEX[field]];

const isMissing = (value: unknown) =>
  value == null ||
  value === '' ||
  value === '—' ||
  value === '-' ||
  (typeof value === 'number' && Number.isNaN(value));

const decimalPlaces = (value: number) => {
  const text = String(value);
  const dotIndex = text.indexOf('.');
  return dotIndex === -1 ? 0 : text.length - dotIndex - 1;
};

const stripNotes = (value: string) =>
  value
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const extractNumbers = (value: string) => {
  const clean = stripNotes(value).replace(/−/g, '-');
  return (clean.match(/[-+]?\d[\d,]*(?:\.\d+)?/g) ?? [])
    .map(token => Number(token.replace(/,/g, '')))
    .filter(num => Number.isFinite(num));
};

const average = (numbers: number[]) =>
  numbers.length === 0 ? null : numbers.reduce((sum, num) => sum + num, 0) / numbers.length;

const parseFloatLike = (value: unknown): number | null => {
  if (isMissing(value)) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const numbers = extractNumbers(String(value));
  return numbers.length ? numbers[0] : null;
};

const parseRangeAverage = (value: unknown): number | null => {
  if (isMissing(value)) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const numbers = extractNumbers(String(value));
  if (!numbers.length) return null;
  return average(numbers.slice(0, Math.min(2, numbers.length)));
};

const parseTemperature = (value: unknown): number | null => {
  if (isMissing(value)) return null;
  const text = String(value);
  const match = text.match(/([-+]?\d+(?:\.\d+)?)\s*°C/);
  return match ? Number(match[1]) : parseFloatLike(value);
};

const parseMeters = (value: unknown): number | null => parseFloatLike(value);

const parsePopulation = (value: unknown): number | null => {
  const parsed = parseRangeAverage(value);
  if (parsed == null) return null;
  if (parsed > 0 && parsed < 1000) return parsed * 1000;
  return parsed;
};

const parseOlympicCount = (value: unknown): number | null => {
  const parsed = parseRangeAverage(value);
  if (parsed == null) return null;
  if (parsed > 0 && parsed < 10 && decimalPlaces(parsed) === 3) return parsed * 1000;
  return parsed;
};

const parseTourists = (value: unknown): number | null => {
  const parsed = parseRangeAverage(value);
  if (parsed == null) return null;
  if (parsed > 0 && parsed < 1000) return parsed * 1000;
  return parsed;
};

const parseRatio = (value: unknown): number | null => {
  const parsed = parseFloatLike(value);
  if (parsed == null) return null;
  if (parsed > 1 && parsed <= 100) return parsed / 100;
  return parsed;
};

const formatInteger = (value: number) => Math.round(value).toLocaleString();
const formatOneDecimal = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 1 });
const formatTwoDecimals = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatThreeDecimals = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const formatRatioPercent = (value: number) => `${(value * 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}%`;
const formatSignedPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}%`;

interface MetricSpec {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  higherMeans: string;
  unitHint: string;
  parse: (row: unknown[]) => number | null;
  format: (value: number) => string;
}

const DATASET_METRIC_SPECS: MetricSpec[] = [
  {
    id: 'population',
    label: 'Population',
    shortLabel: 'Population',
    description: 'Total resident population.',
    higherMeans: 'Higher means a larger population.',
    unitHint: 'people',
    parse: row => parsePopulation(getCell(row, 'Total population')),
    format: value => `${formatInteger(value)} people`,
  },
  {
    id: 'elevationSpan',
    label: 'Elevation Span',
    shortLabel: 'Elevation span',
    description: 'Difference between the country’s lowest and highest points.',
    higherMeans: 'Higher means a larger vertical range.',
    unitHint: 'meters',
    parse: row => parseMeters(getCell(row, 'Elevation span')),
    format: value => `${formatInteger(value)} m`,
  },
  {
    id: 'averageTemperature',
    label: 'Average Yearly Temperature',
    shortLabel: 'Average temperature',
    description: 'Long-run average annual temperature.',
    higherMeans: 'Higher means a warmer average climate.',
    unitHint: '°C',
    parse: row => parseTemperature(getCell(row, 'average yearly temperature')),
    format: value => `${formatOneDecimal(value)} °C`,
  },
  {
    id: 'hdi',
    label: 'Human Development Index',
    shortLabel: 'HDI',
    description: 'Composite development score based on health, education, and income.',
    higherMeans: 'Higher means a stronger HDI score.',
    unitHint: 'index score',
    parse: row => parseFloatLike(getCell(row, 'HDI value')),
    format: value => formatThreeDecimals(value),
  },
  {
    id: 'genderGap',
    label: 'Global Gender Gap Score',
    shortLabel: 'Gender gap',
    description: 'Gap-closing score from the World Economic Forum.',
    higherMeans: 'Higher means a stronger gender-gap score.',
    unitHint: 'index score',
    parse: row => parseFloatLike(getCell(row, 'Global Gender Gap Overall')),
    format: value => formatThreeDecimals(value),
  },
  {
    id: 'co2_2023',
    label: 'CO₂ Emissions per Person (2023)',
    shortLabel: 'CO₂ per person',
    description: 'Annual CO₂ emissions per person in 2023.',
    higherMeans: 'Higher means more CO₂ emitted per person.',
    unitHint: 'tons per person',
    parse: row => parseFloatLike(getCell(row, 'CO2 Emissions per capita 2023 (tons per year)')),
    format: value => `${formatTwoDecimals(value)} t/person`,
  },
  {
    id: 'co2_change',
    label: 'CO₂ Change Since 2000',
    shortLabel: 'CO₂ change',
    description: 'Change in CO₂ emissions per person from 2000 to 2023.',
    higherMeans: 'Higher means a larger increase since 2000. Negative values mean a decrease.',
    unitHint: 'percent change',
    parse: row => {
      const now = parseFloatLike(getCell(row, 'CO2 Emissions per capita 2023 (tons per year)'));
      const then = parseFloatLike(getCell(row, 'CO2 Emissions per capita 2000 (tons per year)'));
      if (now == null || then == null || then === 0) return null;
      return ((now - then) / then) * 100;
    },
    format: value => formatSignedPercent(value),
  },
  {
    id: 'summerGames',
    label: 'Summer Olympic Appearances',
    shortLabel: 'Summer Olympics',
    description: 'Number of Summer Olympic Games entered.',
    higherMeans: 'Higher means more Summer Olympic appearances.',
    unitHint: 'appearances',
    parse: row => parseOlympicCount(getCell(row, 'Summer games')),
    format: value => `${formatInteger(value)} appearances`,
  },
  {
    id: 'summerGold',
    label: 'Summer Olympic Gold Medals',
    shortLabel: 'Olympic golds',
    description: 'Gold medals won at the Summer Olympics.',
    higherMeans: 'Higher means more Summer Olympic gold medals.',
    unitHint: 'gold medals',
    parse: row => parseOlympicCount(getCell(row, 'Summer gold')),
    format: value => `${formatInteger(value)} golds`,
  },
  {
    id: 'combinedMedals',
    label: 'Olympic Medals (Summer + Winter)',
    shortLabel: 'Olympic medals',
    description: 'Combined Olympic medal total.',
    higherMeans: 'Higher means more Olympic medals overall.',
    unitHint: 'medals',
    parse: row => parseOlympicCount(getCell(row, 'Combined total')),
    format: value => `${formatInteger(value)} medals`,
  },
  {
    id: 'amphibianSpecies',
    label: 'Recorded Amphibian Species',
    shortLabel: 'Amphibian species',
    description: 'Known amphibian species recorded in the country.',
    higherMeans: 'Higher means more recorded amphibian species.',
    unitHint: 'species',
    parse: row => parseFloatLike(getCell(row, 'Amphibians Number Species')),
    format: value => `${formatInteger(value)} species`,
  },
  {
    id: 'amphibianThreatened',
    label: 'Threatened Amphibian Species',
    shortLabel: 'Threatened amphibians',
    description: 'Amphibian species classified as threatened.',
    higherMeans: 'Higher means more threatened amphibian species.',
    unitHint: 'species',
    parse: row => parseFloatLike(getCell(row, 'Amphibians Number Threatened')),
    format: value => `${formatInteger(value)} species`,
  },
  {
    id: 'amphibianEndemic',
    label: 'Endemic Amphibian Species',
    shortLabel: 'Endemic amphibians',
    description: 'Amphibian species found only there.',
    higherMeans: 'Higher means more endemic amphibian species.',
    unitHint: 'species',
    parse: row => parseFloatLike(getCell(row, 'Amphibians Number Total Endemic')),
    format: value => `${formatInteger(value)} species`,
  },
  {
    id: 'roadPavedShare',
    label: 'Road Network Paved Share',
    shortLabel: 'Paved roads',
    description: 'Share of the road network that is paved.',
    higherMeans: 'Higher means a larger share of roads are paved.',
    unitHint: 'percent paved',
    parse: row => parseRatio(getCell(row, 'road Paved %')),
    format: value => formatRatioPercent(value),
  },
  {
    id: 'roadUnpavedShare',
    label: 'Road Network Unpaved Share',
    shortLabel: 'Unpaved roads',
    description: 'Share of the road network that is unpaved.',
    higherMeans: 'Higher means a larger share of roads are unpaved.',
    unitHint: 'percent unpaved',
    parse: row => parseRatio(getCell(row, 'road Unpaved %')),
    format: value => formatRatioPercent(value),
  },
  {
    id: 'fifaAppearances',
    label: 'Men’s World Cup Appearances',
    shortLabel: 'World Cup appearances',
    description: 'Appearances at the FIFA Men’s World Cup finals.',
    higherMeans: 'Higher means more World Cup appearances.',
    unitHint: 'appearances',
    parse: row => parseFloatLike(getCell(row, 'FIFA WordlCup Men Appearances')),
    format: value => `${formatInteger(value)} appearances`,
  },
  {
    id: 'fifaStreak',
    label: 'Longest Men’s World Cup Streak',
    shortLabel: 'World Cup streak',
    description: 'Longest consecutive appearance streak at the FIFA Men’s World Cup.',
    higherMeans: 'Higher means a longer World Cup streak.',
    unitHint: 'tournaments',
    parse: row => parseFloatLike(getCell(row, 'FIFA WordlCup Men Record streak')),
    format: value => `${formatInteger(value)} tournaments`,
  },
  {
    id: 'tourism',
    label: 'Annual Tourist Arrivals',
    shortLabel: 'Tourism',
    description: 'Reported annual international tourist arrivals.',
    higherMeans: 'Higher means more annual tourist arrivals.',
    unitHint: 'arrivals',
    parse: row => parseTourists(getCell(row, 'Toursist annually')),
    format: value => `${formatInteger(value)} arrivals`,
  },
  {
    id: 'unesco',
    label: 'UNESCO World Heritage Sites',
    shortLabel: 'UNESCO sites',
    description: 'Total UNESCO World Heritage sites.',
    higherMeans: 'Higher means more UNESCO World Heritage sites.',
    unitHint: 'sites',
    parse: row => parseFloatLike(getCell(row, 'unesco Total sites')),
    format: value => `${formatInteger(value)} sites`,
  },
];

function buildDatasetMetric(spec: MetricSpec): WorldOrderMetric {
  const entries = normalizeWorldOrderEntries(
    ROWS
      .map(row => {
        const rawRow = row as unknown[];
        const country = getCell(rawRow, 'Country');
        const value = spec.parse(rawRow);
        if (typeof country !== 'string' || value == null || !Number.isFinite(value)) return null;
        return { country, value, displayValue: spec.format(value) };
      })
      .filter((entry): entry is { country: string; value: number; displayValue: string } => entry !== null),
  );

  return {
    id: spec.id,
    label: spec.label,
    shortLabel: spec.shortLabel,
    description: spec.description,
    higherMeans: spec.higherMeans,
    unitHint: spec.unitHint,
    data: entries,
  };
}

interface LegacyMetricInput<T> {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  higherMeans: string;
  unitHint: string;
  sortAscending?: boolean;
  aboveMeansLarger?: boolean;
  source: T[];
  country: (entry: T) => string;
  value: (entry: T) => number | null | undefined;
  format: (value: number) => string;
}

function buildLegacyMetric<T>(input: LegacyMetricInput<T>): WorldOrderMetric {
  const data = normalizeWorldOrderEntries(
    input.source
      .map(entry => {
        const country = input.country(entry);
        const value = input.value(entry);
        if (!country || value == null || !Number.isFinite(value)) return null;
        return { country, value: Number(value), displayValue: input.format(Number(value)) };
      })
      .filter((entry): entry is { country: string; value: number; displayValue: string } => entry !== null),
  );

  if (input.sortAscending) {
    data.sort((a, b) => a.value - b.value || a.country.localeCompare(b.country));
    data.forEach((entry, index) => {
      entry.rank = index + 1;
    });
  }

  return {
    id: input.id,
    label: input.label,
    shortLabel: input.shortLabel,
    description: input.description,
    higherMeans: input.higherMeans,
    unitHint: input.unitHint,
    aboveMeansLarger: input.aboveMeansLarger,
    data,
  };
}

function formatImportedValue(value: number, unit = '', precision = 0) {
  const formatted = precision > 0
    ? value.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })
    : Math.round(value).toLocaleString();
  return `${formatted}${unit}`;
}

function normalizeWorldOrderEntries(entries: Array<{ country: string; value: number; displayValue: string }>) {
  const deduped = new Map<string, { country: string; value: number; displayValue: string }>();

  for (const entry of entries) {
    if (!Number.isFinite(entry.value) || !isPlayableCountryName(entry.country)) continue;
    const canonical = canonicalizeCountry(entry.country);
    if (!deduped.has(canonical)) {
      deduped.set(canonical, entry);
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) => b.value - a.value || a.country.localeCompare(b.country))
    .map((entry, index) => ({
      country: entry.country,
      rank: index + 1,
      value: entry.value,
      displayValue: entry.displayValue,
    }));
}

const IMPORTED_METRICS: WorldOrderMetric[] = IMPORTED_COUNTRY_LISTS.map((dataset) => ({
  id: dataset.id,
  label: dataset.label,
  shortLabel: dataset.shortLabel,
  description: dataset.description,
  higherMeans: dataset.higherMeans,
  unitHint: dataset.unitHint,
  data: normalizeWorldOrderEntries(
    dataset.values.map((entry) => ({
      country: entry.country,
      value: entry.value,
      displayValue: formatImportedValue(entry.value, dataset.unit, dataset.precision),
    })),
  ),
}));

const LEGACY_METRICS: WorldOrderMetric[] = [
  buildLegacyMetric({
    id: 'landAreaLegacy',
    label: 'Land Area',
    shortLabel: 'Land area',
    description: 'Total land area, using the original site list.',
    higherMeans: 'Higher means a larger land area.',
    unitHint: 'km²',
    source: landData,
    country: entry => entry.country,
    value: entry => entry.landArea,
    format: value => `${formatInteger(value)} km²`,
  }),
  buildLegacyMetric({
    id: 'riceProduction',
    label: 'Rice Production',
    shortLabel: 'Rice',
    description: 'Annual rice production from the original site list.',
    higherMeans: 'Higher means more rice produced.',
    unitHint: 'tonnes',
    source: riceData,
    country: entry => entry.country,
    value: entry => entry.riceTonnes,
    format: value => `${formatInteger(value)} tonnes`,
  }),
  buildLegacyMetric({
    id: 'cocainePrevalence',
    label: 'Cocaine Use Prevalence',
    shortLabel: 'Cocaine',
    description: 'Estimated share of the population using cocaine.',
    higherMeans: 'Higher means a larger share of the population uses cocaine.',
    unitHint: 'percent',
    source: cocaineData,
    country: entry => entry.country,
    value: entry => entry.prevalence,
    format: value => `${formatOneDecimal(value)}%`,
  }),
  buildLegacyMetric({
    id: 'railNetwork',
    label: 'Railway Network Length',
    shortLabel: 'Railways',
    description: 'Total length of the rail network.',
    higherMeans: 'Higher means a longer rail network.',
    unitHint: 'km',
    source: railData,
    country: entry => entry.country,
    value: entry => entry.railKm,
    format: value => `${formatInteger(value)} km`,
  }),
  buildLegacyMetric({
    id: 'civilianFirearms',
    label: 'Civilian Firearms',
    shortLabel: 'Firearms',
    description: 'Estimated number of civilian-owned firearms.',
    higherMeans: 'Higher means more civilian-owned firearms in total.',
    unitHint: 'firearms',
    source: firearmsData,
    country: entry => entry.country,
    value: entry => entry.civilianFirearms,
    format: value => `${formatInteger(value)} firearms`,
  }),
  buildLegacyMetric({
    id: 'urbanShare',
    label: 'Urban Population Share',
    shortLabel: 'Urban share',
    description: 'Share of the population living in urban areas.',
    higherMeans: 'Higher means a larger share of people live in cities.',
    unitHint: 'percent',
    source: urbanPopulationData,
    country: entry => entry.country,
    value: entry => entry.urbanPercentage,
    format: value => `${formatOneDecimal(value)}%`,
  }),
  buildLegacyMetric({
    id: 'educationSpending',
    label: 'Education Spending',
    shortLabel: 'Education',
    description: 'Education spending as a share of GDP.',
    higherMeans: 'Higher means a larger share of GDP is spent on education.',
    unitHint: 'percent of GDP',
    source: educationSpendingData,
    country: entry => entry.country,
    value: entry => entry.percentage,
    format: value => `${formatTwoDecimals(value)}% of GDP`,
  }),
  buildLegacyMetric({
    id: 'disasterRisk',
    label: 'Disaster Risk Index',
    shortLabel: 'Disaster risk',
    description: 'World Risk Index — lower % means a safer country with less disaster exposure.',
    higherMeans: 'Lower % = less disaster risk. Countries ranked above are safer.',
    unitHint: 'risk percent',
    sortAscending: true,
    aboveMeansLarger: false,
    source: disasterRiskData,
    country: entry => entry.country,
    value: entry => entry.riskPercentage,
    format: value => `${formatTwoDecimals(value)}%`,
  }),
  buildLegacyMetric({
    id: 'linguisticDiversity',
    label: 'Linguistic Diversity Index',
    shortLabel: 'Language diversity',
    description: 'Probability that two randomly selected people speak different first languages.',
    higherMeans: 'Higher means greater linguistic diversity.',
    unitHint: 'index score',
    source: linguisticDiversityData,
    country: entry => entry.country,
    value: entry => entry.ldi,
    format: value => formatThreeDecimals(value),
  }),
];

export const WORLD_ORDER_METRICS = [...DATASET_METRIC_SPECS.map(buildDatasetMetric), ...LEGACY_METRICS, ...IMPORTED_METRICS].filter(
  metric => metric.data.length >= 60,
);
