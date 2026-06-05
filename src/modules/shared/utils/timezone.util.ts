export const CLINIC_TIMEZONE = 'America/Santo_Domingo';

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number;
}

/**
 * Returns the local wall-clock parts of a UTC instant in the clinic timezone.
 * Use this to read day-of-week, hour, minute in clinic local time from a Date.
 */
export function getLocalParts(utcDate: Date): LocalDateTimeParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(utcDate);

  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const hourStr = get('hour');
  const hour = hourStr === '24' ? 0 : Number(hourStr);
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour,
    minute: Number(get('minute')),
    second: Number(get('second')),
    dayOfWeek: WEEKDAY_MAP[get('weekday') ?? 'Sun'] ?? 0,
  };
}

/**
 * Converts a UTC instant to a Date whose UTC fields are the local wall-clock
 * components. Useful for arithmetic and string formatting in clinic local time.
 *
 * Example: in summer, 2026-06-03T12:30:00Z -> 2026-06-03T08:30:00Z (UTC fields)
 */
export function toLocalWallClock(utcDate: Date): Date {
  const p = getLocalParts(utcDate);
  return new Date(
    Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second),
  );
}

/**
 * Inverse of toLocalWallClock. Given local wall-clock components, returns the
 * real UTC Date that represents that local instant.
 *
 * Example: local 2026-06-03 08:30 -> real 2026-06-03T12:30:00Z
 */
export function fromLocalWallClock(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second = 0,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const p = getLocalParts(guess);
  const minuteDelta =
    p.hour * 60 + p.minute - (hour * 60 + minute);
  const dayDelta = p.day - day;
  const totalOffsetMinutes = dayDelta * 24 * 60 + minuteDelta;
  return new Date(guess.getTime() - totalOffsetMinutes * 60 * 1000);
}

/**
 * Returns the UTC range (start, end) of a local calendar day in the clinic tz.
 * Used to query appointments on a specific day regardless of server timezone.
 */
export function getLocalDayUtcRange(
  year: number,
  month: number,
  day: number,
): { start: Date; end: Date } {
  const start = fromLocalWallClock(year, month, day, 0, 0, 0);
  const endNext = fromLocalWallClock(year, month, day + 1, 0, 0, 0);
  return { start, end: endNext };
}
