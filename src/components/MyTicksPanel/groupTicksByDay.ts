import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { sessionDateFromTimestamp } from '../../services/my-ticks/ticksUrlFilter';

export type TickListItem =
  | {
      type: 'header';
      sessionDate: string;
      sessionTicks: FetchedClimbingTick[];
    }
  | { type: 'row'; row: FetchedClimbingTick };

export const groupTicksByDay = (
  rows: FetchedClimbingTick[],
): TickListItem[] => {
  const byDay = new Map<string, FetchedClimbingTick[]>();
  for (const r of rows) {
    const day = sessionDateFromTimestamp(r.date);
    const list = byDay.get(day);
    if (list) {
      list.push(r);
    } else {
      byDay.set(day, [r]);
    }
  }

  const items: TickListItem[] = [];
  let lastDay: string | null = null;
  for (const row of rows) {
    const day = sessionDateFromTimestamp(row.date);
    if (day !== lastDay) {
      items.push({
        type: 'header',
        sessionDate: day,
        sessionTicks: byDay.get(day) ?? [],
      });
      lastDay = day;
    }
    items.push({ type: 'row', row });
  }
  return items;
};
