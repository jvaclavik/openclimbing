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
  osmType: string;
  osmId: number;
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

/**
 * climbing_features.parentId stores the parent relation's OSM id (see addParentIds
 * in overpassToGeojsons.ts). Parents of climbing features are always relations
 * (climbing=area / climbing=crag relations contain routes / sub-relations).
 * So we key the lookup map by osmId and restrict to relations.
 */
function loadClimbingFeaturesByOsmId(
  db: Database,
): Map<number, FeatureByIdRow> {
  const rows = db
    .prepare(
      `SELECT id, "parentId", type, name, "nameRaw", "osmType", "osmId"
       FROM climbing_features
       WHERE "osmType" = 'relation'`,
    )
    .all() as FeatureByIdRow[];
  const m = new Map<number, FeatureByIdRow>();
  for (const r of rows) {
    m.set(r.osmId, r);
  }
  return m;
}

type CragAncestor = {
  name: string | null;
  osmType: string;
  osmId: number;
};

/** Walks parent chain collecting up to two crag/area ancestors (closer first). */
function findCragAncestors(
  byId: Map<number, FeatureByIdRow>,
  startParentId: number | null | undefined,
): CragAncestor[] {
  if (startParentId == null || !Number.isFinite(startParentId)) {
    return [];
  }
  const out: CragAncestor[] = [];
  const visited = new Set<number>();
  let pid: number | null = startParentId;
  for (let step = 0; step < 64 && pid != null && out.length < 2; step += 1) {
    if (visited.has(pid)) break;
    visited.add(pid);
    const node = byId.get(pid);
    if (!node) break;
    if (CRAG_GROUP_TYPES.has(node.type)) {
      out.push({
        name: routeDisplayName(node.name, node.nameRaw),
        osmType: node.osmType,
        osmId: node.osmId,
      });
    }
    pid =
      node.parentId != null && Number.isFinite(node.parentId)
        ? node.parentId
        : null;
  }
  return out;
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

type RouteMeta = {
  routeName: string | null;
  routeGradeTxt: string | null;
  routeLon: number | null;
  routeLat: number | null;
  routeCragName: string | null;
  routeCragOsmType: string | null;
  routeCragOsmId: number | null;
  routeAreaName: string | null;
  routeAreaOsmType: string | null;
  routeAreaOsmId: number | null;
};

const cragMetaFromAncestors = (
  ancestors: CragAncestor[],
  immediateParentName: string | null,
): Pick<
  RouteMeta,
  | 'routeCragName'
  | 'routeCragOsmType'
  | 'routeCragOsmId'
  | 'routeAreaName'
  | 'routeAreaOsmType'
  | 'routeAreaOsmId'
> => {
  const crag = ancestors[0];
  const area = ancestors[1];
  return {
    routeCragName: crag?.name ?? immediateParentName,
    routeCragOsmType: crag?.osmType ?? null,
    routeCragOsmId: crag?.osmId ?? null,
    routeAreaName: area?.name ?? null,
    routeAreaOsmType: area?.osmType ?? null,
    routeAreaOsmId: area?.osmId ?? null,
  };
};

export function getRouteMetaMap(
  db: Database,
  rows: ClimbingTickDb[],
): Map<string, RouteMeta> {
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
    LEFT JOIN climbing_features par
      ON par."osmId" = r."parentId" AND par."osmType" = 'relation'
    WHERE ${orParts}`;
  const stmt = db.prepare(sql);
  const found = stmt.all(
    ...list.flatMap((p) => [p.osmType, p.osmId]),
  ) as FeatureRow[];
  const byId = loadClimbingFeaturesByOsmId(db);
  const map = new Map<string, RouteMeta>();
  for (const row of found) {
    const key = `${row.osmType}:${row.osmId}`;
    const immediateParent = routeDisplayName(row.parName, row.parNameRaw);
    const ancestors = findCragAncestors(byId, row.parentId);
    map.set(key, {
      routeName: routeDisplayName(row.name, row.nameRaw),
      routeGradeTxt: row.gradeTxt?.trim() || null,
      routeLon: Number.isFinite(row.lon) ? row.lon : null,
      routeLat: Number.isFinite(row.lat) ? row.lat : null,
      ...cragMetaFromAncestors(ancestors, immediateParent),
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
