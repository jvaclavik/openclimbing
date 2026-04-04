import { format, isValid, parseISO, startOfDay } from 'date-fns';

/** Local calendar `yyyy-MM-dd` for `<input type="date" max="…" />`. */
export function todayDateInputMax(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** True if climb date (local calendar day) is strictly after today. */
export function isClimbCalendarDateAfterToday(iso: string): boolean {
  let d = parseISO(iso);
  if (!isValid(d)) {
    d = new Date(iso);
  }
  if (!isValid(d)) {
    return false;
  }
  const climb = startOfDay(d).getTime();
  const today = startOfDay(new Date()).getTime();
  return climb > today;
}

/** Lexicographic compare works for yyyy-MM-dd strings. */
export function clampDateInputYyyyMmDd(
  yyyyMmDd: string,
  maxYyyyMmDd: string,
): string {
  if (!yyyyMmDd?.trim()) {
    return yyyyMmDd;
  }
  return yyyyMmDd > maxYyyyMmDd ? maxYyyyMmDd : yyyyMmDd;
}

/** Value for `<input type="date" />` from stored tick timestamp. */
export function tickTimestampToDateInputValue(
  raw: string | null | undefined,
): string {
  if (!raw?.trim()) {
    return '';
  }
  let d = parseISO(raw);
  if (!isValid(d)) {
    d = new Date(raw);
  }
  return isValid(d) ? format(d, 'yyyy-MM-dd') : '';
}

/** Merge picked calendar date with existing time (UTC) or use noon UTC. */
export function applyDateInputToTickTimestamp(
  prevIso: string,
  yyyyMmDd: string,
): string {
  if (!yyyyMmDd?.trim()) {
    return prevIso;
  }
  const parts = yyyyMmDd.split('-').map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return prevIso;
  }
  const [y, m, d] = parts;
  let prev = parseISO(prevIso);
  if (!isValid(prev)) {
    prev = new Date(prevIso);
  }
  if (isValid(prev)) {
    const next = new Date(
      Date.UTC(
        y,
        m - 1,
        d,
        prev.getUTCHours(),
        prev.getUTCMinutes(),
        prev.getUTCSeconds(),
        prev.getUTCMilliseconds(),
      ),
    );
    return next.toISOString();
  }
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0)).toISOString();
}
