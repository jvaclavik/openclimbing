import { TickStyle } from '../FeaturePanel/Climbing/types';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { monthKeyFromDate } from '../../services/my-ticks/climbingStatsDateRange';
import {
  TICK_STYLE_SEGMENT_ORDER,
  coerceTickStyleFromDb,
} from '../../services/my-ticks/ticks';

/** Klíč segmentu pro tick bez vybraného stylu (stejný v datech i v grafech). */
export const NO_STYLE_KEY = '—';

export function styleSegmentKey(style: TickStyle): string {
  return style == null ? NO_STYLE_KEY : String(style);
}

/** Ochrana proti 10 000 měsícům při rozbitém datu ticku. */
const MAX_CAREER_MONTHS = 1200;

function parseTickDate(raw: string): Date | null {
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isProject(tick: FetchedClimbingTick): boolean {
  return (tick.style as TickStyle | null) === 'PJ';
}

export type YearlyAscentsRow = { year: string; total: number } & Record<
  string,
  number | string
>;

/** Počty přelezů po kalendářních letech, rozpadlé podle stylu přelezu. */
export function ascentsByYear(
  ticks: FetchedClimbingTick[],
): YearlyAscentsRow[] {
  const byYear = new Map<number, Map<string, number>>();
  for (const tick of ticks) {
    const date = parseTickDate(tick.date);
    if (!date) continue;
    const year = date.getFullYear();
    const key = styleSegmentKey(coerceTickStyleFromDb(tick.style as string));
    if (!byYear.has(year)) byYear.set(year, new Map());
    const styles = byYear.get(year)!;
    styles.set(key, (styles.get(key) ?? 0) + 1);
  }
  if (byYear.size === 0) {
    return [];
  }
  const years = [...byYear.keys()];
  const from = Math.min(...years);
  const to = Math.max(...years);
  const out: YearlyAscentsRow[] = [];
  for (let year = from; year <= to; year += 1) {
    const styles = byYear.get(year);
    const row: YearlyAscentsRow = { year: String(year), total: 0 };
    let total = 0;
    for (const style of TICK_STYLE_SEGMENT_ORDER) {
      const key = styleSegmentKey(style);
      const count = styles?.get(key) ?? 0;
      if (count > 0) {
        row[key] = count;
        total += count;
      }
    }
    row.total = total;
    out.push(row);
  }
  return out;
}

/** Souvislá řada `YYYY-MM` od prvního do posledního ticku (včetně prázdných). */
export function careerMonthKeys(ticks: FetchedClimbingTick[]): string[] {
  const times = ticks
    .map((tick) => parseTickDate(tick.date))
    .filter((d): d is Date => d !== null)
    .map((d) => d.getTime());
  if (times.length === 0) {
    return [];
  }
  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const end = new Date(last.getFullYear(), last.getMonth(), 1);
  const out: string[] = [];
  while (cursor <= end && out.length < MAX_CAREER_MONTHS) {
    out.push(monthKeyFromDate(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

export type ProgressionRow = {
  key: string;
  /** Nejtvrdší přelez v okně jako řádek tabulky stupňů. */
  best: number | null;
  /** Průměr N nejtvrdších přelezů v okně (řádek tabulky stupňů). */
  topAvg: number | null;
};

const DEFAULT_PROGRESSION_WINDOW_MONTHS = 12;
const DEFAULT_PROGRESSION_TOP_N = 5;

/** `YYYY-MM` na pořadové číslo měsíce, aby se dalo počítat kalendářní okno. */
function monthKeyToOrdinal(key: string): number | null {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  return m ? parseInt(m[1], 10) * 12 + (parseInt(m[2], 10) - 1) : null;
}

function gradeRowIndexesByMonth(
  ticks: FetchedClimbingTick[],
): Map<number, number[]> {
  const byMonth = new Map<number, number[]>();
  for (const tick of ticks) {
    if (isProject(tick)) continue;
    const rowIndex = tick.tickScore.gradeRowIndex;
    if (rowIndex == null) continue;
    const date = parseTickDate(tick.date);
    if (!date) continue;
    const ordinal = monthKeyToOrdinal(monthKeyFromDate(date));
    if (ordinal == null) continue;
    if (!byMonth.has(ordinal)) byMonth.set(ordinal, []);
    byMonth.get(ordinal)!.push(rowIndex);
  }
  return byMonth;
}

/**
 * Klouzavá výkonnost: pro každý měsíc se vezme okno posledních N měsíců a z něj
 * nejtvrdší přelez a průměr `topN` nejtvrdších. Obdoba CPR timeline na theCragu
 * — starší přelezy z okna postupně vypadnou, takže křivka klesá při pauze.
 */
export function progressionSeries(
  ticks: FetchedClimbingTick[],
  monthKeys: string[],
  options?: { windowMonths?: number; topN?: number },
): ProgressionRow[] {
  const windowMonths =
    options?.windowMonths ?? DEFAULT_PROGRESSION_WINDOW_MONTHS;
  const topN = options?.topN ?? DEFAULT_PROGRESSION_TOP_N;
  const byMonth = gradeRowIndexesByMonth(ticks);

  return monthKeys.map((key) => {
    const ordinal = monthKeyToOrdinal(key);
    if (ordinal == null) {
      return { key, best: null, topAvg: null };
    }
    const inWindow: number[] = [];
    for (let m = ordinal - windowMonths + 1; m <= ordinal; m += 1) {
      const rows = byMonth.get(m);
      if (rows) inWindow.push(...rows);
    }
    if (inWindow.length === 0) {
      return { key, best: null, topAvg: null };
    }
    inWindow.sort((a, b) => b - a);
    const top = inWindow.slice(0, topN);
    const sum = top.reduce((a, b) => a + b, 0);
    return {
      key,
      best: inWindow[0],
      topAvg: Math.round((sum / top.length) * 10) / 10,
    };
  });
}

export type CumulativeRow = {
  key: string;
  ascents: number;
  points: number;
};

/** Kumulativní počet přelezů a bodů po měsících (projekty se nepočítají). */
export function cumulativeSeries(
  ticks: FetchedClimbingTick[],
  monthKeys: string[],
): CumulativeRow[] {
  const ascentsByMonth = new Map<string, number>();
  const pointsByMonth = new Map<string, number>();
  for (const tick of ticks) {
    if (isProject(tick)) continue;
    const date = parseTickDate(tick.date);
    if (!date) continue;
    const key = monthKeyFromDate(date);
    ascentsByMonth.set(key, (ascentsByMonth.get(key) ?? 0) + 1);
    pointsByMonth.set(
      key,
      (pointsByMonth.get(key) ?? 0) + tick.tickScore.points,
    );
  }
  let ascents = 0;
  let points = 0;
  return monthKeys.map((key) => {
    ascents += ascentsByMonth.get(key) ?? 0;
    points += pointsByMonth.get(key) ?? 0;
    return { key, ascents, points };
  });
}

export type UserProfileCareerSeries = {
  yearly: YearlyAscentsRow[];
  progression: ProgressionRow[];
  cumulative: CumulativeRow[];
};
