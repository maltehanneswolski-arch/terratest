import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GameNavbar } from '@/components/ui/game-navbar';
import { CountryInput } from './components/CountryInput';
import { COUNTRY_METADATA } from '@/pages/game/data/countryMetadata';
import { getFlagUrl } from '@/lib/countryFlags';
import { RulesModal } from '@/components/feature/rules-modal';
import { GameStatsBar } from '@/components/feature/game-stats-bar';
import { useGameStats } from '@/lib/gameStats';
import { scoreLine } from '@/lib/shareResult';
import { ShareButtons } from '@/components/feature/share-buttons';

interface Country {
  name: string;
  flag: string;
  neighbors: string[];
}

// Comprehensive country data with neighbors
const COUNTRIES: { [key: string]: Country } = {
  'Afghanistan': { name: 'Afghanistan', flag: '🇦🇫', neighbors: ['Iran', 'Pakistan', 'Turkmenistan', 'Uzbekistan', 'Tajikistan', 'China'] },
  'Albania': { name: 'Albania', flag: '🇦🇱', neighbors: ['Montenegro', 'Kosovo', 'North Macedonia', 'Greece'] },
  'Algeria': { name: 'Algeria', flag: '🇩🇿', neighbors: ['Tunisia', 'Libya', 'Niger', 'Mali', 'Mauritania', 'Western Sahara', 'Morocco'] },
  'Andorra': { name: 'Andorra', flag: '🇦🇩', neighbors: ['France', 'Spain'] },
  'Angola': { name: 'Angola', flag: '🇦🇴', neighbors: ['Namibia', 'Zambia', 'Democratic Republic of the Congo', 'Republic of the Congo'] },
  'Argentina': { name: 'Argentina', flag: '🇦🇷', neighbors: ['Chile', 'Bolivia', 'Paraguay', 'Brazil', 'Uruguay'] },
  'Armenia': { name: 'Armenia', flag: '🇦🇲', neighbors: ['Georgia', 'Azerbaijan', 'Iran', 'Turkey'] },
  'Austria': { name: 'Austria', flag: '🇦🇹', neighbors: ['Germany', 'Czech Republic', 'Slovakia', 'Hungary', 'Slovenia', 'Italy', 'Switzerland', 'Liechtenstein'] },
  'Azerbaijan': { name: 'Azerbaijan', flag: '🇦🇿', neighbors: ['Russia', 'Georgia', 'Armenia', 'Iran', 'Turkey'] },
  'Bangladesh': { name: 'Bangladesh', flag: '🇧🇩', neighbors: ['India', 'Myanmar'] },
  'Belarus': { name: 'Belarus', flag: '🇧🇾', neighbors: ['Latvia', 'Lithuania', 'Poland', 'Ukraine', 'Russia'] },
  'Belgium': { name: 'Belgium', flag: '🇧🇪', neighbors: ['France', 'Luxembourg', 'Germany', 'Netherlands'] },
  'Belize': { name: 'Belize', flag: '🇧🇿', neighbors: ['Mexico', 'Guatemala'] },
  'Benin': { name: 'Benin', flag: '🇧🇯', neighbors: ['Togo', 'Burkina Faso', 'Niger', 'Nigeria'] },
  'Bhutan': { name: 'Bhutan', flag: '🇧🇹', neighbors: ['China', 'India'] },
  'Bolivia': { name: 'Bolivia', flag: '🇧🇴', neighbors: ['Peru', 'Brazil', 'Paraguay', 'Argentina', 'Chile'] },
  'Bosnia and Herzegovina': { name: 'Bosnia and Herzegovina', flag: '🇧🇦', neighbors: ['Croatia', 'Serbia', 'Montenegro'] },
  'Botswana': { name: 'Botswana', flag: '🇧🇼', neighbors: ['Namibia', 'Zambia', 'Zimbabwe', 'South Africa'] },
  // French Guiana omitted: it is an overseas department of France, not a
  // sovereign country, and was referenced here without a COUNTRIES entry — so
  // guessing it ended the game as an invalid name despite being listed.
  'Brazil': { name: 'Brazil', flag: '🇧🇷', neighbors: ['Suriname', 'Guyana', 'Venezuela', 'Colombia', 'Peru', 'Bolivia', 'Paraguay', 'Argentina', 'Uruguay'] },
  'Brunei': { name: 'Brunei', flag: '🇧🇳', neighbors: ['Malaysia'] },
  'Bulgaria': { name: 'Bulgaria', flag: '🇧🇬', neighbors: ['Romania', 'Serbia', 'North Macedonia', 'Greece', 'Turkey'] },
  'Burkina Faso': { name: 'Burkina Faso', flag: '🇧🇫', neighbors: ['Mali', 'Niger', 'Benin', 'Togo', 'Ghana', 'Ivory Coast'] },
  'Burundi': { name: 'Burundi', flag: '🇧🇮', neighbors: ['Rwanda', 'Tanzania', 'Democratic Republic of the Congo'] },
  'Cambodia': { name: 'Cambodia', flag: '🇰🇭', neighbors: ['Thailand', 'Laos', 'Vietnam'] },
  'Cameroon': { name: 'Cameroon', flag: '🇨🇲', neighbors: ['Nigeria', 'Chad', 'Central African Republic', 'Republic of the Congo', 'Gabon', 'Equatorial Guinea'] },
  'Canada': { name: 'Canada', flag: '🇨🇦', neighbors: ['United States'] },
  'Central African Republic': { name: 'Central African Republic', flag: '🇨🇫', neighbors: ['Chad', 'Sudan', 'South Sudan', 'Democratic Republic of the Congo', 'Republic of the Congo', 'Cameroon'] },
  'Chad': { name: 'Chad', flag: '🇹🇩', neighbors: ['Libya', 'Sudan', 'Central African Republic', 'Cameroon', 'Nigeria', 'Niger'] },
  'Chile': { name: 'Chile', flag: '🇨🇱', neighbors: ['Peru', 'Bolivia', 'Argentina'] },
  'China': { name: 'China', flag: '🇨🇳', neighbors: ['North Korea', 'Russia', 'Mongolia', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Afghanistan', 'Pakistan', 'India', 'Nepal', 'Bhutan', 'Myanmar', 'Laos', 'Vietnam'] },
  'Colombia': { name: 'Colombia', flag: '🇨🇴', neighbors: ['Panama', 'Venezuela', 'Brazil', 'Peru', 'Ecuador'] },
  'Republic of the Congo': { name: 'Republic of the Congo', flag: '🇨🇬', neighbors: ['Gabon', 'Cameroon', 'Central African Republic', 'Democratic Republic of the Congo', 'Angola'] },
  'Costa Rica': { name: 'Costa Rica', flag: '🇨🇷', neighbors: ['Nicaragua', 'Panama'] },
  'Croatia': { name: 'Croatia', flag: '🇭🇷', neighbors: ['Slovenia', 'Hungary', 'Serbia', 'Bosnia and Herzegovina', 'Montenegro'] },
  'Czech Republic': { name: 'Czech Republic', flag: '🇨🇿', neighbors: ['Germany', 'Poland', 'Slovakia', 'Austria'] },
  'Democratic Republic of the Congo': { name: 'Democratic Republic of the Congo', flag: '🇨🇩', neighbors: ['Central African Republic', 'South Sudan', 'Uganda', 'Rwanda', 'Burundi', 'Tanzania', 'Zambia', 'Angola', 'Republic of the Congo'] },
  'Denmark': { name: 'Denmark', flag: '🇩🇰', neighbors: ['Germany'] },
  'Djibouti': { name: 'Djibouti', flag: '🇩🇯', neighbors: ['Eritrea', 'Ethiopia', 'Somalia'] },
  'Dominican Republic': { name: 'Dominican Republic', flag: '🇩🇴', neighbors: ['Haiti'] },
  'Ecuador': { name: 'Ecuador', flag: '🇪🇨', neighbors: ['Colombia', 'Peru'] },
  'Egypt': { name: 'Egypt', flag: '🇪🇬', neighbors: ['Libya', 'Sudan', 'Israel', 'Palestine'] },
  'El Salvador': { name: 'El Salvador', flag: '🇸🇻', neighbors: ['Guatemala', 'Honduras'] },
  'Equatorial Guinea': { name: 'Equatorial Guinea', flag: '🇬🇶', neighbors: ['Cameroon', 'Gabon'] },
  'Eritrea': { name: 'Eritrea', flag: '🇪🇷', neighbors: ['Sudan', 'Ethiopia', 'Djibouti'] },
  'Estonia': { name: 'Estonia', flag: '🇪🇪', neighbors: ['Russia', 'Latvia'] },
  'Eswatini': { name: 'Eswatini', flag: '🇸🇿', neighbors: ['Mozambique', 'South Africa'] },
  'Ethiopia': { name: 'Ethiopia', flag: '🇪🇹', neighbors: ['Eritrea', 'Djibouti', 'Somalia', 'Kenya', 'South Sudan', 'Sudan'] },
  'Finland': { name: 'Finland', flag: '🇫🇮', neighbors: ['Sweden', 'Norway', 'Russia'] },
  'France': { name: 'France', flag: '🇫🇷', neighbors: ['Belgium', 'Luxembourg', 'Germany', 'Switzerland', 'Italy', 'Monaco', 'Spain', 'Andorra'] },
  'Gabon': { name: 'Gabon', flag: '🇬🇦', neighbors: ['Equatorial Guinea', 'Cameroon', 'Republic of the Congo'] },
  'Gambia': { name: 'Gambia', flag: '🇬🇲', neighbors: ['Senegal'] },
  'Georgia': { name: 'Georgia', flag: '🇬🇪', neighbors: ['Russia', 'Azerbaijan', 'Armenia', 'Turkey'] },
  'Germany': { name: 'Germany', flag: '🇩🇪', neighbors: ['Denmark', 'Poland', 'Czech Republic', 'Austria', 'Switzerland', 'France', 'Luxembourg', 'Belgium', 'Netherlands'] },
  'Ghana': { name: 'Ghana', flag: '🇬🇭', neighbors: ['Ivory Coast', 'Burkina Faso', 'Togo'] },
  'Greece': { name: 'Greece', flag: '🇬🇷', neighbors: ['Albania', 'North Macedonia', 'Bulgaria', 'Turkey'] },
  'Guatemala': { name: 'Guatemala', flag: '🇬🇹', neighbors: ['Mexico', 'Belize', 'Honduras', 'El Salvador'] },
  'Guinea': { name: 'Guinea', flag: '🇬🇳', neighbors: ['Guinea-Bissau', 'Senegal', 'Mali', 'Ivory Coast', 'Liberia', 'Sierra Leone'] },
  'Guinea-Bissau': { name: 'Guinea-Bissau', flag: '🇬🇼', neighbors: ['Senegal', 'Guinea'] },
  'Guyana': { name: 'Guyana', flag: '🇬🇾', neighbors: ['Venezuela', 'Brazil', 'Suriname'] },
  'Haiti': { name: 'Haiti', flag: '🇭🇹', neighbors: ['Dominican Republic'] },
  'Honduras': { name: 'Honduras', flag: '🇭🇳', neighbors: ['Guatemala', 'El Salvador', 'Nicaragua'] },
  'Hungary': { name: 'Hungary', flag: '🇭🇺', neighbors: ['Slovakia', 'Ukraine', 'Romania', 'Serbia', 'Croatia', 'Slovenia', 'Austria'] },
  'India': { name: 'India', flag: '🇮🇳', neighbors: ['Pakistan', 'China', 'Nepal', 'Bhutan', 'Myanmar', 'Bangladesh'] },
  'Indonesia': { name: 'Indonesia', flag: '🇮🇩', neighbors: ['Malaysia', 'Papua New Guinea', 'Timor-Leste'] },
  'Iran': { name: 'Iran', flag: '🇮🇷', neighbors: ['Turkey', 'Iraq', 'Afghanistan', 'Pakistan', 'Armenia', 'Azerbaijan', 'Turkmenistan'] },
  'Iraq': { name: 'Iraq', flag: '🇮🇶', neighbors: ['Turkey', 'Syria', 'Jordan', 'Saudi Arabia', 'Kuwait', 'Iran'] },
  'Ireland': { name: 'Ireland', flag: '🇮🇪', neighbors: ['United Kingdom'] },
  'Israel': { name: 'Israel', flag: '🇮🇱', neighbors: ['Lebanon', 'Syria', 'Jordan', 'Egypt', 'Palestine'] },
  'Italy': { name: 'Italy', flag: '🇮🇹', neighbors: ['France', 'Switzerland', 'Austria', 'Slovenia', 'San Marino', 'Vatican City'] },
  'Ivory Coast': { name: 'Ivory Coast', flag: '🇨🇮', neighbors: ['Liberia', 'Guinea', 'Mali', 'Burkina Faso', 'Ghana'] },
  'Jordan': { name: 'Jordan', flag: '🇯🇴', neighbors: ['Syria', 'Iraq', 'Saudi Arabia', 'Israel', 'Palestine'] },
  'Kazakhstan': { name: 'Kazakhstan', flag: '🇰🇿', neighbors: ['Russia', 'China', 'Kyrgyzstan', 'Uzbekistan', 'Turkmenistan'] },
  'Kenya': { name: 'Kenya', flag: '🇰🇪', neighbors: ['Ethiopia', 'Somalia', 'Tanzania', 'Uganda', 'South Sudan'] },
  'Kosovo': { name: 'Kosovo', flag: '🇽🇰', neighbors: ['Serbia', 'North Macedonia', 'Albania', 'Montenegro'] },
  'Kuwait': { name: 'Kuwait', flag: '🇰🇼', neighbors: ['Iraq', 'Saudi Arabia'] },
  'Kyrgyzstan': { name: 'Kyrgyzstan', flag: '🇰🇬', neighbors: ['Kazakhstan', 'China', 'Tajikistan', 'Uzbekistan'] },
  'Laos': { name: 'Laos', flag: '🇱🇦', neighbors: ['China', 'Vietnam', 'Cambodia', 'Thailand', 'Myanmar'] },
  'Latvia': { name: 'Latvia', flag: '🇱🇻', neighbors: ['Estonia', 'Russia', 'Belarus', 'Lithuania'] },
  'Lebanon': { name: 'Lebanon', flag: '🇱🇧', neighbors: ['Syria', 'Israel'] },
  'Lesotho': { name: 'Lesotho', flag: '🇱🇸', neighbors: ['South Africa'] },
  'Liberia': { name: 'Liberia', flag: '🇱🇷', neighbors: ['Sierra Leone', 'Guinea', 'Ivory Coast'] },
  'Libya': { name: 'Libya', flag: '🇱🇾', neighbors: ['Tunisia', 'Algeria', 'Niger', 'Chad', 'Sudan', 'Egypt'] },
  'Liechtenstein': { name: 'Liechtenstein', flag: '🇱🇮', neighbors: ['Switzerland', 'Austria'] },
  'Lithuania': { name: 'Lithuania', flag: '🇱🇹', neighbors: ['Belarus', 'Poland', 'Latvia', 'Russia'] },
  'Luxembourg': { name: 'Luxembourg', flag: '🇱🇺', neighbors: ['Belgium', 'Germany', 'France'] },
  'Madagascar': { name: 'Madagascar', flag: '🇲🇬', neighbors: [] },
  'Malawi': { name: 'Malawi', flag: '🇲🇼', neighbors: ['Tanzania', 'Mozambique', 'Zambia'] },
  'Malaysia': { name: 'Malaysia', flag: '🇲🇾', neighbors: ['Thailand', 'Indonesia', 'Brunei'] },
  'Mali': { name: 'Mali', flag: '🇲🇱', neighbors: ['Senegal', 'Mauritania', 'Algeria', 'Niger', 'Burkina Faso', 'Ivory Coast', 'Guinea'] },
  'Mauritania': { name: 'Mauritania', flag: '🇲🇷', neighbors: ['Western Sahara', 'Algeria', 'Mali', 'Senegal'] },
  'Mexico': { name: 'Mexico', flag: '🇲🇽', neighbors: ['United States', 'Guatemala', 'Belize'] },
  'Moldova': { name: 'Moldova', flag: '🇲🇩', neighbors: ['Romania', 'Ukraine'] },
  'Monaco': { name: 'Monaco', flag: '🇲🇨', neighbors: ['France'] },
  'Mongolia': { name: 'Mongolia', flag: '🇲🇳', neighbors: ['Russia', 'China'] },
  'Montenegro': { name: 'Montenegro', flag: '🇲🇪', neighbors: ['Croatia', 'Bosnia and Herzegovina', 'Serbia', 'Kosovo', 'Albania'] },
  'Morocco': { name: 'Morocco', flag: '🇲🇦', neighbors: ['Algeria', 'Western Sahara', 'Spain'] },
  'Mozambique': { name: 'Mozambique', flag: '🇲🇿', neighbors: ['Tanzania', 'Malawi', 'Zambia', 'Zimbabwe', 'South Africa', 'Eswatini'] },
  'Myanmar': { name: 'Myanmar', flag: '🇲🇲', neighbors: ['Bangladesh', 'India', 'China', 'Laos', 'Thailand'] },
  'Namibia': { name: 'Namibia', flag: '🇳🇦', neighbors: ['Angola', 'Zambia', 'Botswana', 'South Africa'] },
  'Nepal': { name: 'Nepal', flag: '🇳🇵', neighbors: ['China', 'India'] },
  'Netherlands': { name: 'Netherlands', flag: '🇳🇱', neighbors: ['Germany', 'Belgium'] },
  'Nicaragua': { name: 'Nicaragua', flag: '🇳🇮', neighbors: ['Costa Rica', 'Honduras'] },
  'Niger': { name: 'Niger', flag: '🇳🇪', neighbors: ['Libya', 'Chad', 'Nigeria', 'Benin', 'Burkina Faso', 'Mali', 'Algeria'] },
  'Nigeria': { name: 'Nigeria', flag: '🇳🇬', neighbors: ['Benin', 'Niger', 'Chad', 'Cameroon'] },
  'North Korea': { name: 'North Korea', flag: '🇰🇵', neighbors: ['China', 'Russia', 'South Korea'] },
  'North Macedonia': { name: 'North Macedonia', flag: '🇲🇰', neighbors: ['Kosovo', 'Serbia', 'Bulgaria', 'Greece', 'Albania'] },
  'Norway': { name: 'Norway', flag: '🇳🇴', neighbors: ['Sweden', 'Finland', 'Russia'] },
  'Oman': { name: 'Oman', flag: '🇴🇲', neighbors: ['UAE', 'Saudi Arabia', 'Yemen'] },
  'Pakistan': { name: 'Pakistan', flag: '🇵🇰', neighbors: ['Iran', 'Afghanistan', 'China', 'India'] },
  'Palestine': { name: 'Palestine', flag: '🇵🇸', neighbors: ['Israel', 'Jordan', 'Egypt'] },
  'Panama': { name: 'Panama', flag: '🇵🇦', neighbors: ['Costa Rica', 'Colombia'] },
  'Papua New Guinea': { name: 'Papua New Guinea', flag: '🇵🇬', neighbors: ['Indonesia'] },
  'Paraguay': { name: 'Paraguay', flag: '🇵🇾', neighbors: ['Bolivia', 'Brazil', 'Argentina'] },
  'Peru': { name: 'Peru', flag: '🇵🇪', neighbors: ['Ecuador', 'Colombia', 'Brazil', 'Bolivia', 'Chile'] },
  'Poland': { name: 'Poland', flag: '🇵🇱', neighbors: ['Germany', 'Czech Republic', 'Slovakia', 'Ukraine', 'Belarus', 'Lithuania', 'Russia'] },
  'Portugal': { name: 'Portugal', flag: '🇵🇹', neighbors: ['Spain'] },
  'Qatar': { name: 'Qatar', flag: '🇶🇦', neighbors: ['Saudi Arabia'] },
  'Romania': { name: 'Romania', flag: '🇷🇴', neighbors: ['Ukraine', 'Moldova', 'Hungary', 'Serbia', 'Bulgaria'] },
  'Russia': { name: 'Russia', flag: '🇷🇺', neighbors: ['Norway', 'Finland', 'Estonia', 'Latvia', 'Lithuania', 'Poland', 'Belarus', 'Ukraine', 'Georgia', 'Azerbaijan', 'Kazakhstan', 'China', 'Mongolia', 'North Korea'] },
  'Rwanda': { name: 'Rwanda', flag: '🇷🇼', neighbors: ['Uganda', 'Tanzania', 'Burundi', 'Democratic Republic of the Congo'] },
  'San Marino': { name: 'San Marino', flag: '🇸🇲', neighbors: ['Italy'] },
  'Saudi Arabia': { name: 'Saudi Arabia', flag: '🇸🇦', neighbors: ['Jordan', 'Iraq', 'Kuwait', 'Qatar', 'UAE', 'Oman', 'Yemen'] },
  'Senegal': { name: 'Senegal', flag: '🇸🇳', neighbors: ['Mauritania', 'Mali', 'Guinea', 'Guinea-Bissau', 'Gambia'] },
  'Serbia': { name: 'Serbia', flag: '🇷🇸', neighbors: ['Hungary', 'Romania', 'Bulgaria', 'North Macedonia', 'Kosovo', 'Montenegro', 'Bosnia and Herzegovina', 'Croatia'] },
  'Sierra Leone': { name: 'Sierra Leone', flag: '🇸🇱', neighbors: ['Guinea', 'Liberia'] },
  'Slovakia': { name: 'Slovakia', flag: '🇸🇰', neighbors: ['Poland', 'Czech Republic', 'Austria', 'Ukraine', 'Hungary'] },
  'Slovenia': { name: 'Slovenia', flag: '🇸🇮', neighbors: ['Austria', 'Italy', 'Hungary', 'Croatia'] },
  'Somalia': { name: 'Somalia', flag: '🇸🇴', neighbors: ['Djibouti', 'Ethiopia', 'Kenya'] },
  'South Africa': { name: 'South Africa', flag: '🇿🇦', neighbors: ['Namibia', 'Botswana', 'Zimbabwe', 'Mozambique', 'Eswatini', 'Lesotho'] },
  'South Korea': { name: 'South Korea', flag: '🇰🇷', neighbors: ['North Korea'] },
  'South Sudan': { name: 'South Sudan', flag: '🇸🇸', neighbors: ['Sudan', 'Ethiopia', 'Kenya', 'Uganda', 'Democratic Republic of the Congo', 'Central African Republic'] },
  'Spain': { name: 'Spain', flag: '🇪🇸', neighbors: ['Portugal', 'France', 'Andorra', 'Morocco'] },
  'Sudan': { name: 'Sudan', flag: '🇸🇩', neighbors: ['Egypt', 'Libya', 'Chad', 'Central African Republic', 'South Sudan', 'Ethiopia', 'Eritrea'] },
  'Suriname': { name: 'Suriname', flag: '🇸🇷', neighbors: ['Guyana', 'Brazil'] },
  'Sweden': { name: 'Sweden', flag: '🇸🇪', neighbors: ['Norway', 'Finland'] },
  'Switzerland': { name: 'Switzerland', flag: '🇨🇭', neighbors: ['France', 'Germany', 'Austria', 'Liechtenstein', 'Italy'] },
  'Syria': { name: 'Syria', flag: '🇸🇾', neighbors: ['Turkey', 'Iraq', 'Jordan', 'Israel', 'Lebanon'] },
  'Tajikistan': { name: 'Tajikistan', flag: '🇹🇯', neighbors: ['Kyrgyzstan', 'China', 'Afghanistan', 'Uzbekistan'] },
  'Tanzania': { name: 'Tanzania', flag: '🇹🇿', neighbors: ['Kenya', 'Uganda', 'Rwanda', 'Burundi', 'Democratic Republic of the Congo', 'Zambia', 'Malawi', 'Mozambique'] },
  'Thailand': { name: 'Thailand', flag: '🇹🇭', neighbors: ['Cambodia', 'Laos', 'Myanmar', 'Malaysia'] },
  'Timor-Leste': { name: 'Timor-Leste', flag: '🇹🇱', neighbors: ['Indonesia'] },
  'Togo': { name: 'Togo', flag: '🇹🇬', neighbors: ['Benin', 'Burkina Faso', 'Ghana'] },
  'Tunisia': { name: 'Tunisia', flag: '🇹🇳', neighbors: ['Algeria', 'Libya'] },
  'Turkey': { name: 'Turkey', flag: '🇹🇷', neighbors: ['Greece', 'Bulgaria', 'Georgia', 'Armenia', 'Azerbaijan', 'Iran', 'Iraq', 'Syria'] },
  'Turkmenistan': { name: 'Turkmenistan', flag: '🇹🇲', neighbors: ['Kazakhstan', 'Uzbekistan', 'Afghanistan', 'Iran'] },
  'UAE': { name: 'UAE', flag: '🇦🇪', neighbors: ['Saudi Arabia', 'Oman'] },
  'Uganda': { name: 'Uganda', flag: '🇺🇬', neighbors: ['South Sudan', 'Kenya', 'Tanzania', 'Rwanda', 'Democratic Republic of the Congo'] },
  'Ukraine': { name: 'Ukraine', flag: '🇺🇦', neighbors: ['Belarus', 'Russia', 'Poland', 'Slovakia', 'Hungary', 'Romania', 'Moldova'] },
  'United Kingdom': { name: 'United Kingdom', flag: '🇬🇧', neighbors: ['Ireland'] },
  'United States': { name: 'United States', flag: '🇺🇸', neighbors: ['Canada', 'Mexico'] },
  'Uruguay': { name: 'Uruguay', flag: '🇺🇾', neighbors: ['Brazil', 'Argentina'] },
  'Uzbekistan': { name: 'Uzbekistan', flag: '🇺🇿', neighbors: ['Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Afghanistan', 'Turkmenistan'] },
  'Vatican City': { name: 'Vatican City', flag: '🇻🇦', neighbors: ['Italy'] },
  'Venezuela': { name: 'Venezuela', flag: '🇻🇪', neighbors: ['Colombia', 'Brazil', 'Guyana'] },
  'Vietnam': { name: 'Vietnam', flag: '🇻🇳', neighbors: ['China', 'Laos', 'Cambodia'] },
  'Yemen': { name: 'Yemen', flag: '🇾🇪', neighbors: ['Saudi Arabia', 'Oman'] },
  'Zambia': { name: 'Zambia', flag: '🇿🇲', neighbors: ['Democratic Republic of the Congo', 'Tanzania', 'Malawi', 'Mozambique', 'Namibia', 'Zimbabwe', 'Botswana', 'Angola'] },
  'Zimbabwe': { name: 'Zimbabwe', flag: '🇿🇼', neighbors: ['Mozambique', 'South Africa', 'Botswana', 'Zambia'] }
};


type DirectionKey = 'north' | 'south' | 'east' | 'west';
type RuleKey =
  | DirectionKey
  | 'moreNeighbors'
  | 'fewerNeighbors'
  | 'longerName'
  | 'shorterName'
  | 'alphabeticallyLater'
  | 'alphabeticallyEarlier';

type RuleConfig = {
  key: RuleKey;
  label: string;
  shortLabel: string;
  icon: string;
  explanation: string;
  requirementText: string;
};

type Coords = { lat: number; lng: number };

type DailyChallenge = {
  startCountry: Country;
  rule: RuleKey;
  optimalChain: Country[];
};

const RULE_CONFIG: Record<RuleKey, RuleConfig> = {
  north: {
    key: 'north',
    label: 'North only',
    shortLabel: 'Move north',
    icon: 'ri-arrow-up-line',
    explanation: 'Each next country must border the current one and sit farther north.',
    requirementText: 'be farther north',
  },
  south: {
    key: 'south',
    label: 'South only',
    shortLabel: 'Move south',
    icon: 'ri-arrow-down-line',
    explanation: 'Each next country must border the current one and sit farther south.',
    requirementText: 'be farther south',
  },
  east: {
    key: 'east',
    label: 'East only',
    shortLabel: 'Move east',
    icon: 'ri-arrow-right-line',
    explanation: 'Each next country must border the current one and sit farther east.',
    requirementText: 'be farther east',
  },
  west: {
    key: 'west',
    label: 'West only',
    shortLabel: 'Move west',
    icon: 'ri-arrow-left-line',
    explanation: 'Each next country must border the current one and sit farther west.',
    requirementText: 'be farther west',
  },
  moreNeighbors: {
    key: 'moreNeighbors',
    label: 'More neighbors',
    shortLabel: 'More neighbors',
    icon: 'ri-node-tree',
    explanation: 'Each next country must border the current one and have more neighboring countries.',
    requirementText: 'have more neighboring countries',
  },
  fewerNeighbors: {
    key: 'fewerNeighbors',
    label: 'Fewer neighbors',
    shortLabel: 'Fewer neighbors',
    icon: 'ri-git-branch-line',
    explanation: 'Each next country must border the current one and have fewer neighboring countries.',
    requirementText: 'have fewer neighboring countries',
  },
  longerName: {
    key: 'longerName',
    label: 'Longer name',
    shortLabel: 'Longer name',
    icon: 'ri-text',
    explanation: 'Each next country must border the current one and have a longer country name.',
    requirementText: 'have a longer country name',
  },
  shorterName: {
    key: 'shorterName',
    label: 'Shorter name',
    shortLabel: 'Shorter name',
    icon: 'ri-font-size-2',
    explanation: 'Each next country must border the current one and have a shorter country name.',
    requirementText: 'have a shorter country name',
  },
  alphabeticallyLater: {
    key: 'alphabeticallyLater',
    label: 'Alphabetically later',
    shortLabel: 'A → Z',
    icon: 'ri-sort-alphabet-asc',
    explanation: 'Each next country must border the current one and come later alphabetically.',
    requirementText: 'come later alphabetically',
  },
  alphabeticallyEarlier: {
    key: 'alphabeticallyEarlier',
    label: 'Alphabetically earlier',
    shortLabel: 'Z → A',
    icon: 'ri-sort-alphabet-desc',
    explanation: 'Each next country must border the current one and come earlier alphabetically.',
    requirementText: 'come earlier alphabetically',
  },
};

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  'Republic of the Congo': 'Congo',
  'Democratic Republic of the Congo': 'Congo, Democratic Republic of the',
  'Eswatini': 'Swaziland',
  'Iran': 'Iran, Islamic Rep. of',
  'Ivory Coast': "Côte d'Ivoire",
  'Laos': "Lao People's Dem. Rep.",
  'Libya': 'Libyan Arab Jamahiriya',
  'Moldova': 'Moldova, Republic of',
  'North Korea': "Korea, Dem. People's Rep. of",
  'North Macedonia': 'Macedonia, The former Yugoslav Rep. of',
  'Russia': 'Russian Federation',
  'South Korea': 'Korea, Republic of',
  'South Sudan': 'South Sudan, The Republic of',
  'Sudan': 'Sudan, The Republic of',
  'Syria': 'Syrian Arab Republic',
  'Tanzania': 'Tanzania, United Republic of',
  'UAE': 'United Arab Emirates',
  'Venezuela': 'Venezuela, Bolivarian Rep. of',
  'Vietnam': 'Viet Nam',
};

const REPRESENTATIVE_COORDS: Record<string, Coords> = {
  // Use manual representative points when the metadata uses a different country name
  // or when the generic centroid makes the direction-based game feel wrong.
  Ethiopia: { lat: 9.15, lng: 40.49 },
  Kenya: { lat: -1.29, lng: 36.82 },
  Somalia: { lat: 2.05, lng: 45.32 },
  'South Sudan': { lat: 4.85, lng: 31.58 },
  Sudan: { lat: 15.50, lng: 32.56 },
  Kosovo: { lat: 42.6, lng: 20.9 },
  Liechtenstein: { lat: 47.16, lng: 9.55 },
  Palestine: { lat: 31.95, lng: 35.25 },
  'San Marino': { lat: 43.94, lng: 12.46 },
  'Vatican City': { lat: 41.9, lng: 12.45 },
};

const MIN_MAX_CHAIN = 5;
const EPSILON = 0.05;


function EmojiCountryChain({ chain, title, subtitle }: { chain: Country[]; title: string; subtitle?: string }) {
  if (chain.length <= 1) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{title}</h3>
      {subtitle ? <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{subtitle}</p> : <div className="mb-4" />}
      <div className="flex flex-wrap gap-2">
        {chain.map((country, index) => (
          <div key={`${country.name}-${index}`} className="flex items-center">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-4 py-2 border border-emerald-200 dark:border-emerald-700 flex items-center gap-2">
              <img
                src={getFlagUrl(country.name, 40)}
                alt={`${country.name} flag`}
                className="rounded object-cover shadow-sm shrink-0"
                style={{ width: 28, height: 19 }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="font-medium text-slate-700 dark:text-slate-200">{country.name}</span>
            </div>
            {index < chain.length - 1 && (
              <i className="ri-arrow-right-line text-emerald-500 dark:text-emerald-400 mx-2 text-xl"></i>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


export default function BorderDominoPage() {
  const { t } = useTranslation();
  const [chain, setChain] = useState<Country[]>([]);
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');
  const { record: recordRun } = useGameStats('border-domino');
  const runIdRef = useRef(0);
  const [score, setScore] = useState(0);
  const [optimalChain, setOptimalChain] = useState<Country[]>([]);
  const [optimalChainLoading, setOptimalChainLoading] = useState(true);
  const [ruleKey, setRuleKey] = useState<RuleKey>('north');
  const [showRules, setShowRules] = useState(true);

  const normalizeCountryKey = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

  const countryCoordinates = useMemo(() => {
    const map = new Map<string, Coords>();

    Object.entries(COUNTRY_METADATA).forEach(([name, data]) => {
      const coords = data as Coords;
      map.set(normalizeCountryKey(name), { lat: coords.lat, lng: coords.lng });
    });

    Object.entries(COUNTRY_NAME_ALIASES).forEach(([gameName, metadataName]) => {
      const metadataCountry = COUNTRY_METADATA[metadataName as keyof typeof COUNTRY_METADATA];
      if (metadataCountry) {
        map.set(normalizeCountryKey(gameName), { lat: metadataCountry.lat, lng: metadataCountry.lng });
      }
    });

    return map;
  }, []);

  const resolveCoords = (countryName: string): Coords | null => {
    if (REPRESENTATIVE_COORDS[countryName]) return REPRESENTATIVE_COORDS[countryName];

    const normalizedName = normalizeCountryKey(countryName);
    if (countryCoordinates.has(normalizedName)) return countryCoordinates.get(normalizedName)!;

    return null;
  };

  const getCurrentBrusselsDate = () =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Brussels',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

  const hashString = (value: string) => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const getNeighborCount = (countryName: string) =>
    COUNTRIES[countryName]?.neighbors.filter((neighborName) => Boolean(COUNTRIES[neighborName])).length ?? 0;

  const getNameLength = (countryName: string) =>
    countryName.replace(/[^A-Za-z]/g, '').length;

  const compareCountryNames = (a: string, b: string) =>
    a.localeCompare(b, 'en', { sensitivity: 'base' });

  const isDirectionalRule = (rule: RuleKey): rule is DirectionKey =>
    rule === 'north' || rule === 'south' || rule === 'east' || rule === 'west';

  const isValidByRule = (fromCountry: string, toCountry: string, rule: RuleKey) => {
    if (isDirectionalRule(rule)) {
      const from = resolveCoords(fromCountry);
      const to = resolveCoords(toCountry);
      if (!from || !to) return false;

      if (rule === 'north') return to.lat > from.lat + EPSILON;
      if (rule === 'south') return to.lat < from.lat - EPSILON;
      if (rule === 'east') return to.lng > from.lng + EPSILON;
      return to.lng < from.lng - EPSILON;
    }

    if (rule === 'moreNeighbors') return getNeighborCount(toCountry) > getNeighborCount(fromCountry);
    if (rule === 'fewerNeighbors') return getNeighborCount(toCountry) < getNeighborCount(fromCountry);
    if (rule === 'longerName') return getNameLength(toCountry) > getNameLength(fromCountry);
    if (rule === 'shorterName') return getNameLength(toCountry) < getNameLength(fromCountry);
    if (rule === 'alphabeticallyLater') return compareCountryNames(toCountry, fromCountry) > 0;
    return compareCountryNames(toCountry, fromCountry) < 0;
  };

  const getRuleNeighbors = (countryName: string, rule: RuleKey, used = new Set<string>()) => {
    const country = COUNTRIES[countryName];
    if (!country) return [] as Country[];

    return country.neighbors
      .filter((neighborName) => COUNTRIES[neighborName])
      .filter((neighborName) => !used.has(neighborName))
      .filter((neighborName) => isValidByRule(countryName, neighborName, rule))
      .map((neighborName) => COUNTRIES[neighborName]);
  };

  /**
   * Returns true as soon as a valid chain of length >= minLength is found,
   * using early-exit DFS so we don't need to compute the full optimal chain.
   */
  const hasChainLongerThan = (startCountryName: string, rule: RuleKey, minLength: number): boolean => {
    const dfs = (countryName: string, visited: Set<string>, depth: number): boolean => {
      if (depth >= minLength) return true;
      const options = getRuleNeighbors(countryName, rule, visited);
      for (const next of options) {
        const newVisited = new Set(visited);
        newVisited.add(next.name);
        if (dfs(next.name, newVisited, depth + 1)) return true;
      }
      return false;
    };
    return dfs(startCountryName, new Set([startCountryName]), 1);
  };

  /**
   * Best chain we can find from a start country, under a search budget.
   *
   * Finding the genuinely longest simple path is NP-hard, and this ran an
   * exhaustive DFS with no depth limit and no budget. On a sparse rule that
   * finishes instantly, which is why it went unnoticed — but the graph is dense
   * in Europe and Africa, and on the wrong rule/start combination the number of
   * simple paths explodes and the tab freezes outright.
   *
   * The budget below makes the search always terminate. It returns the best
   * chain found rather than a guaranteed optimum, which is the right trade for
   * a "best possible today" hint: an occasionally conservative number beats a
   * page that never loads.
   */
  const MAX_SEARCH_VISITS = 150_000;
  const MAX_SEARCH_DEPTH = 15;

  /**
   * True when the last search hit its budget, so the chain returned is a lower
   * bound rather than the true optimum. The UI shows "10+" in that case instead
   * of an exact number it cannot stand behind.
   */
  const [optimalIsLowerBound, setOptimalIsLowerBound] = useState(false);

  const calculateOptimalChainForRule = (
    startCountry: Country,
    rule: RuleKey,
  ): { chain: Country[]; truncated: boolean } => {
    let visits = 0;
    let truncated = false;

    const dfs = (countryName: string, visited: Set<string>, depth: number): Country[] => {
      const country = COUNTRIES[countryName];
      if (!country) return [];

      visits += 1;
      if (visits > MAX_SEARCH_VISITS || depth >= MAX_SEARCH_DEPTH) {
        truncated = true;
        return [country];
      }

      const options = getRuleNeighbors(countryName, rule, visited);
      if (options.length === 0) return [country];

      let best = [country];
      for (const next of options) {
        if (visits > MAX_SEARCH_VISITS) break;
        const newVisited = new Set(visited);
        newVisited.add(next.name);
        const candidate = [country, ...dfs(next.name, newVisited, depth + 1)];
        if (candidate.length > best.length) {
          best = candidate;
        }
      }

      return best;
    };

    const chain = dfs(startCountry.name, new Set([startCountry.name]), 0);
    return { chain, truncated };
  };

  /**
   * Picks today's rule and start country using only hash arithmetic — no DFS.
   * The optimal chain is computed separately and lazily.
   */
  const pickDailyStartAndRule = (): { startCountry: Country; rule: RuleKey } => {
    const countryNames = Object.keys(COUNTRIES);
    const ruleKeys = Object.keys(RULE_CONFIG) as RuleKey[];
    const dateStr = getCurrentBrusselsDate();

    const ruleIndex = hashString(`${dateStr}-border-domino-rule-v3`) % ruleKeys.length;
    const rule = ruleKeys[ruleIndex];

    const baseEligible = isDirectionalRule(rule)
      ? countryNames.filter((name) => resolveCoords(name))
      : countryNames;

    // Only keep countries whose longest possible chain under this rule is > 3
    const filtered = baseEligible.filter((name) => hasChainLongerThan(name, rule, 4));

    // Defensive fallback: if somehow every country is filtered out, use the base list
    const pool = filtered.length > 0 ? filtered : baseEligible;

    const countryIndex = hashString(`${dateStr}-border-domino-country-v3`) % pool.length;
    const startCountry = COUNTRIES[pool[countryIndex]];

    return { startCountry, rule };
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const { startCountry, rule } = pickDailyStartAndRule();
    setCurrentCountry(startCountry);
    setChain([startCountry]);
    setGameOver(false);
    setGameOverReason('');
    setScore(0);
    setRuleKey(rule);
    setOptimalChain([]);
    setOptimalChainLoading(true);

    // Compute the optimal chain lazily so the UI renders first
    setTimeout(() => {
      const { chain: optimal, truncated } = calculateOptimalChainForRule(startCountry, rule);
      setOptimalChain(optimal);
      setOptimalIsLowerBound(truncated);
      setOptimalChainLoading(false);
    }, 0);
  };

  const finishGame = (reason: string) => {
    // Score is the chain length reached. Keyed on the run so the same game
    // can't be counted twice if finishGame is somehow reached again.
    recordRun({ score }, `run-${runIdRef.current}`);
    runIdRef.current += 1;
    setGameOverReason(reason);
    setGameOver(true);
  };

  const handleCountrySubmit = (countryName: string) => {
    if (!currentCountry) return;

    const normalizedInput = countryName.trim();
    const submittedCountry = COUNTRIES[normalizedInput];
    const rule = RULE_CONFIG[ruleKey];

    if (!submittedCountry) {
      finishGame(`"${normalizedInput}" is not a valid country name.`);
      return;
    }

    if (chain.some((country) => country.name === submittedCountry.name)) {
      finishGame(`You already used ${submittedCountry.flag} ${submittedCountry.name}.`);
      return;
    }

    if (!currentCountry.neighbors.includes(submittedCountry.name)) {
      finishGame(`${submittedCountry.flag} ${submittedCountry.name} does not border ${currentCountry.flag} ${currentCountry.name}.`);
      return;
    }

    if (!isValidByRule(currentCountry.name, submittedCountry.name, ruleKey)) {
      finishGame(`${submittedCountry.flag} ${submittedCountry.name} borders ${currentCountry.flag} ${currentCountry.name}, but it does not ${rule.requirementText}.`);
      return;
    }

    const newChain = [...chain, submittedCountry];
    const newScore = newChain.length - 1;
    const used = new Set(newChain.map((country) => country.name));
    const remainingMoves = getRuleNeighbors(submittedCountry.name, ruleKey, used);

    setChain(newChain);
    setCurrentCountry(submittedCountry);
    setScore(newScore);

    if (remainingMoves.length === 0) {
      finishGame(`No unused bordering countries remain that ${rule.requirementText}.`);
    }
  };

  const handleGiveUp = () => {
    finishGame('You gave up.');
  };

  const shareBest = Math.max(optimalChain.length - 1, 0);
  const sharePayload = {
    game: 'Border Domino',
    result: `${RULE_CONFIG[ruleKey].label} — ${
      shareBest > 0
        ? `${scoreLine(score, shareBest)}${optimalIsLowerBound ? '+' : ''}`
        : String(score)
    } borders crossed`,
    details: [
      chain.length > 0 && `🚩 Start: ${chain[0].flag} ${chain[0].name}`,
      '',
      chain.map((c) => `${c.flag} ${c.name}`).join(' → '),
    ],
    path: '/border-domino',
  };

  const activeRule = RULE_CONFIG[ruleKey];
  const usedCountries = new Set<string>(chain.map((country) => country.name));
  const availableMoves = currentCountry ? getRuleNeighbors(currentCountry.name, ruleKey, usedCountries) : [];
  const allCountryNames = Object.keys(COUNTRIES).sort((a, b) => a.localeCompare(b));
  const maxChainLength = optimalChainLoading ? null : Math.max(optimalChain.length - 1, 0);
  /**
   * When the search hit its budget the number is a floor, not the optimum, so
   * show it as "10+" rather than claiming an exact best.
   */
  const maxChainDisplay =
    maxChainLength === null ? null : `${maxChainLength}${optimalIsLowerBound ? '+' : ''}`;

  return (
    <div className="app-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <GameNavbar currentPath="/border-domino" />

      <RulesModal
        open={showRules}
        onClose={() => { setShowRules(false); }}
        title="How Border Domino works"
        icon="ri-map-2-line"
        iconGradient="from-emerald-500 to-teal-600"
        accent="emerald"
        description="Start from today's country and build the longest possible chain of bordering countries — but every step must obey today's rule."
        rules={[
          { icon: 'ri-arrow-right-line', text: 'Each country you name must share a land border with the current country.' },
          { icon: 'ri-filter-line', text: "Today's rule adds an extra condition — e.g. 'must be farther north' or 'must have more neighbours'." },
          { icon: 'ri-prohibited-line', text: "You can't reuse a country. The chain ends when no valid move remains — or when you give up." },
        ]}
        scoring={[
          { pts: '+1', label: 'Per valid step', sub: 'each border crossed', color: 'green' },
          { pts: 'Max', label: 'Best chain today', sub: 'shown after game over', color: 'cyan' },
          { pts: '0', label: 'Invalid move', sub: 'ends the game', color: 'red' },
        ]}
        tip="Think a few steps ahead — choosing a country with more valid neighbours gives you more options later."
        ctaLabel="Start the chain!"
        ctaGradient="from-emerald-500 to-teal-600"
      />

      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2 flex items-center justify-center gap-3">
          <i className="ri-map-2-line text-emerald-600 dark:text-emerald-400"></i>
          {t('borderDomino')}
          <i className="ri-earth-line text-emerald-600 dark:text-emerald-400"></i>
        </h1>
        <p className="text-slate-600 dark:text-slate-400">{t('borderDominoSubtitle')}</p>
        <button
          onClick={() => setShowRules(true)}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer font-medium"
          style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
        >
          <i className="ri-question-line"></i>
          How to play
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {!gameOver ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 text-center border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 dark:text-slate-400 text-sm mb-2">Current chain length</div>
                  <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">{score}</div>
                  <GameStatsBar gameId="border-domino" showStreak={false} className="mt-4" />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 dark:text-slate-400 text-sm mb-2">Today&apos;s restriction</div>
                  <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white mb-2">
                    <i className={`${activeRule.icon} text-emerald-600 dark:text-emerald-400`}></i>
                    {activeRule.label}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{activeRule.explanation}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 dark:text-slate-400 text-sm mb-2">Maximum chain today</div>
                  {optimalChainLoading ? (
                    <div className="text-slate-400 animate-pulse text-lg font-medium">Calculating…</div>
                  ) : (
                    <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{maxChainDisplay}</div>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {optimalIsLowerBound
                      ? "At least this many steps are possible from the same start country under today's restriction — the full search is too large to finish exactly."
                      : "Best possible score from the same start country under today's restriction."}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 text-center">Current country</h2>
                {currentCountry && (
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <img
                        src={getFlagUrl(currentCountry.name, 160)}
                        alt={`${currentCountry.name} flag`}
                        className="rounded-xl object-cover shadow-md"
                        style={{ width: 160, height: 107 }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <div className="text-3xl font-bold text-slate-800 dark:text-white mb-3">{currentCountry.name}</div>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">Choose any country you want. To count, it must border {currentCountry.name} and {activeRule.requirementText}.</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 text-sm font-medium">
                      <i className={activeRule.icon}></i>
                      {availableMoves.length} valid move{availableMoves.length === 1 ? '' : 's'} available from here
                    </div>
                  </div>
                )}
              </div>

              <CountryInput onSubmit={handleCountrySubmit} onGiveUp={handleGiveUp} countries={allCountryNames} />

              <EmojiCountryChain chain={chain} title="Your chain" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700 text-center">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">Round complete</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">{gameOverReason}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-left">
                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5">
                    <div className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">Your score</div>
                    <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">{score}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-5">
                    <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">Maximum chain today</div>
                    {optimalChainLoading ? (
                      <div className="text-slate-400 animate-pulse text-lg font-medium">Calculating…</div>
                    ) : (
                      <div className="text-4xl font-bold text-slate-700 dark:text-slate-200">{maxChainLength}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-5">
                    <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">Rule</div>
                    <div className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <i className={`${activeRule.icon} text-emerald-600 dark:text-emerald-400`}></i>
                      {activeRule.label}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-6 text-left mb-6">
                  <EmojiCountryChain chain={chain} title="Your chain" />
                </div>

                {!optimalChainLoading && optimalChain.length > 1 && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-6 text-left mb-6">
                    <EmojiCountryChain chain={optimalChain} title="One optimal chain" subtitle="This is a longest valid route from today&apos;s starting country under the same restriction." />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <ShareButtons share={sharePayload} className="flex-1" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
