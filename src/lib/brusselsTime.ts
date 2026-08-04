/**
 * Helpers for the Europe/Brussels day boundary that every daily challenge keys on.
 *
 * The naive approach — `new Date(now.toLocaleString('en-US', { timeZone }))` — is
 * wrong, because parsing that formatted string re-applies the *viewer's* local
 * offset. The result is a Date that is off by (zoneOffset - localOffset), which
 * silently shifts the daily rollover for everyone outside Brussels. Everything
 * below derives values from the zone's own reported wall clock instead.
 */

const TIME_ZONE = 'Europe/Brussels';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Current Brussels calendar date as `YYYY-MM-DD`. */
export function brusselsDate(at: Date = new Date()) {
  return DATE_FORMATTER.format(at);
}

const OFFSET_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Brussels' UTC offset, in milliseconds, at the given instant. */
function zoneOffsetMs(timestamp: number) {
  const parts = OFFSET_FORMATTER.formatToParts(new Date(timestamp));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );

  // Second precision is all the formatter gives us, so discard the sub-second
  // remainder from the input before differencing.
  return asUtc - timestamp + (timestamp % 1000);
}

/**
 * The UTC instant at which the given Brussels calendar date begins.
 *
 * Resolved iteratively: guess the offset at an approximate instant, correct,
 * then re-check. Two passes settle it even across a DST transition, where the
 * offset at the guess differs from the offset at the true answer.
 */
function startOfBrusselsDay(dateString: string) {
  const naive = Date.parse(`${dateString}T00:00:00Z`);
  let timestamp = naive;

  for (let pass = 0; pass < 2; pass += 1) {
    timestamp = naive - zoneOffsetMs(timestamp);
  }

  return timestamp;
}

/**
 * Milliseconds from now until the next Brussels midnight. Always positive, so
 * callers never have to defend against a negative countdown.
 */
export function msUntilNextBrusselsMidnight(at: Date = new Date()) {
  const [year, month, day] = brusselsDate(at).split('-').map(Number);

  // Step the calendar date forward in UTC purely to get the next Y-M-D triple;
  // the actual instant that date starts at in Brussels is resolved below.
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  const nextDateString = nextDate.toISOString().slice(0, 10);

  return Math.max(0, startOfBrusselsDay(nextDateString) - at.getTime());
}

/**
 * FNV-1a hash. Mirrors the helper the other daily games use, so a date string
 * maps to a well-distributed seed rather than colliding across dates.
 */
export function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
