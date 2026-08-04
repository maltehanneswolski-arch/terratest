/**
 * Guarded localStorage reads.
 *
 * An unguarded `JSON.parse(localStorage.getItem(key))` throws on any malformed
 * value — a partial write, an edit from another tab, a stale key from an older
 * schema. Thrown inside a mount effect that would leave the page stuck on its
 * loading state forever, recoverable only by clearing site data. Falling back to
 * a fresh value is always preferable to bricking the page.
 */
export function readStoredJson<T>(key: string, fallback: T): T {
  let raw: string | null = null;

  try {
    raw = localStorage.getItem(key);
  } catch {
    // Storage can be unavailable outright (Safari private mode, disabled
    // cookies, a sandboxed iframe).
    return fallback;
  }

  if (raw === null) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : (parsed as T);
  } catch {
    // Drop the corrupted value so the same failure doesn't recur on every load.
    try {
      localStorage.removeItem(key);
    } catch {
      /* nothing further we can do */
    }
    return fallback;
  }
}
