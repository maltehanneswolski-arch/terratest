import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export const AnimatedThemeToggle = ({ className }: { className?: string }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('theme');
    // Dark is the default; only an explicit saved choice overrides it. The
    // matching pre-paint script in index.html keeps the first frame in sync.
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    // Keep the browser chrome colour matching the theme.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#101820' : '#fff8e7');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Private mode / storage disabled — the theme still applies for this visit.
    }
  }, [theme, isDark]);

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light' : 'Switch to dark'}
      className={cn(
        'flex h-7 w-7 items-center justify-center text-base transition-colors duration-150 cursor-pointer',
        'text-[#101820]/40 dark:text-[#fff8e7]/35 hover:text-[#101820] dark:hover:text-[#fff8e7]',
        className,
      )}
    >
      <i className={isDark ? 'ri-sun-line' : 'ri-moon-line'} />
    </button>
  );
};
