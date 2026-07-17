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
    SELECT "type", "lon", "lat", "osmType", "osmId", COALESCE("name", "nameRaw") AS "name", "parentId",
      ((lat - @lat) * (lat - @lat) + (lon - @lon) * (lon - @lon)) AS distance_sq
    FROM climbing_features
    WHERE type != 'route' AND type != 'route_top' AND nameRaw LIKE @query
    ORDER BY distance_sq
    LIMIT 30`;

const QUERY_ROUTES = `
    SELECT "type", "lon", "lat", "osmType", "osmId", COALESCE("name", "nameRaw") AS "name", "parentId",
      ((lat - @lat) * (lat - @lat) + (lon - @lon) * (lon - @lon)) AS distance_sq
    FROM climbing_features
    WHERE (type = 'route' OR type = 'route_top') AND nameRaw LIKE @query
    ORDER BY distance_sq
    LIMIT 10`;

const MAX_PARENT_DEPTH = 4; // how many parentId hops to resolve for each result

type SearchRow = ClimbingSearchRecord & { parentId: number | null };
type ParentRow = { osmId: number; name: string; parentId: number | null };

// Resolves the parentId chain (always relations - climbing areas/sites) for each
// result, up to MAX_PARENT_DEPTH hops. Done breadth-first, one batched query per
// level (`osmId IN (...)`) instead of one query per hop per record - so at most
// MAX_PARENT_DEPTH queries total, all hitting idx_climbing_features_osm.
const attachParents = (records: SearchRow[]): void => {
  const cache = new Map<number, ParentRow>();

  let frontier = new Set<number>();
  for (const record of records) {
    if (record.parentId) frontier.add(record.parentId);
  }

  for (let depth = 0; depth < MAX_PARENT_DEPTH && frontier.size; depth += 1) {
    const ids = [...frontier].filter((id) => !cache.has(id));
    if (!ids.length) break;

    const placeholders = ids.map(() => '?').join(',');
    const rows = getDb()
      .prepare<number[], ParentRow>(
        `SELECT "osmId", COALESCE("name", "nameRaw") AS "name", "parentId"
         FROM climbing_features
         WHERE "osmType" = 'relation' AND "osmId" IN (${placeholders})`,
      )
      .all(...ids);

    frontier = new Set();
    for (const row of rows) {
      cache.set(row.osmId, row);
      if (row.parentId) frontier.add(row.parentId);
    }
  }

  for (const record of records) {
    const parents: ClimbingSearchParent[] = [];
    const seen = new Set<number>();
    let pid = record.parentId ?? undefined;
    while (pid && parents.length < MAX_PARENT_DEPTH && !seen.has(pid)) {
      seen.add(pid);
      const row = cache.get(pid);
      if (!row) break;
      parents.push({ name: row.name, osmType: 'relation', osmId: row.osmId });
      pid = row.parentId ?? undefined;
    }
    if (parents.length) record.parents = parents;
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
