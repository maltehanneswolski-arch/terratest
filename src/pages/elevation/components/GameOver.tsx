import { ShareButtons } from '@/components/feature/share-buttons';
import type { ShareDetails } from '@/lib/shareResult';

interface GameStats {
  totalGames: number;
  bestStreak: number;
  averageStreak: number;
  totalCorrect: number;
  totalAttempts: number;
}

interface GameOverProps {
  finalStreak: number;
  stats: GameStats;
  onRestart: () => void;
  share: ShareDetails;
}

export function GameOver({ finalStreak, stats, onRestart, share }: GameOverProps) {
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

  const getResultMessage = (streak: number) => {
    if (streak >= 21) return "LEGENDARY GEOGRAPHY MASTER! 🏆";
    if (streak >= 15) return "Outstanding performance! 🌟";
    if (streak >= 10) return "Excellent geography skills! 🎯";
    if (streak >= 5) return "Great job! 👏";
    if (streak >= 1) return "Good effort! 💪";
    return "Better luck next time! 🎮";
  };

  const getResultEmoji = (streak: number) => {
    if (streak >= 21) return '🏆';
    if (streak >= 15) return '🥇';
    if (streak >= 10) return '🥈';
    if (streak >= 5) return '🥉';
    return '🎮';
  };

  const getScoreMessage = (score: number): string => {
    const messages = {
      0: [
        "Did you even try? 😴",
        "Zero? Really? 🤦‍♂️",
        "Ouch! That stings! 💀",
        "Better luck next time! 🎮",
        "Geography isn't for everyone! 🗺️",
        "Maybe try easier games? 🎯",
        "At least you showed up! 👻",
        "Practice makes perfect! 📚",
        "Everyone starts somewhere! 🌱",
        "Don't give up! 💪"
      ],
      1: [
        "One point? Really? 🤦‍♂️",
        "A broken clock is right twice! ⏰",
        "Lucky guess? 🍀",
        "Progress is progress! 📈",
        "Rome wasn't built in a day! 🏛️",
        "At least it's not zero! 🎯",
        "Baby steps! 👶",
        "You're on the board! 📊",
        "Every journey starts with one! 🚀",
        "Technically a win! ✨"
      ],
      2: [
        "Two points... Were you guessing? 👀",
        "Getting warmer! 🔥",
        "Double trouble! 😅",
        "Two is better than one! ✌️",
        "Small victories count! 🏆",
        "You're improving! 📊",
        "Keep the momentum! ⚡",
        "Not bad for a start! 🌟",
        "Building confidence! 💪",
        "Third time's the charm! 🎯"
      ],
      low: [
        "Ouch! Time for an atlas! 📚",
        "Geography 101 needed! 🎓",
        "Maps are your friend! 🗺️",
        "Study those elevations! 📖",
        "Practice makes perfect! 💪",
        "You'll get there! 🎯",
        "Keep trying! 🚀",
        "Learning curve ahead! 📈",
        "Room for improvement! ⬆️",
        "Don't give up! 🌟"
      ],
      medium: [
        "Not bad for a beginner! 🌱",
        "Getting the hang of it! 👍",
        "Solid effort! 💪",
        "You're learning! 📚",
        "Keep climbing! ⛰️",
        "Making progress! 📈",
        "Good foundation! 🏗️",
        "On the right track! 🛤️",
        "Building skills! 🔧",
        "Nice work! ✨"
      ],
      good: [
        "Getting warmer! 🔥",
        "You're on fire! 🌟",
        "Impressive progress! 📈",
        "Skills are showing! 💪",
        "Great improvement! ⬆️",
        "You're getting it! 🎯",
        "Solid performance! 🏆",
        "Keep it up! 🚀",
        "Nice streak! ⚡",
        "Well done! 👏"
      ],
      excellent: [
        "Impressive! You know elevations! 🎯",
        "Geography skills unlocked! 🔓",
        "You're crushing it! 💪",
        "Excellent work! 🏆",
        "Master in training! 🎓",
        "Outstanding effort! 🌟",
        "You're on fire! 🔥",
        "Brilliant performance! ✨",
        "Keep dominating! 👑",
        "Elevation expert! ⛰️"
      ],
      amazing: [
        "Outstanding! You're crushing this! 🌟",
        "Phenomenal skills! 🚀",
        "Are you using GPS? 📡",
        "Incredible knowledge! 🧠",
        "You're unstoppable! ⚡",
        "Absolutely brilliant! 💎",
        "Geography genius! 🎓",
        "Mind-blowing performance! 🤯",
        "You're on another level! 🚀",
        "Spectacular work! 🎆"
      ],
      legendary: [
        "Legendary! You're an altimeter! 📏",
        "Godlike geography skills! ⚡",
        "Do you have satellite vision? 🛰️",
        "Your brain is a topographic map! 🗺️",
        "Incredible! Are you human? 🤖",
        "Phenomenal mastery! 👑",
        "You've transcended geography! 🌌",
        "Absolutely legendary! 🏆",
        "Mind-reading elevations! 🔮",
        "Geography deity! ⚡"
      ],
      superhuman: [
        "SUPERHUMAN! You've transcended! 🦸‍♂️",
        "Are you from another planet? 👽",
        "You broke the system! 💥",
        "Impossible! Yet here we are! 🤯",
        "You're not human! 🤖",
        "Godlike performance! ⚡",
        "You've achieved enlightenment! 🌟",
        "The elevation whisperer! 🗣️",
        "You see in contour lines! 📏",
        "Geography has been conquered! 👑"
      ]
    };

    let messageArray;
    if (score === 0) messageArray = messages[0];
    else if (score === 1) messageArray = messages[1];
    else if (score === 2) messageArray = messages[2];
    else if (score <= 5) messageArray = messages.low;
    else if (score <= 10) messageArray = messages.medium;
    else if (score <= 15) messageArray = messages.good;
    else if (score <= 20) messageArray = messages.excellent;
    else if (score <= 30) messageArray = messages.amazing;
    else if (score <= 49) messageArray = messages.legendary;
    else messageArray = messages.superhuman;

    return messageArray[Math.floor(Math.random() * messageArray.length)];
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Game Over!</h2>
        <div className={`text-6xl font-bold mb-4 ${getStreakColor(finalStreak)}`}>{finalStreak}</div>
        <div className="text-lg text-slate-700 mb-6">{getScoreMessage(finalStreak)}</div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-500">Best Streak</div>
              <div className="font-semibold text-slate-700">{stats.bestStreak}</div>
            </div>
            <div>
              <div className="text-slate-500">Total Games</div>
              <div className="font-semibold text-slate-700">{stats.totalGames}</div>
            </div>
            <div>
              <div className="text-slate-500">Accuracy</div>
              <div className="font-semibold text-slate-700">
                {stats.totalAttempts > 0 ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100) : 0}%
              </div>
            </div>
            <div>
              <div className="text-slate-500">Avg Streak</div>
              <div className="font-semibold text-slate-700">{stats.averageStreak.toFixed(1)}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <ShareButtons share={share} />

          <div className="flex gap-4">
            <button
              onClick={onRestart}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap transform hover:scale-105 active:scale-95"
            >
              Play Again
            </button>
            <a
              href="/"
              className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 text-center shadow-md hover:shadow-lg whitespace-nowrap transform hover:scale-105 active:scale-95"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
