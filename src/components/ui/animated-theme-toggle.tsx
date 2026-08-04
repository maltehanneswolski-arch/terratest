import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export const AnimatedThemeToggle = ({ className }: { className?: string }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
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
