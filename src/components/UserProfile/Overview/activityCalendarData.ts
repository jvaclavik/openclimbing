import { addDays, format, startOfWeek, subWeeks } from 'date-fns';
import { TickStyle } from '../../FeaturePanel/Climbing/types';
import { FetchedClimbingTick } from '../../../services/my-ticks/getMyTicks';
import { isProjectStyle } from '../../../services/my-ticks/ticks';
import { sessionDateFromTimestamp } from '../../../services/my-ticks/ticksUrlFilter';

export const CALENDAR_WEEKS = 53;

export type CalendarDay = {
  /** YYYY-MM-DD */
  day: string;
  sends: number;
  ticks: number;
  /** 0 = no climbing, 1–4 = intensity. */
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
};

export type CalendarData = {
  /** Columns (weeks, Monday first), oldest first. */
  weeks: CalendarDay[][];
  /** Month label positions (column index of the first week of the month). */
  months: { column: number; date: Date }[];
  activeDays: number;
};

const levelFor = (sends: number, ticks: number): CalendarDay['level'] => {
  if (ticks === 0) return 0;
  if (sends <= 2) return 1;
  if (sends <= 4) return 2;
  if (sends <= 7) return 3;
  return 4;
};

/** Last 53 weeks (ending with the current week) of climbing activity. */
export const buildActivityCalendar = (
  rows: FetchedClimbingTick[],
  today: Date = new Date(),
): CalendarData => {
  const perDay = new Map<string, { sends: number; ticks: number }>();
  for (const row of rows) {
    const key = sessionDateFromTimestamp(row.date);
    const entry = perDay.get(key) ?? { sends: 0, ticks: 0 };
    entry.ticks += 1;
    if (!isProjectStyle(row.style as TickStyle | null)) entry.sends += 1;
    perDay.set(key, entry);
  }

  const todayKey = format(today, 'yyyy-MM-dd');
  const start = startOfWeek(subWeeks(today, CALENDAR_WEEKS - 1), {
    weekStartsOn: 1,
  });
  const weeks: CalendarDay[][] = [];
  const months: CalendarData['months'] = [];
  let activeDays = 0;
  let lastMonth = -1;

  for (let w = 0; w < CALENDAR_WEEKS; w += 1) {
    const week: CalendarDay[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = addDays(start, w * 7 + d);
      const day = format(date, 'yyyy-MM-dd');
      const { sends, ticks } = perDay.get(day) ?? { sends: 0, ticks: 0 };
      const future = day > todayKey;
      if (!future && ticks > 0) activeDays += 1;
      week.push({ day, sends, ticks, level: levelFor(sends, ticks), future });
      if (date.getDate() === 1 && date.getMonth() !== lastMonth) {
        months.push({ column: w, date });
        lastMonth = date.getMonth();
      }
    }
    weeks.push(week);
  }

  return { weeks, months, activeDays };
};
