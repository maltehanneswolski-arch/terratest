import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { GameNavbar } from '@/components/ui/game-navbar';
import { GameStatsBar } from '@/components/feature/game-stats-bar';
import { useGameStats } from '@/lib/gameStats';
import { scoreLine, gradeSquare, gradeEmoji } from '@/lib/shareResult';
import { ShareButtons } from '@/components/feature/share-buttons';
import { RulesModal } from '@/components/feature/rules-modal';
import { landData } from '@/mocks/area-data';
import { COUNTRY_METADATA } from '@/pages/game/data/countryMetadata';
import { getFlagUrl } from '@/lib/countryFlags';
import { BORDERLINE_BORDERS, BorderlineEntry } from './border-data';

const MAX_TRIES = 4;
// One border per day, seeded from the Europe/Brussels date like every other
// daily challenge: everyone gets the same trace, and it rotates at midnight.
const TOTAL_ROUNDS = 1;
const INITIAL_HINT_COUNT = 2;
const MAX_SUGGESTIONS = 8;

function borderPairKey(entry: BorderlineEntry) {
  return [normalizeCountryName(entry.countryA), normalizeCountryName(entry.countryB)].sort().join('::');
}

type AttemptEntry = {
  first: string;
  second: string;
  matched: boolean;
};

type HintTone = 'neutral' | 'success' | 'error';
type ShareMode = 'spoilers' | 'safe';

type CountryMeta = {
  continent: string;
  lat: number;
  lng: number;
};

type FieldKey = 'first' | 'second';

type RoundResult = {
  borderId: string;
  countryA: string;
  countryB: string;
  solved: boolean;
  attemptsUsed: number;
};

const PLAYABLE_BORDERS = Array.from(
  BORDERLINE_BORDERS
    .filter((entry) => entry.pointCount >= 10 && entry.lengthScore >= 0.35)
    .reduce((map, entry) => {
      const key = borderPairKey(entry);
      const existing = map.get(key);
      if (!existing || entry.lengthScore > existing.lengthScore || (entry.lengthScore === existing.lengthScore && entry.pointCount > existing.pointCount)) {
        map.set(key, entry);
      }
      return map;
    }, new Map<string, BorderlineEntry>())
    .values(),
);

const BORDER_COUNTRY_NAMES: string[] = Array.from(
  new Set<string>(PLAYABLE_BORDERS.flatMap((entry) => [entry.countryA, entry.countryB])),
).sort((a, b) => a.localeCompare(b));

const COUNTRY_ALIASES: Record<string, string> = {
  'bosnia': 'Bosnia and Herzegovina',
  'bosnia herzegovina': 'Bosnia and Herzegovina',
  'central african republic': 'Central African Republic',
  'car': 'Central African Republic',
  'cote divoire': 'Ivory Coast',
  'cote d ivoire': 'Ivory Coast',
  'czech republic': 'Czechia',
  'democratic republic of congo': 'Democratic Republic of the Congo',
  'democratic republic of the congo': 'Democratic Republic of the Congo',
  'dr congo': 'Democratic Republic of the Congo',
  'drc': 'Democratic Republic of the Congo',
  'congo kinshasa': 'Democratic Republic of the Congo',
  'ivory coast': 'Ivory Coast',
  'lao pdr': 'Laos',
  'macedonia': 'North Macedonia',
  'north macedonia': 'North Macedonia',
  'palestinian territories': 'Palestine',
  'republic of congo': 'Republic of the Congo',
  'republic of the congo': 'Republic of the Congo',
  'congo brazzaville': 'Republic of the Congo',
  'republic of korea': 'South Korea',
  'south korea': 'South Korea',
  'korea south': 'South Korea',
  'dprk': 'North Korea',
  'north korea': 'North Korea',
  'korea north': 'North Korea',
  'russian federation': 'Russia',
  'south sudan republic': 'South Sudan',
  'state of palestine': 'Palestine',
  'syrian arab republic': 'Syria',
  'timor leste': 'Timor-Leste',
  'united states of america': 'United States',
  'usa': 'United States',
  'us': 'United States',
  'viet nam': 'Vietnam',
};

const METADATA_NAME_ALIASES: Record<string, string> = {
  Czechia: 'Czech Republic',
  'Democratic Republic of the Congo': 'Congo, Democratic Republic of the',
  Iran: 'Iran, Islamic Rep. of',
  'Ivory Coast': "Côte d'Ivoire",
  Laos: "Lao People's Dem. Rep.",
  Libya: 'Libyan Arab Jamahiriya',
  Moldova: 'Moldova, Republic of',
  'North Korea': "Korea, Dem. People's Rep. of",
  'North Macedonia': 'Macedonia, The former Yugoslav Rep. of',
  'Republic of the Congo': 'Congo',
  Russia: 'Russian Federation',
  'South Korea': 'Korea, Republic of',
  'South Sudan': 'South Sudan, The Republic of',
  Sudan: 'Sudan, The Republic of',
  Syria: 'Syrian Arab Republic',
  Tanzania: 'Tanzania, United Republic of',
  Venezuela: 'Venezuela, Bolivarian Rep. of',
  Vietnam: 'Viet Nam',
};

const AREA_NAME_ALIASES: Record<string, string> = {
  Czechia: 'Czech Republic',
};

const MANUAL_COUNTRY_META: Record<string, CountryMeta> = {
  Liechtenstein: { continent: 'Europe', lat: 47.166, lng: 9.555 },
  Palestine: { continent: 'Asia', lat: 31.95, lng: 35.27 },
};

function normalizeCountryName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const LAND_AREA_LOOKUP = new Map<string, number>(landData.map((item) => [item.country, item.landArea]));
const COUNTRY_SEARCH_TOKENS = new Map<string, string[]>();
for (const country of BORDER_COUNTRY_NAMES) {
  const tokens = [normalizeCountryName(country)];
  for (const [alias, mappedCountry] of Object.entries(COUNTRY_ALIASES)) {
    if (mappedCountry === country) {
      tokens.push(alias);
    }
  }
  COUNTRY_SEARCH_TOKENS.set(country, Array.from(new Set(tokens)));
}

function currentDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function hashSeed(seed: string) {
  let hash = 1779033703 ^ seed.length;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return hash >>> 0;
  };
}

function mulberry32(seed: number) {
  // `state` must advance between calls. This previously read
  // `let value = seed + 0x6d2b79f5`, which copies into a local and leaves the
  // closure's seed untouched, so every draw returned an identical number. That
  // made seededShuffle degenerate — a Fisher-Yates driven by one constant
  // fraction — collapsing 249 borders into ~23 distinct daily picks, with
  // Kazakhstan-Russia landing on roughly a third of all days.
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: string) {
  const result = [...items];
  const random = mulberry32(hashSeed(seed)());
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function getCountryMeta(country: string): CountryMeta | null {
  const direct = COUNTRY_METADATA[country as keyof typeof COUNTRY_METADATA];
  if (direct) {
    return { continent: direct.continent, lat: direct.lat, lng: direct.lng };
  }

  const alias = METADATA_NAME_ALIASES[country];
  if (alias) {
    const mapped = COUNTRY_METADATA[alias as keyof typeof COUNTRY_METADATA];
    if (mapped) {
      return { continent: mapped.continent, lat: mapped.lat, lng: mapped.lng };
    }
  }

  return MANUAL_COUNTRY_META[country] ?? null;
}

function getLandArea(country: string): number | null {
  const direct = LAND_AREA_LOOKUP.get(country);
  if (typeof direct === 'number') return direct;

  const alias = AREA_NAME_ALIASES[country] ?? country;
  return LAND_AREA_LOOKUP.get(alias) ?? null;
}

function describeHemisphere(metaA: CountryMeta, metaB: CountryMeta) {
  const latitudeA = metaA.lat >= 0 ? 'Northern' : 'Southern';
  const latitudeB = metaB.lat >= 0 ? 'Northern' : 'Southern';
  const longitudeA = metaA.lng >= 0 ? 'Eastern' : 'Western';
  const longitudeB = metaB.lng >= 0 ? 'Eastern' : 'Western';

  if (latitudeA === latitudeB) {
    return `Both countries are centered in the ${latitudeA} Hemisphere.`;
  }

  if (longitudeA === longitudeB) {
    return `Both countries are centered in the ${longitudeA} Hemisphere.`;
  }

  return 'The two countries sit on opposite sides of the equator or prime meridian.';
}

function describeAreaBucket(area: number) {
  if (area < 1_000) return 'a microstate';
  if (area < 10_000) return 'a very small country';
  if (area < 100_000) return 'a small country';
  if (area < 500_000) return 'a medium-sized country';
  if (area < 1_500_000) return 'a large country';
  if (area < 5_000_000) return 'a very large country';
  return 'a giant country';
}

function approximateRatio(areaA: number, areaB: number) {
  const smaller = Math.min(areaA, areaB);
  const larger = Math.max(areaA, areaB);
  const target = smaller / larger;
  const options: Array<[number, number]> = [];

  for (let left = 1; left <= 7; left += 1) {
    for (let right = left; right <= 8; right += 1) {
      options.push([left, right]);
    }
  }

  let best = options[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const option of options) {
    const ratio = option[0] / option[1];
    const distance = Math.abs(ratio - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = option;
    }
  }

  return `${best[0]}:${best[1]}`;
}

function buildHintDeck(border: BorderlineEntry) {
  const metaA = getCountryMeta(border.countryA);
  const metaB = getCountryMeta(border.countryB);
  const areaA = getLandArea(border.countryA);
  const areaB = getLandArea(border.countryB);
  const candidates: string[] = [];

  if (metaA && metaB) {
    if (metaA.continent === metaB.continent) {
      candidates.push(`Both countries are in ${metaA.continent}.`);
    } else {
      candidates.push(`This border links ${metaA.continent} and ${metaB.continent}.`);
    }
    candidates.push(describeHemisphere(metaA, metaB));
  }

  const revealedLetterCountry = seededShuffle<string>([border.countryA, border.countryB], `${border.id}:letter`)[0];
  candidates.push(`One of the countries starts with “${revealedLetterCountry.charAt(0)}”.`);

  if (areaA !== null && areaB !== null) {
    const focusCountry = seededShuffle<{ name: string; area: number }>([
      { name: border.countryA, area: areaA },
      { name: border.countryB, area: areaB },
    ], `${border.id}:size`)[0];
    candidates.push(`One of the countries is ${describeAreaBucket(focusCountry.area)} by land area.`);
    candidates.push(`Their land areas are roughly in a ${approximateRatio(areaA, areaB)} ratio.`);
  } else if (areaA !== null || areaB !== null) {
    const area = areaA ?? areaB ?? 0;
    candidates.push(`One of the countries is ${describeAreaBucket(area)} by land area.`);
  }

  const unique = Array.from(new Set(candidates));
  return seededShuffle(unique, `${border.id}:hints`);
}

function getRevealedCountry(border: BorderlineEntry) {
  return seededShuffle([border.countryA, border.countryB], `${border.id}:reveal`)[0];
}

function buildSharePayload(dateKey: string, results: RoundResult[]) {
  const solvedCount = results.filter((result) => result.solved).length;
  const tiles = results.map((r) => (r.solved ? gradeSquare(((MAX_TRIES - r.attemptsUsed + 1) / MAX_TRIES) * 100) : '🟥')).join('');

  return {
    game: 'Borderline',
    // With a single round the bar already says everything the tile would, so
    // only append per-round tiles when there is more than one.
    result: TOTAL_ROUNDS > 1
      ? `${scoreLine(solvedCount, TOTAL_ROUNDS)} ${tiles}`
      : `${solvedCount === TOTAL_ROUNDS ? 'solved' : 'missed'} in ${results[0]?.attemptsUsed ?? MAX_TRIES}/${MAX_TRIES} tries ${solvedCount === TOTAL_ROUNDS ? gradeEmoji(((MAX_TRIES - (results[0]?.attemptsUsed ?? MAX_TRIES) + 1) / MAX_TRIES) * 100) : '💀'}`,
    details: [
      `🗓️ Daily ${dateKey}`,
      '',
      ...results.map((result, index) => {
        const status = result.solved ? '✅' : '❌';
        const tries = result.solved ? `${result.attemptsUsed}/${MAX_TRIES} tries` : `missed in ${MAX_TRIES}`;
        return `${status} ${result.countryA} + ${result.countryB} · ${tries}`;
      }),
    ],
    path: '/borderline',
  };
}

function setsMatch(first: string, second: string, targetA: string, targetB: string) {
  return new Set([first, second]).has(targetA) && new Set([first, second]).has(targetB);
}

function hintToneClasses(tone: HintTone) {
  if (tone === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200';
  }
  if (tone === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-200';
  }
  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-700/30 dark:text-slate-200';
}

function getFilteredCountries(query: string, excludeCountry?: string | null) {
  const normalizedQuery = normalizeCountryName(query);
  const filtered = BORDER_COUNTRY_NAMES.filter((country) => {
    if (excludeCountry && country === excludeCountry) return false;
    if (!normalizedQuery) return true;

    const tokens = COUNTRY_SEARCH_TOKENS.get(country) ?? [normalizeCountryName(country)];
    return tokens.some((token) => token.includes(normalizedQuery));
  });

  return filtered.slice(0, MAX_SUGGESTIONS);
}

function CountryBadge({ country, size = 'md' }: { country: string; size?: 'sm' | 'md' }) {
  const flagSize = size === 'sm' ? 'w-5 h-4' : 'w-7 h-5';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 border border-slate-200 dark:border-slate-600 shadow-sm">
      <img src={getFlagUrl(country, size === 'sm' ? 40 : 80)} alt={`${country} flag`} className={`${flagSize} rounded-[2px] object-cover shadow-sm`} />
      <span className={`${textSize} font-medium text-slate-800 dark:text-slate-100`}>{country}</span>
    </div>
  );
}

function BorderPreview({ border }: { border: BorderlineEntry }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Current border</h2>
          <p className="text-slate-600 dark:text-slate-400">
            This trace comes from a real shared country boundary. Name the two countries that touch here.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-700 text-sm font-medium">
          <i className="ri-route-line"></i>
          Border trace
        </div>
      </div>

      <div className="rounded-2xl border border-violet-100 dark:border-violet-900/40 bg-violet-50/50 dark:bg-slate-900/50 p-4">
        <svg viewBox="0 0 800 520" className="h-[320px] w-full" preserveAspectRatio="xMidYMid meet">
          <path
            d={border.path}
            fill="none"
            stroke="currentColor"
            className="text-violet-600 dark:text-violet-400"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

interface CountrySelectCardProps {
  label: string;
  field: FieldKey;
  search: string;
  setSearch: (value: string) => void;
  selectedCountry: string | null;
  onSelectCountry: (country: string) => void;
  onClearCountry: () => void;
  openField: FieldKey | null;
  setOpenField: (field: FieldKey | null) => void;
  excludeCountry?: string | null;
  disabled?: boolean;
}

function CountrySelectCard({
  label,
  field,
  search,
  setSearch,
  selectedCountry,
  onSelectCountry,
  onClearCountry,
  openField,
  setOpenField,
  excludeCountry,
  disabled,
}: CountrySelectCardProps) {
  const suggestions = useMemo(() => getFilteredCountries(search, excludeCountry), [search, excludeCountry]);
  const isOpen = openField === field && !disabled;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 p-3">
        {selectedCountry ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700 px-3 py-2">
            <CountryBadge country={selectedCountry} size="sm" />
            {!disabled ? (
              <button
                type="button"
                onClick={onClearCountry}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-violet-700 dark:text-slate-300 dark:hover:text-violet-300 hover:border-violet-300 dark:hover:border-violet-600 transition-colors"
                aria-label={`Clear ${label}`}
              >
                <i className="ri-close-line"></i>
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setOpenField(field);
                }}
                onFocus={() => setOpenField(field)}
                disabled={disabled}
                placeholder="Search and select a country…"
                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-violet-500 dark:focus:border-violet-400 text-base bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                autoComplete="off"
              />

              {isOpen && suggestions.length > 0 ? (
                <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-2xl shadow-xl max-h-72 overflow-y-auto">
                  {suggestions.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        onSelectCountry(country);
                        setOpenField(null);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 last:border-b-0 flex items-center gap-3"
                    >
                      <img src={getFlagUrl(country, 40)} alt="" className="w-6 h-4 rounded-[2px] object-cover shadow-sm" />
                      <span className="font-medium">{country}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Type to search, then choose from the list. Only selected countries count as guesses.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BorderlinePage() {
  const dailySeed = useMemo(() => `borderline:${currentDateKey()}`, []);
  const dailyBorders = useMemo(
    () => seededShuffle(PLAYABLE_BORDERS, `${dailySeed}:rounds`).slice(0, TOTAL_ROUNDS),
    [dailySeed],
  );

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [firstSearch, setFirstSearch] = useState('');
  const [secondSearch, setSecondSearch] = useState('');
  const [selectedFirst, setSelectedFirst] = useState<string | null>(null);
  const [selectedSecond, setSelectedSecond] = useState<string | null>(null);
  const [openField, setOpenField] = useState<FieldKey | null>(null);
  const [attempts, setAttempts] = useState<AttemptEntry[]>([]);
  const [hintCount, setHintCount] = useState(0);
  const [revealedCountry, setRevealedCountry] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [solved, setSolved] = useState(false);
  const { record: recordRound } = useGameStats('borderline');
  const [feedback, setFeedback] = useState<{ text: string; tone: HintTone } | null>(null);
  const [showRules, setShowRules] = useState(true);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const currentBorder = dailyBorders[currentRoundIndex] ?? dailyBorders[0];
  const dailyDateKey = dailySeed.replace('borderline:', '');


  useEffect(() => {
    setFirstSearch('');
    setSecondSearch('');
    setSelectedFirst(null);
    setSelectedSecond(null);
    setOpenField(null);
    setAttempts([]);
    setHintCount(0);
    setRevealedCountry(null);
    setFinished(false);
    setSolved(false);
    setFeedback(null);
    setShowShareMenu(false);
    setShareFeedback(null);
  }, [currentRoundIndex, currentBorder?.id]);

  const hintDeck = useMemo(() => (currentBorder ? buildHintDeck(currentBorder) : []), [currentBorder]);
  const visibleHints = hintDeck.slice(0, Math.min(hintCount, INITIAL_HINT_COUNT));
  const triesLeft = Math.max(0, MAX_TRIES - attempts.length);
  const challengeComplete = roundResults.length === TOTAL_ROUNDS && finished && currentRoundIndex === TOTAL_ROUNDS - 1;

  const finalizeRound = (didSolve: boolean, attemptsUsed: number) => {
    if (!currentBorder) return;

    setSolved(didSolve);
    setFinished(true);
    // Score = tries remaining, so solving on the first guess scores highest.
    // Keyed on the border id so the round is counted once.
    recordRound(
      { score: didSolve ? MAX_TRIES - attemptsUsed + 1 : 0, maxScore: MAX_TRIES, won: didSolve },
      currentBorder.id,
    );
    setRoundResults((current) => {
      const next = [...current];
      next[currentRoundIndex] = {
        borderId: currentBorder.id,
        countryA: currentBorder.countryA,
        countryB: currentBorder.countryB,
        solved: didSolve,
        attemptsUsed,
      };
      return next;
    });
  };

  const submitGuess = (event: FormEvent) => {
    event.preventDefault();
    if (!currentBorder || finished) return;

    if (!selectedFirst || !selectedSecond) {
      setFeedback({
        text: 'Search and select both countries from the dropdown before submitting.',
        tone: 'error',
      });
      return;
    }

    if (selectedFirst === selectedSecond) {
      setFeedback({
        text: 'Select two different countries.',
        tone: 'error',
      });
      return;
    }

    const alreadyTried = attempts.some((attempt) =>
      setsMatch(selectedFirst, selectedSecond, attempt.first, attempt.second),
    );
    if (alreadyTried) {
      setFeedback({
        text: 'You already tried that pair. Pick a fresh combination.',
        tone: 'error',
      });
      return;
    }

    const matched = setsMatch(selectedFirst, selectedSecond, currentBorder.countryA, currentBorder.countryB);
    const nextAttempts = [...attempts, { first: selectedFirst, second: selectedSecond, matched }];
    setAttempts(nextAttempts);
    setFirstSearch('');
    setSecondSearch('');
    setSelectedFirst(null);
    setSelectedSecond(null);
    setOpenField(null);

    if (matched) {
      finalizeRound(true, nextAttempts.length);
      setFeedback({
        text: nextAttempts.length === 1
          ? 'Perfect. You got it on the first try.'
          : `Correct — solved in ${nextAttempts.length} tries.`,
        tone: 'success',
      });
      return;
    }

    const wrongAttempts = nextAttempts.length;
    if (wrongAttempts >= MAX_TRIES) {
      finalizeRound(false, wrongAttempts);
      setFeedback({
        text: `Out of tries. The border was ${currentBorder.countryA} and ${currentBorder.countryB}.`,
        tone: 'error',
      });
      return;
    }

    if (wrongAttempts === 1) {
      setHintCount(1);
      setFeedback({
        text: `Not quite. You have ${MAX_TRIES - wrongAttempts} tries left, and your first hint is now unlocked.`,
        tone: 'error',
      });
      return;
    }

    if (wrongAttempts === 2) {
      setHintCount(2);
      setFeedback({
        text: `Still not it. You have ${MAX_TRIES - wrongAttempts} tries left, and one more hint just appeared.`,
        tone: 'error',
      });
      return;
    }

    const revealed = getRevealedCountry(currentBorder);
    setHintCount(3);
    setRevealedCountry(revealed);
    setFeedback({
      text: `Last try. One of the two countries is ${revealed}.`,
      tone: 'error',
    });
  };

  const continueToNextRound = () => {
    if (!finished || currentRoundIndex >= TOTAL_ROUNDS - 1) return;
    setCurrentRoundIndex((value) => value + 1);
  };

  const replayDailyChallenge = () => {
    setCurrentRoundIndex(0);
    setRoundResults([]);
    setFirstSearch('');
    setSecondSearch('');
    setSelectedFirst(null);
    setSelectedSecond(null);
    setOpenField(null);
    setAttempts([]);
    setHintCount(0);
    setRevealedCountry(null);
    setFinished(false);
    setSolved(false);
    setFeedback(null);
    setShowShareMenu(false);
    setShareFeedback(null);
  };

  const sharePayload = buildSharePayload(dailyDateKey, roundResults);


  return (
    <div className="app-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-fuchsia-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <GameNavbar currentPath="/borderline" />

      <RulesModal
        open={showRules}
        onClose={() => {
          setShowRules(false);
        }}
        title="How Borderline works"
        icon="ri-route-line"
        iconGradient="from-violet-500 to-purple-600"
        description="Each day brings one real border trace. Search and select the two countries sharing that border. You get four tries, with stronger hints after each miss."
        rules={[
          { icon: 'ri-calendar-check-line', text: 'One border per day, the same for everyone. A new trace unlocks at midnight (Brussels).' },
          { icon: 'ri-search-line', text: 'Search for countries, then select both answers from the dropdowns. Only selected countries count.' },
          { icon: 'ri-lightbulb-flash-line', text: 'After the 1st and 2nd misses, you unlock clue cards. After the 3rd miss, one country is revealed.' },
        ]}
        scoring={[
          { pts: '4', label: 'Tries', sub: 'per border', color: 'purple' },
          { pts: '4', label: 'Tries', sub: 'per border', color: 'yellow' },
          { pts: 'Hints', label: 'Progressive', sub: 'after misses', color: 'green' },
        ]}
        tip="Look for distinctive bends, river-like wiggles, or long straight runs — they often narrow the region quickly."
        ctaLabel="Start the daily challenge"
        ctaGradient="from-violet-500 to-purple-600"
      />

      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2 flex items-center justify-center gap-3">
          <i className="ri-route-line text-violet-600 dark:text-violet-400"></i>
          Borderline
          <i className="ri-earth-line text-violet-600 dark:text-violet-400"></i>
        </h1>
        <p className="text-slate-600 dark:text-slate-400">One real border trace every day. Four tries. Search, select, solve.</p>
        <button
          onClick={() => setShowRules(true)}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 transition-colors cursor-pointer font-medium"
          style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
        >
          <i className="ri-question-line"></i>
          How to play
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 text-center border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400 text-sm mb-2">Tries left</div>
              <div className="text-5xl font-bold text-violet-600 dark:text-violet-400">{triesLeft}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400 text-sm mb-2">Hints unlocked</div>
              <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white mb-2">
                <i className="ri-lightbulb-flash-line text-violet-600 dark:text-violet-400"></i>
                {Math.min(hintCount, 3)} / 3
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Clues unlock after wrong answers, with one country revealed after miss number three.</p>
            </div>
          </div>


          {currentBorder ? <BorderPreview border={currentBorder} /> : null}

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr,0.85fr] gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 text-center">Pick the two countries</h2>
              <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
                Use the search fields, then select one country for each slot from the dropdown suggestions.
              </p>

              <form onSubmit={submitGuess} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CountrySelectCard
                    label="Country 1"
                    field="first"
                    search={firstSearch}
                    setSearch={setFirstSearch}
                    selectedCountry={selectedFirst}
                    onSelectCountry={(country) => {
                      setSelectedFirst(country);
                      setFirstSearch('');
                    }}
                    onClearCountry={() => {
                      setSelectedFirst(null);
                      setFirstSearch('');
                    }}
                    openField={openField}
                    setOpenField={setOpenField}
                    excludeCountry={selectedSecond}
                    disabled={finished}
                  />
                  <CountrySelectCard
                    label="Country 2"
                    field="second"
                    search={secondSearch}
                    setSearch={setSecondSearch}
                    selectedCountry={selectedSecond}
                    onSelectCountry={(country) => {
                      setSelectedSecond(country);
                      setSecondSearch('');
                    }}
                    onClearCountry={() => {
                      setSelectedSecond(null);
                      setSecondSearch('');
                    }}
                    openField={openField}
                    setOpenField={setOpenField}
                    excludeCountry={selectedFirst}
                    disabled={finished}
                  />
                </div>

                {feedback ? (
                  <div className={`rounded-2xl border px-4 py-4 text-sm ${hintToneClasses(feedback.tone)}`}>
                    {feedback.text}
                  </div>
                ) : null}

                {!finished ? (
                  <button
                    type="submit"
                    className="w-full bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 text-white py-3 px-6 rounded-full font-semibold transition-colors shadow-md hover:shadow-lg"
                  >
                    <i className="ri-send-plane-line mr-2"></i>
                    Submit guess
                  </button>
                ) : currentRoundIndex < TOTAL_ROUNDS - 1 ? (
                  <button
                    type="button"
                    onClick={continueToNextRound}
                    className="w-full bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 text-white py-3 px-6 rounded-full font-semibold transition-colors shadow-md hover:shadow-lg"
                  >
                    <i className="ri-arrow-right-line mr-2"></i>
                    Continue to round {currentRoundIndex + 2}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={replayDailyChallenge}
                    className="w-full bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 text-white py-3 px-6 rounded-full font-semibold transition-colors shadow-md hover:shadow-lg"
                  >
                    <i className="ri-refresh-line mr-2"></i>
                    Replay today's challenge
                  </button>
                )}
              </form>

              <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-5">
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">Guess history</div>
                {attempts.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">No guesses yet. Start with your best read of the border shape.</div>
                ) : (
                  <div className="space-y-3">
                    {attempts.map((attempt, index) => (
                      <div key={`${attempt.first}-${attempt.second}-${index}`} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3">
                        <div className="space-y-2">
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Try {index + 1}</div>
                          <div className="flex flex-wrap items-center gap-2">
                            <CountryBadge country={attempt.first} size="sm" />
                            <span className="text-slate-400 dark:text-slate-500 font-semibold">+</span>
                            <CountryBadge country={attempt.second} size="sm" />
                          </div>
                        </div>
                        <div className={`text-sm font-semibold ${attempt.matched ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {attempt.matched ? 'Correct' : 'Miss'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {finished ? (
                <div className={`mt-6 rounded-2xl border px-4 py-4 ${solved ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' : 'border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-900/20'}`}>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-2">
                    {solved ? 'Solved border' : 'Border answer'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CountryBadge country={currentBorder.countryA} size="sm" />
                    <span className="text-slate-400 dark:text-slate-500 font-semibold">+</span>
                    <CountryBadge country={currentBorder.countryB} size="sm" />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <i className="ri-lightbulb-flash-line text-violet-600 dark:text-violet-400"></i>
                  Hints
                </h2>
                <div className="space-y-3">
                  {visibleHints.map((hint, index) => (
                    <div key={hint} className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300 mb-1">Hint {index + 1}</div>
                      <div className="text-sm text-violet-900 dark:text-violet-100">{hint}</div>
                    </div>
                  ))}

                  {revealedCountry ? (
                    <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300 mb-2">Final clue</div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-violet-900 dark:text-violet-100">
                        <span>One of the two countries is</span>
                        <CountryBadge country={revealedCountry} size="sm" />
                      </div>
                    </div>
                  ) : null}

                  {visibleHints.length === 0 && !revealedCountry ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
                      No hints yet. Your first clue appears after the first missed guess.
                    </div>
                  ) : null}
                </div>
              </div>

              {challengeComplete ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <i className="ri-calendar-check-line text-violet-600 dark:text-violet-400"></i>
                        Daily summary
                      </h2>
                      <GameStatsBar gameId="borderline" className="mt-3" />
                    </div>

                    <ShareButtons share={sharePayload} />
                  </div>

                  {shareFeedback ? (
                    <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-200">
                      {shareFeedback}
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {roundResults.map((result, index) => (
                      <div key={result.borderId} className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 px-4 py-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="text-sm font-semibold text-slate-800 dark:text-white">Round {index + 1}</div>
                          <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${result.solved ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {result.solved ? `Solved in ${result.attemptsUsed}` : 'Missed'}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <CountryBadge country={result.countryA} size="sm" />
                          <span className="text-slate-400 dark:text-slate-500 font-semibold">+</span>
                          <CountryBadge country={result.countryB} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
