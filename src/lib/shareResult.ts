/**
 * One share format for every game, in two flavours.
 *
 *   'summary'  — headline only. Safe to post publicly: no answers spoiled.
 *   'detailed' — adds the game-specific breakdown (cities picked, chain built,
 *                per-round errors), which usually reveals answers.
 *
 * The text is copied straight to the clipboard. We deliberately do NOT call
 * navigator.share: on desktop it usually doesn't exist, and on mobile it opens
 * a share sheet, so "copy" behaved differently per device.
 */

export type ShareMode = 'summary' | 'detailed';

export interface ShareDetails {
  /** Display name, e.g. "Border Domino". */
  game: string;
  /** Headline result. Include a grade emoji via the helpers below. */
  result: string;
  /**
   * Breakdown lines, included only in 'detailed'. Falsy entries are dropped so
   * callers can inline conditionals; empty strings are kept as blank lines.
   */
  details?: Array<string | false | null | undefined>;
  /** Path to link back to. Defaults to the current page. */
  path?: string;
}

/* ── Emoji grading ──────────────────────────────────────────────────────── */

/** A single grade badge for a 0-100 percentage. */
export function gradeEmoji(percent: number): string {
  if (percent >= 100) return '🏆';
  if (percent >= 90) return '🌟';
  if (percent >= 75) return '✅';
  if (percent >= 50) return '👍';
  if (percent >= 25) return '😅';
  return '💀';
}

/** Coloured square matching the same bands — used for per-item tiles. */
export function gradeSquare(percent: number): string {
  if (percent >= 90) return '🟩';
  if (percent >= 75) return '🟢';
  if (percent >= 50) return '🟨';
  if (percent >= 25) return '🟧';
  return '🟥';
}

/** Five-block progress bar, e.g. 🟩🟩🟩🟩⬜ for 80%. */
export function scoreBar(percent: number, blocks = 5): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * blocks);
  const square = gradeSquare(clamped);
  return square.repeat(filled) + '⬜'.repeat(Math.max(0, blocks - filled));
}

/** Streak heat: colder for short runs, hotter as it grows. */
export function streakEmoji(streak: number): string {
  if (streak >= 25) return '🔥🔥🔥';
  if (streak >= 15) return '🔥🔥';
  if (streak >= 8) return '🔥';
  if (streak >= 4) return '⚡';
  if (streak >= 1) return '✨';
  return '🧊';
}

/** Formats "12 / 18" plus a badge and bar from the implied percentage. */
export function scoreLine(score: number, max: number): string {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return `${score}/${max} ${gradeEmoji(pct)} ${scoreBar(pct)}`;
}

/** Percentage with one decimal, a badge and a bar. */
export function percentLine(percent: number, label = 'accuracy'): string {
  return `${percent.toFixed(1)}% ${label} ${gradeEmoji(percent)} ${scoreBar(percent)}`;
}

/* ── Text building ──────────────────────────────────────────────────────── */

export function buildShareText(
  { game, result, details = [], path }: ShareDetails,
  mode: ShareMode = 'summary',
): string {
  const link =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}${path ?? window.location.pathname}`;

  const lines = [`I played ${game} on TerraTest!`, '', `My result: ${result}`];

  if (mode === 'detailed') {
    // Keep '' entries: they are deliberate blank lines. Only drop the
    // false/null placeholders callers use for conditionals.
    const body = details.filter((line): line is string => typeof line === 'string');
    if (body.length > 0) lines.push('', ...body);
  }

  lines.push('', 'Can you beat my score?', link);

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ── Clipboard ──────────────────────────────────────────────────────────── */

/**
 * Copies text, falling back to a hidden textarea where the async Clipboard API
 * is unavailable or blocked. Resolves true only if the copy actually happened,
 * so callers can show honest feedback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/** Build the standard text for a mode and copy it in one step. */
export async function shareResult(
  details: ShareDetails,
  mode: ShareMode = 'summary',
): Promise<boolean> {
  return copyToClipboard(buildShareText(details, mode));
}
