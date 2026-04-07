import type { Database } from 'better-sqlite3';
import { convertClimbingTickFromDb } from '../../services/my-ticks/myTicksApi';
import type { ClimbingTick, ClimbingTickDb } from '../../types';

type FeatureRow = {
  id: number;
  parentId: number | null;
  osmType: string;
  osmId: number;
  name: string | null;
  nameRaw: string | null;
  gradeTxt: string | null;
  lon: number;
  lat: number;
  parName: string | null;
  parNameRaw: string | null;
};

type FeatureByIdRow = {
  id: number;
  parentId: number | null;
  type: string;
  name: string | null;
  nameRaw: string | null;
};

const CRAG_GROUP_TYPES = new Set(['crag', 'area']);

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

function loadClimbingFeaturesById(db: Database): Map<number, FeatureByIdRow> {
  const rows = db
    .prepare(
      `SELECT id, "parentId", type, name, "nameRaw" FROM climbing_features`,
    )
    .all() as FeatureByIdRow[];
  const m = new Map<number, FeatureByIdRow>();
  for (const r of rows) {
    m.set(r.id, r);
  }
  return m;
}

/** První předek v řetězci parentId s typem crag nebo area (skála / lezecká oblast). */
function findFirstCragOrAreaName(
  byId: Map<number, FeatureByIdRow>,
  startParentId: number | null | undefined,
): string | null {
  if (startParentId == null || !Number.isFinite(startParentId)) {
    return null;
  }
  const visited = new Set<number>();
  let pid: number | null = startParentId;
  for (let step = 0; step < 64 && pid != null; step += 1) {
    if (visited.has(pid)) break;
    visited.add(pid);
    const node = byId.get(pid);
    if (!node) break;
    if (CRAG_GROUP_TYPES.has(node.type)) {
      return routeDisplayName(node.name, node.nameRaw);
    }
    pid =
      node.parentId != null && Number.isFinite(node.parentId)
        ? node.parentId
        : null;
  }
  return null;
}

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
    routeCragName: string | null;
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
    .map(() => '(r."osmType" = ? AND r."osmId" = ?)')
    .join(' OR ');
  const sql = `SELECT r.id, r."parentId", r."osmType", r."osmId", r.name, r."nameRaw", r."gradeTxt", r.lon, r.lat,
    par.name AS "parName", par."nameRaw" AS "parNameRaw"
    FROM climbing_features r
    LEFT JOIN climbing_features par ON par.id = r."parentId"
    WHERE ${orParts}`;
  const stmt = db.prepare(sql);
  const found = stmt.all(
    ...list.flatMap((p) => [p.osmType, p.osmId]),
  ) as FeatureRow[];
  const byId = loadClimbingFeaturesById(db);
  const map = new Map<
    string,
    {
      routeName: string | null;
      routeGradeTxt: string | null;
      routeLon: number | null;
      routeLat: number | null;
      routeCragName: string | null;
    }
  >();
  for (const row of found) {
    const key = `${row.osmType}:${row.osmId}`;
    const immediateParent = routeDisplayName(row.parName, row.parNameRaw);
    const cragName =
      findFirstCragOrAreaName(byId, row.parentId) ?? immediateParent;
    map.set(key, {
      routeName: routeDisplayName(row.name, row.nameRaw),
      routeGradeTxt: row.gradeTxt?.trim() || null,
      routeLon: Number.isFinite(row.lon) ? row.lon : null,
      routeLat: Number.isFinite(row.lat) ? row.lat : null,
      routeCragName: cragName,
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
