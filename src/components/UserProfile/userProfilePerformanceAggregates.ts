import { TickStyle } from '../FeaturePanel/Climbing/types';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { monthKeyFromDate } from '../../services/my-ticks/climbingStatsDateRange';
import {
  TICK_STYLE_SEGMENT_ORDER,
  coerceTickStyleFromDb,
} from '../../services/my-ticks/ticks';

export function aggregateMonthlyPointsForKeys(
  ticks: FetchedClimbingTick[],
  monthKeys: string[],
): { key: string; points: number }[] {
  const map = new Map<string, number>();
  for (const row of ticks) {
    const d = new Date(row.date);
    if (Number.isNaN(d.getTime())) {
      continue;
    }
    const k = monthKeyFromDate(d);
    map.set(k, (map.get(k) ?? 0) + row.tickScore.points);
  }
  return monthKeys.map((k) => ({ key: k, points: map.get(k) ?? 0 }));
}

export function cumulativePointsSeries(
  ticks: FetchedClimbingTick[],
): Array<{ date: string; total: number }> {
  const sorted = [...ticks].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  let sum = 0;
  return sorted.map((row) => {
    sum += row.tickScore.points;
    return { date: row.date, total: sum };
  });
}

export function bestSendByMonth(
  ticks: FetchedClimbingTick[],
  monthKeys: string[],
): { key: string; gradeLabel: string; rowIndex: number }[] {
  return monthKeys.map((monthKey) => {
    const inMonth = ticks.filter((t) => {
      if ((t.style as TickStyle | null) === 'PJ') return false;
      const d = new Date(t.date);
      return !Number.isNaN(d.getTime()) && monthKeyFromDate(d) === monthKey;
    });
    if (inMonth.length === 0) {
      return { key: monthKey, gradeLabel: '', rowIndex: -1 };
    }
    let best = inMonth[0];
    for (const t of inMonth) {
      const ri = t.tickScore.gradeRowIndex ?? -1;
      const bri = best.tickScore.gradeRowIndex ?? -1;
      if (ri > bri) best = t;
    }
    return {
      key: monthKey,
      gradeLabel: best.grade || '?',
      rowIndex: best.tickScore.gradeRowIndex ?? -1,
    };
  });
}

export function areaVisitDays(
  ticks: FetchedClimbingTick[],
  unknownAreaKey: string,
): { area: string; days: number }[] {
  const byArea = new Map<string, Set<string>>();
  for (const t of ticks) {
    if ((t.style as TickStyle | null) === 'PJ') continue;
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) continue;
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const area = t.areaName?.trim() ? t.areaName.trim() : unknownAreaKey;
    if (!byArea.has(area)) byArea.set(area, new Set());
    byArea.get(area)!.add(dayKey);
  }
  return [...byArea.entries()]
    .map(([area, days]) => ({ area, days: days.size }))
    .sort((a, b) => b.days - a.days);
}

export type GradeStyleSegment = { style: TickStyle; count: number };

export function gradeSendCountsByStyle(ticks: FetchedClimbingTick[]): {
  grade: string;
  rowIndex: number;
  total: number;
  segments: GradeStyleSegment[];
}[] {
  type Agg = { byStyle: Map<string, number>; rowIndex: number };
  const map = new Map<string, Agg>();

  for (const t of ticks) {
    const g = t.grade?.trim() || '?';
    const coerced = coerceTickStyleFromDb(t.style as string);
    const mapKey = coerced == null ? '__null__' : coerced;

    let agg = map.get(g);
    if (!agg) {
      agg = { byStyle: new Map(), rowIndex: -1 };
      map.set(g, agg);
    }
    agg.byStyle.set(mapKey, (agg.byStyle.get(mapKey) ?? 0) + 1);
    const ri = t.tickScore.gradeRowIndex ?? -1;
    agg.rowIndex = Math.max(agg.rowIndex, ri);
  }

  const nullKey = '__null__';
  const orderKeys = TICK_STYLE_SEGMENT_ORDER.map((s) =>
    s == null ? nullKey : s,
  );
  const orderedSet = new Set<string>(orderKeys);

  const toSegments = (byStyle: Map<string, number>): GradeStyleSegment[] => {
    const out: GradeStyleSegment[] = [];
    for (const key of orderKeys) {
      const c = byStyle.get(key) ?? 0;
      if (c > 0) {
        out.push({
          style: key === nullKey ? null : (key as TickStyle),
          count: c,
        });
      }
    }
    let other = 0;
    for (const [key, c] of byStyle) {
      if (c > 0 && !orderedSet.has(key)) {
        other += c;
      }
    }
    if (other > 0) {
      out.push({ style: null, count: other });
    }
    return out;
  };

  return [...map.entries()]
    .map(([grade, agg]) => ({
      grade,
      rowIndex: agg.rowIndex,
      total: [...agg.byStyle.values()].reduce((a, b) => a + b, 0),
      segments: toSegments(agg.byStyle),
    }))
    .sort((a, b) => b.rowIndex - a.rowIndex);
}

export function sendCountExclProjects(ticks: FetchedClimbingTick[]): number {
  return ticks.filter((r) => (r.style as TickStyle | null) !== 'PJ').length;
}

export function totalTickPoints(ticks: FetchedClimbingTick[]): number {
  return ticks.reduce((s, r) => s + r.tickScore.points, 0);
}
