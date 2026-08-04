export type ImportedCountryValueRow = readonly [country: string, value: number];

export interface ImportedCountryListRaw {
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
  values: ImportedCountryValueRow[];
}
