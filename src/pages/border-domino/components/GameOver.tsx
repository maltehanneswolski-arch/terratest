import { useState } from 'react';

interface Country {
  name: string;
  flag: string;
  neighbors: string[];
}

interface GameOverProps {
  score: number;
  reason: string;
  chain: Country[];
  longestPossibleChain: Country[];
  onPlayAgain: () => void;
  onShare: () => void;
}

// Get country code from country name
const getCountryCode = (countryName: string): string => {
  const countryCodeMap: { [key: string]: string } = {
    'Afghanistan': 'af', 'Albania': 'al', 'Algeria': 'dz', 'Andorra': 'ad', 'Angola': 'ao',
    'Argentina': 'ar', 'Armenia': 'am', 'Austria': 'at', 'Azerbaijan': 'az', 'Bangladesh': 'bd',
    'Belarus': 'by', 'Belgium': 'be', 'Belize': 'bz', 'Benin': 'bj', 'Bhutan': 'bt',
    'Bolivia': 'bo', 'Bosnia and Herzegovina': 'ba', 'Botswana': 'bw', 'Brazil': 'br', 'Bulgaria': 'bg',
    'Burkina Faso': 'bf', 'Burundi': 'bi', 'Cambodia': 'kh', 'Cameroon': 'cm', 'Canada': 'ca',
    'Central African Republic': 'cf', 'Chad': 'td', 'Chile': 'cl', 'China': 'cn', 'Colombia': 'co',
    'Republic of the Congo': 'cg', 'Costa Rica': 'cr', 'Croatia': 'hr', 'Czech Republic': 'cz',
    'Democratic Republic of the Congo': 'cd', 'Denmark': 'dk', 'Djibouti': 'dj', 'Dominican Republic': 'do',
    'Ecuador': 'ec', 'Egypt': 'eg', 'El Salvador': 'sv', 'Equatorial Guinea': 'gq', 'Eritrea': 'er',
    'Estonia': 'ee', 'Eswatini': 'sz', 'Ethiopia': 'et', 'Finland': 'fi', 'France': 'fr',
    'Gabon': 'ga', 'Gambia': 'gm', 'Georgia': 'ge', 'Germany': 'de', 'Ghana': 'gh',
    'Greece': 'gr', 'Guatemala': 'gt', 'Guinea': 'gn', 'Guinea-Bissau': 'gw', 'Guyana': 'gy',
    'Haiti': 'ht', 'Honduras': 'hn', 'Hungary': 'hu', 'India': 'in', 'Indonesia': 'id',
    'Iran': 'ir', 'Iraq': 'iq', 'Ireland': 'ie', 'Israel': 'il', 'Italy': 'it',
    'Ivory Coast': 'ci', 'Jordan': 'jo', 'Kazakhstan': 'kz', 'Kenya': 'ke', 'Kosovo': 'xk',
    'Kuwait': 'kw', 'Kyrgyzstan': 'kg', 'Laos': 'la', 'Latvia': 'lv', 'Lebanon': 'lb',
    'Lesotho': 'ls', 'Liberia': 'lr', 'Libya': 'ly', 'Liechtenstein': 'li', 'Lithuania': 'lt',
    'Luxembourg': 'lu', 'Madagascar': 'mg', 'Malawi': 'mw', 'Malaysia': 'my', 'Mali': 'ml',
    'Mauritania': 'mr', 'Mexico': 'mx', 'Moldova': 'md', 'Monaco': 'mc', 'Mongolia': 'mn',
    'Montenegro': 'me', 'Morocco': 'ma', 'Mozambique': 'mz', 'Myanmar': 'mm', 'Namibia': 'na',
    'Nepal': 'np', 'Netherlands': 'nl', 'Nicaragua': 'ni', 'Niger': 'ne', 'Nigeria': 'ng',
    'North Korea': 'kp', 'North Macedonia': 'mk', 'Norway': 'no', 'Oman': 'om', 'Pakistan': 'pk',
    'Palestine': 'ps', 'Panama': 'pa', 'Papua New Guinea': 'pg', 'Paraguay': 'py', 'Peru': 'pe',
    'Poland': 'pl', 'Portugal': 'pt', 'Qatar': 'qa', 'Romania': 'ro', 'Russia': 'ru',
    'Rwanda': 'rw', 'San Marino': 'sm', 'Saudi Arabia': 'sa', 'Senegal': 'sn', 'Serbia': 'rs',
    'Sierra Leone': 'sl', 'Slovakia': 'sk', 'Slovenia': 'si', 'Somalia': 'so', 'South Africa': 'za',
    'South Korea': 'kr', 'South Sudan': 'ss', 'Spain': 'es', 'Sudan': 'sd', 'Suriname': 'sr',
    'Sweden': 'se', 'Switzerland': 'ch', 'Syria': 'sy', 'Tajikistan': 'tj', 'Tanzania': 'tz',
    'Thailand': 'th', 'Timor-Leste': 'tl', 'Togo': 'tg', 'Tunisia': 'tn', 'Turkey': 'tr',
    'Turkmenistan': 'tm', 'UAE': 'ae', 'Uganda': 'ug', 'Ukraine': 'ua', 'United Kingdom': 'gb',
    'United States': 'us', 'Uruguay': 'uy', 'Uzbekistan': 'uz', 'Vatican City': 'va',
    'Venezuela': 've', 'Vietnam': 'vn', 'Yemen': 'ye', 'Zambia': 'zm', 'Zimbabwe': 'zw',
    'French Guiana': 'gf', 'Western Sahara': 'eh', 'Brunei': 'bn'
  };
  return countryCodeMap[countryName] || 'un';
};

export function GameOver({ score, reason, chain, longestPossibleChain, onPlayAgain, onShare }: GameOverProps) {

  const getScoreFeedback = (s: number): { label: string; message: string; color: string } => {
    if (s <= 2) return {
      label: 'Keep Exploring',
      message: 'A rough start — but every great geographer has to begin somewhere. The borders will start clicking soon.',
      color: 'text-slate-500 dark:text-slate-400',
    };
    if (s <= 4) return {
      label: 'Getting There',
      message: 'Not bad at all — you\'re building a feel for the map. A few more runs and it\'ll all come together.',
      color: 'text-amber-500 dark:text-amber-400',
    };
    if (s <= 6) return {
      label: 'Decent Run',
      message: 'Solid effort — you clearly know your way around the globe. A bit more confidence and you\'ll go much further.',
      color: 'text-yellow-500 dark:text-yellow-400',
    };
    if (s <= 8) return {
      label: 'Good Stuff',
      message: 'You\'ve got a strong handle on world borders. That\'s a respectable chain by any measure.',
      color: 'text-lime-500 dark:text-lime-400',
    };
    if (s <= 10) return {
      label: 'Great Chain',
      message: 'Impressive — navigating borders at that length takes real geographic intuition. Well played.',
      color: 'text-emerald-500 dark:text-emerald-400',
    };
    if (s <= 13) return {
      label: 'Excellent',
      message: 'You\'re clearly no stranger to world geography. That chain shows serious knowledge and focus.',
      color: 'text-teal-500 dark:text-teal-400',
    };
    if (s <= 17) return {
      label: 'Outstanding',
      message: 'That\'s a remarkable run — most people don\'t get close. You\'ve got the world map practically memorized.',
      color: 'text-cyan-500 dark:text-cyan-400',
    };
    if (s <= 22) return {
      label: 'Masterful',
      message: 'Genuinely elite geography knowledge on display. The world map is basically your backyard at this point.',
      color: 'text-indigo-500 dark:text-indigo-400',
    };
    return {
      label: 'Legendary',
      message: 'An almost unchartable performance. You\'re operating on a level most players can only dream of. Remarkable.',
      color: 'text-rose-500 dark:text-rose-400',
    };
  };

  const feedback = getScoreFeedback(score);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center border border-slate-200 dark:border-slate-700">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Game Over!</h2>
        
        <div className="text-xl text-slate-600 dark:text-slate-300 mb-6">
          {reason}
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-6 mb-6 border border-emerald-200 dark:border-emerald-700">
          <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">Your Chain Length</div>
          <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">{score}</div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 mb-6 border border-slate-200 dark:border-slate-600">
          <div className={`text-lg font-bold mb-2 ${feedback.color}`}>{feedback.label}</div>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{feedback.message}</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-600">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Your Chain</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {chain.map((country, index) => (
              <div key={index} className="flex items-center">
                <div className="bg-white dark:bg-slate-600 rounded-lg px-3 py-2 shadow-sm border border-slate-200 dark:border-slate-500 flex items-center gap-2">
                  <img 
                    src={`https://flagcdn.com/w40/${getCountryCode(country.name)}.png`}
                    alt={`${country.name} flag`}
                    className="w-8 h-6 object-cover rounded"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{country.name}</span>
                </div>
                {index < chain.length - 1 && (
                  <i className="ri-arrow-right-line text-slate-400 dark:text-slate-500 mx-1"></i>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onShare}
            className="flex-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-3 px-6 rounded-full font-semibold transition-colors whitespace-nowrap shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <i className="ri-share-line mr-2"></i>
            Share Results
          </button>
          
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white py-3 px-6 rounded-full font-semibold transition-colors whitespace-nowrap shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <i className="ri-refresh-line mr-2"></i>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
