import { Geometry } from 'geojson';
import { getDb } from '../db/db';
import { ClimbingFeaturesRow } from '../db/types';
import { ClimbingFeatureFull } from '../../types';
import { Feature, OsmType } from '../../services/types';
import { getApiId } from '../../services/helpers';
import { convertOsmIdToMapId } from './buildTileGeojson';
import {
  getImageDefs,
  mergeMemberImageDefs,
} from '../../services/images/getImageDefs';
import { getCountryCode } from '../../services/osm/getCountryCode';
import { getPoiClass } from '../../services/getPoiClass';

const OSM_TYPES: OsmType[] = ['node', 'way', 'relation'];

// Thrown when the feature is not present in the climbing SQLite DB (e.g. a
// non-climbing POI, or data not yet refreshed). The /get endpoint maps it to a
// 404 so the client can cheaply fall back to the OSM/Overpass path.
export class ClimbingFeatureNotFoundError extends Error {}

const mapTypeToOsm: Record<string, OsmType> = {
  '0': 'node',
  '1': 'way',
  '4': 'relation',
};

// reverse of convertOsmIdToMapId() - last digit is the osm type marker
export const decodeMapId = (mapId: number): { type: OsmType; id: number } => {
  const str = String(mapId);
  const type = mapTypeToOsm[str.slice(-1)];
  if (!type) {
    throw new Error(`Invalid mapId: ${mapId}`);
  }
  return { type, id: Number(str.slice(0, -1)) };
};

/**
 * Parses the `id` query param. Accepts:
 *  - OSM URL id:  `way/123`, `node/5`, `relation/9`
 *  - short id:    `w123`, `n5`, `r9`
 *  - mapId:       `1231` (numeric, as used in the vector tiles)
 */
export const parseFeatureId = (raw: string): { type: OsmType; id: number } => {
  const s = String(raw).trim();

  if (s.includes('/')) {
    const [typeStr, idStr] = s.split('/');
    const type = typeStr.toLowerCase() as OsmType;
    const id = Number(idStr);
    if (!OSM_TYPES.includes(type) || !Number.isFinite(id)) {
      throw new Error(`Invalid OSM URL id: ${s}`);
    }
    return { type, id };
  }

  if (/^[nwr]/i.test(s)) {
    const { type, id } = getApiId(s);
    if (!type || !Number.isFinite(id)) {
      throw new Error(`Invalid short id: ${s}`);
    }
    return { type, id };
  }

  if (/^\d+$/.test(s)) {
    return decodeMapId(Number(s));
  }

  throw new Error(`Cannot parse feature id: ${s}`);
};

const getRow = (osmType: OsmType, osmId: number) =>
  getDb()
    .prepare<
      [string, number],
      ClimbingFeaturesRow
    >(`SELECT * FROM climbing_features WHERE "osmType" = ? AND "osmId" = ?`)
    .get(osmType, osmId);

// Batch variant of getRow() - fetches all members of one relation level with a
// single query per osmType (`osmId IN (...)`) instead of one query per member.
// Returns a map keyed by `${osmType}/${osmId}`.
const getRows = (
  members: ClimbingFeatureFull['members'],
): Map<string, ClimbingFeaturesRow> => {
  const result = new Map<string, ClimbingFeaturesRow>();
  if (!members?.length) {
    return result;
  }

  const idsByType = new Map<OsmType, Set<number>>();
  for (const { type, ref } of members) {
    (idsByType.get(type) ?? idsByType.set(type, new Set()).get(type)!).add(ref);
  }

  for (const [osmType, idSet] of idsByType) {
    const ids = [...idSet];
    const placeholders = ids.map(() => '?').join(',');
    const rows = getDb()
      .prepare<[OsmType, ...number[]], ClimbingFeaturesRow>(
        `SELECT * FROM climbing_features WHERE "osmType" = ? AND "osmId" IN (${placeholders})`,
      )
      .all(osmType, ...ids);
    for (const row of rows) {
      result.set(`${row.osmType}/${row.osmId}`, row);
    }
  }

  return result;
};

const buildGeometry = (row: ClimbingFeaturesRow): Geometry =>
  row.line
    ? { type: 'LineString', coordinates: JSON.parse(row.line) }
    : { type: 'Point', coordinates: [row.lon, row.lat] };

const buildBaseFeature = (row: ClimbingFeaturesRow): ClimbingFeatureFull => {
  const { osmType, osmId, lon, lat, tags, members } = row;
  const center: [number, number] = [lon, lat];
  const parsedTags = tags ? JSON.parse(tags) : {};

  return {
    type: 'Feature',
    id: convertOsmIdToMapId({ type: osmType, id: osmId }),
    osmMeta: { type: osmType, id: osmId },
    tags: parsedTags,
    members: members ? JSON.parse(members) : undefined,
    // Always default to [] (like the Overpass path's leaf/visited case) so
    // consumers can safely iterate memberFeatures without null-guards. It's
    // overwritten with the resolved children in buildMemberTree() when present.
    memberFeatures: [],
    center,
    geometry: buildGeometry(row),
    imageDefs: getImageDefs(parsedTags, osmType, center),
    // Only class/subclass (for the POI icon), computed from tags - exactly like
    // osmToFeature(). Tile-only props (routeCount, histogram, grade, materials,
    // ...) are intentionally NOT sent: the FeaturePanel derives everything it
    // needs from `tags` + resolved `memberFeatures`, so shipping the precomputed
    // tile properties would only bloat the payload. Compute them on the FE.
    properties: getPoiClass(parsedTags),
  };
};

// Resolves relation members to full features from the DB (recursive tree).
const buildMemberTree = (
  members: ClimbingFeatureFull['members'],
  visited: Set<string>,
): ClimbingFeatureFull[] => {
  const result: ClimbingFeatureFull[] = [];
  const rows = getRows(members); // one query per osmType, not per member
  for (const { type, ref } of members ?? []) {
    const row = rows.get(`${type}/${ref}`);
    if (!row) continue; // member not in climbing DB (e.g. geometry-only node)

    const feature = buildBaseFeature(row);
    const key = `${type}/${ref}`;
    if (!visited.has(key)) {
      visited.add(key);
      if (feature.members?.length) {
        feature.memberFeatures = buildMemberTree(feature.members, visited);
        mergeMemberImageDefs(feature as unknown as Feature);
      }
    }
    result.push(feature);
  }
  return result;
};

// Walks the parentId chain upwards (parentId is always a relation osmId).
const buildParentChain = (
  parentId: number | undefined,
  visited: Set<string>,
): ClimbingFeatureFull[] => {
  const result: ClimbingFeatureFull[] = [];
  let pid = parentId;
  while (pid) {
    const key = `relation/${pid}`;
    if (visited.has(key)) break;
    visited.add(key);

    const row = getRow('relation', pid);
    if (!row) break;

    result.push(buildBaseFeature(row));
    pid = row.parentId ?? undefined;
  }
  return result;
};

export const getClimbingFeature = async (
  osmType: OsmType,
  osmId: number,
): Promise<ClimbingFeatureFull> => {
  const row = getRow(osmType, osmId);
  if (!row) {
    throw new ClimbingFeatureNotFoundError(
      `Feature ${osmType}/${osmId} not found`,
    );
  }

  const feature = buildBaseFeature(row);
  const visited = new Set<string>([`${osmType}/${osmId}`]);

  if (feature.members?.length) {
    feature.memberFeatures = buildMemberTree(feature.members, visited);
    mergeMemberImageDefs(feature as unknown as Feature);
  }

  // Always expose parentFeatures as an array (like the OSM path in osmApi.ts),
  // even when the feature has no parent. The FeaturePanel calls
  // filterCrags(feature.parentFeatures) for route_bottom photos and would throw
  // `.filter of undefined` otherwise.
  feature.parentFeatures = row.parentId
    ? buildParentChain(row.parentId, visited)
    : [];

  const countryCode = await getCountryCode({
    center: feature.center,
  } as Feature);
  if (countryCode) {
    feature.countryCode = countryCode;
  }

  return feature;
};
