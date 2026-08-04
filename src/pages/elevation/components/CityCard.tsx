
interface City {
  name: string;
  country: string;
  elevation: number;
}

interface CityCardProps {
  city: City;
  onSelect: (city: City) => void;
  isSelected: boolean;
  showElevation: boolean;
  isCorrect?: boolean;
  isLoading: boolean;
  flag: string;
}

export function CityCard({ 
  city, 
  onSelect, 
  isSelected, 
  showElevation, 
  isCorrect, 
  isLoading,
  flag 
}: CityCardProps) {
  const handleClick = () => {
    if (!showElevation && !isLoading) {
      onSelect(city);
    }
  };

  const getCardStyle = () => {
    if (!showElevation) {
      return 'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transform hover:scale-105';
    }
    
    if (isSelected) {
      if (isCorrect) {
        return 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-500 ring-2 ring-green-200 dark:ring-green-600';
      } else {
        return 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-500 ring-2 ring-red-200 dark:ring-red-600';
      }
    }
    
    return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600';
  };

  const getElevationColor = () => {
    if (city.elevation > 2000) return 'text-purple-600 dark:text-purple-400';
    if (city.elevation > 1000) return 'text-blue-600 dark:text-blue-400';
    if (city.elevation > 500) return 'text-green-600 dark:text-green-400';
    if (city.elevation > 100) return 'text-yellow-600 dark:text-yellow-400';
    if (city.elevation > 0) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-8 rounded-2xl border-2 transition-all duration-300 shadow-lg
        ${getCardStyle()}
        ${isLoading && isSelected ? 'animate-pulse' : ''}
      `}
    >
      {/* Loading overlay */}
      {isLoading && isSelected && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-2xl flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">Revealing elevation...</p>
          </div>
        </div>
      )}

      {/* Result indicator */}
      {showElevation && isSelected && (
        <div className="absolute -top-4 -right-4 z-20">
          {isCorrect ? (
            <div className="bg-green-500 text-white rounded-full p-3 shadow-lg">
              <i className="ri-check-line text-2xl"></i>
            </div>
          ) : (
            <div className="bg-red-500 text-white rounded-full p-3 shadow-lg">
              <i className="ri-close-line text-2xl"></i>
            </div>
          )}
        </div>
      )}

      <div className="text-center">
        {/* Flag - Using image instead of emoji for better cross-browser support */}
        <div className="mb-6 flex items-center justify-center">
          <img 
            src={`https://flagcdn.com/w160/${flag.toLowerCase()}.png`}
            alt={`${city.country} flag`}
            className="w-24 h-16 object-cover rounded-lg shadow-md"
            onError={(e) => {
              // Fallback to emoji if image fails
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }}
          />
          <div className="text-7xl hidden" style={{ fontSize: '5rem' }}>🏳️</div>
        </div>
        
        {/* City name */}
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{city.name}</h3>
        
        {/* Country */}
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">{city.country}</p>
        
        {/* Elevation (shown after selection) */}
        {showElevation ? (
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${getElevationColor()}`}>
              {city.elevation.toLocaleString()} m
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {city.elevation > 0 ? 'above sea level' : 'below sea level'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-slate-400 dark:text-slate-500">
              <i className="ri-mountain-line text-4xl"></i>
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              Click to select
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
