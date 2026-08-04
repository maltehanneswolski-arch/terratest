export interface BorderlineEntry {
  id: string;
  countryA: string;
  countryB: string;
  path: string;
  lengthScore: number;
  pointCount: number;
}

import { BORDERLINE_BORDERS_1 } from "./chunk/borders-1";
import { BORDERLINE_BORDERS_2 } from "./chunk/borders-2";
import { BORDERLINE_BORDERS_3 } from "./chunk/borders-3";
import { BORDERLINE_BORDERS_4 } from "./chunk/borders-4";
import { BORDERLINE_BORDERS_5 } from "./chunk/borders-5";
import { BORDERLINE_BORDERS_6 } from "./chunk/borders-6";

export const BORDERLINE_BORDERS: BorderlineEntry[] = [
  ...BORDERLINE_BORDERS_1,
  ...BORDERLINE_BORDERS_2,
  ...BORDERLINE_BORDERS_3,
  ...BORDERLINE_BORDERS_4,
  ...BORDERLINE_BORDERS_5,
  ...BORDERLINE_BORDERS_6,
];
