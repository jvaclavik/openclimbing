import { ClimbingRoute, PathPoint, PathPoints, Position } from '../types';

const distSq = (a: Position, b: PathPoint) =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export const getStickyThreshold = () =>
  'ontouchstart' in window ? 0.03 : 0.015;

export type FindCloserPointOptions = {
  /** When dragging a protection point, exclude it so snap does not lock to itself. */
  excludeProtectionIndex?: number | null;
  /** When true, disables snap/sticking and returns no closer point. */
  disableSnap?: boolean;
};

export const findCloserPointFactory =
  ({
    routeSelectedIndex,
    routes,
    getPathForRoute,
    getProtectionPoints,
  }: {
    routeSelectedIndex: number | null;
    routes: Array<ClimbingRoute>;
    getPathForRoute: (route: ClimbingRoute) => PathPoints;
    getProtectionPoints?: () => PathPoints;
  }) =>
  (
    checkedPosition: Position,
    options?: FindCloserPointOptions | null,
  ): PathPoint | null => {
    const STICKY_THRESHOLD = getStickyThreshold();
    const thresholdSq = STICKY_THRESHOLD ** 2;

    if (options?.disableSnap) return null;

    if (
      !Number.isFinite(checkedPosition.x) ||
      !Number.isFinite(checkedPosition.y)
    )
      return null;

    const protectionRaw = getProtectionPoints?.() ?? [];
    const protection =
      options?.excludeProtectionIndex != null
        ? protectionRaw.filter((_, i) => i !== options.excludeProtectionIndex)
        : protectionRaw;

    const otherRoutePoints =
      routeSelectedIndex === null
        ? routes.flatMap((r) => getPathForRoute(r))
        : routes.flatMap((route, index) =>
            index === routeSelectedIndex ? [] : getPathForRoute(route),
          );

    const candidates = [...protection, ...otherRoutePoints];

    let best: PathPoint | null = null;
    let bestD = thresholdSq;

    for (const point of candidates) {
      if (!point) continue;
      const d = distSq(checkedPosition, point);
      if (d <= thresholdSq && d < bestD) {
        bestD = d;
        best = point;
      }
    }

    return best;
  };
