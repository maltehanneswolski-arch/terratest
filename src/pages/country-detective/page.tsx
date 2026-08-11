'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { GameNavbar } from '@/components/ui/game-navbar';
import { ROWS } from './country-detective-data';
import { META } from './country-detective-meta';
import { RulesModal } from '@/components/feature/rules-modal';
import { GameStatsBar } from '@/components/feature/game-stats-bar';
import { useGameStats } from '@/lib/gameStats';
import { scoreLine } from '@/lib/shareResult';
import { ShareButtons } from '@/components/feature/share-buttons';
import { canonicalizeCountry, getCountryMetricPool, getMetricById, isPlayableCountryName, publicMetricLabel } from '@/lib/metricData';

type V = string | number | null;
type Row = readonly V[];
type MetaRow = readonly [string, string, string, string, number, string, string];
type MetricClue = {
  key: string;
  icon: string;
  label: string;
  description: string;
  category: string;
  value: string;
  group?: string;
};
type BonusHint = { level: 1 | 2; label: string; value: string };

type RoundState = {
  targetIndex: number;
  guesses: string[];
  attempts: number;
  isCorrect: boolean;
  isGameOver: boolean;
  revealedBonusLevels: (1 | 2)[];
};

type MultiDayState = {
  puzzleDate: string;
  currentRoundIdx: number;
  rounds: RoundState[];
  allComplete: boolean;
};

type FieldDef = {
  key: string;
  label: string;
  description: string;
  category: string;
  icon: string;
  group?: string;
  get: (row: Row) => string | null;
};

const DATA = ROWS as readonly Row[];
const META_DATA = META as readonly MetaRow[];
const TIMEZONE = 'Europe/Brussels';
const STORAGE_PREFIX = 'country-detective-v3';
const MAX_ATTEMPTS = 3;
const BASE_CLUES = 4;
const TOTAL_ROUNDS = 1;

function clean(s: string) {
  return s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanNotes(s: string) {
  return clean(s)
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s*[–—]\s*/g, '–')
    .replace(/\s*\(estimate[^)]*\)/gi, '')
    .trim();
}

function isMissing(v: V) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'number') return Number.isNaN(v);
  const s = clean(String(v)).toLowerCase();
  return !s || s === 'null' || s === 'nan' || s === '—' || s === 'n/a';
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle<T>(items: readonly T[], seed: string) {
  const a = [...items];
  let state = hash(seed) || 1;
  const next = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clueSelectionWeight(clue: MetricClue) {
  if (clue.group?.startsWith('imported:')) return 2.4;
  if (clue.key.includes('amphibian')) return 0.28;
  return 1;
}

function weightedMetricClueShuffle(items: readonly MetricClue[], seed: string) {
  return items
    .map((clue, index) => {
      const weight = clueSelectionWeight(clue);
      const random = (hash(`${seed}:${index}:${clue.key}`) % 1_000_000 + 1) / 1_000_001;
      return { clue, score: weight <= 0 ? Number.POSITIVE_INFINITY : -Math.log(random) / weight };
    })
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => a.score - b.score || a.clue.label.localeCompare(b.clue.label))
    .map((entry) => entry.clue);
}

function brusselsDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function n(v: number, max = 0) {
  return v.toLocaleString(undefined, { maximumFractionDigits: max });
}

// Format a number with K / M / B suffix for cleaner display
function formatHuman(v: number, suffix = ''): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) {
    const scaled = v / 1_000_000_000;
    return `${n(scaled, scaled % 1 === 0 ? 0 : 2)}B${suffix}`;
  }
  if (abs >= 1_000_000) {
    const scaled = v / 1_000_000;
    return `${n(scaled, scaled % 1 === 0 ? 0 : 2)}M${suffix}`;
  }
  if (abs >= 10_000) {
    const scaled = v / 1_000;
    return `${n(scaled, scaled % 1 === 0 ? 0 : 1)}K${suffix}`;
  }
  return `${n(v, 0)}${suffix}`;
}

function decimals(v: number) {
  const s = String(v);
  return s.includes('.') ? s.split('.')[1].length : 0;
}

function normalizedNumber(idx: number, raw: V): number | null {
  if (typeof raw !== 'number' || Number.isNaN(raw)) return null;
  const d = decimals(raw);

  if ([1, 3, 20, 21, 23, 24, 26, 27, 28, 35, 37, 38, 40].includes(idx)) {
    // Values with decimals are stored in millions → convert to actual count (*1000 gives thousands scale)
    if (d > 0) return raw * 1000;
    // For religious / total population indices (NOT Jewish pop idx=28 which stores actual small counts):
    // small whole numbers represent thousands (e.g. 3 = 3,000 Hindus, 100 = 100,000 Muslims)
    if ([20, 21, 24, 26, 27].includes(idx) && raw < 1000) return raw * 1000;
    return raw;
  }

  if (idx === 6) {
    if (d >= 2) return raw * 1000;
    if (d === 1 && raw < 20) return raw * 1000;
    return raw;
  }

  if (idx === 7) {
    return d >= 2 ? raw * 1000 : raw;
  }

  if (idx === 15) {
    return d > 0 && raw < 100 ? raw * 1000 : raw;
  }

  if (idx === 29 || idx === 30 || idx === 32 || idx === 34 || idx === 39 || idx === 41) {
    return raw;
  }

  return raw;
}

function textValue(raw: V): string | null {
  if (isMissing(raw)) return null;
  if (typeof raw === 'number') return n(raw, 0);
  const s = cleanNotes(String(raw));
  return s || null;
}

function numberText(idx: number, raw: V, suffix = '', max = 0): string | null {
  const v = normalizedNumber(idx, raw);
  if (v === null) return null;
  return `${n(v, max)}${suffix}`;
}

function numberHuman(idx: number, raw: V, suffix = ''): string | null {
  const v = normalizedNumber(idx, raw);
  if (v === null) return null;
  return formatHuman(v, suffix);
}

function percentRatio(raw: V): string | null {
  const v = typeof raw === 'number' && !Number.isNaN(raw) ? raw : null;
  if (v === null) return null;
  return `${n(v * 100, 0)}%`;
}

function temperatureText(raw: V): string | null {
  if (isMissing(raw)) return null;
  if (typeof raw === 'number') return `${n(raw, 1)} °C`;
  const m = clean(String(raw)).match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  return `${n(Number(m[0]), 1)} °C`;
}

function elevationText(raw: V): string | null {
  if (isMissing(raw)) return null;
  if (typeof raw === 'number') return `${n(raw, 0)} m`;
  const s = clean(String(raw));
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  return s;
}

function hdiTrendText(raw: V): string | null {
  if (isMissing(raw)) return null;
  const s = clean(String(raw)).toLowerCase();
  if (s.includes('increase')) return 'Rising';
  if (s.includes('decrease')) return 'Falling';
  if (s.includes('steady')) return 'Stable';
  return clean(String(raw));
}

function co2ChangeText(row: Row): string | null {
  const now = normalizedNumber(29, row[29]);
  const past = normalizedNumber(30, row[30]);
  if (now === null || past === null || past === 0) return null;
  const change = ((now - past) / past) * 100;
  const dir = change > 1 ? 'Up' : change < -1 ? 'Down' : 'About the same';
  if (dir === 'About the same') return dir;
  return `${dir} ${n(Math.abs(change), 0)}% since 2000`;
}

function countryName(row: Row) {
  return String(row[0] || '');
}

function lettersOnly(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '');
}

function firstLetter(name: string) {
  const m = lettersOnly(name);
  return m ? m[0].toUpperCase() : '?';
}

function lastLetter(name: string) {
  const m = lettersOnly(name);
  return m ? m[m.length - 1].toLowerCase() : '?';
}

function startsWithVowel(name: string) {
  return /^[AEIOU]/i.test(firstLetter(name));
}

function nameLength(name: string) {
  return lettersOnly(name).length;
}

function normGuess(s: string) {
  return clean(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Spellings that refer to the same country. The data set stores several
 * countries under more than one name, and each spelling is independently
 * selectable as a mystery target \u2014 so with plain string equality, answering
 * "Ivory Coast" when the target happened to be stored as "C\u00f4te d'Ivoire" was
 * marked wrong. Only unambiguous same-country variants belong here: Sudan and
 * South Sudan are different countries, and Czechoslovakia is a different
 * (defunct) entity from Czechia, so none of those are aliased.
 */
const GUESS_ALIASES: Record<string, string> = {
  ivorycoast: 'cotedivoire',
  capeverde: 'caboverde',
  swaziland: 'eswatini',
  czechrepublic: 'czechia',
  chinesetaipei: 'taiwan',
  stkittsandnevis: 'saintkittsandnevis',
  stlucia: 'saintlucia',
  stvincentandgrenadines: 'saintvincentandthegrenadines',
  stvincentandthegrenadines: 'saintvincentandthegrenadines',
  usvirginislands: 'unitedstatesvirginislands',
  virginislands: 'unitedstatesvirginislands',
  nortmarianais: 'northernmarianaislands',
  northmarianaislands: 'northernmarianaislands',
};

/** Alias-aware identity key. Punctuation and spacing are dropped, so
 *  "Guinea Bissau"/"Guinea-bissau" collapse without needing an entry above. */
function countryKey(s: string) {
  const bare = normGuess(s).replace(/[^a-z0-9]+/g, '');
  return GUESS_ALIASES[bare] ?? bare;
}

/** True when two spellings name the same country. */
function sameCountry(a: string, b: string) {
  return countryKey(a) === countryKey(b);
}

function listify(s: string) {
  const parts = s.split('|').map(clean).filter(Boolean);
  if (parts.length <= 1) return parts[0] || '';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

// Sub-groups within a category – only one clue per sub-group is allowed
const FIELD_SUBGROUPS: Record<string, string> = {
  'summer-games': 'olympics',
  'summer-gold': 'olympics',
  'combined-games': 'olympics',
  'combined-total': 'olympics',
  'wc-apps': 'worldcup',
  'wc-streak': 'worldcup',
};

const FIELDS: readonly FieldDef[] = [
  {
    key: 'islands',
    label: 'Islands',
    description: 'How many islands make up this place.',
    category: 'Geography',
    icon: '🏝️',
    get: (row) => numberText(1, row[1]),
  },
  {
    key: 'islands-inhabited',
    label: 'Inhabited islands',
    description: 'How many islands have people living on them.',
    category: 'Geography',
    icon: '🏘️',
    get: (row) => numberText(2, row[2]),
  },
  {
    key: 'border-length',
    label: 'Land-border length',
    description: 'Combined length of all land borders.',
    category: 'Geography',
    icon: '🧭',
    get: (row) => numberText(3, row[3], ' km'),
  },
  {
    key: 'elevation',
    label: 'Elevation span',
    description: 'Difference from the lowest point to the highest point.',
    category: 'Geography',
    icon: '⛰️',
    get: (row) => elevationText(row[5]),
  },
  {
    key: 'coast',
    label: 'Coastline',
    description: 'Length of the coastline.',
    category: 'Geography',
    icon: '🌊',
    get: (row) => numberHuman(6, row[6], ' km'),
  },
  {
    key: 'area',
    label: 'Land area',
    description: 'Land area, excluding water.',
    category: 'Geography',
    icon: '📐',
    get: (row) => numberHuman(7, row[7], ' km²'),
  },
  {
    key: 'summer-games',
    label: 'Summer Olympic appearances',
    description: 'Times this place has appeared at the Summer Olympics.',
    category: 'Sports',
    icon: '🏅',
    get: (row) => numberText(8, row[8]),
  },
  {
    key: 'summer-gold',
    label: 'Summer Olympic gold medals',
    description: 'Gold medals won at the Summer Olympics.',
    category: 'Sports',
    icon: '🥇',
    get: (row) => numberText(9, row[9]),
  },
  {
    key: 'combined-games',
    label: 'Olympic appearances (all Games)',
    description: 'Summer and Winter Olympic appearances combined.',
    category: 'Sports',
    icon: '🎖️',
    get: (row) => numberText(10, row[10]),
  },
  {
    key: 'combined-total',
    label: 'Total Olympic medals',
    description: 'Olympic medals across Summer and Winter Games.',
    category: 'Sports',
    icon: '🏆',
    get: (row) => numberText(11, row[11]),
  },
  {
    key: 'amph-species',
    label: 'Amphibian species',
    description: 'Recorded amphibian species.',
    category: 'Nature',
    icon: '🐸',
    get: (row) => numberText(12, row[12]),
  },
  {
    key: 'amph-threat',
    label: 'Threatened amphibians',
    description: 'Amphibian species currently classed as threatened.',
    category: 'Nature',
    icon: '⚠️',
    get: (row) => numberText(13, row[13]),
  },
  {
    key: 'amph-endemic',
    label: 'Endemic amphibians',
    description: 'Amphibian species found only here.',
    category: 'Nature',
    icon: '🧬',
    get: (row) => numberText(14, row[14]),
  },
  {
    key: 'plant-species',
    label: 'Documented plant species',
    description: 'Approximate recorded plant species count.',
    category: 'Nature',
    icon: '🌿',
    get: (row) => numberHuman(15, row[15]),
  },
  {
    key: 'plant-threat',
    label: 'Threatened plant species',
    description: 'Plant species currently classed as threatened.',
    category: 'Nature',
    icon: '🌱',
    get: (row) => numberHuman(16, row[16]),
  },
  {
    key: 'plant-endemic',
    label: 'Endemic plant species',
    description: 'Plant species found only here.',
    category: 'Nature',
    icon: '🍃',
    get: (row) => numberHuman(17, row[17]),
  },
  {
    key: 'temp',
    label: 'Average temperature',
    description: 'Typical yearly average temperature.',
    category: 'Climate',
    icon: '🌡️',
    get: (row) => temperatureText(row[18]),
  },
  {
    key: 'buddhist-share',
    label: 'Buddhist share',
    description: 'Estimated share of the population that is Buddhist.',
    category: 'Religion',
    icon: '☸️',
    get: (row) => textValue(row[19]),
  },
  {
    key: 'buddhist-pop',
    label: 'Buddhist population',
    description: 'Estimated number of Buddhists.',
    category: 'Religion',
    icon: '🪷',
    get: (row) => {
      if (typeof row[20] === 'number') return numberHuman(20, row[20]);
      return textValue(row[20]);
    },
  },
  {
    key: 'christian-pop',
    label: 'Christian population',
    description: 'Estimated number of Christians.',
    category: 'Religion',
    icon: '✝️',
    get: (row) => {
      if (typeof row[21] === 'number') return numberHuman(21, row[21]);
      return textValue(row[21]);
    },
  },
  {
    key: 'christian-share',
    label: 'Christian share',
    description: 'Estimated share of the population that is Christian.',
    category: 'Religion',
    icon: '⛪',
    get: (row) => textValue(row[22]),
  },
  {
    key: 'population',
    label: 'Population',
    description: 'Estimated total population.',
    category: 'Society',
    icon: '👥',
    get: (row) => {
      if (typeof row[23] === 'number') return numberHuman(23, row[23]);
      return textValue(row[23]);
    },
  },
  {
    key: 'hindu-pop',
    label: 'Hindu population',
    description: 'Estimated number of Hindus.',
    category: 'Religion',
    icon: '🕉️',
    group: 'hindu-pop',
    get: (row) => {
      const a = typeof row[24] === 'number' ? numberHuman(24, row[24]) : textValue(row[24]);
      const b = typeof row[26] === 'number' ? numberHuman(26, row[26]) : textValue(row[26]);
      return a || b;
    },
  },
  {
    key: 'hindu-share',
    label: 'Hindu share',
    description: 'Estimated share of the population that is Hindu.',
    category: 'Religion',
    icon: '🛕',
    get: (row) => textValue(row[25]),
  },
  {
    key: 'muslim-pop',
    label: 'Muslim population',
    description: 'Estimated number of Muslims.',
    category: 'Religion',
    icon: '☪️',
    get: (row) => {
      if (typeof row[27] === 'number') return numberHuman(27, row[27]);
      return textValue(row[27]);
    },
  },
  {
    key: 'jewish-pop',
    label: 'Jewish population',
    description: 'Estimated number of Jewish residents.',
    category: 'Religion',
    icon: '✡️',
    get: (row) => {
      if (typeof row[28] === 'number') return numberHuman(28, row[28]);
      return textValue(row[28]);
    },
  },
  {
    key: 'co2-2023',
    label: 'CO₂ emissions per person',
    description: 'Per-person CO₂ emissions in 2023.',
    category: 'Development',
    icon: '🏭',
    get: (row) => numberText(29, row[29], ' t/person', 2),
  },
  {
    key: 'co2-2000',
    label: 'CO₂ per person in 2000',
    description: 'Per-person CO₂ emissions in 2000.',
    category: 'Development',
    icon: '🕰️',
    get: (row) => numberText(30, row[30], ' t/person', 2),
  },
  {
    key: 'co2-change',
    label: 'CO₂ trend since 2000',
    description: 'How per-person emissions changed since 2000.',
    category: 'Development',
    icon: '📉',
    get: (row) => co2ChangeText(row),
  },
  {
    key: 'gender-gap',
    label: 'Gender-gap score',
    description: 'Overall score from the Global Gender Gap Index.',
    category: 'Society',
    icon: '⚖️',
    get: (row) => numberText(32, row[32], '', 3),
  },
  {
    key: 'hdi-change',
    label: 'HDI trend',
    description: 'Whether human development has recently been rising, stable, or falling.',
    category: 'Development',
    icon: '📈',
    get: (row) => hdiTrendText(row[33]),
  },
  {
    key: 'hdi',
    label: 'Human Development Index',
    description: 'HDI value.',
    category: 'Development',
    icon: '🌍',
    get: (row) => numberText(34, row[34], '', 3),
  },
  {
    key: 'rain',
    label: 'Annual rainfall',
    description: 'Average yearly precipitation.',
    category: 'Climate',
    icon: '🌧️',
    get: (row) => numberHuman(35, row[35], ' mm'),
  },
  {
    key: 'roads-total',
    label: 'Total road length',
    description: 'Total length of the road network.',
    category: 'Infrastructure',
    icon: '🛣️',
    get: (row) => numberHuman(37, row[37], ' km'),
  },
  {
    key: 'roads-paved',
    label: 'Paved roads',
    description: 'Length of paved roads.',
    category: 'Infrastructure',
    icon: '🚗',
    get: (row) => numberHuman(38, row[38], ' km'),
  },
  {
    key: 'paved-share',
    label: 'Roads that are paved',
    description: 'Share of the road network that is paved.',
    category: 'Infrastructure',
    icon: '🧱',
    get: (row) => percentRatio(row[39]),
  },
  {
    key: 'roads-unpaved',
    label: 'Unpaved roads',
    description: 'Length of roads that are not paved.',
    category: 'Infrastructure',
    icon: '🚜',
    get: (row) => numberHuman(40, row[40], ' km'),
  },
  {
    key: 'unpaved-share',
    label: 'Roads that are unpaved',
    description: 'Share of the road network that is unpaved.',
    category: 'Infrastructure',
    icon: '🪨',
    get: (row) => percentRatio(row[41]),
  },
  {
    key: 'wc-apps',
    label: "Men's World Cup appearances",
    description: 'Appearances at the FIFA Men\'s World Cup.',
    category: 'Sports',
    icon: '⚽',
    get: (row) => numberText(42, row[42]),
  },
  {
    key: 'wc-streak',
    label: "Longest World Cup streak",
    description: 'Longest run of consecutive Men\'s World Cup appearances.',
    category: 'Sports',
    icon: '📣',
    get: (row) => numberText(43, row[43]),
  },
  {
    key: 'tourists',
    label: 'Annual tourist arrivals',
    description: 'Approximate yearly visitor arrivals.',
    category: 'Culture',
    icon: '🧳',
    get: (row) => {
      if (typeof row[44] === 'number') return numberHuman(44, row[44]);
      return textValue(row[44]);
    },
  },
  {
    key: 'unesco',
    label: 'UNESCO World Heritage sites',
    description: 'World Heritage places recognized by UNESCO.',
    category: 'Culture',
    icon: '🏛️',
    get: (row) => numberText(45, row[45]),
  },
] as const;

const IMPORTED_CATEGORY_ICONS: Record<string, string> = {
  Geography: '🗺️',
  Society: '👥',
  Development: '📈',
  Climate: '🌦️',
  Infrastructure: '🛣️',
  Culture: '🏛️',
  Nature: '🌿',
  Sports: '🏅',
};

const EXISTING_CLUE_LABELS = new Set(FIELDS.map((field) => field.label.toLowerCase()));

function buildImportedMetricClues(row: Row): MetricClue[] {
  const bucket = getCountryMetricPool().get(canonicalizeCountry(countryName(row)));
  if (!bucket) return [];

  return bucket.metrics
    .map((metric) => {
      const dataset = getMetricById(metric.datasetId);
      if (!dataset || dataset.source !== 'Imported') return null;
      const label = publicMetricLabel(dataset.label);
      if (EXISTING_CLUE_LABELS.has(label.toLowerCase())) return null;
      return {
        key: dataset.id,
        icon: IMPORTED_CATEGORY_ICONS[dataset.category] ?? '📊',
        label,
        description: dataset.description ?? `Country-level ${label.toLowerCase()}.`,
        category: dataset.category,
        value: metric.displayValue,
        group: `imported:${dataset.id}`,
      } as MetricClue;
    })
    .filter((clue): clue is MetricClue => clue !== null);
}

function buildMetricClues(rowIndex: number, seed: string) {
  const row = DATA[rowIndex];
  const all: MetricClue[] = [];
  const importedClues = buildImportedMetricClues(row);
  const seenGroups = new Set<string>();
  for (const field of FIELDS) {
    const group = field.group || field.key;
    if (seenGroups.has(group)) continue;
    const value = field.get(row);
    if (!value) continue;
    seenGroups.add(group);
    all.push({
      key: field.key,
      icon: field.icon,
      label: field.label,
      description: field.description,
      category: field.category,
      value,
      group,
    });
  }
  for (const clue of importedClues) all.push(clue);
  const mixed = weightedMetricClueShuffle(all, seed);
  const picked: MetricClue[] = [];
  const usedCats = new Set<string>();
  const usedSubGroups = new Set<string>();

  const canAdd = (clue: MetricClue) => {
    if (usedCats.has(clue.category)) return false;
    const sg = FIELD_SUBGROUPS[clue.key];
    if (sg && usedSubGroups.has(sg)) return false;
    return true;
  };

  const markUsed = (clue: MetricClue) => {
    usedCats.add(clue.category);
    const sg = FIELD_SUBGROUPS[clue.key];
    if (sg) usedSubGroups.add(sg);
  };

  // First pass: one clue per category (and per sub-group)
  for (const clue of mixed) {
    if (canAdd(clue)) {
      picked.push(clue);
      markUsed(clue);
      if (picked.length === BASE_CLUES) return picked;
    }
  }

  // Second pass: allow repeating categories but still enforce sub-group uniqueness
  // and cap each category at 2 max to avoid all-same-category situations
  const catCount: Record<string, number> = {};
  for (const c of picked) catCount[c.category] = (catCount[c.category] || 0) + 1;

  for (const clue of mixed) {
    if (picked.includes(clue)) continue;
    const sg = FIELD_SUBGROUPS[clue.key];
    if (sg && usedSubGroups.has(sg)) continue;
    const cc = catCount[clue.category] || 0;
    if (cc >= 2) continue; // max 2 per category in fallback
    picked.push(clue);
    catCount[clue.category] = cc + 1;
    const newSg = FIELD_SUBGROUPS[clue.key];
    if (newSg) usedSubGroups.add(newSg);
    if (picked.length === BASE_CLUES) break;
  }

  return picked;
}

function buildBonusHints(rowIndex: number, seed: string) {
  const row = DATA[rowIndex];
  const meta = META_DATA[rowIndex] || ['', '', '', '', 0, '', ''];
  const name = countryName(row);
  const [region, subregion, capital, hemi, islandMeta, langs, flagColors] = meta;
  const L = nameLength(name);
  const fl = firstLetter(name);
  const ll = lastLetter(name);
  const borderCount = typeof row[4] === 'number' && !Number.isNaN(row[4]) ? row[4] : null;
  const islandCount = normalizedNumber(1, row[1]);
  const likelyIsland = islandMeta === 1 || (!!islandCount && islandCount > 0 && borderCount === 0);
  const candidates: BonusHint[][] = [];

  candidates.push([
    { level: 1, label: 'Name hint', value: `Starts with ${startsWithVowel(name) ? 'a vowel' : 'a consonant'}` },
    { level: 2, label: 'Name hint', value: `Starts with ${fl}` },
  ]);
  candidates.push([
    { level: 1, label: 'Name hint', value: `The name has ${L} letters` },
    { level: 2, label: 'Name hint', value: `Starts with ${fl}` },
  ]);
  candidates.push([
    { level: 1, label: 'Name hint', value: `The name has ${L} letters` },
    { level: 2, label: 'Name hint', value: `Starts with ${fl} and ends with ${ll}` },
  ]);
  candidates.push([
    { level: 1, label: 'Geography hint', value: likelyIsland ? 'This is an island place' : 'This is a mainland place' },
    { level: 2, label: 'Name hint', value: `Starts with ${fl}` },
  ]);

  if (borderCount !== null) {
    candidates.push([
      { level: 1, label: 'Geography hint', value: borderCount > 0 ? 'It has land borders' : 'It has no land borders' },
      { level: 2, label: 'Name hint', value: `The name has ${L} letters` },
    ]);
  }

  if (hemi === 'N' || hemi === 'S') {
    candidates.push([
      { level: 1, label: 'Hemisphere hint', value: `In the ${hemi === 'N' ? 'Northern' : 'Southern'} Hemisphere` },
      { level: 2, label: 'Name hint', value: `Starts with ${fl}` },
    ]);
  }

  if (region) {
    const regionText = region === 'Americas' ? 'the Americas' : region;
    candidates.push([
      { level: 1, label: 'Region hint', value: `Located in ${regionText}` },
      { level: 2, label: 'Name hint', value: `Starts with ${fl}` },
    ]);
  }

  if (subregion) {
    candidates.push([
      { level: 1, label: 'Subregion hint', value: `In ${subregion}` },
      { level: 2, label: 'Name hint', value: `Starts with ${fl}` },
    ]);
  }

  if (langs && capital) {
    const lang = langs.split('|').map(clean).filter(Boolean)[0] || '';
    const capLetter = firstLetter(capital);
    if (lang && capLetter !== '?') {
      candidates.push([
        { level: 1, label: 'Language hint', value: `An official language is ${lang}` },
        { level: 2, label: 'Capital hint', value: `Its capital starts with ${capLetter}` },
      ]);
    }
  }

  if (flagColors) {
    const colors = flagColors.split('|').map(clean).filter(Boolean).slice(0, 3);
    if (colors.length >= 2) {
      candidates.push([
        { level: 1, label: 'Flag hint', value: `Its flag includes ${listify(colors.join('|'))}` },
        { level: 2, label: 'Name hint', value: `Starts with ${fl}` },
      ]);
    }
  }

  return shuffle(candidates, seed)[0] || [];
}

function pickTargetIndex(date: string) {
  const eligible: number[] = [];
  for (let i = 0; i < DATA.length; i += 1) {
    const rowName = countryName(DATA[i]);
    if (!rowName || !isPlayableCountryName(rowName)) continue;
    if (buildMetricClues(i, `${date}|eligibility`).length >= BASE_CLUES) eligible.push(i);
  }
  return eligible[hash(`target|${date}`) % eligible.length];
}

function pickThreeTargetIndices(date: string): number[] {
  const eligible: number[] = [];
  for (let i = 0; i < DATA.length; i += 1) {
    const rowName = countryName(DATA[i]);
    if (!rowName || !isPlayableCountryName(rowName)) continue;
    if (buildMetricClues(i, `${date}|eligibility`).length >= BASE_CLUES) eligible.push(i);
  }
  const shuffled = shuffle(eligible, `three-targets|${date}`);
  return shuffled.slice(0, TOTAL_ROUNDS);
}

function saveKey(date: string) {
  return `${STORAGE_PREFIX}:${date}`;
}

function loadState(date: string): MultiDayState | null {
  try {
    const raw = localStorage.getItem(saveKey(date));
    return raw ? (JSON.parse(raw) as MultiDayState) : null;
  } catch {
    return null;
  }
}

function persist(state: MultiDayState) {
  localStorage.setItem(saveKey(state.puzzleDate), JSON.stringify(state));
}

function sectionTitle(text: string, sub: string) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{text}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{sub}</p>
    </div>
  );
}

export default function CountryDetectivePage() {
  const [multiState, setMultiState] = useState<MultiDayState | null>(null);
  const { record: recordRound } = useGameStats('country-detective');
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showRules, setShowRules] = useState(true);

  useEffect(() => {
    const date = brusselsDate();
    const saved = loadState(date);
    if (saved && Array.isArray(saved.rounds) && saved.rounds.length === TOTAL_ROUNDS) {
      setMultiState(saved);
      return;
    }
    const indices = pickThreeTargetIndices(date);
    const newState: MultiDayState = {
      puzzleDate: date,
      currentRoundIdx: 0,
      allComplete: false,
      rounds: indices.map((targetIndex) => ({
        targetIndex,
        guesses: [],
        attempts: 0,
        isCorrect: false,
        isGameOver: false,
        revealedBonusLevels: [],
      })),
    };
    setMultiState(newState);
    persist(newState);
  }, []);

  const allNames = useMemo(() => DATA.map(countryName).filter((name): name is string => !!name && isPlayableCountryName(name)), []);

  // Current round derived values
  const currentRoundIdx = multiState?.currentRoundIdx ?? 0;
  const currentRound = multiState?.rounds[currentRoundIdx] ?? null;

  const metricClues = useMemo(() => {
    if (!currentRound || !multiState) return [];
    return buildMetricClues(
      currentRound.targetIndex,
      `${multiState.puzzleDate}|clues|${currentRound.targetIndex}|r${currentRoundIdx}`,
    );
  }, [currentRound, currentRoundIdx, multiState]);

  const bonusHints = useMemo(() => {
    if (!currentRound || !multiState) return [];
    return buildBonusHints(
      currentRound.targetIndex,
      `${multiState.puzzleDate}|bonus|${currentRound.targetIndex}|r${currentRoundIdx}`,
    );
  }, [currentRound, currentRoundIdx, multiState]);

  function updateCurrentRound(updater: (r: RoundState) => RoundState) {
    setMultiState((prev) => {
      if (!prev) return prev;
      const updatedRounds = prev.rounds.map((r, i) =>
        i === prev.currentRoundIdx ? updater(r) : r,
      );
      const allComplete = updatedRounds.every((r) => r.isGameOver);
      const next: MultiDayState = { ...prev, rounds: updatedRounds, allComplete };
      persist(next);
      return next;
    });
  }

  function onInput(value: string) {
    setInput(value);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const q = normGuess(value);
    setSuggestions(allNames.filter((name) => normGuess(name).includes(q)).slice(0, 6));
  }

  function submit(rawGuess: string) {
    if (!currentRound || currentRound.isGameOver) return;
    const guess = clean(rawGuess);
    if (!guess) return;
    const nextAttempts = currentRound.attempts + 1;
    const target = countryName(DATA[currentRound.targetIndex]);
    const correct = sameCountry(guess, target);
    updateCurrentRound((r) => ({
      ...r,
      guesses: [...r.guesses, guess],
      attempts: nextAttempts,
      isCorrect: correct,
      isGameOver: correct || nextAttempts >= MAX_ATTEMPTS,
    }));
    setInput('');
    setSuggestions([]);

    if (correct || nextAttempts >= MAX_ATTEMPTS) {
      // Fewer attempts scores higher; a miss scores zero. Keyed on the puzzle's
      // target so each round is counted once.
      recordRound(
        {
          score: correct ? MAX_ATTEMPTS - nextAttempts + 1 : 0,
          maxScore: MAX_ATTEMPTS,
          won: correct,
        },
        `${multiState?.puzzleDate ?? ''}-${currentRound.targetIndex}`,
      );
    }
  }

  function revealHint(level: 1 | 2) {
    if (!currentRound || currentRound.isGameOver) return;
    if ((currentRound.revealedBonusLevels || []).includes(level)) return;
    updateCurrentRound((r) => ({
      ...r,
      revealedBonusLevels: [...(r.revealedBonusLevels || []), level].sort() as (1 | 2)[],
    }));
  }

  function handleNextRound() {
    if (!multiState) return;
    const nextIdx = currentRoundIdx + 1;
    if (nextIdx >= TOTAL_ROUNDS) {
      const next: MultiDayState = { ...multiState, allComplete: true };
      setMultiState(next);
      persist(next);
    } else {
      const next: MultiDayState = { ...multiState, currentRoundIdx: nextIdx };
      setMultiState(next);
      persist(next);
    }
    setInput('');
    setSuggestions([]);
  }

  function resetGame() {
    const date = brusselsDate();
    localStorage.removeItem(saveKey(date));
    const indices = pickThreeTargetIndices(date);
    const newState: MultiDayState = {
      puzzleDate: date,
      currentRoundIdx: 0,
      allComplete: false,
      rounds: indices.map((targetIndex) => ({
        targetIndex,
        guesses: [],
        attempts: 0,
        isCorrect: false,
        isGameOver: false,
        revealedBonusLevels: [],
      })),
    };
    setMultiState(newState);
    persist(newState);
    setInput('');
    setSuggestions([]);
  }

  const sharePayload = multiState
    ? {
        game: 'Country Detective',
        result: `${scoreLine(multiState.rounds.filter((r) => r.isCorrect).length, multiState.rounds.length)} solved`,
        details: multiState.rounds.map((r, i) => {
          const hints = (r.revealedBonusLevels || []).length;
          const mark = r.isCorrect ? '✅' : '❌';
          const tries = r.isCorrect ? `${r.attempts}/${MAX_ATTEMPTS} guesses` : 'not solved';
          const hintText = hints === 0 ? '💡 no hints' : `💡 ${hints} hint${hints === 1 ? '' : 's'}`;
          return `${mark} Round ${i + 1}: ${tries} · ${hintText} — ${countryName(DATA[r.targetIndex])}`;
        }),
        path: '/country-detective',
      }
    : { game: 'Country Detective', result: '', path: '/country-detective' };

  if (!multiState || !currentRound) {
    return <div className="app-page-shell grid min-h-screen place-items-center bg-slate-950 text-slate-200">Loading…</div>;
  }

  const target = countryName(DATA[currentRound.targetIndex]);
  const revealedLevels = new Set(currentRound.revealedBonusLevels || []);
  const revealedBonusHints = bonusHints.filter((h) => revealedLevels.has(h.level));
  const availableBonusHints = bonusHints.filter(
    (h) => currentRound.attempts >= h.level && !revealedLevels.has(h.level) && !currentRound.isCorrect,
  );
  const guessesLeft = Math.max(0, MAX_ATTEMPTS - currentRound.attempts);
  const hintCount = (currentRound.revealedBonusLevels || []).length;
  const isLastRound = currentRoundIdx === TOTAL_ROUNDS - 1;

  // Final summary screen
  if (multiState.allComplete) {
    const correctCount = multiState.rounds.filter((r) => r.isCorrect).length;
    return (
      <div className="app-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50 text-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-slate-100">
        <GameNavbar currentPath="/country-detective" />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{correctCount === TOTAL_ROUNDS ? '🎉' : correctCount >= Math.ceil(TOTAL_ROUNDS/2) ? '🌟' : correctCount === 1 ? '🕵️' : '💪'}</div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">All done!</h1>
            <p className="text-slate-600 dark:text-slate-400">You solved {correctCount} out of {TOTAL_ROUNDS} puzzles today.</p>
          </div>
          <div className="flex flex-col gap-4 mb-8">
            {multiState.rounds.map((r, i) => {
              const rTarget = countryName(DATA[r.targetIndex]);
              const rHintCount = (r.revealedBonusLevels || []).length;
              return (
                <div key={i} className={`rounded-2xl border p-6 ${r.isCorrect ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/20' : 'border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/20'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Round {i + 1}</div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">{rTarget}</div>
                      {rHintCount > 0 && <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{rHintCount} bonus hint{rHintCount === 1 ? '' : 's'} used</div>}
                    </div>
                    <div className="text-4xl">{r.isCorrect ? '✅' : '❌'}</div>
                  </div>
                  {r.isCorrect && (
                    <div className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">Solved in {r.attempts} {r.attempts === 1 ? 'guess' : 'guesses'}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <ShareButtons share={sharePayload} className="flex-1" />
            <button
              onClick={resetGame}
              className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 py-3 px-6 rounded-full font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-refresh-line mr-2"></i>Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50 text-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-slate-100">
      <GameNavbar currentPath="/country-detective" />

      <RulesModal
        open={showRules}
        onClose={() => { setShowRules(false); }}
        title="How Country Detective works"
        icon="ri-spy-line"
        iconGradient="from-cyan-500 to-teal-600"
        accent="cyan"
        description="Three mystery countries, three rounds. Each round gives you four stat clues. Identify the country in as few guesses as possible."
        rules={[
          { icon: 'ri-search-line', text: 'Four factual clues are revealed at the start — geography, nature, sports, and more.' },
          { icon: 'ri-number-3', text: 'You have up to 3 guesses per round. Use them wisely — fewer guesses is better.' },
          { icon: 'ri-lightbulb-line', text: 'After your 1st and 2nd guesses, optional bonus hints unlock (noted in your shared result).' },
        ]}
        scoring={[
          { pts: '✅ 1', label: 'Solved first try', sub: 'no bonus hints', color: 'green' },
          { pts: '✅ 2', label: 'Solved second try', sub: 'good detective work', color: 'yellow' },
          { pts: '✅ 3', label: 'Solved third try', sub: 'just made it!', color: 'orange' },
          { pts: '❌', label: 'Not solved', sub: 'answer revealed', color: 'red' },
        ]}
        tip="Start with clues that are most distinctive — tiny amphibian counts or unusual Olympic medals narrow the field quickly."
        ctaLabel="Start investigating!"
        ctaGradient="from-cyan-500 to-teal-600"
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2 flex items-center justify-center gap-3">
            <i className="ri-spy-line text-cyan-600 dark:text-cyan-400"></i>
            Country Detective
            <i className="ri-search-eye-line text-cyan-600 dark:text-cyan-400"></i>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Guess the country from four clues. One puzzle today.
          </p>
          <button
            onClick={() => setShowRules(true)}
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 transition-colors cursor-pointer font-medium"
            style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
          >
            <i className="ri-question-line"></i>
            How to play
          </button>
        </div>

        <section className="mb-8">
          {sectionTitle(`Round ${currentRoundIdx + 1} clues`, 'Each clue gives you one fact about the answer.')}
          <div className="grid gap-4 md:grid-cols-2">
            {metricClues.map((clue) => (
              <article key={clue.key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-100 text-2xl dark:bg-cyan-950/50">{clue.icon}</div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-400">{clue.category}</div>
                    <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{clue.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{clue.description}</p>
                    <div className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{clue.value}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {(revealedBonusHints.length > 0 || availableBonusHints.length > 0) && (
          <section className="mb-8">
            {sectionTitle('Bonus hints', 'Optional extra clues — using them is noted in your shared result.')}
            <div className="grid gap-4 md:grid-cols-2">
              {revealedBonusHints.map((hint) => (
                <article key={`${hint.level}-${hint.label}`} className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-lg dark:border-amber-800/60 dark:bg-amber-900/20">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">Bonus hint {hint.level}</div>
                  <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{hint.label}</h3>
                  <div className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">{hint.value}</div>
                </article>
              ))}
              {availableBonusHints.map((hint) => (
                <article key={`offer-${hint.level}`} className="rounded-2xl border border-dashed border-amber-300 bg-white p-6 shadow-lg dark:border-amber-800/60 dark:bg-slate-800">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">Bonus hint {hint.level}</div>
                  <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Need a little help?</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Reveal an extra clue. This will show in your shared result.</p>
                  <button onClick={() => revealHint(hint.level)} className="mt-4 rounded-2xl bg-amber-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-amber-400 cursor-pointer">
                    Reveal bonus hint {hint.level}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {currentRound.isGameOver ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="text-center">
              <div className="text-6xl">{currentRound.isCorrect ? '🎉' : '🕵️'}</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {currentRound.isCorrect ? 'Puzzle solved!' : 'Puzzle complete'}
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {currentRound.isCorrect
                  ? `You solved it in ${currentRound.attempts} ${currentRound.attempts === 1 ? 'guess' : 'guesses'}.`
                  : `The answer was ${target}.`}
                {hintCount > 0 ? ` You used ${hintCount} bonus hint${hintCount === 1 ? '' : 's'}.` : ''}
              </p>
              <div className="mt-5 text-4xl font-black tracking-tight text-cyan-700 dark:text-cyan-300">{target}</div>
              <GameStatsBar gameId="country-detective" className="mx-auto mt-5 max-w-md" />
            </div>

            {currentRound.guesses.length > 0 && (
              <div className="mt-8">
                {sectionTitle('Your guesses', '')}
                <div className="space-y-3">
                  {currentRound.guesses.map((guess, i) => {
                    const ok = sameCountry(guess, target);
                    return (
                      <div key={`${guess}-${i}`} className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${ok ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-400 bg-red-50 dark:bg-red-950/20'}`}>
                        <span className="font-semibold text-slate-900 dark:text-white">{i + 1}. {guess}</span>
                        <span className="text-2xl">{ok ? '✅' : '❌'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 max-w-md mx-auto flex gap-3">
              <button
                onClick={handleNextRound}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-6 rounded-full font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                {isLastRound ? (
                  <><i className="ri-trophy-line mr-2"></i>See Final Results</>
                ) : (
                  <><i className="ri-arrow-right-line mr-2"></i>Next Round</>
                )}
              </button>
            </div>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
              {sectionTitle('Make your guess', `You have ${guessesLeft} ${guessesLeft === 1 ? 'guess' : 'guesses'} left for this round.`)}
              <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <span>{guessesLeft} {guessesLeft === 1 ? 'guess' : 'guesses'} left</span>
                <span>{currentRound.attempts} / {MAX_ATTEMPTS} used</span>
              </div>
              <div className="relative">
                <input
                  value={input}
                  onChange={(e) => onInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submit(input); }}
                  placeholder="Type a country or territory name…"
                  className="w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    {suggestions.map((name) => (
                      <button key={name} onClick={() => submit(name)} className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer">
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => submit(input)}
                disabled={!clean(input)}
                className="mt-4 w-full rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-6 font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                Submit guess
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
              {sectionTitle('Your guesses', 'Wrong guesses stay listed so you can avoid repeating them.')}
              {currentRound.guesses.length === 0 ? (
                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">No guesses yet.</p>
              ) : (
                <div className="space-y-3">
                  {currentRound.guesses.map((guess, i) => (
                    <div key={`${guess}-${i}`} className="flex items-center justify-between rounded-2xl border border-red-400 bg-red-50 px-4 py-3 dark:bg-red-950/20">
                      <span className="font-semibold text-slate-900 dark:text-white">{i + 1}. {guess}</span>
                      <span className="text-2xl">❌</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
