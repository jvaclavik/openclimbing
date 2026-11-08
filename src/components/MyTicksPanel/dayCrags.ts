import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { OsmId } from '../../services/types';

export type DayCrag = { name: string; osmId: OsmId | null };

/** Unique crags of a climbing day, in order of first appearance. */
export const getDayCrags = (ticks: FetchedClimbingTick[]): DayCrag[] => {
  const seen = new Map<string, DayCrag>();
  for (const row of ticks) {
    const name = row.cragName?.trim();
    if (!name || seen.has(name)) continue;
    const osmId =
      row.cragOsmType && row.cragOsmId
        ? ({ type: row.cragOsmType, id: row.cragOsmId } as OsmId)
        : null;
    seen.set(name, { name, osmId });
  }
  return [...seen.values()];
};
