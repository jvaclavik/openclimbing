import { FetchedClimbingTick } from './getMyTicks';

export type ClimbingStatsDateRange =
  | { mode: 'rolling365' }
  | { mode: 'all' }
  | { mode: 'year'; year: number };

export const DEFAULT_CLIMBING_STATS_DATE_RANGE: ClimbingStatsDateRange = {
  mode: 'rolling365',
};

export function climbingStatsDateRangeToSelectValue(
  r: ClimbingStatsDateRange,
): string {
  if (r.mode === 'rolling365') return 'rolling365';
  if (r.mode === 'all') return 'all';
  return `year:${r.year}`;
}

export function selectValueToClimbingStatsDateRange(
  value: string,
): ClimbingStatsDateRange | null {
  if (value === 'rolling365') return { mode: 'rolling365' };
  if (value === 'all') return { mode: 'all' };
  const m = /^year:(\d{4})$/.exec(value);
  if (m) return { mode: 'year', year: parseInt(m[1], 10) };
  return null;
}

export function monthKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function lastNMonthKeysFrom(end: Date, n: number): string[] {
  const out: string[] = [];
  const d = new Date(end.getFullYear(), end.getMonth(), 1);
  for (let i = 0; i < n; i++) {
    out.unshift(monthKeyFromDate(d));
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

export function filterFetchedTicksByRange(
  ticks: FetchedClimbingTick[],
  range: ClimbingStatsDateRange,
): FetchedClimbingTick[] {
  if (range.mode === 'all') return ticks;
  const now = new Date();
  if (range.mode === 'rolling365') {
    const since = new Date(now);
    since.setDate(since.getDate() - 365);
    since.setHours(0, 0, 0, 0);
    return ticks.filter((r) => {
      const d = new Date(r.date);
      return !Number.isNaN(d.getTime()) && d >= since;
    });
  }
  return ticks.filter((r) => {
    const d = new Date(r.date);
    return !Number.isNaN(d.getTime()) && d.getFullYear() === range.year;
  });
}

export function getYearsPresentInTicks(ticks: FetchedClimbingTick[]): number[] {
  const years = new Set<number>();
  for (const t of ticks) {
    const d = new Date(t.date);
    if (!Number.isNaN(d.getTime())) years.add(d.getFullYear());
  }
  return [...years].sort((a, b) => b - a);
}

export function getChartMonthKeys(
  range: ClimbingStatsDateRange,
  allTicksUnfiltered: FetchedClimbingTick[],
): string[] {
  const now = new Date();
  if (range.mode === 'year') {
    return Array.from(
      { length: 12 },
      (_, i) => `${range.year}-${String(i + 1).padStart(2, '0')}`,
    );
  }
  if (range.mode === 'rolling365') {
    return lastNMonthKeysFrom(now, 12);
  }
  const dates = allTicksUnfiltered
    .map((t) => new Date(t.date))
    .filter((d) => !Number.isNaN(d.getTime()));
  const end =
    dates.length > 0
      ? new Date(Math.max(...dates.map((d) => d.getTime())))
      : now;
  return lastNMonthKeysFrom(end, 36);
}

/** @deprecated use ClimbingStatsDateRange */
export type ProfileDateRange = ClimbingStatsDateRange;
/** @deprecated use DEFAULT_CLIMBING_STATS_DATE_RANGE */
export const DEFAULT_PROFILE_DATE_RANGE = DEFAULT_CLIMBING_STATS_DATE_RANGE;
/** @deprecated use climbingStatsDateRangeToSelectValue */
export const profileDateRangeToSelectValue =
  climbingStatsDateRangeToSelectValue;
/** @deprecated use selectValueToClimbingStatsDateRange */
export const selectValueToProfileDateRange =
  selectValueToClimbingStatsDateRange;

export function parseLeaderboardQueryRange(
  raw: string | string[] | undefined,
): ClimbingStatsDateRange {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v == null || v === '') return DEFAULT_CLIMBING_STATS_DATE_RANGE;
  const p = selectValueToClimbingStatsDateRange(String(v));
  return p ?? DEFAULT_CLIMBING_STATS_DATE_RANGE;
}
