import type { ImportedCountryListRaw, ImportedCountryValueRow } from './imported-country-lists-data/types';
import { IMPORTED_COUNTRY_LISTS_PART_1 } from './imported-country-lists-data/part-1';
import { IMPORTED_COUNTRY_LISTS_PART_2 } from './imported-country-lists-data/part-2';
import { IMPORTED_COUNTRY_LISTS_PART_3 } from './imported-country-lists-data/part-3';
import { IMPORTED_COUNTRY_LISTS_PART_4 } from './imported-country-lists-data/part-4';
import { IMPORTED_COUNTRY_LISTS_PART_5 } from './imported-country-lists-data/part-5';
import { IMPORTED_COUNTRY_LISTS_PART_6 } from './imported-country-lists-data/part-6';
import { IMPORTED_COUNTRY_LISTS_PART_7 } from './imported-country-lists-data/part-7';
import { IMPORTED_COUNTRY_LISTS_PART_8 } from './imported-country-lists-data/part-8';

export interface ImportedCountryList {
  id: string;
  slug: string;
  label: string;
  shortLabel: string;
  source: string;
  category: string;
  unit?: string;
  precision?: number;
  description: string;
  higherMeans: string;
  unitHint: string;
  coverageCount: number;
  values: Array<{ country: string; value: number }>;
}

const EXCLUDED_IMPORTED_LIST_IDS = new Set(['imp-pm25']);

const RAW_IMPORTED_COUNTRY_LISTS: ImportedCountryListRaw[] = [
  ...IMPORTED_COUNTRY_LISTS_PART_1,
  ...IMPORTED_COUNTRY_LISTS_PART_2,
  ...IMPORTED_COUNTRY_LISTS_PART_3,
  ...IMPORTED_COUNTRY_LISTS_PART_4,
  ...IMPORTED_COUNTRY_LISTS_PART_5,
  ...IMPORTED_COUNTRY_LISTS_PART_6,
  ...IMPORTED_COUNTRY_LISTS_PART_7,
  ...IMPORTED_COUNTRY_LISTS_PART_8,
].filter((list) => !EXCLUDED_IMPORTED_LIST_IDS.has(list.id));

function hydrateValues(values: ImportedCountryValueRow[]) {
  return values.map(([country, value]) => ({ country, value }));
}

export const IMPORTED_COUNTRY_LISTS: ImportedCountryList[] = RAW_IMPORTED_COUNTRY_LISTS.map((list) => ({
  ...list,
  values: hydrateValues(list.values),
}));