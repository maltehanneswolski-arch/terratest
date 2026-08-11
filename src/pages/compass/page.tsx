import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GameNavbar } from '@/components/ui/game-navbar';
import { RulesModal } from '@/components/feature/rules-modal';
import { GameStatsBar } from '@/components/feature/game-stats-bar';
import { ShareButtons } from '@/components/feature/share-buttons';
import { gradeEmoji } from '@/lib/shareResult';
import { useGameStats } from '@/lib/gameStats';

interface CountryData {
  Country: string;
  C1_R100: number;
  T2_R100: number;
  U1_R100: number;
  B3_R100: number;
  R2_R100: number;
  O3_R100: number;
  W1_R100: number;
  V2_R100: number;
  NBI_R100: number;
}

interface CountryScore {
  country: string;
  score: number;
  factors: number[];
}

export const FACTORS = [
  'Climate',
  'Mountains', 
  'Urbanisation',
  'Forest',
  'Justice',
  'Openness',
  'Ocean',
  'Vastness',
  'Biodiversity'
];

export const FACTOR_IDS = [
  'climate',
  'mountains',
  'urbanisation',
  'forest',
  'justice',
  'openness',
  'ocean',
  'vastness',
  'biodiversity'
] as const;

const FACTOR_EXPLANATIONS = [
  'Climate: Year-round temperature comfort, sunshine, and humidity levels',
  'Mountains: Mountain ranges, hills, terrain variety and dramatic landscapes',
  'Urbanisation: Access to cities, metro areas, and urban amenities',
  'Forest: Woodland extent, protected parks, and natural green spaces',
  'Justice System: Legal predictability, low corruption, and institutional trust',
  'Openness: Multiculturalism, immigration friendliness, and global connectivity',
  'Ocean: Proximity to seas, lakes, beaches, and maritime culture',
  'Vastness: Country size, geographic scale, and room to explore',
  'Biodiversity: Wildlife richness, unique species, and diverse ecosystems'
];

const QUESTIONS = [
  { id: 'Q1', text: 'q1', factor: 'C1', reverse: false },
  { id: 'Q2', text: 'q2', factor: 'C1', reverse: false },
  { id: 'Q3', text: 'q3', factor: 'C1', reverse: true },
  { id: 'Q4', text: 'q4', factor: 'T2', reverse: false },
  { id: 'Q6', text: 'q6', factor: 'T2', reverse: true },
  { id: 'Q7', text: 'q7', factor: 'U1', reverse: false },
  { id: 'Q8', text: 'q8', factor: 'U1', reverse: true },
  { id: 'Q9', text: 'q9', factor: 'U1', reverse: false },
  { id: 'Q10', text: 'q10', factor: 'B3', reverse: false },
  { id: 'Q11', text: 'q11', factor: 'B3', reverse: true },
  { id: 'Q12', text: 'q12', factor: 'B3', reverse: false },
  { id: 'Q13', text: 'q13', factor: 'R2', reverse: false },
  { id: 'Q14', text: 'q14', factor: 'R2', reverse: false },
  { id: 'Q16', text: 'q16', factor: 'O3', reverse: false },
  { id: 'Q18', text: 'q18', factor: 'O3', reverse: false },
  { id: 'Q19', text: 'q19', factor: 'W1', reverse: false },
  { id: 'Q20', text: 'q20', factor: 'W1', reverse: false },
  { id: 'Q21', text: 'q21', factor: 'V2', reverse: false },
  { id: 'Q22', text: 'q22', factor: 'V2', reverse: true },
  { id: 'Q23', text: 'q23', factor: 'NBI', reverse: false },
];

export const COUNTRY_DATA: CountryData[] = [
  { Country: 'Albania', C1_R100: 75.0, T2_R100: 47.0, U1_R100: 65.0, B3_R100: 28.8, R2_R100: 46.8, O3_R100: 63.94, W1_R100: 100.0, V2_R100: 1.7, NBI_R100: 53.1 },
  { Country: 'Andorra', C1_R100: 66.0, T2_R100: 100.0, U1_R100: 88.0, B3_R100: 34.0, R2_R100: 79.6, O3_R100: 88.18, W1_R100: 0.0, V2_R100: 0.0, NBI_R100: 45.5 },
  { Country: 'Austria', C1_R100: 25.0, T2_R100: 61.0, U1_R100: 60.0, B3_R100: 47.2, R2_R100: 85.0, O3_R100: 85.19, W1_R100: 0.0, V2_R100: 4.9, NBI_R100: 46.9 },
  { Country: 'Belarus', C1_R100: 25.0, T2_R100: 11.0, U1_R100: 81.0, B3_R100: 43.4, R2_R100: 25.0, O3_R100: 61.82, W1_R100: 0.0, V2_R100: 12.1, NBI_R100: 36.8 },
  { Country: 'Belgium', C1_R100: 66.0, T2_R100: 12.0, U1_R100: 98.0, B3_R100: 22.6, R2_R100: 76.0, O3_R100: 82.66, W1_R100: 92.0, V2_R100: 1.8, NBI_R100: 44.5 },
  { Country: 'Bosnia and Herzegovina', C1_R100: 66.0, T2_R100: 33.0, U1_R100: 50.0, B3_R100: 42.7, R2_R100: 43.0, O3_R100: 67.22, W1_R100: 55.0, V2_R100: 3.0, NBI_R100: 53.2 },
  { Country: 'Bulgaria', C1_R100: 30.0, T2_R100: 31.0, U1_R100: 77.0, B3_R100: 36.2, R2_R100: 49.8, O3_R100: 75.6, W1_R100: 85.0, V2_R100: 6.5, NBI_R100: 49.3 },
  { Country: 'Croatia', C1_R100: 25.0, T2_R100: 22.0, U1_R100: 59.0, B3_R100: 34.8, R2_R100: 57.2, O3_R100: 81.22, W1_R100: 100.0, V2_R100: 3.3, NBI_R100: 53.8 },
  { Country: 'Cyprus', C1_R100: 75.0, T2_R100: 6.0, U1_R100: 67.0, B3_R100: 18.7, R2_R100: 62.6, O3_R100: 81.74, W1_R100: 100.0, V2_R100: 0.5, NBI_R100: 45.1 },
  { Country: 'Czechia', C1_R100: 25.0, T2_R100: 29.0, U1_R100: 74.0, B3_R100: 34.6, R2_R100: 72.8, O3_R100: 79.57, W1_R100: 0.0, V2_R100: 4.6, NBI_R100: 49.8 },
  { Country: 'Denmark', C1_R100: 66.0, T2_R100: 2.0, U1_R100: 89.0, B3_R100: 15.1, R2_R100: 88.2, O3_R100: 83.62, W1_R100: 99.0, V2_R100: 2.5, NBI_R100: 40.3 },
  { Country: 'Estonia', C1_R100: 25.0, T2_R100: 4.0, U1_R100: 70.0, B3_R100: 57.1, R2_R100: 78.6, O3_R100: 83.34, W1_R100: 94.0, V2_R100: 2.6, NBI_R100: 43.6 },
  { Country: 'Finland', C1_R100: 15.0, T2_R100: 11.0, U1_R100: 86.0, B3_R100: 73.7, R2_R100: 89.4, O3_R100: 81.81, W1_R100: 86.0, V2_R100: 19.8, NBI_R100: 29.0 },
  { Country: 'France', C1_R100: 66.0, T2_R100: 25.0, U1_R100: 82.0, B3_R100: 32.5, R2_R100: 73.6, O3_R100: 82.03, W1_R100: 67.0, V2_R100: 37.7, NBI_R100: 42.3 },
  { Country: 'Germany', C1_R100: 66.0, T2_R100: 18.0, U1_R100: 78.0, B3_R100: 32.7, R2_R100: 81.0, O3_R100: 83.75, W1_R100: 64.0, V2_R100: 20.9, NBI_R100: 36.5 },
  { Country: 'Greece', C1_R100: 75.0, T2_R100: 33.0, U1_R100: 91.0, B3_R100: 30.3, R2_R100: 54.2, O3_R100: 82.88, W1_R100: 98.0, V2_R100: 7.7, NBI_R100: 55.4 },
  { Country: 'Hungary', C1_R100: 25.0, T2_R100: 10.0, U1_R100: 72.0, B3_R100: 22.6, R2_R100: 58.6, O3_R100: 77.86, W1_R100: 0.0, V2_R100: 5.4, NBI_R100: 44.1 },
  { Country: 'Iceland', C1_R100: 60.0, T2_R100: 37.0, U1_R100: 94.0, B3_R100: 0.5, R2_R100: 84.4, O3_R100: 82.45, W1_R100: 94.0, V2_R100: 6.0, NBI_R100: 11.3 },
  { Country: 'Ireland', C1_R100: 66.0, T2_R100: 8.0, U1_R100: 64.0, B3_R100: 11.6, R2_R100: 82.6, O3_R100: 84.65, W1_R100: 86.0, V2_R100: 4.1, NBI_R100: 27.9 },
  { Country: 'Italy', C1_R100: 75.0, T2_R100: 36.0, U1_R100: 71.0, B3_R100: 31.4, R2_R100: 57.8, O3_R100: 78.98, W1_R100: 94.0, V2_R100: 17.6, NBI_R100: 51.2 },
  { Country: 'Kosovo', C1_R100: 66.0, T2_R100: 53.0, U1_R100: 0.0, B3_R100: 0.0, R2_R100: 0.0, O3_R100: 0.0, W1_R100: 0.0, V2_R100: 0.6, NBI_R100: 53.0 },
  { Country: 'Latvia', C1_R100: 25.0, T2_R100: 6.0, U1_R100: 69.0, B3_R100: 55.0, R2_R100: 70.8, O3_R100: 79.99, W1_R100: 88.0, V2_R100: 3.8, NBI_R100: 42.0 },
  { Country: 'Liechtenstein', C1_R100: 25.0, T2_R100: 72.0, U1_R100: 15.0, B3_R100: 41.9, R2_R100: 84.2, O3_R100: 83.19, W1_R100: 0.0, V2_R100: 0.0, NBI_R100: 48.3 },
  { Country: 'Lithuania', C1_R100: 25.0, T2_R100: 7.0, U1_R100: 71.0, B3_R100: 33.7, R2_R100: 75.4, O3_R100: 80.83, W1_R100: 89.0, V2_R100: 3.8, NBI_R100: 42.0 },
  { Country: 'Luxembourg', C1_R100: 66.0, T2_R100: 22.0, U1_R100: 92.0, B3_R100: 35.1, R2_R100: 85.0, O3_R100: 88.18, W1_R100: 0.0, V2_R100: 0.2, NBI_R100: 41.1 },
  { Country: 'Malta', C1_R100: 75.0, T2_R100: 3.0, U1_R100: 94.0, B3_R100: 1.0, R2_R100: 64.0, O3_R100: 81.31, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 53.1 },
  { Country: 'Moldova', C1_R100: 25.0, T2_R100: 9.0, U1_R100: 43.0, B3_R100: 11.8, R2_R100: 47.0, O3_R100: 67.82, W1_R100: 0.0, V2_R100: 2.0, NBI_R100: 45.4 },
  { Country: 'Monaco', C1_R100: 75.0, T2_R100: 10.0, U1_R100: 100.0, B3_R100: 0.0, R2_R100: 79.6, O3_R100: 86.27, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 42.3 },
  { Country: 'Montenegro', C1_R100: 66.0, T2_R100: 72.0, U1_R100: 68.0, B3_R100: 61.5, R2_R100: 49.2, O3_R100: 76.63, W1_R100: 100.0, V2_R100: 0.8, NBI_R100: 52.8 },
  { Country: 'Netherlands', C1_R100: 66.0, T2_R100: 2.0, U1_R100: 92.0, B3_R100: 10.9, R2_R100: 82.8, O3_R100: 84.26, W1_R100: 95.0, V2_R100: 2.4, NBI_R100: 41.2 },
  { Country: 'North Macedonia', C1_R100: 66.0, T2_R100: 49.0, U1_R100: 59.0, B3_R100: 38.7, R2_R100: 46.6, O3_R100: 66.76, W1_R100: 0.0, V2_R100: 1.5, NBI_R100: 55.0 },
  { Country: 'Norway', C1_R100: 15.0, T2_R100: 31.0, U1_R100: 84.0, B3_R100: 38.0, R2_R100: 86.6, O3_R100: 85.38, W1_R100: 94.0, V2_R100: 22.5, NBI_R100: 29.7 },
  { Country: 'Poland', C1_R100: 25.0, T2_R100: 12.0, U1_R100: 60.0, B3_R100: 30.8, R2_R100: 59.2, O3_R100: 73.96, W1_R100: 72.0, V2_R100: 18.3, NBI_R100: 36.7 },
  { Country: 'Portugal', C1_R100: 75.0, T2_R100: 25.0, U1_R100: 67.0, B3_R100: 34.6, R2_R100: 71.4, O3_R100: 77.63, W1_R100: 93.0, V2_R100: 5.4, NBI_R100: 51.1 },
  { Country: 'Romania', C1_R100: 25.0, T2_R100: 28.0, U1_R100: 55.0, B3_R100: 29.1, R2_R100: 58.8, O3_R100: 74.06, W1_R100: 70.0, V2_R100: 13.9, NBI_R100: 42.4 },
  { Country: 'Russia', C1_R100: 25.0, T2_R100: 40.0, U1_R100: 75.0, B3_R100: 49.8, R2_R100: 26.2, O3_R100: 61.68, W1_R100: 44.0, V2_R100: 100.0, NBI_R100: 44.7 },
  { Country: 'San Marino', C1_R100: 70.0, T2_R100: 18.0, U1_R100: 98.0, B3_R100: 16.7, R2_R100: 79.6, O3_R100: 80.32, W1_R100: 0.0, V2_R100: 0.0, NBI_R100: 51.2 },
  { Country: 'Serbia', C1_R100: 25.0, T2_R100: 32.0, U1_R100: 57.0, B3_R100: 31.0, R2_R100: 48.6, O3_R100: 76.2, W1_R100: 0.0, V2_R100: 5.2, NBI_R100: 51.0 },
  { Country: 'Slovakia', C1_R100: 25.0, T2_R100: 31.0, U1_R100: 54.0, B3_R100: 40.2, R2_R100: 62.0, O3_R100: 80.97, W1_R100: 0.0, V2_R100: 2.9, NBI_R100: 58.9 },
  { Country: 'Slovenia', C1_R100: 66.0, T2_R100: 33.0, U1_R100: 55.0, B3_R100: 62.0, R2_R100: 70.8, O3_R100: 83.28, W1_R100: 93.0, V2_R100: 1.2, NBI_R100: 55.8 },
  { Country: 'Spain', C1_R100: 75.0, T2_R100: 44.0, U1_R100: 81.0, B3_R100: 36.9, R2_R100: 66.4, O3_R100: 79.77, W1_R100: 94.0, V2_R100: 29.6, NBI_R100: 48.6 },
  { Country: 'Sweden', C1_R100: 15.0, T2_R100: 21.0, U1_R100: 88.0, B3_R100: 68.9, R2_R100: 82.0, O3_R100: 83.36, W1_R100: 79.0, V2_R100: 26.3, NBI_R100: 30.4 },
  { Country: 'Switzerland', C1_R100: 25.0, T2_R100: 90.0, U1_R100: 74.0, B3_R100: 31.5, R2_R100: 85.2, O3_R100: 86.68, W1_R100: 0.0, V2_R100: 2.4, NBI_R100: 49.7 },
  { Country: 'Turkey', C1_R100: 45.0, T2_R100: 76.0, U1_R100: 77.0, B3_R100: 29.4, R2_R100: 39.8, O3_R100: 63.84, W1_R100: 76.0, V2_R100: 45.8, NBI_R100: 57.2 },
  { Country: 'Ukraine', C1_R100: 25.0, T2_R100: 12.0, U1_R100: 69.0, B3_R100: 16.7, R2_R100: 32.2, O3_R100: 67.01, W1_R100: 58.0, V2_R100: 35.3, NBI_R100: 41.5 },
  { Country: 'United Kingdom', C1_R100: 66.0, T2_R100: 11.0, U1_R100: 84.0, B3_R100: 13.2, R2_R100: 78.0, O3_R100: 85.4, W1_R100: 94.0, V2_R100: 14.2, NBI_R100: 32.0 },
  { Country: 'Vatican City', C1_R100: 75.0, T2_R100: 3.0, U1_R100: 100.0, B3_R100: 0.0, R2_R100: 0.0, O3_R100: 0.0, W1_R100: 0.0, V2_R100: 0.0, NBI_R100: 51.2 },
  { Country: 'Canada', C1_R100: 37.5, T2_R100: 32.5, U1_R100: 81.9, B3_R100: 38.7, R2_R100: 87.0, O3_R100: 85.0, W1_R100: 15.0, V2_R100: 58.4, NBI_R100: 60.0 },
  { Country: 'United States', C1_R100: 43.8, T2_R100: 50.7, U1_R100: 83.3, B3_R100: 33.9, R2_R100: 83.2, O3_R100: 88.0, W1_R100: 40.0, V2_R100: 57.5, NBI_R100: 70.0 },
  { Country: 'Mexico', C1_R100: 57.5, T2_R100: 74.1, U1_R100: 81.6, B3_R100: 33.8, R2_R100: 27.1, O3_R100: 70.0, W1_R100: 50.0, V2_R100: 11.5, NBI_R100: 92.8 },
  { Country: 'Belize', C1_R100: 92.5, T2_R100: 11.5, U1_R100: 46.6, B3_R100: 56.0, R2_R100: 0.0, O3_R100: 65.0, W1_R100: 60.0, V2_R100: 1.3, NBI_R100: 80.0 },
  { Country: 'Guatemala', C1_R100: 92.5, T2_R100: 50.6, U1_R100: 53.1, B3_R100: 32.9, R2_R100: 20.1, O3_R100: 55.0, W1_R100: 20.0, V2_R100: 6.4, NBI_R100: 75.0 },
  { Country: 'Honduras', C1_R100: 95.0, T2_R100: 45.6, U1_R100: 60.2, B3_R100: 56.8, R2_R100: 19.5, O3_R100: 50.0, W1_R100: 30.0, V2_R100: 6.6, NBI_R100: 80.0 },
  { Country: 'El Salvador', C1_R100: 92.5, T2_R100: 29.5, U1_R100: 75.4, B3_R100: 28.2, R2_R100: 38.6, O3_R100: 60.0, W1_R100: 70.0, V2_R100: 1.2, NBI_R100: 65.0 },
  { Country: 'Nicaragua', C1_R100: 85.0, T2_R100: 19.9, U1_R100: 59.8, B3_R100: 28.3, R2_R100: 14.7, O3_R100: 45.0, W1_R100: 80.0, V2_R100: 7.6, NBI_R100: 80.0 },
  { Country: 'Costa Rica', C1_R100: 100.0, T2_R100: 49.7, U1_R100: 82.6, B3_R100: 59.4, R2_R100: 58.5, O3_R100: 75.0, W1_R100: 80.0, V2_R100: 3.0, NBI_R100: 85.0 },
  { Country: 'Panama', C1_R100: 100.0, T2_R100: 24.0, U1_R100: 69.5, B3_R100: 56.8, R2_R100: 0.0, O3_R100: 78.0, W1_R100: 90.0, V2_R100: 4.4, NBI_R100: 80.0 },
  { Country: 'Bahamas', C1_R100: 100.0, T2_R100: 22.7, U1_R100: 83.6, B3_R100: 50.9, R2_R100: 0.0, O3_R100: 70.0, W1_R100: 100.0, V2_R100: 0.8, NBI_R100: 70.0 },
  { Country: 'Cuba', C1_R100: 100.0, T2_R100: 7.2, U1_R100: 77.5, B3_R100: 31.2, R2_R100: 22.0, O3_R100: 50.0, W1_R100: 100.0, V2_R100: 6.4, NBI_R100: 75.0 },
  { Country: 'Jamaica', C1_R100: 100.0, T2_R100: 22.7, U1_R100: 57.4, B3_R100: 55.1, R2_R100: 43.7, O3_R100: 65.0, W1_R100: 100.0, V2_R100: 0.6, NBI_R100: 70.0 },
  { Country: 'Haiti', C1_R100: 100.0, T2_R100: 31.3, U1_R100: 59.7, B3_R100: 12.6, R2_R100: 12.5, O3_R100: 40.0, W1_R100: 100.0, V2_R100: 1.6, NBI_R100: 40.0 },
  { Country: 'Dominican Republic', C1_R100: 100.0, T2_R100: 28.3, U1_R100: 84.4, B3_R100: 44.4, R2_R100: 44.9, O3_R100: 65.0, W1_R100: 100.0, V2_R100: 2.8, NBI_R100: 60.0 },
  { Country: 'Antigua and Barbuda', C1_R100: 100.0, T2_R100: 1.4, U1_R100: 24.3, B3_R100: 18.4, R2_R100: 0.0, O3_R100: 50.0, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 30.0 },
  { Country: 'Saint Kitts and Nevis', C1_R100: 100.0, T2_R100: 42.3, U1_R100: 31.1, B3_R100: 42.3, R2_R100: 0.0, O3_R100: 50.0, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 40.0 },
  { Country: 'Dominica', C1_R100: 100.0, T2_R100: 63.3, U1_R100: 72.0, B3_R100: 63.8, R2_R100: 0.0, O3_R100: 50.0, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 50.0 },
  { Country: 'Saint Lucia', C1_R100: 100.0, T2_R100: 34.1, U1_R100: 19.2, B3_R100: 34.0, R2_R100: 0.0, O3_R100: 50.0, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 45.0 },
  { Country: 'Saint Vincent and the Grenadines', C1_R100: 100.0, T2_R100: 15.0, U1_R100: 54.3, B3_R100: 73.2, R2_R100: 0.0, O3_R100: 50.0, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 50.0 },
  { Country: 'Barbados', C1_R100: 100.0, T2_R100: 6.7, U1_R100: 31.4, B3_R100: 14.7, R2_R100: 0.0, O3_R100: 55.0, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 30.0 },
  { Country: 'Grenada', C1_R100: 100.0, T2_R100: 37.1, U1_R100: 37.1, B3_R100: 52.1, R2_R100: 0.0, O3_R100: 50.0, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 40.0 },
  { Country: 'Trinidad and Tobago', C1_R100: 100.0, T2_R100: 5.5, U1_R100: 53.4, B3_R100: 44.5, R2_R100: 52.0, O3_R100: 75.0, W1_R100: 100.0, V2_R100: 0.3, NBI_R100: 50.0 },
  { Country: 'Colombia', C1_R100: 92.5, T2_R100: 39.5, U1_R100: 82.4, B3_R100: 53.3, R2_R100: 36.3, O3_R100: 70.0, W1_R100: 50.0, V2_R100: 66.8, NBI_R100: 95.0 },
  { Country: 'Venezuela', C1_R100: 92.5, T2_R100: 30.0, U1_R100: 88.4, B3_R100: 52.4, R2_R100: 4.0, O3_R100: 55.0, W1_R100: 70.0, V2_R100: 53.3, NBI_R100: 90.0 },
  { Country: 'Guyana', C1_R100: 100.0, T2_R100: 13.8, U1_R100: 27.2, B3_R100: 97.4, R2_R100: 39.3, O3_R100: 45.0, W1_R100: 90.0, V2_R100: 12.6, NBI_R100: 95.0 },
  { Country: 'Suriname', C1_R100: 100.0, T2_R100: 16.4, U1_R100: 66.4, B3_R100: 93.5, R2_R100: 46.7, O3_R100: 40.0, W1_R100: 90.0, V2_R100: 9.6, NBI_R100: 100.0 },
  { Country: 'Brazil', C1_R100: 80.0, T2_R100: 62.3, U1_R100: 87.8, B3_R100: 59.4, R2_R100: 40.2, O3_R100: 75.0, W1_R100: 60.0, V2_R100: 49.8, NBI_R100: 100.0 },
  { Country: 'Peru', C1_R100: 72.5, T2_R100: 103.7, U1_R100: 78.9, B3_R100: 56.5, R2_R100: 34.2, O3_R100: 60.0, W1_R100: 60.0, V2_R100: 75.2, NBI_R100: 98.0 },
  { Country: 'Bolivia', C1_R100: 70.0, T2_R100: 79.5, U1_R100: 71.2, B3_R100: 46.9, R2_R100: 16.3, O3_R100: 50.0, W1_R100: 0.0, V2_R100: 64.3, NBI_R100: 95.0 },
  { Country: 'Chile', C1_R100: 50.0, T2_R100: 124.7, U1_R100: 88.0, B3_R100: 24.5, R2_R100: 64.7, O3_R100: 80.0, W1_R100: 80.0, V2_R100: 44.2, NBI_R100: 70.0 },
  { Country: 'Argentina', C1_R100: 45.0, T2_R100: 39.7, U1_R100: 92.5, B3_R100: 10.4, R2_R100: 37.5, O3_R100: 78.0, W1_R100: 50.0, V2_R100: 16.3, NBI_R100: 85.0 },
  { Country: 'Uruguay', C1_R100: 75.0, T2_R100: 7.3, U1_R100: 95.8, B3_R100: 11.6, R2_R100: 67.2, O3_R100: 80.0, W1_R100: 80.0, V2_R100: 10.3, NBI_R100: 70.0 },
  { Country: 'Paraguay', C1_R100: 60.0, T2_R100: 11.9, U1_R100: 63.1, B3_R100: 40.5, R2_R100: 33.0, O3_R100: 50.0, W1_R100: 0.0, V2_R100: 23.8, NBI_R100: 80.0 },
  { Country: 'Ecuador', C1_R100: 72.5, T2_R100: 74.5, U1_R100: 64.8, B3_R100: 50.3, R2_R100: 23.2, O3_R100: 65.0, W1_R100: 50.0, V2_R100: 16.6, NBI_R100: 98.0 },
  { Country: 'Algeria', C1_R100: 20.0, T2_R100: 53.3, U1_R100: 75.3, B3_R100: 0.8, R2_R100: 36.5, O3_R100: 47.81, W1_R100: 30.0, V2_R100: 13.9, NBI_R100: 34.1 },
  { Country: 'Angola', C1_R100: 70.0, T2_R100: 42.7, U1_R100: 68.7, B3_R100: 52.1, R2_R100: 30.2, O3_R100: 62.54, W1_R100: 40.0, V2_R100: 72.9, NBI_R100: 64.1 },
  { Country: 'Benin', C1_R100: 80.0, T2_R100: 18.2, U1_R100: 50.1, B3_R100: 26.5, R2_R100: 35.5, O3_R100: 38.93, W1_R100: 15.0, V2_R100: 6.6, NBI_R100: 59.2 },
  { Country: 'Botswana', C1_R100: 30.0, T2_R100: 67.5, U1_R100: 72.9, B3_R100: 26.3, R2_R100: 50.0, O3_R100: 46.38, W1_R100: 0.0, V2_R100: 34.0, NBI_R100: 60.9 },
  { Country: 'Burkina Faso', C1_R100: 50.0, T2_R100: 19.8, U1_R100: 32.5, B3_R100: 22.2, R2_R100: 27.8, O3_R100: 38.56, W1_R100: 0.0, V2_R100: 16.0, NBI_R100: 57.3 },
  { Country: 'Burundi', C1_R100: 80.0, T2_R100: 10.5, U1_R100: 14.8, B3_R100: 10.9, R2_R100: 21.0, O3_R100: 29.75, W1_R100: 0.0, V2_R100: 1.6, NBI_R100: 58.7 },
  { Country: 'Cabo Verde', C1_R100: 20.0, T2_R100: 21.7, U1_R100: 68.0, B3_R100: 11.6, R2_R100: 50.0, O3_R100: 55.44, W1_R100: 100.0, V2_R100: 0.2, NBI_R100: 59.2 },
  { Country: 'Cameroon', C1_R100: 90.0, T2_R100: 44.5, U1_R100: 59.3, B3_R100: 42.7, R2_R100: 24.6, O3_R100: 37.77, W1_R100: 20.0, V2_R100: 27.8, NBI_R100: 59.9 },
  { Country: 'Central African Republic', C1_R100: 85.0, T2_R100: 42.3, U1_R100: 43.6, B3_R100: 35.7, R2_R100: 19.4, O3_R100: 31.2, W1_R100: 0.0, V2_R100: 36.4, NBI_R100: 59.3 },
  { Country: 'Chad', C1_R100: 15.0, T2_R100: 36.2, U1_R100: 24.4, B3_R100: 3.2, R2_R100: 18.2, O3_R100: 32.95, W1_R100: 0.0, V2_R100: 75.1, NBI_R100: 57.7 },
  { Country: 'Comoros', C1_R100: 90.0, T2_R100: 11.3, U1_R100: 30.1, B3_R100: 17.0, R2_R100: 30.6, O3_R100: 48.03, W1_R100: 100.0, V2_R100: 0.1, NBI_R100: 60.9 },
  { Country: 'Congo (Republic)', C1_R100: 95.0, T2_R100: 28.7, U1_R100: 69.2, B3_R100: 64.1, R2_R100: 20.0, O3_R100: 46.33, W1_R100: 0.0, V2_R100: 20.0, NBI_R100: 64.9 },
  { Country: 'Congo (Democratic Republic)', C1_R100: 100.0, T2_R100: 48.4, U1_R100: 47.4, B3_R100: 54.2, R2_R100: 15.6, O3_R100: 27.17, W1_R100: 0.0, V2_R100: 13.7, NBI_R100: 65.1 },
  { Country: 'Côte d’Ivoire', C1_R100: 90.0, T2_R100: 16.7, U1_R100: 53.1, B3_R100: 7.9, R2_R100: 30.2, O3_R100: 41.24, W1_R100: 20.0, V2_R100: 18.9, NBI_R100: 63.2 },
  { Country: 'Djibouti', C1_R100: 10.0, T2_R100: 28.7, U1_R100: 49.3, B3_R100: 0.3, R2_R100: 23.0, O3_R100: 49.35, W1_R100: 0.0, V2_R100: 1.4, NBI_R100: 58.7 },
  { Country: 'Egypt', C1_R100: 5.0, T2_R100: 21.4, U1_R100: 43.1, B3_R100: 0.0, R2_R100: 31.4, O3_R100: 61.38, W1_R100: 30.0, V2_R100: 58.6, NBI_R100: 0.8 },
  { Country: 'Equatorial Guinea', C1_R100: 95.0, T2_R100: 17.5, U1_R100: 74.4, B3_R100: 86.4, R2_R100: 22.2, O3_R100: 46.33, W1_R100: 70.0, V2_R100: 1.6, NBI_R100: 71.4 },
  { Country: 'Eritrea', C1_R100: 20.0, T2_R100: 28.5, U1_R100: 43.3, B3_R100: 8.6, R2_R100: 19.2, O3_R100: 35.57, W1_R100: 0.0, V2_R100: 6.9, NBI_R100: 58.7 },
  { Country: 'Eswatini', C1_R100: 70.0, T2_R100: 20.3, U1_R100: 24.8, B3_R100: 29.1, R2_R100: 37.2, O3_R100: 46.38, W1_R100: 50.0, V2_R100: 1.0, NBI_R100: 60.9 },
  { Country: 'Ethiopia', C1_R100: 50.0, T2_R100: 39.5, U1_R100: 23.2, B3_R100: 14.9, R2_R100: 34.2, O3_R100: 40.0, W1_R100: 0.0, V2_R100: 64.6, NBI_R100: 59.3 },
  { Country: 'Gabon', C1_R100: 95.0, T2_R100: 25.1, U1_R100: 89.0, B3_R100: 91.2, R2_R100: 27.6, O3_R100: 58.05, W1_R100: 15.0, V2_R100: 15.7, NBI_R100: 64.1 },
  { Country: 'Gambia', C1_R100: 90.0, T2_R100: 2.3, U1_R100: 64.5, B3_R100: 22.3, R2_R100: 32.0, O3_R100: 49.65, W1_R100: 50.0, V2_R100: 0.7, NBI_R100: 60.2 },
  { Country: 'Ghana', C1_R100: 90.0, T2_R100: 12.7, U1_R100: 59.2, B3_R100: 41.3, R2_R100: 46.0, O3_R100: 46.52, W1_R100: 30.0, V2_R100: 14.0, NBI_R100: 64.6 },
  { Country: 'Guinea', C1_R100: 85.0, T2_R100: 24.7, U1_R100: 38.1, B3_R100: 24.7, R2_R100: 26.4, O3_R100: 36.18, W1_R100: 20.0, V2_R100: 14.4, NBI_R100: 60.3 },
  { Country: 'Guinea-Bissau', C1_R100: 95.0, T2_R100: 7.0, U1_R100: 45.5, B3_R100: 59.2, R2_R100: 22.6, O3_R100: 43.85, W1_R100: 80.0, V2_R100: 2.1, NBI_R100: 59.2 },
  { Country: 'Kenya', C1_R100: 80.0, T2_R100: 50.8, U1_R100: 29.5, B3_R100: 6.2, R2_R100: 43.4, O3_R100: 43.22, W1_R100: 10.0, V2_R100: 33.9, NBI_R100: 64.3 },
  { Country: 'Lesotho', C1_R100: 30.0, T2_R100: 144.1, U1_R100: 30.4, B3_R100: 1.1, R2_R100: 30.2, O3_R100: 46.38, W1_R100: 0.0, V2_R100: 1.8, NBI_R100: 1.1 },
  { Country: 'Liberia', C1_R100: 95.0, T2_R100: 7.8, U1_R100: 53.6, B3_R100: 78.1, R2_R100: 18.6, O3_R100: 42.3, W1_R100: 40.0, V2_R100: 6.5, NBI_R100: 59.7 },
  { Country: 'Libya', C1_R100: 5.0, T2_R100: 28.2, U1_R100: 75.3, B3_R100: 0.1, R2_R100: 15.2, O3_R100: 51.36, W1_R100: 0.0, V2_R100: 10.3, NBI_R100: 0.1 },
  { Country: 'Madagascar', C1_R100: 90.0, T2_R100: 29.5, U1_R100: 40.6, B3_R100: 21.3, R2_R100: 37.2, O3_R100: 46.38, W1_R100: 70.0, V2_R100: 34.3, NBI_R100: 81.3 },
  { Country: 'Malawi', C1_R100: 85.0, T2_R100: 51.9, U1_R100: 18.3, B3_R100: 22.4, R2_R100: 41.0, O3_R100: 39.27, W1_R100: 0.0, V2_R100: 6.9, NBI_R100: 62.7 },
  { Country: 'Mali', C1_R100: 10.0, T2_R100: 22.9, U1_R100: 46.2, B3_R100: 10.9, R2_R100: 26.2, O3_R100: 36.26, W1_R100: 0.0, V2_R100: 72.5, NBI_R100: 38.1 },
  { Country: 'Mauritania', C1_R100: 5.0, T2_R100: 18.4, U1_R100: 57.7, B3_R100: 0.3, R2_R100: 22.4, O3_R100: 43.33, W1_R100: 25.0, V2_R100: 60.3, NBI_R100: 34.1 },
  { Country: 'Mauritius', C1_R100: 80.0, T2_R100: 20.3, U1_R100: 40.9, B3_R100: 19.5, R2_R100: 66.2, O3_R100: 73.65, W1_R100: 100.0, V2_R100: 0.1, NBI_R100: 50.0 },
  { Country: 'Morocco', C1_R100: 50.0, T2_R100: 60.6, U1_R100: 65.1, B3_R100: 12.9, R2_R100: 40.0, O3_R100: 47.81, W1_R100: 30.0, V2_R100: 26.1, NBI_R100: 63.2 },
  { Country: 'Mozambique', C1_R100: 85.0, T2_R100: 23.0, U1_R100: 38.8, B3_R100: 28.3, R2_R100: 35.6, O3_R100: 34.53, W1_R100: 50.0, V2_R100: 46.9, NBI_R100: 52.2 },
  { Country: 'Namibia', C1_R100: 20.0, T2_R100: 52.0, U1_R100: 54.9, B3_R100: 7.8, R2_R100: 50.0, O3_R100: 53.23, W1_R100: 0.0, V2_R100: 48.3, NBI_R100: 7.8 },
  { Country: 'Niger', C1_R100: 5.0, T2_R100: 31.6, U1_R100: 17.1, B3_R100: 0.8, R2_R100: 21.0, O3_R100: 33.05, W1_R100: 0.0, V2_R100: 74.1, NBI_R100: 8.0 },
  { Country: 'Nigeria', C1_R100: 80.0, T2_R100: 25.3, U1_R100: 54.3, B3_R100: 23.2, R2_R100: 35.4, O3_R100: 37.82, W1_R100: 20.0, V2_R100: 54.0, NBI_R100: 54.8 },
  { Country: 'Rwanda', C1_R100: 85.0, T2_R100: 10.9, U1_R100: 17.9, B3_R100: 11.0, R2_R100: 40.0, O3_R100: 38.87, W1_R100: 0.0, V2_R100: 1.5, NBI_R100: 55.4 },
  { Country: 'São Tomé and Príncipe', C1_R100: 95.0, T2_R100: 12.3, U1_R100: 74.4, B3_R100: 52.1, R2_R100: 25.8, O3_R100: 53.06, W1_R100: 100.0, V2_R100: 0.1, NBI_R100: 52.1 },
  { Country: 'Senegal', C1_R100: 70.0, T2_R100: 4.6, U1_R100: 49.6, B3_R100: 41.3, R2_R100: 45.4, O3_R100: 50.07, W1_R100: 30.0, V2_R100: 11.5, NBI_R100: 65.2 },
  { Country: 'Seychelles', C1_R100: 90.0, T2_R100: 2.3, U1_R100: 58.8, B3_R100: 73.3, R2_R100: 52.5, O3_R100: 73.65, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 71.0 },
  { Country: 'Sierra Leone', C1_R100: 90.0, T2_R100: 9.1, U1_R100: 44.3, B3_R100: 34.3, R2_R100: 32.2, O3_R100: 37.74, W1_R100: 20.0, V2_R100: 4.2, NBI_R100: 65.2 },
  { Country: 'Somalia', C1_R100: 20.0, T2_R100: 27.3, U1_R100: 47.9, B3_R100: 9.2, R2_R100: 12.5, O3_R100: 30.98, W1_R100: 60.0, V2_R100: 37.3, NBI_R100: 65.0 },
  { Country: 'South Africa', C1_R100: 60.0, T2_R100: 68.7, U1_R100: 68.8, B3_R100: 14.0, R2_R100: 51.8, O3_R100: 64.08, W1_R100: 30.0, V2_R100: 71.4, NBI_R100: 71.4 },
  { Country: 'South Sudan', C1_R100: 85.0, T2_R100: 42.9, U1_R100: 21.2, B3_R100: 0.0, R2_R100: 24.0, O3_R100: 31.84, W1_R100: 0.0, V2_R100: 37.7, NBI_R100: 65.0 },
  { Country: 'Sudan', C1_R100: 15.0, T2_R100: 37.9, U1_R100: 36.3, B3_R100: 9.6, R2_R100: 24.6, O3_R100: 31.84, W1_R100: 5.0, V2_R100: 10.9, NBI_R100: 53.9 },
  { Country: 'Tanzania', C1_R100: 90.0, T2_R100: 67.9, U1_R100: 37.4, B3_R100: 50.1, R2_R100: 39.6, O3_R100: 34.54, W1_R100: 20.0, V2_R100: 55.4, NBI_R100: 67.4 },
  { Country: 'Togo', C1_R100: 90.0, T2_R100: 18.2, U1_R100: 44.5, B3_R100: 22.1, R2_R100: 33.0, O3_R100: 39.53, W1_R100: 20.0, V2_R100: 3.3, NBI_R100: 69.3 },
  { Country: 'Tunisia', C1_R100: 40.0, T2_R100: 16.4, U1_R100: 70.5, B3_R100: 4.6, R2_R100: 45.4, O3_R100: 47.36, W1_R100: 80.0, V2_R100: 9.6, NBI_R100: 46.4 },
  { Country: 'Uganda', C1_R100: 85.0, T2_R100: 43.4, U1_R100: 26.8, B3_R100: 11.0, R2_R100: 38.2, O3_R100: 37.97, W1_R100: 0.0, V2_R100: 14.1, NBI_R100: 65.5 },
  { Country: 'Zambia', C1_R100: 80.0, T2_R100: 53.8, U1_R100: 46.3, B3_R100: 59.5, R2_R100: 37.2, O3_R100: 44.02, W1_R100: 0.0, V2_R100: 44.0, NBI_R100: 53.7 },
  { Country: 'Zimbabwe', C1_R100: 80.0, T2_R100: 64.1, U1_R100: 32.5, B3_R100: 44.7, R2_R100: 31.6, O3_R100: 47.36, W1_R100: 0.0, V2_R100: 22.9, NBI_R100: 58.6 },
  { Country: 'Australia', C1_R100: 50.0, T2_R100: 22.0, U1_R100: 86.6, B3_R100: 17.4, R2_R100: 80.8, O3_R100: 84.63, W1_R100: 95.0, V2_R100: 45.3, NBI_R100: 71.0 },
  { Country: 'Federated States of Micronesia', C1_R100: 95.0, T2_R100: 92.2, U1_R100: 23.4, B3_R100: 92.2, R2_R100: 40.4, O3_R100: 62.36, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 52.0 },
  { Country: 'Fiji', C1_R100: 90.0, T2_R100: 63.5, U1_R100: 58.7, B3_R100: 57.6, R2_R100: 52.6, O3_R100: 63.88, W1_R100: 80.0, V2_R100: 1.1, NBI_R100: 52.0 },
  { Country: 'Kiribati', C1_R100: 95.0, T2_R100: 1.5, U1_R100: 57.8, B3_R100: 1.5, R2_R100: 37.0, O3_R100: 53.75, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 56.0 },
  { Country: 'Marshall Islands', C1_R100: 95.0, T2_R100: 2.0, U1_R100: 78.9, B3_R100: 0.0, R2_R100: 32.0, O3_R100: 0.0, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 50.0 },
  { Country: 'Nauru', C1_R100: 90.0, T2_R100: 0.0, U1_R100: 100.0, B3_R100: 0.0, R2_R100: 40.0, O3_R100: 0.0, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 0.0 },
  { Country: 'New Zealand', C1_R100: 70.0, T2_R100: 25.9, U1_R100: 87.0, B3_R100: 37.8, R2_R100: 84.2, O3_R100: 80.77, W1_R100: 90.0, V2_R100: 15.8, NBI_R100: 71.0 },
  { Country: 'Palau', C1_R100: 95.0, T2_R100: 90.5, U1_R100: 82.4, B3_R100: 90.5, R2_R100: 69.7, O3_R100: 71.28, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 71.0 },
  { Country: 'Papua New Guinea', C1_R100: 95.0, T2_R100: 44.5, U1_R100: 13.7, B3_R100: 79.0, R2_R100: 30.2, O3_R100: 35.38, W1_R100: 61.0, V2_R100: 27.1, NBI_R100: 77.5 },
  { Country: 'Samoa', C1_R100: 90.0, T2_R100: 57.6, U1_R100: 17.5, B3_R100: 57.6, R2_R100: 74.0, O3_R100: 65.48, W1_R100: 100.0, V2_R100: 0.2, NBI_R100: 52.0 },
  { Country: 'Solomon Islands', C1_R100: 95.0, T2_R100: 90.1, U1_R100: 26.0, B3_R100: 90.1, R2_R100: 33.4, O3_R100: 47.96, W1_R100: 90.0, V2_R100: 1.7, NBI_R100: 65.2 },
  { Country: 'Tonga', C1_R100: 90.0, T2_R100: 33.3, U1_R100: 23.2, B3_R100: 12.4, R2_R100: 45.0, O3_R100: 63.29, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 69.3 },
  { Country: 'Tuvalu', C1_R100: 95.0, T2_R100: 33.3, U1_R100: 66.2, B3_R100: 33.3, R2_R100: 70.2, O3_R100: 53.06, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 52.0 },
  { Country: 'Vanuatu', C1_R100: 95.0, T2_R100: 36.3, U1_R100: 26.0, B3_R100: 36.3, R2_R100: 49.4, O3_R100: 59.83, W1_R100: 90.0, V2_R100: 0.7, NBI_R100: 52.0 },
  { Country: 'Afghanistan', C1_R100: 10.0, T2_R100: 100.0, U1_R100: 26.0, B3_R100: 2.0, R2_R100: 15.0, O3_R100: 25.0, W1_R100: 0.0, V2_R100: 38.1, NBI_R100: 45.9 },
  { Country: 'Armenia', C1_R100: 5.0, T2_R100: 100.0, U1_R100: 63.3, B3_R100: 11.0, R2_R100: 40.0, O3_R100: 35.0, W1_R100: 0.0, V2_R100: 1.7, NBI_R100: 55.9 },
  { Country: 'Azerbaijan', C1_R100: 10.0, T2_R100: 26.0, U1_R100: 56.4, B3_R100: 11.0, R2_R100: 40.0, O3_R100: 45.0, W1_R100: 0.0, V2_R100: 5.1, NBI_R100: 53.4 },
  { Country: 'Bahrain', C1_R100: 0.0, T2_R100: 20.0, U1_R100: 100.0, B3_R100: 0.0, R2_R100: 60.0, O3_R100: 80.0, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 5.0 },
  { Country: 'Bangladesh', C1_R100: 90.0, T2_R100: 5.7, U1_R100: 38.2, B3_R100: 10.2, R2_R100: 50.0, O3_R100: 40.0, W1_R100: 50.0, V2_R100: 8.6, NBI_R100: 53.8 },
  { Country: 'Bhutan', C1_R100: 20.0, T2_R100: 100.0, U1_R100: 42.3, B3_R100: 64.2, R2_R100: 70.0, O3_R100: 60.0, W1_R100: 30.0, V2_R100: 2.2, NBI_R100: 60.7 },
  { Country: 'Brunei', C1_R100: 80.0, T2_R100: 31.9, U1_R100: 78.3, B3_R100: 77.7, R2_R100: 70.0, O3_R100: 55.0, W1_R100: 0.0, V2_R100: 0.3, NBI_R100: 77.7 },
  { Country: 'Cambodia', C1_R100: 95.0, T2_R100: 8.4, U1_R100: 24.2, B3_R100: 47.0, R2_R100: 15.0, O3_R100: 30.0, W1_R100: 40.0, V2_R100: 10.6, NBI_R100: 56.8 },
  { Country: 'China', C1_R100: 60.0, T2_R100: 100.0, U1_R100: 61.4, B3_R100: 17.5, R2_R100: 65.0, O3_R100: 50.0, W1_R100: 80.0, V2_R100: 56.1, NBI_R100: 83.9 },
  { Country: 'Georgia', C1_R100: 50.0, T2_R100: 95.5, U1_R100: 59.5, B3_R100: 40.0, R2_R100: 40.0, O3_R100: 40.0, W1_R100: 0.0, V2_R100: 4.1, NBI_R100: 55.3 },
  { Country: 'India', C1_R100: 75.0, T2_R100: 41.4, U1_R100: 34.9, B3_R100: 21.6, R2_R100: 45.0, O3_R100: 45.0, W1_R100: 20.0, V2_R100: 19.2, NBI_R100: 73.2 },
  { Country: 'Indonesia', C1_R100: 80.0, T2_R100: 24.5, U1_R100: 56.6, B3_R100: 50.0, R2_R100: 55.0, O3_R100: 70.0, W1_R100: 75.0, V2_R100: 11.1, NBI_R100: 100.0 },
  { Country: 'Iran', C1_R100: 10.0, T2_R100: 87.0, U1_R100: 75.9, B3_R100: 5.0, R2_R100: 25.0, O3_R100: 45.0, W1_R100: 30.0, V2_R100: 96.4, NBI_R100: 47.1 },
  { Country: 'Iraq', C1_R100: 30.0, T2_R100: 27.5, U1_R100: 70.9, B3_R100: 1.0, R2_R100: 20.0, O3_R100: 35.0, W1_R100: 5.0, V2_R100: 25.6, NBI_R100: 43.1 },
  { Country: 'Israel', C1_R100: 50.0, T2_R100: 33.9, U1_R100: 92.6, B3_R100: 4.0, R2_R100: 70.0, O3_R100: 60.0, W1_R100: 100.0, V2_R100: 1.2, NBI_R100: 60.1 },
  { Country: 'Japan', C1_R100: 50.0, T2_R100: 29.2, U1_R100: 91.8, B3_R100: 67.0, R2_R100: 80.0, O3_R100: 75.0, W1_R100: 95.0, V2_R100: 22.1, NBI_R100: 63.8 },
  { Country: 'Jordan', C1_R100: 5.0, T2_R100: 54.1, U1_R100: 91.4, B3_R100: 0.0, R2_R100: 50.0, O3_R100: 45.0, W1_R100: 100.0, V2_R100: 5.2, NBI_R100: 46.8 },
  { Country: 'Kazakhstan', C1_R100: 10.0, T2_R100: 18.3, U1_R100: 57.7, B3_R100: 1.0, R2_R100: 30.0, O3_R100: 35.0, W1_R100: 0.0, V2_R100: 15.9, NBI_R100: 43.5 },
  { Country: 'North Korea', C1_R100: 50.0, T2_R100: 7.7, U1_R100: 62.4, B3_R100: 22.0, R2_R100: 20.0, O3_R100: 30.0, W1_R100: 0.0, V2_R100: 7.0, NBI_R100: 37.0 },
  { Country: 'South Korea', C1_R100: 50.0, T2_R100: 7.7, U1_R100: 81.4, B3_R100: 64.0, R2_R100: 85.0, O3_R100: 80.0, W1_R100: 95.0, V2_R100: 5.9, NBI_R100: 42.3 },
  { Country: 'Kuwait', C1_R100: 0.0, T2_R100: 20.3, U1_R100: 100.0, B3_R100: 0.0, R2_R100: 60.0, O3_R100: 90.0, W1_R100: 100.0, V2_R100: 1.0, NBI_R100: 22.4 },
  { Country: 'Kyrgyzstan', C1_R100: 20.0, T2_R100: 100.0, U1_R100: 36.9, B3_R100: 2.0, R2_R100: 35.0, O3_R100: 15.0, W1_R100: 0.0, V2_R100: 11.7, NBI_R100: 41.4 },
  { Country: 'Laos', C1_R100: 95.0, T2_R100: 44.7, U1_R100: 36.3, B3_R100: 47.0, R2_R100: 20.0, O3_R100: 30.0, W1_R100: 0.0, V2_R100: 13.8, NBI_R100: 61.5 },
  { Country: 'Lebanon', C1_R100: 50.0, T2_R100: 25.3, U1_R100: 88.9, B3_R100: 13.0, R2_R100: 50.0, O3_R100: 40.0, W1_R100: 100.0, V2_R100: 0.6, NBI_R100: 56.9 },
  { Country: 'Malaysia', C1_R100: 90.0, T2_R100: 60.3, U1_R100: 77.2, B3_R100: 58.0, R2_R100: 75.0, O3_R100: 80.0, W1_R100: 80.0, V2_R100: 19.3, NBI_R100: 80.9 },
  { Country: 'Maldives', C1_R100: 100.0, T2_R100: 0.1, U1_R100: 58.3, B3_R100: 0.0, R2_R100: 40.0, O3_R100: 30.0, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 50.0 },
  { Country: 'Mongolia', C1_R100: 10.0, T2_R100: 100.0, U1_R100: 68.7, B3_R100: 10.0, R2_R100: 20.0, O3_R100: 15.0, W1_R100: 0.0, V2_R100: 91.5, NBI_R100: 35.8 },
  { Country: 'Myanmar', C1_R100: 80.0, T2_R100: 41.9, U1_R100: 31.1, B3_R100: 48.0, R2_R100: 30.0, O3_R100: 35.0, W1_R100: 50.0, V2_R100: 39.6, NBI_R100: 62.8 },
  { Country: 'Nepal', C1_R100: 30.0, T2_R100: 100.0, U1_R100: 20.6, B3_R100: 27.0, R2_R100: 30.0, O3_R100: 25.0, W1_R100: 0.0, V2_R100: 8.6, NBI_R100: 64.2 },
  { Country: 'Oman', C1_R100: 10.0, T2_R100: 63.5, U1_R100: 86.3, B3_R100: 5.0, R2_R100: 40.0, O3_R100: 30.0, W1_R100: 30.0, V2_R100: 18.1, NBI_R100: 35.8 },
  { Country: 'Pakistan', C1_R100: 20.0, T2_R100: 60.0, U1_R100: 37.2, B3_R100: 3.0, R2_R100: 40.0, O3_R100: 40.0, W1_R100: 20.0, V2_R100: 51.6, NBI_R100: 49.5 },
  { Country: 'Philippines', C1_R100: 100.0, T2_R100: 19.1, U1_R100: 47.4, B3_R100: 24.0, R2_R100: 45.0, O3_R100: 75.0, W1_R100: 100.0, V2_R100: 17.5, NBI_R100: 78.6 },
  { Country: 'Qatar', C1_R100: 0.0, T2_R100: 3.1, U1_R100: 99.2, B3_R100: 0.0, R2_R100: 50.0, O3_R100: 90.0, W1_R100: 100.0, V2_R100: 0.7, NBI_R100: 18.9 },
  { Country: 'Saudi Arabia', C1_R100: 0.0, T2_R100: 50.1, U1_R100: 84.3, B3_R100: 1.0, R2_R100: 35.0, O3_R100: 55.0, W1_R100: 40.0, V2_R100: 12.6, NBI_R100: 28.1 },
  { Country: 'Singapore', C1_R100: 100.0, T2_R100: 1.0, U1_R100: 100.0, B3_R100: 4.0, R2_R100: 95.0, O3_R100: 95.0, W1_R100: 100.0, V2_R100: 0.0, NBI_R100: 4.0 },
  { Country: 'Sri Lanka', C1_R100: 100.0, T2_R100: 20.6, U1_R100: 18.7, B3_R100: 30.0, R2_R100: 40.0, O3_R100: 65.0, W1_R100: 100.0, V2_R100: 3.8, NBI_R100: 65.6 },
  { Country: 'Syria', C1_R100: 20.0, T2_R100: 34.3, U1_R100: 55.5, B3_R100: 0.0, R2_R100: 30.0, O3_R100: 40.0, W1_R100: 100.0, V2_R100: 10.8, NBI_R100: 46.9 },
  { Country: 'Tajikistan', C1_R100: 20.0, T2_R100: 100.0, U1_R100: 27.5, B3_R100: 2.0, R2_R100: 25.0, O3_R100: 20.0, W1_R100: 0.0, V2_R100: 8.4, NBI_R100: 45.6 },
  { Country: 'Thailand', C1_R100: 80.0, T2_R100: 19.1, U1_R100: 51.4, B3_R100: 34.0, R2_R100: 50.0, O3_R100: 65.0, W1_R100: 80.0, V2_R100: 29.9, NBI_R100: 67.0 },
  { Country: 'Timor-Leste', C1_R100: 100.0, T2_R100: 58.7, U1_R100: 31.3, B3_R100: 60.0, R2_R100: 30.0, O3_R100: 40.0, W1_R100: 100.0, V2_R100: 0.9, NBI_R100: 80.0 },
  { Country: 'Turkmenistan', C1_R100: 5.0, T2_R100: 15.3, U1_R100: 52.5, B3_R100: 5.0, R2_R100: 20.0, O3_R100: 20.0, W1_R100: 0.0, V2_R100: 28.5, NBI_R100: 44.5 },
  { Country: 'United Arab Emirates', C1_R100: 0.0, T2_R100: 9.9, U1_R100: 87.1, B3_R100: 0.0, R2_R100: 35.0, O3_R100: 55.0, W1_R100: 100.0, V2_R100: 4.9, NBI_R100: 39.2 },
  { Country: 'Uzbekistan', C1_R100: 0.0, T2_R100: 30.0, U1_R100: 50.4, B3_R100: 2.0, R2_R100: 25.0, O3_R100: 25.0, W1_R100: 0.0, V2_R100: 26.2, NBI_R100: 43.6 },
  { Country: 'Vietnam', C1_R100: 85.0, T2_R100: 26.5, U1_R100: 37.3, B3_R100: 47.0, R2_R100: 45.0, O3_R100: 55.0, W1_R100: 90.0, V2_R100: 19.4, NBI_R100: 68.2 },
  { Country: 'Yemen', C1_R100: 50.0, T2_R100: 66.6, U1_R100: 37.9, B3_R100: 3.0, R2_R100: 20.0, O3_R100: 35.0, W1_R100: 60.0, V2_R100: 30.9, NBI_R100: 38.7 },
];

const countryToCode: { [key: string]: string } = {
  'Albania': 'AL',
  'Andorra': 'AD',
  'Austria': 'AT',
  'Belarus': 'BY',
  'Belgium': 'BE',
  'Bosnia and Herzegovina': 'BA',
  'Bulgaria': 'BG',
  'Croatia': 'HR',
  'Cyprus': 'CY',
  'Czechia': 'CZ',
  'Denmark': 'DK',
  'Estonia': 'EE',
  'Finland': 'FI',
  'France': 'FR',
  'Germany': 'DE',
  'Greece': 'GR',
  'Hungary': 'HU',
  'Iceland': 'IS',
  'Ireland': 'IE',
  'Italy': 'IT',
  'Kosovo': 'XK',
  'Latvia': 'LV',
  'Liechtenstein': 'LI',
  'Lithuania': 'LT',
  'Luxembourg': 'LU',
  'Malta': 'MT',
  'Moldova': 'MD',
  'Monaco': 'MC',
  'Montenegro': 'ME',
  'Netherlands': 'NL',
  'North Macedonia': 'MK',
  'Norway': 'NO',
  'Poland': 'PL',
  'Portugal': 'PT',
  'Romania': 'RO',
  'Russia': 'RU',
  'San Marino': 'SM',
  'Serbia': 'RS',
  'Slovakia': 'SK',
  'Slovenia': 'SI',
  'Spain': 'ES',
  'Sweden': 'SE',
  'Switzerland': 'CH',
  'Turkey': 'TR',
  'Ukraine': 'UA',
  'United Kingdom': 'GB',
  'Vatican City': 'VA',
  'Canada': 'CA',
  'United States': 'US',
  'Mexico': 'MX',
  'Belize': 'BZ',
  'Guatemala': 'GT',
  'Honduras': 'HN',
  'El Salvador': 'SV',
  'Nicaragua': 'NI',
  'Costa Rica': 'CR',
  'Panama': 'PA',
  'Bahamas': 'BS',
  'Cuba': 'CU',
  'Jamaica': 'JM',
  'Haiti': 'HT',
  'Dominican Republic': 'DO',
  'Antigua and Barbuda': 'AG',
  'Saint Kitts and Nevis': 'KN',
  'Dominica': 'DM',
  'Saint Lucia': 'LC',
  'Saint Vincent and the Grenadines': 'VC',
  'Barbados': 'BB',
  'Grenada': 'GD',
  'Trinidad and Tobago': 'TT',
  'Colombia': 'CO',
  'Venezuela': 'VE',
  'Guyana': 'GY',
  'Suriname': 'SR',
  'Brazil': 'BR',
  'Peru': 'PE',
  'Bolivia': 'BO',
  'Chile': 'CL',
  'Argentina': 'AR',
  'Uruguay': 'UY',
  'Paraguay': 'PY',
  'Ecuador': 'EC',
  'Algeria': 'DZ',
  'Angola': 'AO',
  'Benin': 'BJ',
  'Botswana': 'BW',
  'Burkina Faso': 'BF',
  'Burundi': 'BI',
  'Cabo Verde': 'CV',
  'Cameroon': 'CM',
  'Central African Republic': 'CF',
  'Chad': 'TD',
  'Comoros': 'KM',
  'Congo (Republic)': 'CG',
  'Congo (Democratic Republic)': 'CD',
  'Côte d’Ivoire': 'CI',
  'Djibouti': 'DJ',
  'Egypt': 'EG',
  'Equatorial Guinea': 'GQ',
  'Eritrea': 'ER',
  'Eswatini': 'SZ',
  'Ethiopia': 'ET',
  'Gabon': 'GA',
  'Gambia': 'GM',
  'Ghana': 'GH',
  'Guinea': 'GN',
  'Guinea-Bissau': 'GW',
  'Kenya': 'KE',
  'Lesotho': 'LS',
  'Liberia': 'LR',
  'Libya': 'LY',
  'Madagascar': 'MG',
  'Malawi': 'MW',
  'Mali': 'ML',
  'Mauritania': 'MR',
  'Mauritius': 'MU',
  'Morocco': 'MA',
  'Mozambique': 'MZ',
  'Namibia': 'NA',
  'Niger': 'NE',
  'Nigeria': 'NG',
  'Rwanda': 'RW',
  'São Tomé and Príncipe': 'ST',
  'Senegal': 'SN',
  'Seychelles': 'SC',
  'Sierra Leone': 'SL',
  'Somalia': 'SO',
  'South Africa': 'ZA',
  'South Sudan': 'SS',
  'Sudan': 'SD',
  'Tanzania': 'TZ',
  'Togo': 'TG',
  'Tunisia': 'TN',
  'Uganda': 'UG',
  'Zambia': 'ZM',
  'Zimbabwe': 'ZW',
  'Australia': 'AU',
  'Federated States of Micronesia': 'FM',
  'Fiji': 'FJ',
  'Kiribati': 'KI',
  'Marshall Islands': 'MH',
  'Nauru': 'NR',
  'New Zealand': 'NZ',
  'Palau': 'PW',
  'Papua New Guinea': 'PG',
  'Samoa': 'WS',
  'Solomon Islands': 'SB',
  'Tonga': 'TO',
  'Tuvalu': 'TV',
  'Vanuatu': 'VU',
  'Afghanistan': 'AF',
  'Armenia': 'AM',
  'Azerbaijan': 'AZ',
  'Bahrain': 'BH',
  'Bangladesh': 'BD',
  'Bhutan': 'BT',
  'Brunei': 'BN',
  'Cambodia': 'KH',
  'China': 'CN',
  'Georgia': 'GE',
  'India': 'IN',
  'Indonesia': 'ID',
  'Iran': 'IR',
  'Iraq': 'IQ',
  'Israel': 'IL',
  'Japan': 'JP',
  'Jordan': 'JO',
  'Kazakhstan': 'KZ',
  'North Korea': 'KP',
  'South Korea': 'KR',
  'Kuwait': 'KW',
  'Kyrgyzstan': 'KG',
  'Laos': 'LA',
  'Lebanon': 'LB',
  'Malaysia': 'MY',
  'Maldives': 'MV',
  'Mongolia': 'MN',
  'Myanmar': 'MM',
  'Nepal': 'NP',
  'Oman': 'OM',
  'Pakistan': 'PK',
  'Philippines': 'PH',
  'Qatar': 'QA',
  'Saudi Arabia': 'SA',
  'Singapore': 'SG',
  'Sri Lanka': 'LK',
  'Syria': 'SY',
  'Tajikistan': 'TJ',
  'Thailand': 'TH',
  'Timor-Leste': 'TL',
  'Turkmenistan': 'TM',
  'United Arab Emirates': 'AE',
  'Uzbekistan': 'UZ',
  'Vietnam': 'VN',
  'Yemen': 'YE',
};

const countryToContinent: { [key: string]: string } = {
  'Albania': 'Europe',
  'Andorra': 'Europe',
  'Austria': 'Europe',
  'Belarus': 'Europe',
  'Belgium': 'Europe',
  'Bosnia and Herzegovina': 'Europe',
  'Bulgaria': 'Europe',
  'Croatia': 'Europe',
  'Cyprus': 'Europe',
  'Czechia': 'Europe',
  'Denmark': 'Europe',
  'Estonia': 'Europe',
  'Finland': 'Europe',
  'France': 'Europe',
  'Germany': 'Europe',
  'Greece': 'Europe',
  'Hungary': 'Europe',
  'Iceland': 'Europe',
  'Ireland': 'Europe',
  'Italy': 'Europe',
  'Kosovo': 'Europe',
  'Latvia': 'Europe',
  'Liechtenstein': 'Europe',
  'Lithuania': 'Europe',
  'Luxembourg': 'Europe',
  'Malta': 'Europe',
  'Moldova': 'Europe',
  'Monaco': 'Europe',
  'Montenegro': 'Europe',
  'Netherlands': 'Europe',
  'North Macedonia': 'Europe',
  'Norway': 'Europe',
  'Poland': 'Europe',
  'Portugal': 'Europe',
  'Romania': 'Europe',
  'Russia': 'Europe',
  'San Marino': 'Europe',
  'Serbia': 'Europe',
  'Slovakia': 'Europe',
  'Slovenia': 'Europe',
  'Spain': 'Europe',
  'Sweden': 'Europe',
  'Switzerland': 'Europe',
  'Turkey': 'Europe',
  'Ukraine': 'Europe',
  'United Kingdom': 'Europe',
  'Vatican City': 'Europe',
  'Canada': 'North America',
  'United States': 'North America',
  'Mexico': 'North America',
  'Belize': 'North America',
  'Guatemala': 'North America',
  'Honduras': 'North America',
  'El Salvador': 'North America',
  'Nicaragua': 'North America',
  'Costa Rica': 'North America',
  'Panama': 'North America',
  'Bahamas': 'North America',
  'Cuba': 'North America',
  'Jamaica': 'North America',
  'Haiti': 'North America',
  'Dominican Republic': 'North America',
  'Antigua and Barbuda': 'North America',
  'Saint Kitts and Nevis': 'North America',
  'Dominica': 'North America',
  'Saint Lucia': 'North America',
  'Saint Vincent and the Grenadines': 'North America',
  'Barbados': 'North America',
  'Grenada': 'North America',
  'Trinidad and Tobago': 'North America',
  'Colombia': 'South America',
  'Venezuela': 'South America',
  'Guyana': 'South America',
  'Suriname': 'South America',
  'Brazil': 'South America',
  'Peru': 'South America',
  'Bolivia': 'South America',
  'Chile': 'South America',
  'Argentina': 'South America',
  'Uruguay': 'South America',
  'Paraguay': 'South America',
  'Ecuador': 'South America',
  'Algeria': 'Africa',
  'Angola': 'Africa',
  'Benin': 'Africa',
  'Botswana': 'Africa',
  'Burkina Faso': 'Africa',
  'Burundi': 'Africa',
  'Cabo Verde': 'Africa',
  'Cameroon': 'Africa',
  'Central African Republic': 'Africa',
  'Chad': 'Africa',
  'Comoros': 'Africa',
  'Congo (Republic)': 'Africa',
  'Congo (Democratic Republic)': 'Africa',
  'Côte d’Ivoire': 'Africa',
  'Djibouti': 'Africa',
  'Egypt': 'Africa',
  'Equatorial Guinea': 'Africa',
  'Eritrea': 'Africa',
  'Eswatini': 'Africa',
  'Ethiopia': 'Africa',
  'Gabon': 'Africa',
  'Gambia': 'Africa',
  'Ghana': 'Africa',
  'Guinea': 'Africa',
  'Guinea-Bissau': 'Africa',
  'Kenya': 'Africa',
  'Lesotho': 'Africa',
  'Liberia': 'Africa',
  'Libya': 'Africa',
  'Madagascar': 'Africa',
  'Malawi': 'Africa',
  'Mali': 'Africa',
  'Mauritania': 'Africa',
  'Mauritius': 'Africa',
  'Morocco': 'Africa',
  'Mozambique': 'Africa',
  'Namibia': 'Africa',
  'Niger': 'Africa',
  'Nigeria': 'Africa',
  'Rwanda': 'Africa',
  'São Tomé and Príncipe': 'Africa',
  'Senegal': 'Africa',
  'Seychelles': 'Africa',
  'Sierra Leone': 'Africa',
  'Somalia': 'Africa',
  'South Africa': 'Africa',
  'South Sudan': 'Africa',
  'Sudan': 'Africa',
  'Tanzania': 'Africa',
  'Togo': 'Africa',
  'Tunisia': 'Africa',
  'Uganda': 'Africa',
  'Zambia': 'Africa',
  'Zimbabwe': 'Africa',
  'Australia': 'Oceania',
  'Federated States of Micronesia': 'Oceania',
  'Fiji': 'Oceania',
  'Kiribati': 'Oceania',
  'Marshall Islands': 'Oceania',
  'Nauru': 'Oceania',
  'New Zealand': 'Oceania',
  'Palau': 'Oceania',
  'Papua New Guinea': 'Oceania',
  'Samoa': 'Oceania',
  'Solomon Islands': 'Oceania',
  'Tonga': 'Oceania',
  'Tuvalu': 'Oceania',
  'Vanuatu': 'Oceania',
  'Afghanistan': 'Asia',
  'Armenia': 'Asia',
  'Azerbaijan': 'Asia',
  'Bahrain': 'Asia',
  'Bangladesh': 'Asia',
  'Bhutan': 'Asia',
  'Brunei': 'Asia',
  'Cambodia': 'Asia',
  'China': 'Asia',
  'Georgia': 'Asia',
  'India': 'Asia',
  'Indonesia': 'Asia',
  'Iran': 'Asia',
  'Iraq': 'Asia',
  'Israel': 'Asia',
  'Japan': 'Asia',
  'Jordan': 'Asia',
  'Kazakhstan': 'Asia',
  'North Korea': 'Asia',
  'South Korea': 'Asia',
  'Kuwait': 'Asia',
  'Kyrgyzstan': 'Asia',
  'Laos': 'Asia',
  'Lebanon': 'Asia',
  'Malaysia': 'Asia',
  'Maldives': 'Asia',
  'Mongolia': 'Asia',
  'Myanmar': 'Asia',
  'Nepal': 'Asia',
  'Oman': 'Asia',
  'Pakistan': 'Asia',
  'Philippines': 'Asia',
  'Qatar': 'Asia',
  'Saudi Arabia': 'Asia',
  'Singapore': 'Asia',
  'Sri Lanka': 'Asia',
  'Syria': 'Asia',
  'Tajikistan': 'Asia',
  'Thailand': 'Asia',
  'Timor-Leste': 'Asia',
  'Turkmenistan': 'Asia',
  'United Arab Emirates': 'Asia',
  'Uzbekistan': 'Asia',
  'Vietnam': 'Asia',
  'Yemen': 'Asia',
};

const CONTINENTS = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'];

function getCountryFlag(country: string): string {
  const code = countryToCode[country];
  if (!code) return '🏳️';
  return code
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

const getCountryContinent = (country: string): string => {
  return countryToContinent[country] || '';
};

const clampFactor = (value: number): number => Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;

const getCountryFactors = (country: CountryData): number[] => [
  country.C1_R100,
  country.T2_R100,
  country.U1_R100,
  country.B3_R100,
  country.R2_R100,
  country.O3_R100,
  country.W1_R100,
  country.V2_R100,
  country.NBI_R100,
].map(clampFactor);

/**
 * Scores every country against the user's answer profile.
 *
 * Extracted so the initial calculation and the two on-results refinements
 * (continent, priority factors) can never drift apart — previously this block
 * was duplicated inline and had to be kept in sync by hand.
 */
function computeCountryScores(
  profile: number[],
  priorityFactorIds: string[],
  continent: string,
): CountryScore[] {
  const scores: CountryScore[] = COUNTRY_DATA.map(country => {
    const factors = getCountryFactors(country);

    let totalDiff = 0;
    for (let i = 0; i < 9; i++) {
      let diff = Math.abs(profile[i] - factors[i]);
      // Priority factors count double, so mismatches there hurt more.
      if (priorityFactorIds.includes(FACTOR_IDS[i])) diff *= 2;
      totalDiff += diff;
    }

    const avgDiff = totalDiff / 9;
    let score = Math.max(0, 100 - avgDiff);

    // Countries on the preferred continent get their gap halved.
    if (continent && getCountryContinent(country.Country) === continent) {
      score = Math.max(0, 100 - avgDiff / 2);
    }

    return {
      country: country.Country,
      score: Number.isFinite(score) ? Math.min(100, score) : 0,
      factors,
    };
  });

  return scores.sort((a, b) => b.score - a.score);
}

export default function CompassPage() {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<CountryScore[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userProfile, setUserProfile] = useState<number[]>([]);
  const [selectedContinent, setSelectedContinent] = useState<string>('');
  const [priorityFactors, setPriorityFactors] = useState<string[]>([]);
  const [showRules, setShowRules] = useState(false);
  const { record: recordRun } = useGameStats('dream-country');
  const runIdRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const factors = [
    { id: 'climate', translationKey: 'factor.climate', icon: '🌡️' },
    { id: 'mountains', translationKey: 'factor.mountains', icon: '⛰️' },
    { id: 'urbanisation', translationKey: 'factor.urbanisation', icon: '🏙️' },
    { id: 'forest', translationKey: 'factor.forest', icon: '🌲' },
    { id: 'justice', translationKey: 'factor.justice', icon: '⚖️' },
    { id: 'openness', translationKey: 'factor.openness', icon: '🌐' },
    { id: 'ocean', translationKey: 'factor.ocean', icon: '🌊' },
    { id: 'vastness', translationKey: 'factor.vastness', icon: '🗺️' },
    { id: 'biodiversity', translationKey: 'factor.biodiversity', icon: '🦋' },
  ];

  useEffect(() => {
    const initialAnswers: Record<string, number> = {};
    QUESTIONS.forEach(q => {
      initialAnswers[q.id] = 50;
    });
    setAnswers(initialAnswers);
    if (!localStorage.getItem('compass-rules-seen')) {
      setShowRules(true);
    }
  }, []);

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handlePriorityToggle = (factorId: string) => {
    setPriorityFactors(prev => {
      if (prev.includes(factorId)) {
        return prev.filter(f => f !== factorId);
      } else if (prev.length < 3) {
        return [...prev, factorId];
      }
      return prev;
    });
  };

  const resetQuestions = () => {
    setCurrentStep(0);
    setResults([]);
    setSelectedCountries([]);
    setUserProfile([]);
    setSelectedContinent('');
    setPriorityFactors([]);
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResults();
    }
  };

  const calculateResults = () => {
    const profile: number[] = [];
    const factorKeys = ['C1', 'T2', 'U1', 'B3', 'R2', 'O3', 'W1', 'V2', 'NBI'];
    
    factorKeys.forEach(factorKey => {
      const factorQuestions = QUESTIONS.filter(q => q.factor === factorKey);
      let sum = 0;
      factorQuestions.forEach(q => {
        // `??` not `||`: 0 is a valid answer ("not like me at all") and must not
        // fall back to the neutral midpoint.
        const value = answers[q.id] ?? 50;
        sum += q.reverse ? (100 - value) : value;
      });
      // Guard the divide: a factor with no questions would push NaN into the
      // profile and silently corrupt every country score.
      profile.push(factorQuestions.length > 0 ? sum / factorQuestions.length : 50);
    });
    
    setUserProfile(profile);
    
    setResults(computeCountryScores(profile, priorityFactors, selectedContinent));
    // Dream Country is a preference quiz with no score, so only the completion
    // count is meaningful. Recorded here — the other setResults call site is a
    // continent re-filter on the results screen, not a new run.
    recordRun({}, `run-${runIdRef.current}`);
    runIdRef.current += 1;
    setCurrentStep(-1);
  };

  const handleCountryToggle = (country: string) => {
    setSelectedCountries(prev => {
      if (prev.includes(country)) {
        return prev.filter(c => c !== country);
      } else if (prev.length < 4) {
        return [...prev, country];
      }
      return prev;
    });
  };

  useEffect(() => {
    if (currentStep === -1 && results.length > 0) {
      drawRadarChart();
    }
  }, [selectedCountries, results, currentStep]);

  const drawRadarChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '#1e293b' : '#f8fafc';
    const gridColor = isDark ? '#475569' : '#cbd5e1';
    const textColor = isDark ? '#e2e8f0' : '#334155';
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 60;
    const numFactors = 9;
    
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let j = 0; j <= numFactors; j++) {
        const angle = (j * 2 * Math.PI) / numFactors - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius * (i / 5);
        const y = centerY + Math.sin(angle) * radius * (i / 5);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    for (let i = 0; i < numFactors; i++) {
      const angle = (i * 2 * Math.PI) / numFactors - Math.PI / 2;
      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      ctx.stroke();
      
      const labelX = centerX + Math.cos(angle) * (radius + 30);
      const labelY = centerY + Math.sin(angle) * (radius + 30);
      ctx.fillStyle = textColor;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t(factors[i].translationKey), labelX, labelY);
    }
    
    if (userProfile.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(251, 191, 36, 1)';
      ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
      ctx.lineWidth = 3;
      for (let i = 0; i <= numFactors; i++) {
        const angle = (i * 2 * Math.PI) / numFactors - Math.PI / 2;
        const value = clampFactor(userProfile[i % numFactors]);
        const distance = (value / 100) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    
    const colors = [
      'rgba(147, 197, 253, 0.9)',
      'rgba(167, 243, 208, 0.9)',
      'rgba(252, 165, 165, 0.9)',
      'rgba(196, 181, 253, 0.9)'
    ];
    
    selectedCountries.forEach((countryName, index) => {
      const countryData = results.find(r => r.country === countryName);
      if (!countryData) return;
      
      ctx.beginPath();
      ctx.strokeStyle = colors[index % colors.length];
      ctx.fillStyle = colors[index % colors.length].replace('0.9', '0.1');
      ctx.lineWidth = 2;
      
      for (let i = 0; i <= numFactors; i++) {
        const angle = (i * 2 * Math.PI) / numFactors - Math.PI / 2;
        const value = clampFactor(countryData.factors[i % numFactors]);
        const distance = (value / 100) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  };

  // 20 questions / 4 per page = exactly 5 pages, no short final page.
  const questionsPerStep = 4;
  const currentQuestions = QUESTIONS.slice(
    currentStep * questionsPerStep,
    (currentStep + 1) * questionsPerStep
  );

  const totalSteps = Math.ceil(QUESTIONS.length / questionsPerStep);
  const progress = currentStep === 0 ? 0 : (currentStep / (totalSteps - 1)) * 100;

  if (currentStep === -1) {
    return (
      <div className="app-page-shell min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <GameNavbar currentPath="/compass" />

        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-6">
            <button onClick={resetQuestions} className="bg-rose-500 hover:bg-rose-600 border border-rose-600 text-white px-4 py-2 rounded-lg transition-all shadow-md whitespace-nowrap cursor-pointer transform hover:scale-105 active:scale-95">
              Retake Survey
            </button>

            {/* No score in this game, so only the completion count is shown. */}
            <GameStatsBar
              gameId="dream-country"
              showStreak={false}
              showScore={false}
              className="mt-4 max-w-xs"
            />

            {results.length > 0 && (
              <ShareButtons
                className="mt-3 max-w-md"
                share={{
                  game: 'Dream Country',
                  result: `${results[0].country} — ${results[0].score.toFixed(1)}% match ${gradeEmoji(results[0].score)}`,
                  details: [
                    selectedContinent && `🌍 Filtered to ${selectedContinent}`,
                    priorityFactors.length > 0 &&
                      `⭐ Priorities: ${priorityFactors
                        .map((id) => t(factors.find((f) => f.id === id)?.translationKey ?? id))
                        .join(', ')}`,
                    '',
                    ...results.slice(0, 5).map((r, i) =>
                      `${['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]} ${r.country} — ${r.score.toFixed(1)}%`,
                    ),
                  ],
                  path: '/compass',
                }}
              />
            )}
          </div>

          {/*
            Priority factors sit here alongside the continent picker rather than
            on the first question page. Both are refinements of an existing
            result, so the player can weigh what matters while actually looking
            at the countries and see the ranking update immediately.
          */}
          <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-1 text-slate-800 dark:text-white">
              {t('selectFactors')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              {t('selectUpTo3Factors')}
            </p>
            {/* grid-cols-2 below sm: the German labels are long enough to
                overflow three columns on a phone. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {factors.map(factor => {
                const active = priorityFactors.includes(factor.id);
                const atLimit = priorityFactors.length >= 3 && !active;
                return (
                  <button
                    key={factor.id}
                    type="button"
                    aria-pressed={active}
                    disabled={atLimit}
                    onClick={() => {
                      const next = active
                        ? priorityFactors.filter(f => f !== factor.id)
                        : priorityFactors.length < 3
                          ? [...priorityFactors, factor.id]
                          : priorityFactors;
                      if (next === priorityFactors) return;
                      setPriorityFactors(next);
                      setResults(computeCountryScores(userProfile, next, selectedContinent));
                    }}
                    className={`min-h-11 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer transform hover:scale-105 active:scale-95 ${
                      active
                        ? 'bg-rose-500 text-white shadow-md border border-rose-600'
                        : atLimit
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {active && <span className="mr-1">✓</span>}
                    {t(factor.translationKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">
              {t('selectContinent')}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {CONTINENTS.map(continent => (
                <button
                  key={continent}
                  onClick={() => {
                    const newContinent = continent === selectedContinent ? '' : continent;
                    setSelectedContinent(newContinent);
                    setResults(computeCountryScores(userProfile, priorityFactors, newContinent));
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer transform hover:scale-105 active:scale-95 whitespace-nowrap ${
                    selectedContinent === continent
                      ? 'bg-rose-500 text-white shadow-md border border-rose-600'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {selectedContinent === continent && '✓ '}
                  {continent}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">{t('countryComparison')}</h3>
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                className="w-full h-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg"
              />
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                9 factors: Climate • Topography • Urbanisation • Forest Cover • Fair Justice • Openness • Coastal Access • Vastness • Biodiversity
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 1)' }}></div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('yourProfile')}</span>
                </div>
                {selectedCountries.map((country, index) => {
                  const colors = ['rgba(147, 197, 253, 0.9)', 'rgba(167, 243, 208, 0.9)', 'rgba(252, 165, 165, 0.9)', 'rgba(196, 181, 253, 0.9)'];
                  return (
                    <div key={country} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[index % colors.length] }}></div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{country}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">{t('allCountriesRanked')}</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {results.map((item, index) => {
                  const countryCode = countryToCode[item.country];
                  return (
                    <div
                      key={item.country}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                        selectedCountries.includes(item.country)
                          ? 'bg-rose-100 dark:bg-rose-900/40 border-2 border-rose-400'
                          : 'bg-slate-50 dark:bg-slate-700 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                      onClick={() => handleCountryToggle(item.country)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-slate-600 dark:text-slate-400 w-8">
                          #{index + 1}
                        </span>
                        <div className="w-8 h-6 flex items-center justify-center overflow-hidden rounded shadow-sm bg-white/40 dark:bg-slate-900/40">
                          {countryCode && (
                            <img 
                              src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
                              alt={`${item.country} flag`}
                              className="w-8 h-6 object-cover rounded shadow-sm"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                                if (fallback) fallback.style.display = 'inline-flex';
                              }}
                            />
                          )}
                          <span
                            className="text-lg leading-none"
                            style={{ display: countryCode ? 'none' : 'inline-flex' }}
                            aria-label={`${item.country} flag fallback`}
                          >
                            {getCountryFlag(item.country)}
                          </span>
                        </div>
                        <span className="font-medium text-slate-800 dark:text-white">
                          {item.country}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {item.score.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {t('compareCountries')}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page-shell min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <GameNavbar currentPath="/compass" />

      <RulesModal
        open={showRules}
        onClose={() => { setShowRules(false); localStorage.setItem('compass-rules-seen', '1'); }}
        title="How Compass works"
        icon="ri-compass-3-line"
        iconGradient="from-rose-500 to-pink-600"
        description="Answer 25 quick questions about your lifestyle preferences. Compass analyses 9 geographic factors and finds which countries match your personality best."
        rules={[
          { icon: 'ri-survey-line', text: 'Slide each answer from "Not like me" to "Very much like me" — be honest for the best matches.' },
          { icon: 'ri-star-line', text: 'On step 1, optionally pin up to 3 priority factors. Those count double in the scoring.' },
          { icon: 'ri-earth-line', text: 'After the survey, filter by continent and tap up to 4 countries to compare their radar profiles.' },
        ]}
        scoring={[
          { pts: '9', label: 'Factors', sub: 'climate, mountains, ocean…', color: 'rose' },
          { pts: '×2', label: 'Priority boost', sub: 'pinned factors', color: 'amber' },
          { pts: '100%', label: 'Best match', sub: 'closest to your profile', color: 'green' },
        ]}
        tip="There are no right or wrong answers — the more honestly you respond, the more accurate your country matches will be."
        ctaLabel="Start the survey!"
        ctaGradient="from-rose-500 to-pink-600"
      />

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="flex items-center justify-center gap-3 text-4xl font-bold text-slate-800 dark:text-white">
            <i className="ri-compass-3-line text-rose-500 dark:text-rose-400"></i>
            {t('compassTitle')}
            <i className="ri-compass-3-line text-rose-500 dark:text-rose-400"></i>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            {t('compassDescription', { total: QUESTIONS.length })}
          </p>
          <button
            onClick={() => setShowRules(true)}
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition-colors cursor-pointer font-medium"
            style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
          >
            <i className="ri-question-line"></i>
            How to play
          </button>
        </div>


        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
            <span>{t('progress')}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-rose-500 to-red-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
          {currentQuestions.map((question, index) => (
            <div key={question.id} className="mb-8 last:mb-0">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-rose-500 dark:text-rose-400 flex-shrink-0">
                    {t('question')} {currentStep * questionsPerStep + index + 1}
                  </span>
                  <p className="text-slate-800 dark:text-white font-medium">
                    {t(question.text)}
                  </p>
                </div>
                <div className="pl-0">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={answers[question.id] ?? 50}
                    onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span>{t('notLikeMe')}</span>
                    <span>{t('neutral')}</span>
                    <span>{t('veryMuchLikeMe')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between gap-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              currentStep === 0
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 shadow-md transform hover:scale-105 active:scale-95'
            }`}
          >
            {t('previous')}
          </button>
          <button
            onClick={nextStep}
            className="bg-rose-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-rose-600 border border-rose-600 transition-all shadow-md cursor-pointer whitespace-nowrap transform hover:scale-105 active:scale-95"
          >
            {currentStep === totalSteps - 1 ? t('seeResults') : t('next')}
          </button>
        </div>
      </div>
    </div>
  );
}
