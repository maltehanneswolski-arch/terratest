
interface GameStats {
  totalGames: number;
  bestStreak: number;
  averageStreak: number;
  totalCorrect: number;
  totalAttempts: number;
}

interface GameStatsProps {
  stats: GameStats;
  currentStreak: number;
  onShare: () => void;
}

export function GameStats({ stats, currentStreak, onShare }: GameStatsProps) {
  const getStreakColor = (streak: number) => {
    if (streak >= 21) return 'text-purple-800';
    if (streak >= 18) return 'text-purple-600';
    if (streak >= 15) return 'text-indigo-600';
    if (streak >= 12) return 'text-blue-600';
    if (streak >= 9) return 'text-green-600';
    if (streak >= 6) return 'text-yellow-600';
    if (streak >= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 21) return "You're too good for the counting system! 🏆";
    if (streak >= 18) return "EPIC MASTERY! 👑";
    if (streak >= 15) return "Legendary streak! 🌟";
    if (streak >= 12) return "Geography genius! 🧠";
    if (streak >= 9) return "Unstoppable force! ⚡";
    if (streak >= 6) return "You're on fire! 🔥";
    if (streak >= 3) return "Keep the momentum going!";
    if (streak >= 1) return "Great start!";
    return "Start your streak!";
  };

  const getStreakDotColor = (index: number, streak: number) => {
    const position = index + 1;
    if (position > streak) return 'bg-slate-200';
    
    if (streak >= 21) return 'bg-purple-800';
    if (streak >= 18) return 'bg-purple-600';
    if (streak >= 15) return 'bg-indigo-600';
    if (streak >= 12) return 'bg-blue-600';
    if (streak >= 9) return 'bg-green-600';
    if (streak >= 6) return 'bg-yellow-500';
    if (streak >= 3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const renderStreakDots = () => {
    if (currentStreak <= 20) {
      // Show individual dots up to 20
      return (
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${getStreakDotColor(i, currentStreak)}`}
            />
          ))}
        </div>
      );
    } else {
      // Show 20 dots + additional count for streaks over 20
      const additional = currentStreak - 20;
      return (
        <div className="flex flex-wrap justify-center gap-1 mt-2 items-center">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${getStreakDotColor(i, 20)}`}
            />
          ))}
          <span className="text-purple-800 font-bold text-sm ml-2">+{additional}</span>
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Current Streak</h2>
        <div className={`text-4xl font-bold mb-2 ${getStreakColor(currentStreak)}`}>
          {currentStreak}
        </div>
        <div className="text-slate-600 mb-3">
          {getStreakMessage(currentStreak)}
        </div>
        
        {/* Streak visualization */}
        {renderStreakDots()}
        
        {/* Share Button */}
        <button
          onClick={onShare}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-full font-semibold transition-colors whitespace-nowrap text-sm"
        >
          <i className="ri-share-line mr-2"></i>
          Share Results
        </button>
        
        {/* Additional Stats */}
        {stats.totalAttempts > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-500">Best Streak</div>
                <div className="font-semibold text-slate-700">{stats.bestStreak}</div>
              </div>
              <div>
                <div className="text-slate-500">Accuracy</div>
                <div className="font-semibold text-slate-700">
                  {Math.round((stats.totalCorrect / stats.totalAttempts) * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
