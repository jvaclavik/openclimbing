import type { Database } from 'better-sqlite3';
import { convertClimbingTickFromDb } from '../../services/my-ticks/myTicksApi';
import type { ClimbingTick, ClimbingTickDb } from '../../types';

type FeatureRow = {
  osmType: string;
  osmId: number;
  name: string | null;
  nameRaw: string | null;
  gradeTxt: string | null;
  lon: number;
  lat: number;
};

const routeDisplayName = (
  name: string | null,
  nameRaw: string | null,
): string | null => {
  const trimmedName = name?.trim();
  if (trimmedName) return trimmedName;
  const trimmedRaw = nameRaw?.trim();
  if (trimmedRaw) return trimmedRaw;
  return null;
};

const tickRowOsmKey = (row: ClimbingTickDb): string | null => {
  if (
    typeof row.osmType !== 'string' ||
    row.osmType.trim() === '' ||
    row.osmId == null
  ) {
    return null;
  }
  const id = Number(row.osmId);
  if (!Number.isFinite(id) || id < 1) return null;
  return `${row.osmType.trim()}:${id}`;
};

export function getRouteMetaMap(
  db: Database,
  rows: ClimbingTickDb[],
): Map<
  string,
  {
    routeName: string | null;
    routeGradeTxt: string | null;
    routeLon: number | null;
    routeLat: number | null;
  }
> {
  const pairs = new Map<string, { osmType: string; osmId: number }>();
  for (const r of rows) {
    const key = tickRowOsmKey(r);
    if (!key) continue;
    const id = Number(r.osmId);
    pairs.set(key, { osmType: String(r.osmType).trim(), osmId: id });
  }
  if (pairs.size === 0) {
    return new Map();
  }
  const list = [...pairs.values()];
  const orParts = list
    .map(() => '("osmType" = ? AND "osmId" = ?)')
    .join(' OR ');
  const sql = `SELECT "osmType", "osmId", name, "nameRaw", "gradeTxt", lon, lat FROM climbing_features WHERE ${orParts}`;
  const stmt = db.prepare(sql);
  const found = stmt.all(
    ...list.flatMap((p) => [p.osmType, p.osmId]),
  ) as FeatureRow[];
  const map = new Map<
    string,
    {
      routeName: string | null;
      routeGradeTxt: string | null;
      routeLon: number | null;
      routeLat: number | null;
    }
  >();
  for (const row of found) {
    const key = `${row.osmType}:${row.osmId}`;
    map.set(key, {
      routeName: routeDisplayName(row.name, row.nameRaw),
      routeGradeTxt: row.gradeTxt?.trim() || null,
      routeLon: Number.isFinite(row.lon) ? row.lon : null,
      routeLat: Number.isFinite(row.lat) ? row.lat : null,
    });
  }
  return map;
}

export function climbingTickDbsToResponseTicks(
  db: Database,
  rows: ClimbingTickDb[],
): ClimbingTick[] {
  const metaMap = getRouteMetaMap(db, rows);
  return rows.map((row) => {
    const tick = convertClimbingTickFromDb(row);
    const key = tickRowOsmKey(row);
    const meta = key ? metaMap.get(key) : undefined;
    if (!meta) return tick;
    return { ...tick, ...meta };
  });
}
