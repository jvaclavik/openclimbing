import { ClimbingNearbyRecord } from '../../types';
import { getDb } from '../db/db';
import { LonLat, OsmType } from '../../services/types';

const EARTH_RADIUS = 6372795;
const MAX_RESULTS = 20;
const DEFAULT_RADIUS_M: Record<ClimbingNearbyRecord['type'], number> = {
  crag: 8000,
  area: 15000,
};

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;

const getDistance = (point1: LonLat, point2: LonLat) => {
  const latdiff = degreesToRadians(point2[1]) - degreesToRadians(point1[1]);
  const lngdiff = degreesToRadians(point2[0]) - degreesToRadians(point1[0]);
  return (
    EARTH_RADIUS *
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin(latdiff / 2) ** 2 +
          Math.cos(degreesToRadians(point1[1])) *
            Math.cos(degreesToRadians(point2[1])) *
            Math.sin(lngdiff / 2) ** 2,
      ),
    )
  );
};

type NearbyRow = {
  type: 'area' | 'crag';
  lon: number;
  lat: number;
  osmType: OsmType;
  osmId: number;
  name: string;
  parentId: number | null;
  routeCount: number | null;
};

type OriginRow = { lon: number; lat: number };

export type GetClimbingNearbyParams = {
  type: ClimbingNearbyRecord['type'];
  lon?: number;
  lat?: number;
  excludeOsmType?: OsmType;
  excludeOsmId?: number;
  radiusMeters?: number;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const lookupOrigin = (
  lon: number | undefined,
  lat: number | undefined,
  osmType: OsmType | undefined,
  osmId: number | undefined,
): LonLat | null => {
  if (isFiniteNumber(lon) && isFiniteNumber(lat)) {
    return [lon, lat];
  }
  if (!osmType || !isFiniteNumber(osmId) || osmId < 1) {
    return null;
  }
  const row = getDb()
    .prepare<
      [string, number],
      OriginRow
    >(`SELECT lon, lat FROM climbing_features WHERE "osmType" = ? AND "osmId" = ? LIMIT 1`)
    .get(osmType, osmId);
  return row ? [row.lon, row.lat] : null;
};

const fetchParentNames = (parentIds: number[]): Map<number, string> => {
  if (!parentIds.length) return new Map();
  const placeholders = parentIds.map(() => '?').join(',');
  const rows = getDb()
    .prepare<number[], { osmId: number; name: string }>(
      `SELECT "osmId", COALESCE("name", "nameRaw") AS "name"
       FROM climbing_features
       WHERE "osmType" = 'relation' AND "osmId" IN (${placeholders})`,
    )
    .all(...parentIds);
  return new Map(rows.map((row) => [row.osmId, row.name]));
};

export const getClimbingNearby = ({
  type,
  lon,
  lat,
  excludeOsmType,
  excludeOsmId,
  radiusMeters,
}: GetClimbingNearbyParams): ClimbingNearbyRecord[] => {
  if (type !== 'crag' && type !== 'area') {
    throw new Error('type must be crag or area');
  }

  const origin = lookupOrigin(lon, lat, excludeOsmType, excludeOsmId);
  if (!origin) return [];

  const radius = radiusMeters ?? DEFAULT_RADIUS_M[type];
  const delta = (radius / 111_000) * 2;
  const excludeChildrenOfArea =
    type === 'crag' &&
    excludeOsmType === 'relation' &&
    isFiniteNumber(excludeOsmId) &&
    excludeOsmId > 0;

  const conditions = [
    `type = @type`,
    `lat BETWEEN @minLat AND @maxLat`,
    `lon BETWEEN @minLon AND @maxLon`,
  ];
  if (type === 'area') {
    conditions.push(`"osmType" = 'relation'`);
  }
  if (excludeOsmType && isFiniteNumber(excludeOsmId)) {
    conditions.push(
      `NOT ("osmType" = @excludeOsmType AND "osmId" = @excludeOsmId)`,
    );
  }
  if (excludeChildrenOfArea) {
    conditions.push(`("parentId" IS NULL OR "parentId" != @excludeOsmId)`);
  }

  const rows = getDb()
    .prepare<Record<string, unknown>, NearbyRow>(
      `SELECT "type", "lon", "lat", "osmType", "osmId",
              COALESCE("name", "nameRaw", '') AS "name",
              "parentId", "routeCount"
       FROM climbing_features
       WHERE ${conditions.join(' AND ')}`,
    )
    .all({
      type,
      minLat: origin[1] - delta,
      maxLat: origin[1] + delta,
      minLon: origin[0] - delta,
      maxLon: origin[0] + delta,
      excludeOsmType,
      excludeOsmId,
    });

  const withDistance = rows
    .map((row) => ({
      ...row,
      distanceMeters: getDistance(origin, [row.lon, row.lat]),
    }))
    .filter((row) => row.distanceMeters <= radius)
    .sort((a, b) => {
      if (type === 'crag') {
        const aOrphan = a.parentId == null ? 0 : 1;
        const bOrphan = b.parentId == null ? 0 : 1;
        if (aOrphan !== bOrphan) return aOrphan - bOrphan;
      }
      return a.distanceMeters - b.distanceMeters;
    })
    .slice(0, MAX_RESULTS);

  const parentNames = fetchParentNames([
    ...new Set(
      withDistance
        .map((row) => row.parentId)
        .filter((id): id is number => id != null),
    ),
  ]);

  return withDistance.map((row) => {
    const parentName =
      row.parentId != null ? parentNames.get(row.parentId) : undefined;
    return {
      type: row.type,
      lon: row.lon,
      lat: row.lat,
      osmType: row.osmType,
      osmId: row.osmId,
      name: row.name,
      distanceMeters: Math.round(row.distanceMeters),
      routeCount: row.routeCount ?? undefined,
      parentName,
    };
  });
};
