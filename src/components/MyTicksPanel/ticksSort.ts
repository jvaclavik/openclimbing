import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { findGradeTableRowIndexForGradeText } from '../../services/tagging/climbing/routeGrade';

export const TICKS_SORT_KEYS = [
  'date_desc',
  'date_asc',
  'grade_desc',
  'points_desc',
  'name_asc',
] as const;

export type TicksSortKey = (typeof TICKS_SORT_KEYS)[number];

export const DEFAULT_TICKS_SORT: TicksSortKey = 'date_desc';

const byDateDesc = (a: FetchedClimbingTick, b: FetchedClimbingTick) =>
  b.date.localeCompare(a.date) || b.tick.id - a.tick.id;

// Scoring gives projects no grade (0 points), but for sorting the route's
// difficulty is what counts.
const gradeOf = (row: FetchedClimbingTick) =>
  row.tickScore?.gradeRowIndex ??
  (row.grade ? findGradeTableRowIndexForGradeText(row.grade) : null) ??
  -1;

const COMPARATORS: Record<
  TicksSortKey,
  (a: FetchedClimbingTick, b: FetchedClimbingTick) => number
> = {
  date_desc: byDateDesc,
  date_asc: (a, b) => -byDateDesc(a, b),
  // grade table row index, not the label: "10-" must beat "9+"
  grade_desc: (a, b) => gradeOf(b) - gradeOf(a) || byDateDesc(a, b),
  points_desc: (a, b) =>
    (b.tickScore?.points ?? 0) - (a.tickScore?.points ?? 0) || byDateDesc(a, b),
  name_asc: (a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '') || byDateDesc(a, b),
};

/** Returns a new sorted array (input is left untouched). */
export const sortTicks = (
  rows: FetchedClimbingTick[],
  key: TicksSortKey,
): FetchedClimbingTick[] => [...rows].sort(COMPARATORS[key]);

/** Date orders are shown grouped by climbing day. */
export const isGroupedByDay = (key: TicksSortKey) =>
  key === 'date_desc' || key === 'date_asc';
