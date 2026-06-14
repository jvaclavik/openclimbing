import { along, length, lineString } from '@turf/turf';
import { LonLat } from '../../../../services/types';

const sameLonLat = (a: LonLat, b: LonLat, epsilon = 1e-9) =>
  Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon;

/**
 * Spreads `count` routes evenly along the polyline defined by the given guide
 * (control) points. The first route lands on the first guide point, the last
 * route on the last guide point and the rest is distributed by geodesic
 * distance (so segments of different length get a proportional number of
 * routes).
 */
export const distributeAlongControlPoints = (
  controlPoints: LonLat[],
  count: number,
): LonLat[] => {
  if (count <= 0) return [];
  if (controlPoints.length === 0) return [];
  if (controlPoints.length === 1) {
    return Array.from({ length: count }, () => controlPoints[0]);
  }

  const line = lineString(controlPoints);
  const total = length(line, { units: 'kilometers' });

  if (total <= 0) {
    return Array.from({ length: count }, () => controlPoints[0]);
  }

  if (count === 1) {
    const point = along(line, total / 2, { units: 'kilometers' });
    return [point.geometry.coordinates as LonLat];
  }

  return Array.from({ length: count }, (_, index) => {
    const distance = (total * index) / (count - 1);
    const point = along(line, distance, { units: 'kilometers' });
    return point.geometry.coordinates as LonLat;
  });
};

/**
 * Computes the final on-map position for each route.
 *
 * - With at least two guide points the routes are distributed along the line.
 * - With fewer guide points the routes keep their fallback (original) position.
 * - A per-route manual override (drag & drop) always wins.
 */
export const getRouteMapPositions = ({
  controlPoints,
  routeIds,
  fallbackPositions,
  overrides,
}: {
  controlPoints: LonLat[];
  routeIds: string[];
  fallbackPositions: Array<LonLat | undefined>;
  overrides: Record<string, LonLat>;
}): Array<LonLat | undefined> => {
  const distributed =
    controlPoints.length >= 2
      ? distributeAlongControlPoints(controlPoints, routeIds.length)
      : null;

  return routeIds.map((id, index) => {
    if (overrides[id]) return overrides[id];
    if (distributed) return distributed[index];
    return fallbackPositions[index];
  });
};

export const hasPositionChanged = (
  next: LonLat | undefined,
  original: LonLat | undefined,
) => {
  if (!next) return false;
  if (!original) return true;
  return !sameLonLat(next, original);
};
