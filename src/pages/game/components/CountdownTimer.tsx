
import { useState, useEffect } from 'react';
import { brusselsDate, msUntilNextBrusselsMidnight } from '@/lib/brusselsTime';

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // The Brussels date we mounted on. When it changes we've crossed midnight
    // there, which is the only condition that should trigger a reload.
    const startingDate = brusselsDate();
    let reloaded = false;

    const calculateTimeLeft = () => {
      // Milliseconds until the next Europe/Brussels midnight. Derived from the
      // zone's own wall clock rather than by juggling Date offsets, so the
      // result is correct regardless of the viewer's local timezone.
      const difference = msUntilNextBrusselsMidnight();

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });

      if (brusselsDate() !== startingDate && !reloaded) {
        // Guard against reloading more than once: a reload that fails to fetch
        // a new challenge would otherwise loop forever.
        reloaded = true;
        window.location.reload();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (time: number) => {
    return time.toString().padStart(2, '0');
  };

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
      <div className="text-center">
        <div className="flex items-center justify-center text-indigo-700 mb-2">
          <i className="ri-time-line mr-2"></i>
          <span className="font-semibold text-sm">Next Challenge In (Brussels Time)</span>
        </div>
        
        <div className="flex justify-center space-x-2 text-2xl font-bold text-indigo-800">
          <div className="bg-white rounded-lg px-3 py-2 min-w-[3rem]">
            {formatTime(timeLeft.hours)}
          </div>
          <div className="flex items-center">:</div>
          <div className="bg-white rounded-lg px-3 py-2 min-w-[3rem]">
            {formatTime(timeLeft.minutes)}
          </div>
          <div className="flex items-center">:</div>
          <div className="bg-white rounded-lg px-3 py-2 min-w-[3rem]">
            {formatTime(timeLeft.seconds)}
          </div>
        </div>
        
        <div className="flex justify-center space-x-4 text-xs text-indigo-600 mt-2">
          <span>Hours</span>
          <span>Minutes</span>
          <span>Seconds</span>
        </div>
      </div>
    </div>
  );
}
