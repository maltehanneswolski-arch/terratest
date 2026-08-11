import { useState } from 'react';
import { shareResult, type ShareDetails, type ShareMode } from '@/lib/shareResult';

interface ShareButtonsProps {
  /** The same payload for both buttons; `details` is used only by "with details". */
  share: ShareDetails;
  /** Extra classes for the wrapper. */
  className?: string;
  /** Tailwind classes for the buttons, so each game can keep its own palette. */
  buttonClassName?: string;
}

/**
 * Two share options, side by side.
 *
 * "Result only" is safe to post publicly — just the headline score. "With
 * details" appends the breakdown (cities picked, chain built, per-round
 * errors), which normally gives away answers, so it's the deliberate choice
 * rather than the default.
 */
export function ShareButtons({ share, className = '', buttonClassName }: ShareButtonsProps) {
  const [copied, setCopied] = useState<ShareMode | 'failed' | null>(null);

  const base =
    buttonClassName ??
    'flex-1 min-h-11 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ' +
      'bg-slate-100 text-slate-700 hover:bg-slate-200 ' +
      'dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600';

  const handle = async (mode: ShareMode) => {
    const ok = await shareResult(share, mode);
    setCopied(ok ? mode : 'failed');
    window.setTimeout(() => setCopied(null), 2000);
  };

  const label = (mode: ShareMode, text: string) => {
    if (copied === mode) return 'Copied!';
    if (copied === 'failed') return 'Copy failed';
    return text;
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button type="button" onClick={() => handle('summary')} className={base}>
        <i className={`${copied === 'summary' ? 'ri-check-line' : 'ri-share-line'} mr-1.5`} aria-hidden="true" />
        {label('summary', 'Share result')}
      </button>
      <button type="button" onClick={() => handle('detailed')} className={base}>
        <i className={`${copied === 'detailed' ? 'ri-check-line' : 'ri-list-check'} mr-1.5`} aria-hidden="true" />
        {label('detailed', 'Share with details')}
      </button>
    </div>
  );
}
