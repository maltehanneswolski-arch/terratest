import { hdiData } from '@/mocks/hdi-data';
import { landData, waterData } from '@/mocks/area-data';
import { populationData } from '@/mocks/population-data';
import { riceData } from '@/mocks/rice-data';
import { cocaineData } from '@/mocks/cocaine-data';
import { educationSpendingData } from '@/mocks/education-spending-data';
import { disasterRiskData } from '@/mocks/disaster-risk-data';
import { linguisticDiversityData } from '@/mocks/linguistic-diversity-data';
import { firearmsData } from '@/mocks/firearms-data';
import { railData } from '@/mocks/rail-data';
import { urbanPopulationData } from '@/mocks/urban-population-data';
import { COUNTRY_DATA, FACTORS, FACTOR_IDS } from '@/pages/compass/page';
import { ROWS } from '@/pages/country-detective/country-detective-data';
import { COUNTRY_METADATA } from '@/pages/game/data/countryMetadata';
import { IMPORTED_COUNTRY_LISTS } from '@/lib/imported-country-lists';

export interface MetricEntry {
  country: string;
  canonicalCountry: string;
  value: number;
  displayValue: string;
  rank: number;
}

export interface MetricDataset {
  id: string;
  label: string;
  source: 'World Order' | 'Compass' | 'Country Detective' | 'Derived' | 'Imported';
  category: string;
  unit?: string;
  precision?: number;
  description?: string;
  entries: MetricEntry[];
}

const numberFormatter = new Intl.NumberFormat('en-US');

const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'unitedstates',
  unitedstatesofamerica: 'unitedstates',
  us: 'unitedstates',
  uk: 'unitedkingdom',
  uae: 'unitedarabemirates',
  russianfederation: 'russia',
  drcongo: 'democraticrepublicofthecongo',
  congodemocraticrepublic: 'democraticrepublicofthecongo',
  democraticrepublicofcongo: 'democraticrepublicofthecongo',
  congodemocraticrepublicofthe: 'democraticrepublicofthecongo',
  democraticrepublicofthecongo: 'democraticrepublicofthecongo',
  congodemocraticrepublicofthecongo: 'democraticrepublicofthecongo',
  congodemocraticrepublickinshasa: 'democraticrepublicofthecongo',
  republicofthecongo: 'republicofthecongo',
  congorepublic: 'republicofthecongo',
  ivorycoast: 'cotedivoire',
  cotedivoire: 'cotedivoire',
  coteivoire: 'cotedivoire',
  czechrepublic: 'czechia',
  republicofkorea: 'southkorea',
  korea: 'southkorea',
  southkorea: 'southkorea',
  koreasouth: 'southkorea',
  democraticpeoplesrepublicofkorea: 'northkorea',
  koreanorth: 'northkorea',
  burma: 'myanmar',
  capeverde: 'caboverde',
  swaziland: 'eswatini',
  laopeoplesdemocraticrepublic: 'laos',
  laopdr: 'laos',
  easttimor: 'timorleste',
  moldovarepublicof: 'moldova',
  iranislamicrepublicof: 'iran',
  venezuelabolivarianrepublicof: 'venezuela',
  boliviaplurinationalstateof: 'bolivia',
  unitedrepublicoftanzania: 'tanzania',
  syrianarabrepublic: 'syria',
  vietnam: 'vietnam',
  turkiye: 'turkey',
  macedonia: 'northmacedonia',
  bahamasthe: 'bahamas',
  gambiathe: 'gambia',
  congodemrep: 'democraticrepublicofthecongo',
  congorep: 'republicofthecongo',
  egyptarabrep: 'egypt',
  eswatinikingdomof: 'eswatini',
  hongkongsarchina: 'hongkong',
  hongkongchinasar: 'hongkong',
  iranislamicrep: 'iran',
  koreademocraticpeoplesrep: 'northkorea',
  koreademocraticpeoplesrepof: 'northkorea',
  korearep: 'southkorea',
  korearepublicof: 'southkorea',
  koreaSouth: 'southkorea',
  macaosarchina: 'macau',
  micronesiafederatedstatesof: 'federatedstatesofmicronesia',
  micronesiafedsts: 'federatedstatesofmicronesia',
  palestinestateof: 'palestine',
  puertoricous: 'puertorico',
  sintmaartendutchpart: 'sintmaarten',
  somaliafedrep: 'somalia',
  stkittsandnevis: 'saintkittsandnevis',
  stlucia: 'saintlucia',
  stmartinfrenchpart: 'saintmartin',
  stvincentandthegrenadines: 'saintvincentandthegrenadines',
  tanzaniaunitedrepublicof: 'tanzania',
  venezuelarb: 'venezuela',
  virginislandsus: 'unitedstatesvirginislands',
  yemenrep: 'yemen',
};

function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function canonicalizeCountry(country: string) {
  const base = stripDiacritics(country)
    .toLowerCase()
    .replace(/&/g, ' and ');

  // Match on the full name first, parenthetical content retained. Stripping
  // parentheses before the lookup made whole families of aliases unreachable
  // (`korearepublicof`, `congodemocraticrepublicofthe`,
  // `micronesiafederatedstatesof`, ...) and, worse, collapsed distinct
  // countries onto one key: both Korean states reduced to `korea` and both
  // Congos to `congo`, so the deduplication downstream silently discarded
  // whichever appeared second.
  const full = base.replace(/[^a-z0-9]+/g, '');
  const fullAlias = COUNTRY_ALIASES[full];
  if (fullAlias) return fullAlias;

  // Only then fall back to the paren-stripped form, which is what resolves
  // names like "Bolivia (Plurinational State of)" to a plain `bolivia`.
  const stripped = base
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, '');

  return COUNTRY_ALIASES[stripped] ?? stripped;
}

const PLAYABLE_CANONICAL_COUNTRIES = new Set(
  Object.keys(COUNTRY_METADATA).map((country) => canonicalizeCountry(country)),
);

export function isPlayableCountryName(country: string) {
  return PLAYABLE_CANONICAL_COUNTRIES.has(canonicalizeCountry(country));
}

function parseLooseNumber(value: unknown, mode: 'default' | 'temperature' | 'ratio' = 'default'): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? (mode === 'ratio' && value <= 1 ? value * 100 : value) : null;
  }

  if (typeof value !== 'string') return null;

  const cleaned = value
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[−–—]/g, '-')
    .replace(/\u00a0/g, ' ')
    .trim();

  if (!cleaned) return null;

  const matches = cleaned.match(/-?\d[\d,]*(?:\.\d+)?/g);
  if (!matches) return null;

  const numbers = matches
    .map((part) => Number(part.replace(/,/g, '')))
    .filter((part) => Number.isFinite(part));

  if (!numbers.length) return null;

  let result: number;
  if (mode === 'temperature') {
    result = numbers[0];
  } else if (numbers.length === 1) {
    result = numbers[0];
  } else if (cleaned.includes(' to ') || cleaned.includes(' or ')) {
    result = Math.max(...numbers);
  } else if (cleaned.includes('/')) {
    result = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  } else if (cleaned.includes('-')) {
    result = numbers.slice(0, 2).reduce((sum, n) => sum + n, 0) / Math.min(numbers.length, 2);
  } else {
    result = Math.max(...numbers);
  }

  if (mode === 'ratio' && result <= 1) {
    return result * 100;
  }

  return result;
}

export function formatMetricValue(value: number, unit = '', precision = 0) {
  if (!Number.isFinite(value)) return '';
  const formatted = precision > 0
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: precision, maximumFractionDigits: precision }).format(value)
    : numberFormatter.format(Math.round(value));
  return `${formatted}${unit}`;
}

function finalizeMetric(
  id: string,
  label: string,
  source: MetricDataset['source'],
  category: string,
  unit: string | undefined,
  precision: number | undefined,
  description: string | undefined,
  rawEntries: Array<{ country: string; value: number }>,
): MetricDataset | null {
  const deduped = new Map<string, { country: string; value: number }>();

  for (const entry of rawEntries) {
    if (!Number.isFinite(entry.value)) continue;
    const canonicalCountry = canonicalizeCountry(entry.country);
    if (!canonicalCountry || !PLAYABLE_CANONICAL_COUNTRIES.has(canonicalCountry)) continue;
    if (!deduped.has(canonicalCountry)) {
      deduped.set(canonicalCountry, entry);
    }
  }

  const sorted = Array.from(deduped.values())
    .sort((a, b) => (b.value - a.value) || a.country.localeCompare(b.country))
    .map((entry, index) => ({
      country: entry.country,
      canonicalCountry: canonicalizeCountry(entry.country),
      value: entry.value,
      displayValue: formatMetricValue(entry.value, unit, precision),
      rank: index + 1,
    }));

  if (sorted.length < 5) return null;

  return {
    id,
    label,
    source,
    category,
    unit,
    precision,
    description,
    entries: sorted,
  };
}

const worldOrderMetrics = [
  finalizeMetric('hdi', 'Human Development Index', 'World Order', 'Development', undefined, 3, 'UN composite of health, education and income — 0 to 1 scale.', hdiData.map((item) => ({ country: item.country, value: item.hdi }))),
  finalizeMetric('land-area', 'Land area', 'World Order', 'Geography', ' km²', 0, 'Total land area, excluding inland water bodies.', landData.map((item) => ({ country: item.country, value: item.landArea }))),
  finalizeMetric('water-area', 'Water area', 'World Order', 'Geography', ' km²', 0, 'Total inland water surface area including lakes and rivers.', waterData.map((item) => ({ country: item.country, value: item.waterArea }))),
  finalizeMetric('population', 'Population', 'World Order', 'Society', '', 0, 'Total resident population.', populationData.map((item) => ({ country: item.country, value: item.population }))),
  finalizeMetric('rice-production', 'Rice production', 'World Order', 'Agriculture', ' tonnes', 0, 'Annual paddy rice production in metric tonnes.', riceData.map((item) => ({ country: item.country, value: item.riceTonnes }))),
  finalizeMetric('cocaine-prevalence', 'Cocaine prevalence', 'World Order', 'Society', '%', 2, 'Estimated share of adults who used cocaine in the past year.', cocaineData.map((item) => ({ country: item.country, value: item.prevalence }))),
  finalizeMetric('education-spending', 'Education spending', 'World Order', 'Development', '%', 2, 'Government expenditure on education as a percentage of GDP.', educationSpendingData.map((item) => ({ country: item.country, value: item.percentage }))),
  finalizeMetric('disaster-risk', 'Natural disaster risk', 'World Order', 'Climate', '%', 2, 'World Risk Report index — exposure and vulnerability to natural disasters.', disasterRiskData.map((item) => ({ country: item.country, value: item.riskPercentage }))),
  finalizeMetric('linguistic-diversity', 'Linguistic diversity', 'World Order', 'Culture', '', 3, 'Probability that two randomly chosen people speak different native languages (0–1).', linguisticDiversityData.map((item) => ({ country: item.country, value: item.ldi }))),
  finalizeMetric('civilian-firearms', 'Civilian firearms', 'World Order', 'Society', '', 0, 'Estimated total number of firearms held by private civilians.', firearmsData.map((item) => ({ country: item.country, value: item.civilianFirearms }))),
  finalizeMetric('rail-network', 'Rail network length', 'World Order', 'Infrastructure', ' km', 0, 'Total length of the operational railway network.', railData.map((item) => ({ country: item.country, value: item.railKm }))),
  finalizeMetric('urban-population', 'Urban population', 'World Order', 'Society', '', 0, 'Number of people living in cities and towns.', urbanPopulationData.map((item) => ({ country: item.country, value: item.urbanPopulation }))),
  finalizeMetric('urban-population-share', 'Urban population share', 'World Order', 'Society', '%', 1, 'Percentage of the total population classified as urban.', urbanPopulationData.map((item) => ({ country: item.country, value: item.urbanPercentage }))),
].filter(Boolean) as MetricDataset[];

const compassFactorKeys = ['C1_R100', 'T2_R100', 'U1_R100', 'B3_R100', 'R2_R100', 'O3_R100', 'W1_R100', 'V2_R100', 'NBI_R100'] as const;
const compassFactorCategories = [
  'Climate',       // C1 - Temperature comfort
  'Geography',     // T2 - Terrain / mountains
  'Society',       // U1 - Urbanisation
  'Nature',        // B3 - Forest / vegetation
  'Development',   // R2 - Rule of law / safety
  'Culture',       // O3 - Openness / tolerance
  'Geography',     // W1 - Coastline proximity
  'Geography',     // V2 - Geographic size
  'Nature',        // NBI - Biodiversity
];
const compassFactorDescriptions = [
  'Average temperature and thermal comfort across the country. Score from 0 to 100.',
  'Presence of mountains, highlands and varied terrain. Score from 0 to 100.',
  'Level of urbanisation and access to city infrastructure. Score from 0 to 100.',
  'Forest and vegetation coverage across the land area. Score from 0 to 100.',
  'Quality of the justice system, safety and rule of law. Score from 0 to 100.',
  'Openness index — tolerance, globalisation and freedom. Score from 0 to 100.',
  'Proximity to coastlines and navigable ocean waters. Score from 0 to 100.',
  'Geographic size and sense of open space. Score from 0 to 100.',
  'National Biodiversity Index — variety of native species. Score from 0 to 100.',
];

const compassMetrics = FACTORS.map((label, index) => finalizeMetric(
  `compass-${FACTOR_IDS[index]}`,
  `Compass: ${label}`,
  'Compass',
  compassFactorCategories[index],
  '',
  1,
  compassFactorDescriptions[index],
  COUNTRY_DATA.map((country) => ({
    country: country.Country,
    value: country[compassFactorKeys[index]],
  })),
)).filter(Boolean) as MetricDataset[];

type DetectiveMetricDef = {
  id: string;
  label: string;
  category: string;
  index?: number;
  unit?: string;
  precision?: number;
  description?: string;
  parser?: (row: unknown[]) => number | null;
};

const detectiveMetricDefs: DetectiveMetricDef[] = [
  { id: 'det-islands', label: 'Islands', category: 'Geography', index: 1, description: 'Total number of islands that make up the country.' },
  { id: 'det-inhabited-islands', label: 'Inhabited islands', category: 'Geography', index: 2, description: 'Number of permanently inhabited islands.' },
  { id: 'det-border-length', label: 'Land-border length', category: 'Geography', index: 3, unit: ' km', description: 'Total length of all land borders with neighbouring countries.' },
  { id: 'det-neighbour-count', label: 'Neighbouring countries', category: 'Geography', index: 4, description: 'Number of countries that share a land border.' },
  { id: 'det-elevation-span', label: 'Elevation span', category: 'Geography', index: 5, unit: ' m', description: 'Difference in metres between the highest and lowest points.' },
  { id: 'det-coastline', label: 'Coastline', category: 'Geography', index: 6, unit: ' km', description: 'Total length of the coastline including islands.' },
  { id: 'det-detective-land-area', label: 'Land area', category: 'Geography', index: 7, unit: ' km²', description: 'Total land area in square kilometres.' },
  { id: 'det-summer-olympics', label: 'Summer Olympic appearances', category: 'Sports', index: 8, description: 'Number of Summer Olympic Games the country has participated in.' },
  { id: 'det-summer-gold', label: 'Summer Olympic gold medals', category: 'Sports', index: 9, description: 'Total gold medals won at Summer Olympic Games.' },
  { id: 'det-olympic-appearances', label: 'Olympic appearances (all Games)', category: 'Sports', index: 10, description: 'Total appearances across all Summer and Winter Olympic Games.' },
  { id: 'det-olympic-medals', label: 'Total Olympic medals', category: 'Sports', index: 11, description: 'Combined gold, silver and bronze medals across all Olympic Games.' },
  { id: 'det-amphibian-species', label: 'Amphibian species', category: 'Nature', index: 12, description: 'Total number of amphibian species (frogs, salamanders, etc.) recorded.' },
  { id: 'det-threatened-amphibians', label: 'Threatened amphibians', category: 'Nature', index: 13, description: 'Number of amphibian species classified as threatened or endangered.' },
  { id: 'det-endemic-amphibians', label: 'Endemic amphibians', category: 'Nature', index: 14, description: 'Amphibian species found naturally nowhere else on Earth.' },
  { id: 'det-plant-species', label: 'Documented plant species', category: 'Nature', index: 15, description: 'Total number of documented native vascular plant species.' },
  { id: 'det-threatened-plants', label: 'Threatened plant species', category: 'Nature', index: 16, description: 'Native plant species classified as threatened or endangered.' },
  { id: 'det-endemic-plants', label: 'Endemic plant species', category: 'Nature', index: 17, description: 'Plant species that exist nowhere else in the world.' },
  { id: 'det-temperature', label: 'Average temperature', category: 'Climate', index: 18, unit: ' °C', precision: 2, description: 'Long-term annual average surface temperature.', parser: (row) => parseLooseNumber(row[18], 'temperature') },
  { id: 'det-buddhist-share', label: 'Buddhist share', category: 'Religion', index: 19, unit: '%', precision: 2, description: 'Share of the population identifying as Buddhist.' },
  { id: 'det-buddhist-pop', label: 'Buddhist population', category: 'Religion', index: 20, description: 'Estimated number of Buddhist adherents.' },
  { id: 'det-christian-pop', label: 'Christian population', category: 'Religion', index: 21, description: 'Estimated number of Christian adherents.' },
  { id: 'det-christian-share', label: 'Christian share', category: 'Religion', index: 22, unit: '%', precision: 2, description: 'Share of the population identifying as Christian.' },
  { id: 'det-detective-population', label: 'Population', category: 'Society', index: 23, description: 'Total resident population.' },
  { id: 'det-hindu-pop', label: 'Hindu population', category: 'Religion', description: 'Estimated number of Hindu adherents.', parser: (row) => parseLooseNumber(row[24]) ?? parseLooseNumber(row[26]) },
  { id: 'det-hindu-share', label: 'Hindu share', category: 'Religion', index: 25, unit: '%', precision: 2, description: 'Share of the population identifying as Hindu.' },
  { id: 'det-muslim-pop', label: 'Muslim population', category: 'Religion', index: 27, description: 'Estimated number of Muslim adherents.' },
  { id: 'det-jewish-pop', label: 'Jewish population', category: 'Religion', index: 28, description: 'Estimated number of Jewish adherents.' },
  { id: 'det-co2-2023', label: 'CO₂ emissions per person (2023)', category: 'Development', index: 29, unit: ' t/person', precision: 2, description: 'Carbon dioxide emissions per capita in 2023, in tonnes.' },
  { id: 'det-co2-2000', label: 'CO₂ emissions per person (2000)', category: 'Development', index: 30, unit: ' t/person', precision: 2, description: 'Carbon dioxide emissions per capita in 2000, in tonnes.' },
  { id: 'det-gender-gap', label: 'Gender-gap score', category: 'Society', index: 32, precision: 3, description: 'World Economic Forum Gender Gap Index — 0 (full gap) to 1 (full parity).' },
  { id: 'det-detective-hdi', label: 'Human Development Index', category: 'Development', index: 34, precision: 3, description: 'UN Human Development Index — composite of health, education and income (0–1).' },
  { id: 'det-rainfall', label: 'Annual rainfall', category: 'Climate', index: 35, unit: ' mm', description: 'Average annual precipitation in millimetres.' },
  { id: 'det-road-length', label: 'Total road length', category: 'Infrastructure', index: 37, unit: ' km', description: 'Total length of all road types combined.' },
  { id: 'det-paved-roads', label: 'Paved roads', category: 'Infrastructure', index: 38, unit: ' km', description: 'Total length of surfaced (paved) roads.' },
  { id: 'det-paved-share', label: 'Roads that are paved', category: 'Infrastructure', index: 39, unit: '%', precision: 1, description: 'Percentage of the total road network that is paved.', parser: (row) => parseLooseNumber(row[39], 'ratio') },
  { id: 'det-unpaved-roads', label: 'Unpaved roads', category: 'Infrastructure', index: 40, unit: ' km', description: 'Total length of unsurfaced (dirt or gravel) roads.' },
  { id: 'det-unpaved-share', label: 'Roads that are unpaved', category: 'Infrastructure', index: 41, unit: '%', precision: 1, description: 'Percentage of the total road network that is unpaved.', parser: (row) => parseLooseNumber(row[41], 'ratio') },
  { id: 'det-world-cup-appearances', label: "Men's World Cup appearances", category: 'Sports', index: 42, description: 'Number of times the national team has qualified for a FIFA World Cup.' },
  { id: 'det-world-cup-streak', label: 'Longest World Cup streak', category: 'Sports', index: 43, description: 'Longest consecutive run of FIFA World Cup qualifications.' },
  { id: 'det-tourist-arrivals', label: 'Annual tourist arrivals', category: 'Culture', index: 44, description: 'Number of international tourist arrivals per year.' },
  { id: 'det-unesco-sites', label: 'UNESCO World Heritage sites', category: 'Culture', index: 45, description: 'Number of sites inscribed on the UNESCO World Heritage List.' },
];

const detectiveMetrics = detectiveMetricDefs
  .map((def) => {
    const rawEntries = ROWS.map((row) => {
      const rowArray = row as unknown[];
      const country = String(rowArray[0] ?? '').trim();
      const value = def.parser
        ? def.parser(rowArray)
        : parseLooseNumber(typeof def.index === 'number' ? rowArray[def.index] : null);
      return { country, value };
    }).filter((entry): entry is { country: string; value: number } => !!entry.country && entry.value !== null && Number.isFinite(entry.value));

    return finalizeMetric(
      def.id,
      def.label,
      'Country Detective',
      def.category,
      def.unit,
      def.precision,
      def.description,
      rawEntries,
    );
  })
  .filter(Boolean) as MetricDataset[];

const importedMetrics = IMPORTED_COUNTRY_LISTS.map((dataset) => finalizeMetric(
  dataset.id,
  dataset.label,
  'Imported',
  dataset.category,
  dataset.unit,
  dataset.precision,
  dataset.description,
  dataset.values,
)).filter(Boolean) as MetricDataset[];

const derivedMetrics = [
  finalizeMetric(
    'latitude',
    'Latitude',
    'Derived',
    'Geography',
    '°',
    2,
    'Geographic centre latitude — higher values mean further north, negative means southern hemisphere.',
    Object.entries(COUNTRY_METADATA).map(([country, meta]) => ({ country, value: meta.lat })),
  ),
].filter(Boolean) as MetricDataset[];


export function getMeaningfulDifference(metric: MetricDataset, valueA: number, valueB = valueA) {
  const average = Math.max(Math.abs(valueA), Math.abs(valueB), 1);

  if ((metric.unit ?? '') === '%') return 4;
  if ((metric.unit ?? '').includes('°C')) return 3;
  if ((metric.unit ?? '').includes('t/person')) return 0.75;
  if ((metric.precision ?? 0) >= 3 && average <= 1.5) return 0.05;

  if (average < 10) return 2;
  if (average < 50) return 4;
  if (average < 100) return 8;
  if (average < 1000) return 25;
  if (average < 10000) return 250;

  return Math.max(500, average * 0.12);
}

export function publicMetricLabel(label: string) {
  return label
    .replace(/ \(detective\)$/i, '')
    .replace(/^Compass:\s*/i, '');
}

export const ALL_METRIC_DATASETS: MetricDataset[] = [
  ...worldOrderMetrics,
  ...compassMetrics,
  ...detectiveMetrics,
  ...importedMetrics,
  ...derivedMetrics,
].sort((a, b) => a.label.localeCompare(b.label));

export function getMetricById(metricId: string) {
  return ALL_METRIC_DATASETS.find((metric) => metric.id === metricId) ?? null;
}

export function getCountryMetricPool() {
  const pool = new Map<string, { country: string; canonicalCountry: string; metrics: Array<{ datasetId: string; label: string; value: number; displayValue: string; source: string; category: string }> }>();

  for (const dataset of ALL_METRIC_DATASETS) {
    for (const entry of dataset.entries) {
      const canonicalCountry = entry.canonicalCountry;
      if (!pool.has(canonicalCountry)) {
        pool.set(canonicalCountry, { country: entry.country, canonicalCountry, metrics: [] });
      }
      pool.get(canonicalCountry)!.metrics.push({
        datasetId: dataset.id,
        label: dataset.label,
        value: entry.value,
        displayValue: entry.displayValue,
        source: dataset.source,
        category: dataset.category,
      });
    }
  }

  return pool;
}
