import { TickStyle } from '../../FeaturePanel/Climbing/types';
import { FetchedClimbingTick } from '../../../services/my-ticks/getMyTicks';
import { isProjectStyle } from '../../../services/my-ticks/ticks';
import {
  ClimbingStatsDateRange,
  getChartMonthKeys,
  monthKeyFromDate,
} from '../../../services/my-ticks/climbingStatsDateRange';
import { sessionDateFromTimestamp } from '../../../services/my-ticks/ticksUrlFilter';
import { cragKey } from '../../../services/my-ticks/personalRecords';

// Styles grouped by how clean the send was: an ordered scale, so the charts
// use one hue from dark (cleanest) to light.
export const STYLE_BUCKETS = ['os', 'fl', 'rp', 'other'] as const;
export type StyleBucket = (typeof STYLE_BUCKETS)[number];

export const styleBucket = (style: TickStyle | string | null): StyleBucket => {
  if (style === 'OS') return 'os';
  if (style === 'FL') return 'fl';
  if (style === 'RP' || style === 'PP') return 'rp';
  return 'other';
};

export const isSend = (row: FetchedClimbingTick) =>
  !isProjectStyle(row.style as TickStyle | null);

const validDate = (row: FetchedClimbingTick) =>
  !Number.isNaN(Date.parse(row.date));

const MAX_MONTHS = 600; // 50 years

/** Month keys (YYYY-MM) for the selected period; "all" spans the whole history. */
export const chartMonthKeys = (
  range: ClimbingStatsDateRange,
  allRows: FetchedClimbingTick[],
): string[] => {
  if (range.mode !== 'all') return getChartMonthKeys(range, allRows);
  // Ignore impossible future dates and cap the span, so one bad timestamp
  // cannot blow the series up to thousands of months.
  const now = new Date();
  const dates = allRows
    .filter(validDate)
    .map((row) => new Date(row.date))
    .filter((d) => d <= now);
  if (dates.length === 0) return getChartMonthKeys(range, allRows);
  const last = new Date(Math.max(...dates.map((d) => d.getTime())));
  const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
  const limit = new Date(last.getFullYear(), last.getMonth() - MAX_MONTHS + 1);
  const first = earliest < limit ? limit : earliest;
  const keys: string[] = [];
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  while (cursor <= last) {
    keys.push(monthKeyFromDate(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
};

export type ProgressionPoint = {
  key: string;
  /** Grade table row of the hardest send, null when nothing was sent. */
  gradeIndex: number | null;
  grade: string | null;
  route: string | null;
};

/** Hardest send of each month. */
export const gradeProgression = (
  rows: FetchedClimbingTick[],
  monthKeys: string[],
): ProgressionPoint[] => {
  const best = new Map<string, FetchedClimbingTick>();
  for (const row of rows) {
    const index = row.tickScore?.gradeRowIndex;
    if (!isSend(row) || index == null || !validDate(row)) continue;
    const key = monthKeyFromDate(new Date(row.date));
    const current = best.get(key);
    if (!current || index > (current.tickScore.gradeRowIndex ?? -1)) {
      best.set(key, row);
    }
  }
  return monthKeys.map((key) => {
    const row = best.get(key);
    return {
      key,
      gradeIndex: row?.tickScore.gradeRowIndex ?? null,
      grade: row?.grade ?? null,
      route: row?.name?.trim() || null,
    };
  });
};

export type PyramidRow = {
  grade: string;
  gradeIndex: number;
  total: number;
  counts: Record<StyleBucket, number>;
};

/** Sends per grade split by style, hardest grade first. */
export const gradePyramid = (rows: FetchedClimbingTick[]): PyramidRow[] => {
  const byGrade = new Map<number, PyramidRow>();
  for (const row of rows) {
    const index = row.tickScore?.gradeRowIndex;
    if (!isSend(row) || index == null) continue;
    const entry = byGrade.get(index) ?? {
      grade: row.grade,
      gradeIndex: index,
      total: 0,
      counts: { os: 0, fl: 0, rp: 0, other: 0 },
    };
    entry.total += 1;
    entry.counts[styleBucket(row.style)] += 1;
    byGrade.set(index, entry);
  }
  return [...byGrade.values()].sort((a, b) => b.gradeIndex - a.gradeIndex);
};

/** Sends per month. */
export const sendsByMonth = (
  rows: FetchedClimbingTick[],
  monthKeys: string[],
): { key: string; sends: number }[] => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!isSend(row) || !validDate(row)) continue;
    const key = monthKeyFromDate(new Date(row.date));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return monthKeys.map((key) => ({ key, sends: counts.get(key) ?? 0 }));
};

/** Sends per style bucket (cleanest first) + number of project ticks. */
export const styleSplit = (rows: FetchedClimbingTick[]) => {
  const counts: Record<StyleBucket, number> = { os: 0, fl: 0, rp: 0, other: 0 };
  let projects = 0;
  for (const row of rows) {
    if (isSend(row)) counts[styleBucket(row.style)] += 1;
    else projects += 1;
  }
  return { counts, projects };
};

/** Crags ranked by number of climbing days. */
export const topCrags = (
  rows: FetchedClimbingTick[],
  limit = 8,
): { name: string; days: number }[] => {
  const crags = new Map<string, { name: string; days: Set<string> }>();
  for (const row of rows) {
    const key = cragKey(row);
    if (!key || !validDate(row)) continue;
    const entry = crags.get(key) ?? {
      name: row.cragName.trim(),
      days: new Set<string>(),
    };
    entry.days.add(sessionDateFromTimestamp(row.date));
    crags.set(key, entry);
  }
  return [...crags.values()]
    .map(({ name, days }) => ({ name, days: days.size }))
    .sort((a, b) => b.days - a.days || a.name.localeCompare(b.name))
    .slice(0, limit);
};
