import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { sessionDateFromTimestamp } from '../../services/my-ticks/ticksUrlFilter';

export type UserProfileSummary = {
  /** Year of the first tick. */
  sinceYear: number | null;
  /** Area (or crag) with the most climbing days. */
  homeArea: string | null;
};

export const computeUserProfileSummary = (
  rows: FetchedClimbingTick[],
): UserProfileSummary => {
  let firstDate: string | null = null;
  const daysByArea = new Map<string, Set<string>>();

  for (const row of rows) {
    if (Number.isNaN(Date.parse(row.date))) continue;
    if (!firstDate || row.date < firstDate) firstDate = row.date;
    const area = row.areaName?.trim() || row.cragName?.trim();
    if (!area) continue;
    const days = daysByArea.get(area) ?? new Set<string>();
    days.add(sessionDateFromTimestamp(row.date));
    daysByArea.set(area, days);
  }

  let homeArea: string | null = null;
  let homeDays = 0;
  daysByArea.forEach((days, area) => {
    if (days.size > homeDays) {
      homeArea = area;
      homeDays = days.size;
    }
  });

  return {
    sinceYear: firstDate ? new Date(firstDate).getFullYear() : null,
    homeArea,
  };
};
