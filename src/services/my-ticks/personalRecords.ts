import { TickStyle } from '../../components/FeaturePanel/Climbing/types';
import { FetchedClimbingTick } from './getMyTicks';
import { isProjectStyle } from './ticks';
import { sessionDateFromTimestamp } from './ticksUrlFilter';

// ---------------------------------------------------------------------------
// Osobní rekordy a milníky — čisté funkce nad řádky deníku (FetchedClimbingTick).
// Přelez = tick s jiným stylem než projekt (PJ/PF). Den na skalách = jakýkoliv
// tick toho dne (i projekt). Pořadí v čase: datum, pak id (stabilní).
// ---------------------------------------------------------------------------

const isSend = (row: FetchedClimbingTick) =>
  !isProjectStyle(row.style as TickStyle | null);

const gradeIndex = (row: FetchedClimbingTick) =>
  row.tickScore?.gradeRowIndex ?? null;

const dayOf = (row: FetchedClimbingTick) => sessionDateFromTimestamp(row.date);

const byDateAsc = (a: FetchedClimbingTick, b: FetchedClimbingTick) =>
  a.date.localeCompare(b.date) || a.tick.id - b.tick.id;

const chronological = (rows: FetchedClimbingTick[]) =>
  rows.filter((row) => !Number.isNaN(Date.parse(row.date))).sort(byDateAsc);

// --- Rekordy ---------------------------------------------------------------

export type GradeRecord = {
  row: FetchedClimbingTick;
  grade: string;
  gradeRowIndex: number;
};

export type DayRecord = {
  /** YYYY-MM-DD */
  day: string;
  points: number;
  tickCount: number;
};

export type YearRecord = {
  year: number;
  points: number;
  sendCount: number;
  days: number;
};

export type PersonalRecords = {
  hardestSend: GradeRecord | null;
  hardestOnsight: GradeRecord | null;
  hardestFlash: GradeRecord | null;
  hardestRedpoint: GradeRecord | null;
  bestDayByPoints: DayRecord | null;
  bestDayByTicks: DayRecord | null;
  /** Calendar year with the most points. */
  bestYear: YearRecord | null;
  topCrag: { name: string; days: number } | null;
  climbingDays: number;
  sendCount: number;
  cragCount: number;
};

/** Nejtěžší přelez z vybraných; při shodě vyhrává ten dřívější (kdy padl). */
const hardest = (
  sortedRows: FetchedClimbingTick[],
  predicate: (row: FetchedClimbingTick) => boolean,
): GradeRecord | null => {
  let best: GradeRecord | null = null;
  for (const row of sortedRows) {
    const index = gradeIndex(row);
    if (index == null || !predicate(row)) continue;
    if (!best || index > best.gradeRowIndex) {
      best = { row, grade: row.grade, gradeRowIndex: index };
    }
  }
  return best;
};

const aggregateDays = (rows: FetchedClimbingTick[]): DayRecord[] => {
  const byDay = new Map<string, DayRecord>();
  for (const row of rows) {
    const day = dayOf(row);
    const entry = byDay.get(day) ?? { day, points: 0, tickCount: 0 };
    entry.points += row.tickScore?.points ?? 0;
    if (isSend(row)) entry.tickCount += 1;
    byDay.set(day, entry);
  }
  return [...byDay.values()];
};

/** Nejlepší den; při shodě ten dřívější. */
const bestDay = (
  days: DayRecord[],
  value: (d: DayRecord) => number,
): DayRecord | null => {
  let best: DayRecord | null = null;
  for (const d of days) {
    if (value(d) <= 0) continue;
    if (
      !best ||
      value(d) > value(best) ||
      (value(d) === value(best) && d.day < best.day)
    ) {
      best = d;
    }
  }
  return best;
};

const bestYear = (days: DayRecord[]): YearRecord | null => {
  const byYear = new Map<number, YearRecord>();
  for (const d of days) {
    const year = Number(d.day.slice(0, 4));
    const entry = byYear.get(year) ?? {
      year,
      points: 0,
      sendCount: 0,
      days: 0,
    };
    entry.points += d.points;
    entry.sendCount += d.tickCount;
    entry.days += 1;
    byYear.set(year, entry);
  }
  let best: YearRecord | null = null;
  byYear.forEach((entry) => {
    if (entry.points > 0 && (!best || entry.points > best.points)) best = entry;
  });
  return best;
};

/** Crag identity: OSM id when known (two crags may share a name). */
export const cragKey = (row: FetchedClimbingTick): string | null => {
  const name = row.cragName?.trim();
  if (!name) return null;
  return row.cragOsmType && row.cragOsmId
    ? `${row.cragOsmType}/${row.cragOsmId}`
    : `name:${name}`;
};

const cragDays = (rows: FetchedClimbingTick[]) => {
  const map = new Map<string, { name: string; days: Set<string> }>();
  for (const row of rows) {
    const key = cragKey(row);
    if (!key) continue;
    const entry = map.get(key) ?? {
      name: row.cragName.trim(),
      days: new Set<string>(),
    };
    entry.days.add(dayOf(row));
    map.set(key, entry);
  }
  return map;
};

export const computePersonalRecords = (
  rows: FetchedClimbingTick[],
): PersonalRecords => {
  const sorted = chronological(rows);
  const days = aggregateDays(sorted);
  const crags = cragDays(sorted);

  let topCrag: PersonalRecords['topCrag'] = null;
  crags.forEach(({ name, days }) => {
    if (!topCrag || days.size > topCrag.days) {
      topCrag = { name, days: days.size };
    }
  });

  return {
    hardestSend: hardest(sorted, isSend),
    hardestOnsight: hardest(sorted, (row) => row.style === 'OS'),
    hardestFlash: hardest(sorted, (row) => row.style === 'FL'),
    hardestRedpoint: hardest(
      sorted,
      (row) => row.style === 'RP' || row.style === 'PP',
    ),
    bestDayByPoints: bestDay(days, (d) => d.points),
    bestDayByTicks: bestDay(days, (d) => d.tickCount),
    bestYear: bestYear(days),
    topCrag,
    climbingDays: days.length,
    sendCount: sorted.filter(isSend).length,
    cragCount: crags.size,
  };
};

// --- Milníky ---------------------------------------------------------------

export const SEND_COUNT_MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500];
export const CLIMBING_DAY_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];
export const CRAG_COUNT_MILESTONES = [5, 10, 25, 50, 100, 250];

export type Milestone =
  | { kind: 'first_send'; day: string; row: FetchedClimbingTick }
  | { kind: 'send_count'; day: string; count: number; row: FetchedClimbingTick }
  | {
      kind: 'grade_pb';
      day: string;
      grade: string;
      style: TickStyle;
      row: FetchedClimbingTick;
    }
  | { kind: 'climbing_days'; day: string; count: number }
  | { kind: 'crag_count'; day: string; count: number; cragName: string };

const sendMilestones = (sorted: FetchedClimbingTick[]): Milestone[] => {
  const out: Milestone[] = [];
  let count = 0;
  let maxGrade: number | null = null;
  for (const row of sorted) {
    if (!isSend(row)) continue;
    count += 1;
    if (count === 1) {
      out.push({ kind: 'first_send', day: dayOf(row), row });
    }
    if (SEND_COUNT_MILESTONES.includes(count)) {
      out.push({ kind: 'send_count', day: dayOf(row), count, row });
    }
    const index = gradeIndex(row);
    if (index == null) continue;
    // První přelez s obtížností nastaví laťku, nový milník až při překonání.
    if (maxGrade != null && index > maxGrade) {
      out.push({
        kind: 'grade_pb',
        day: dayOf(row),
        grade: row.grade,
        style: row.style,
        row,
      });
    }
    if (maxGrade == null || index > maxGrade) maxGrade = index;
  }
  return out;
};

const dayAndCragMilestones = (sorted: FetchedClimbingTick[]): Milestone[] => {
  const out: Milestone[] = [];
  const days = new Set<string>();
  const crags = new Set<string>();
  for (const row of sorted) {
    const day = dayOf(row);
    if (!days.has(day)) {
      days.add(day);
      if (CLIMBING_DAY_MILESTONES.includes(days.size)) {
        out.push({ kind: 'climbing_days', day, count: days.size });
      }
    }
    const crag = cragKey(row);
    if (crag && !crags.has(crag)) {
      crags.add(crag);
      if (CRAG_COUNT_MILESTONES.includes(crags.size)) {
        out.push({
          kind: 'crag_count',
          day,
          count: crags.size,
          cragName: row.cragName.trim(),
        });
      }
    }
  }
  return out;
};

/** Všechny milníky, nejnovější první. */
export const computeMilestones = (rows: FetchedClimbingTick[]): Milestone[] => {
  const sorted = chronological(rows);
  const all = [...sendMilestones(sorted), ...dayAndCragMilestones(sorted)];
  // Stabilní řazení: novější den první; ve stejném dni zachová pořadí vzniku
  // obráceně (poslední dosažený nahoře).
  return all
    .map((m, i) => ({ m, i }))
    .sort((a, b) => b.m.day.localeCompare(a.m.day) || b.i - a.i)
    .map(({ m }) => m);
};
