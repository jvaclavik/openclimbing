import { along, destination, length, lineString } from '@turf/turf';
import { LonLat } from '../../../../services/types';

/** Almost overlapping, so grouped pitches stay clickable. */
export const STACKED_PITCH_SPACING_M = 2;
/** Side-by-side spacing once the user picks a direction. */
export const DIRECTED_PITCH_SPACING_M = 8;
export const MIN_PITCH_SPACING_M = 1;
export const MAX_PITCH_SPACING_M = 80;

export const clampPitchSpacingM = (value: number) =>
  Math.min(
    MAX_PITCH_SPACING_M,
    Math.max(MIN_PITCH_SPACING_M, Math.round(value)),
  );

export const MULTIPITCH_LAYOUT_EVENT = 'oc-multipitch-layout';

/** Direction of the pitches that follow a given pitch number. null stacks them. */
export type PitchBearings = Record<number, number | null>;

export type MultipitchLayout = {
  group: boolean;
  /** Degrees clockwise from north. null keeps pitches stacked. */
  bearing: number | null;
  /** Metres between pitches when a direction is set. Stacked stays at 2 m. */
  spacingM?: number;
  /**
   * Direction of the pitches after one pitch of a route, keyed by the
   * normalized base name and then by pitch number. A bearing on L1 moves
   * every later pitch; a bearing on L4 moves only L5 onward.
   */
  groupBearings?: Record<string, PitchBearings>;
};

const MULTIPITCH_SUFFIX = /^(.*?)\s+L\s*(\d+)\s*$/i;

export const parseMultipitchName = (
  name: string,
): { base: string; pitch: number } | null => {
  const match = name.trim().match(MULTIPITCH_SUFFIX);
  if (!match) return null;
  const base = match[1].replace(/\s+/g, ' ').trim();
  if (!base) return null;
  const pitch = Number(match[2]);
  if (!Number.isFinite(pitch)) return null;
  return { base, pitch };
};

export const multipitchGroupKey = (name: string) => {
  const parsed = parseMultipitchName(name);
  return parsed ? parsed.base.toLocaleLowerCase() : null;
};

export const dispatchMultipitchLayout = (layout: MultipitchLayout) => {
  window.dispatchEvent(
    new CustomEvent(MULTIPITCH_LAYOUT_EVENT, { detail: layout }),
  );
};

type SlotMember = { routeIndex: number; pitch: number };

const buildSlots = (
  routes: { name: string }[],
  group: boolean,
  groupBearings?: Record<string, PitchBearings>,
): SlotMember[][] => {
  const slots: SlotMember[][] = [];
  const slotByKey = new Map<string, SlotMember[]>();
  routes.forEach((route, routeIndex) => {
    const parsed = parseMultipitchName(route.name);
    const key = parsed ? parsed.base.toLocaleLowerCase() : null;
    const grouped =
      !!parsed &&
      !!key &&
      (group || (groupBearings != null && key in groupBearings));
    if (!grouped || !key) {
      slots.push([{ routeIndex, pitch: 1 }]);
      return;
    }
    let slot = slotByKey.get(key);
    if (!slot) {
      slot = [];
      slotByKey.set(key, slot);
      slots.push(slot);
    }
    slot.push({ routeIndex, pitch: parsed.pitch });
  });

  slots.forEach((slot) => {
    slot.sort((a, b) => a.pitch - b.pitch || a.routeIndex - b.routeIndex);
  });
  return slots;
};

const pitchBearingsOf = (
  routes: { name: string }[],
  slot: SlotMember[],
  groupBearings?: Record<string, PitchBearings>,
): PitchBearings | undefined => {
  const key = multipitchGroupKey(routes[slot[0]?.routeIndex]?.name ?? '');
  if (!key || !groupBearings || !(key in groupBearings)) return undefined;
  return groupBearings[key];
};

/** Bearing that places `memberIndex`, taken from the nearest earlier pitch. */
const bearingBefore = (
  slot: SlotMember[],
  memberIndex: number,
  pitchBearings: PitchBearings | undefined,
  fallback: number | null,
): number | null => {
  for (let index = memberIndex - 1; index >= 0; index -= 1) {
    const pitch = slot[index].pitch;
    if (pitchBearings && pitch in pitchBearings) return pitchBearings[pitch];
  }
  return fallback;
};

/** Writes `fromIndex` and every later pitch. Earlier pitches stay untouched. */
const layoutForward = (
  slot: SlotMember[],
  fromIndex: number,
  origin: LonLat,
  next: Array<LonLat | undefined>,
  pitchBearings: PitchBearings | undefined,
  fallback: number | null,
  spacingM: number | undefined,
) => {
  let cursor = origin;
  next[slot[fromIndex].routeIndex] = cursor;
  for (let index = fromIndex + 1; index < slot.length; index += 1) {
    cursor = offsetBySteps(
      cursor,
      1,
      bearingBefore(slot, index, pitchBearings, fallback),
      spacingM,
    );
    next[slot[index].routeIndex] = cursor;
  }
};

/** True when this route is the lowest pitch of a multi-pitch group. */
export const isMultipitchAnchor = (
  routes: { name: string }[],
  routeIndex: number,
) => {
  const slot = buildSlots(routes, true).find((members) =>
    members.some((member) => member.routeIndex === routeIndex),
  );
  return !!slot && slot.length >= 2 && slot[0].routeIndex === routeIndex;
};

/** True when another pitch of the same route comes after this one. */
export const hasFollowingPitch = (
  routes: { name: string }[],
  routeIndex: number,
) => {
  const slot = buildSlots(routes, true).find((members) =>
    members.some((member) => member.routeIndex === routeIndex),
  );
  if (!slot) return false;
  const index = slot.findIndex((member) => member.routeIndex === routeIndex);
  return index >= 0 && index < slot.length - 1;
};

const pitchStepM = (bearing: number | null, spacingM: number | undefined) =>
  bearing == null
    ? STACKED_PITCH_SPACING_M
    : clampPitchSpacingM(spacingM ?? DIRECTED_PITCH_SPACING_M);

const offsetBySteps = (
  anchor: LonLat,
  steps: number,
  bearing: number | null,
  spacingM: number | undefined,
): LonLat => {
  if (steps === 0) return anchor;
  const stepM = pitchStepM(bearing, spacingM);
  const usedBearing = bearing ?? 90;
  const distanceKm = (Math.abs(steps) * stepM) / 1000;
  const stepBearing = steps > 0 ? usedBearing : (usedBearing + 180) % 360;
  const point = destination(anchor, distanceKm, stepBearing, {
    units: 'kilometers',
  });
  return point.geometry.coordinates as LonLat;
};

const isCoord = (value: LonLat | undefined): value is LonLat =>
  !!value && Number.isFinite(value[0]) && Number.isFinite(value[1]);

/**
 * One slot on the guide line per route. Pitches of the same multi-pitch route
 * (names ending in L1, L2, …) share a slot: the lowest pitch sits on the line
 * and the rest are offset along `bearing`, or stacked when bearing is null.
 */
export const distributeGroupedRoutes = (
  controlPoints: LonLat[],
  routes: { name: string }[],
  layout: MultipitchLayout,
): LonLat[] => {
  if (routes.length === 0 || controlPoints.length === 0) return [];
  const slots = buildSlots(routes, layout.group, layout.groupBearings);
  const anchors = distributeAlongControlPoints(controlPoints, slots.length);
  const positions: Array<LonLat | undefined> = new Array(routes.length);
  const fallback = layout.group ? layout.bearing : null;
  slots.forEach((slot, slotIndex) => {
    const anchor = anchors[slotIndex];
    if (!anchor || slot.length === 0) return;
    layoutForward(
      slot,
      0,
      anchor,
      positions,
      pitchBearingsOf(routes, slot, layout.groupBearings),
      fallback,
      layout.spacingM,
    );
  });
  return positions as LonLat[];
};

/**
 * Pulls each multi-pitch group onto the position of its lowest placed pitch.
 * Routes outside a group are left where they are.
 */
const placeSlot = (
  slot: SlotMember[],
  positions: Array<LonLat | undefined>,
  next: Array<LonLat | undefined>,
  pitchBearings: PitchBearings | undefined,
  fallback: number | null,
  spacingM: number | undefined,
) => {
  if (slot.length < 2) return;
  const anchorIndex = slot.findIndex((member) =>
    isCoord(positions[member.routeIndex]),
  );
  if (anchorIndex < 0) return;
  const anchor = positions[slot[anchorIndex].routeIndex] as LonLat;
  for (let index = 0; index < anchorIndex; index += 1) {
    next[slot[index].routeIndex] = offsetBySteps(
      anchor,
      index - anchorIndex,
      fallback,
      spacingM,
    );
  }
  layoutForward(
    slot,
    anchorIndex,
    anchor,
    next,
    pitchBearings,
    fallback,
    spacingM,
  );
};

export const clusterGroupedRoutes = (
  routes: { name: string }[],
  positions: Array<LonLat | undefined>,
  bearing: number | null,
  spacingM?: number,
  groupBearings?: Record<string, PitchBearings>,
): Array<LonLat | undefined> => {
  const next = positions.slice();
  buildSlots(routes, true).forEach((slot) => {
    placeSlot(
      slot,
      positions,
      next,
      pitchBearingsOf(routes, slot, groupBearings),
      bearing,
      spacingM,
    );
  });
  return next;
};

/**
 * Moves pitches after `fromPitch` of one route. The chosen pitch and
 * everything before it stay put, as do other routes.
 */
export const layoutMultipitchGroup = (
  routes: { name: string }[],
  positions: Array<LonLat | undefined>,
  groupKey: string,
  fromPitch: number,
  bearing: number | null,
  spacingM?: number,
  pitchBearings?: PitchBearings,
): Array<LonLat | undefined> => {
  const next = positions.slice();
  const slot = buildSlots(routes, true).find((members) => {
    const key = multipitchGroupKey(routes[members[0].routeIndex]?.name ?? '');
    return key === groupKey;
  });
  if (!slot) return next;
  const fromIndex = slot.findIndex((member) => member.pitch === fromPitch);
  if (fromIndex < 0) return next;
  const origin = positions[slot[fromIndex].routeIndex];
  if (!isCoord(origin)) return next;
  layoutForward(
    slot,
    fromIndex,
    origin,
    next,
    { ...pitchBearings, [fromPitch]: bearing },
    bearing,
    spacingM,
  );
  return next;
};

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

export const distributionSlotCount = (
  routes: { name: string }[],
  group: boolean,
  groupBearings?: Record<string, PitchBearings>,
) => buildSlots(routes, group, groupBearings).length;

/** Even spacing between slots on the guide line, in metres. */
export const guideLineSpacingM = (
  controlPoints: LonLat[],
  slotCount: number,
): number | null => {
  if (controlPoints.length < 2 || slotCount < 2) return null;
  const totalKm = length(lineString(controlPoints), { units: 'kilometers' });
  if (totalKm <= 0) return null;
  return (totalKm * 1000) / (slotCount - 1);
};

export const formatGuideSpacingM = (meters: number) => {
  if (meters >= 10) return String(Math.round(meters));
  const tenths = Math.round(meters * 10) / 10;
  return String(tenths);
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
