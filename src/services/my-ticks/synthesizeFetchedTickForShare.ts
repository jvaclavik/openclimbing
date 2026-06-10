import { ClimbingTick } from '../../types';
import { TickStyle } from '../../components/FeaturePanel/Climbing/types';
import { getApiId } from '../helpers';
import { FetchedClimbingTick } from './getMyTicks';

/**
 * Build a minimal FetchedClimbingTick from a stored ClimbingTick using only
 * fields already on the tick (routeName/Grade/Crag/Area). Suitable for the
 * Share dialog where stats fields (tickScore, full feature tags) aren't read.
 *
 * Returns null when the tick has no shortId (orphan tick) — there's nothing
 * to share without an OSM ref.
 */
export const synthesizeFetchedTickForShare = (
  tick: ClimbingTick,
): FetchedClimbingTick | null => {
  if (!tick.shortId) return null;
  return {
    key: `${tick.shortId}-${tick.timestamp}`,
    name: tick.routeName?.trim() ?? '',
    grade: tick.routeGradeTxt?.trim() ?? '',
    cragName: tick.routeCragName?.trim() || null,
    cragOsmType: tick.routeCragOsmType ?? null,
    cragOsmId: tick.routeCragOsmId ?? null,
    areaName: tick.routeAreaName?.trim() || null,
    areaOsmType: tick.routeAreaOsmType ?? null,
    areaOsmId: tick.routeAreaOsmId ?? null,
    index: 0,
    date: tick.timestamp,
    style: tick.style as TickStyle,
    apiId: getApiId(tick.shortId),
    tags: {},
    tick,
    tickScore: {
      points: 0,
      gradeRowIndex: null,
      gradeBase: 0,
      multiplier: 0,
    },
  };
};
