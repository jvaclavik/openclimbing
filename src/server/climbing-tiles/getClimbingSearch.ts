import { ClimbingSearchParent, ClimbingSearchRecord } from '../../types';
import { removeDiacritics } from './utils';
import { getDb } from '../db/db';
import { LonLat } from '../../services/types';

const EARTH_RADIUS = 6372795;

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;

const getDistance = (point1: LonLat, point2: LonLat) => {
  const latdiff = degreesToRadians(point2[1]) - degreesToRadians(point1[1]);
  const lngdiff = degreesToRadians(point2[0]) - degreesToRadians(point1[0]);

  // harvesine formula
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

const haversineSorter = (origin: LonLat) => (a, b) =>
  getDistance(origin, [a.lon, a.lat]) - getDistance(origin, [b.lon, b.lat]);

const QUERY_GROUPS = `
    SELECT "type", "lon", "lat", "osmType", "osmId", COALESCE("name", "nameRaw") AS "name", "countryCode", "parentId",
      ((lat - @lat) * (lat - @lat) + (lon - @lon) * (lon - @lon)) AS distance_sq
    FROM climbing_features
    WHERE type != 'route' AND type != 'route_top' AND nameRaw LIKE @query
    ORDER BY distance_sq
    LIMIT 30`;

const QUERY_ROUTES = `
    SELECT "type", "lon", "lat", "osmType", "osmId", COALESCE("name", "nameRaw") AS "name", "countryCode", "parentId",
      "gradeId", "gradeTxt",
      ((lat - @lat) * (lat - @lat) + (lon - @lon) * (lon - @lon)) AS distance_sq
    FROM climbing_features
    WHERE (type = 'route' OR type = 'route_top') AND nameRaw LIKE @query
    ORDER BY distance_sq
    LIMIT 10`;

type SearchRow = ClimbingSearchRecord & { parentId: number | null };
type ParentRow = { osmId: number; name: string; parentId: number | null };

const fetchRelationsByOsmId = (osmIds: number[]): ParentRow[] => {
  if (!osmIds.length) return [];
  const placeholders = osmIds.map(() => '?').join(',');
  return getDb()
    .prepare<number[], ParentRow>(
      `SELECT "osmId", COALESCE("name", "nameRaw") AS "name", "parentId"
       FROM climbing_features
       WHERE "osmType" = 'relation' AND "osmId" IN (${placeholders})`,
    )
    .all(...osmIds);
};

// Attaches up to two ancestors (parent and grandparent, always relations - climbing
// areas/sites) to each result, resolved with one query per level.
const attachParents = (records: SearchRow[]): void => {
  const parentIds = [
    ...new Set(records.map((r) => r.parentId).filter(Boolean)),
  ] as number[];
  const parents = fetchRelationsByOsmId(parentIds);
  const parentById = new Map(parents.map((row) => [row.osmId, row]));

  const grandparentIds = [
    ...new Set(parents.map((row) => row.parentId).filter(Boolean)),
  ] as number[];
  const grandparents = fetchRelationsByOsmId(grandparentIds);
  const grandparentById = new Map(grandparents.map((row) => [row.osmId, row]));

  for (const record of records) {
    const parent = record.parentId
      ? parentById.get(record.parentId)
      : undefined;
    const grandparent = parent?.parentId
      ? grandparentById.get(parent.parentId)
      : undefined;

    const chain = [parent, grandparent].filter(
      (row): row is ParentRow => row != null,
    );
    if (chain.length) {
      record.parents = chain.map(
        (row): ClimbingSearchParent => ({
          name: row.name,
          osmType: 'relation',
          osmId: row.osmId,
        }),
      );
    }
    delete record.parentId;
  }
};

// usually 20 ms on M1 Air for both queries (70k records, 59k with nameRaw)
export const getClimbingSearch = (
  q: string,
  lon: number,
  lat: number,
): ClimbingSearchRecord[] => {
  const query = `%${removeDiacritics(q)}%`;

  const groups = getDb()
    .prepare(QUERY_GROUPS)
    .all({ lat, lon, query }) as SearchRow[];
  const routes = getDb()
    .prepare(QUERY_ROUTES)
    .all({ lat, lon, query }) as SearchRow[];

  groups.sort(haversineSorter([lon, lat])); // we search by distance_sq for performance, but we want to sort by real distance on FE
  routes.sort(haversineSorter([lon, lat]));

  const records = [...groups, ...routes];
  attachParents(records);
  return records;
};
