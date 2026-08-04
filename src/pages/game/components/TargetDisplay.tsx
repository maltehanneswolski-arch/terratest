interface TargetDisplayProps {
  targetNumber: number;
  bonusCountry: string;
  bonusFlag: string;
}

export function TargetDisplay({ targetNumber, bonusCountry, bonusFlag }: TargetDisplayProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 justify-center items-start">
      {/* Target Number Box */}
      <div className="bg-red-50 backdrop-blur-sm rounded-l-2xl lg:rounded-r-none rounded-r-2xl p-8 shadow-xl max-w-md mx-auto lg:mx-0 border border-red-100 lg:border-r-0">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Today's Target</h2>
        <div className="text-4xl font-bold text-red-600 mb-2">
          {formatNumber(targetNumber)}
        </div>
        <div className="text-slate-600">
          Combined population to guess
        </div>
        <div className="mt-4 text-sm text-slate-500">
          Select 3 cities whose total population matches this number
        </div>
      </div>

      {/* Bonus Country Box */}
      <div className="bg-purple-50 backdrop-blur-sm rounded-r-2xl lg:rounded-l-none rounded-l-2xl p-6 shadow-xl max-w-sm mx-auto lg:mx-0 border border-purple-100 lg:border-l-0">
        <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center">
          <i className="ri-star-line text-purple-600 mr-2"></i>
          Bonus Country
        </h3>
        <div className="text-center mb-3">
          <div className="text-3xl mb-2">{bonusFlag}</div>
          <div className="text-lg font-semibold text-purple-700">{bonusCountry}</div>
        </div>
        <div className="text-sm text-slate-600 text-center">
          <div className="bg-purple-100 rounded-lg p-3">
            <i className="ri-trophy-line text-purple-600 mr-1"></i>
            <strong>Bonus Effect:</strong> Using any city from {bonusCountry} will <span className="text-purple-700 font-semibold">halve your accuracy score</span>, making your result better!
          </div>
        </div>
      </div>
    </div>
  );
}