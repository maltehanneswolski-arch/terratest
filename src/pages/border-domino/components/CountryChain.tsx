
interface Country {
  name: string;
  flag: string;
  neighbors: string[];
}

interface CountryChainProps {
  chain: Country[];
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

export function CountryChain({ chain }: CountryChainProps) {
  if (chain.length <= 1) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
        Your Chain ({chain.length} countries)
      </h3>
      <div className="flex flex-wrap gap-2">
        {chain.map((country, index) => (
          <div key={index} className="flex items-center">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-4 py-2 border border-emerald-200 dark:border-emerald-700 flex items-center gap-2">
              <img 
                src={`https://flagcdn.com/w40/${getCountryCode(country.name)}.png`}
                alt={`${country.name} flag`}
                className="w-8 h-6 object-cover rounded"
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
