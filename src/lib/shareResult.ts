/**
 * One share format for every game.
 *
 * Produces:
 *
 *   I played Border Domino on TerraTest!
 *
 *   My result: 7 borders crossed
 *   Rule: must be farther north
 *   Start: 🇩🇪 Germany
 *
 *   Can you beat my score?
 *   https://terratest.example/border-domino
 *
 * The text is copied straight to the clipboard. We deliberately do NOT call
 * navigator.share first: on desktop it usually doesn't exist, and on mobile it
 * opens a share sheet, so "copy" became a two-step action that behaved
 * differently per device. Copying immediately is predictable everywhere, and
 * the player can paste wherever they like.
 */

export interface ShareDetails {
  /** Display name of the game, e.g. "Border Domino". */
  game: string;
  /** One-line headline result, e.g. "7 borders crossed" or "14 / 18 points". */
  result: string;
  /**
   * Extra game-specific lines: today's rule, the emoji grid, the chain, etc.
   * Falsy entries are dropped so callers can inline conditionals.
   */
  details?: Array<string | false | null | undefined>;
  /** Path to link back to, e.g. "/border-domino". Defaults to the current page. */
  path?: string;
}

export function buildShareText({ game, result, details = [], path }: ShareDetails): string {
  const link =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}${path ?? window.location.pathname}`;

  // Drop only the falsy placeholders callers use for conditionals. An empty
  // string is a deliberate blank line, so `filter(Boolean)` would eat the very
  // separators that keep the message readable.
  const body = details
    .filter((line): line is string => typeof line === 'string')
    .join('\n');

  return [
    `I played ${game} on TerraTest!`,
    '',
    `My result: ${result}`,
    body,
    '',
    'Can you beat my score?',
    link,
  ]
    .filter((line, index, all) => {
      // Collapse the blank line that appears when there are no detail lines.
      if (line !== '') return true;
      return all[index - 1] !== '';
    })
    .join('\n')
    .trim();
}

/**
 * Copies text to the clipboard, falling back to a hidden textarea where the
 * async Clipboard API is unavailable or blocked (older Safari, insecure origin).
 * Resolves true only if the copy actually happened, so callers can show honest
 * feedback rather than claiming success unconditionally.
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
    // Keep it off-screen and non-focusable so the page doesn't jump.
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

/** Build the standard text and copy it in one step. */
export async function shareResult(details: ShareDetails): Promise<boolean> {
  return copyToClipboard(buildShareText(details));
}
