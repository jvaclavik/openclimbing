import { TickStyle } from '../FeaturePanel/Climbing/types';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { monthKeyFromDate } from '../../services/my-ticks/climbingStatsDateRange';
import {
  TICK_STYLE_SEGMENT_ORDER,
  coerceTickStyleFromDb,
  tickStyles,
  tickStyleToChartColor,
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

export function cragVisitDays(
  ticks: FetchedClimbingTick[],
  unknownCragKey: string,
): { crag: string; days: number }[] {
  const byCrag = new Map<string, Set<string>>();
  for (const t of ticks) {
    if ((t.style as TickStyle | null) === 'PJ') continue;
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) continue;
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const crag = t.cragName?.trim() ? t.cragName.trim() : unknownCragKey;
    if (!byCrag.has(crag)) byCrag.set(crag, new Set());
    byCrag.get(crag)!.add(dayKey);
  }
  return [...byCrag.entries()]
    .map(([crag, days]) => ({ crag, days: days.size }))
    .sort((a, b) => b.days - a.days);
}

export type GradeStyleSegment = { style: TickStyle; count: number };

const NULL_STYLE_KEY = '__null__';

function styleOrderKeys(): string[] {
  return TICK_STYLE_SEGMENT_ORDER.map((s) => (s == null ? NULL_STYLE_KEY : s));
}

function segmentsFromStyleCounts(
  byStyle: Map<string, number>,
): GradeStyleSegment[] {
  const orderKeys = styleOrderKeys();
  const orderedSet = new Set<string>(orderKeys);
  const out: GradeStyleSegment[] = [];
  for (const key of orderKeys) {
    const c = byStyle.get(key) ?? 0;
    if (c > 0) {
      out.push({
        style: key === NULL_STYLE_KEY ? null : (key as TickStyle),
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
}

export function gradeSendCountsByStyle(ticks: FetchedClimbingTick[]): {
  grade: string;
  rowIndex: number;
  total: number;
  segments: GradeStyleSegment[];
  sampleTick: FetchedClimbingTick | null;
}[] {
  type Agg = {
    byStyle: Map<string, number>;
    rowIndex: number;
    sampleTick: FetchedClimbingTick | null;
  };
  const map = new Map<string, Agg>();

  for (const t of ticks) {
    const g = t.grade?.trim() || '?';
    const coerced = coerceTickStyleFromDb(t.style as string);
    const mapKey = coerced == null ? NULL_STYLE_KEY : coerced;

    let agg = map.get(g);
    if (!agg) {
      agg = { byStyle: new Map(), rowIndex: -1, sampleTick: t };
      map.set(g, agg);
    }
    agg.byStyle.set(mapKey, (agg.byStyle.get(mapKey) ?? 0) + 1);
    const ri = t.tickScore.gradeRowIndex ?? -1;
    agg.rowIndex = Math.max(agg.rowIndex, ri);
  }

  return [...map.entries()]
    .map(([grade, agg]) => ({
      grade,
      rowIndex: agg.rowIndex,
      total: [...agg.byStyle.values()].reduce((a, b) => a + b, 0),
      segments: segmentsFromStyleCounts(agg.byStyle),
      sampleTick: agg.sampleTick,
    }))
    .sort((a, b) => b.rowIndex - a.rowIndex);
}

export function sendCountExclProjects(ticks: FetchedClimbingTick[]): number {
  return ticks.filter((r) => (r.style as TickStyle | null) !== 'PJ').length;
}

export function totalTickPoints(ticks: FetchedClimbingTick[]): number {
  return ticks.reduce((s, r) => s + r.tickScore.points, 0);
}

export function tickStylePieData(ticks: FetchedClimbingTick[]): Array<{
  key: string;
  name: string;
  value: number;
  color: string;
}> {
  const map = new Map<TickStyle, number>();
  for (const t of ticks) {
    const coerced = coerceTickStyleFromDb(t.style as string);
    map.set(coerced, (map.get(coerced) ?? 0) + 1);
  }
  return tickStyles
    .map((s) => ({
      key: s.key == null ? '—' : String(s.key),
      name: s.name,
      value: map.get(s.key) ?? 0,
      color: tickStyleToChartColor(s.key),
    }))
    .filter((r) => r.value > 0);
}

export function weekdayRadarData(ticks: FetchedClimbingTick[]): Array<{
  key: string;
  label: string;
  value: number;
}> {
  // Date.getDay(): 0=Sun ... 6=Sat. Chceme pořadí Po..Ne.
  const order = [1, 2, 3, 4, 5, 6, 0];
  const labels: Record<number, string> = {
    1: 'Po',
    2: 'Út',
    3: 'St',
    4: 'Čt',
    5: 'Pá',
    6: 'So',
    0: 'Ne',
  };
  const counts = new Map<number, number>();
  for (const t of ticks) {
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) continue;
    const dow = d.getDay();
    counts.set(dow, (counts.get(dow) ?? 0) + 1);
  }
  return order.map((k) => ({
    key: String(k),
    label: labels[k] ?? String(k),
    value: counts.get(k) ?? 0,
  }));
}
