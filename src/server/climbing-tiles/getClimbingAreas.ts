import { getDb } from '../db/db';
import { OsmType } from '../../services/types';
import {
  ClimbingListType,
  isClimbingListType,
} from '../../services/climbing-areas/climbingListTypes';
import { formatViaFerrataScaleRange } from '../../services/tagging/viaFerrataScale';

export type ClimbingArea = {
  osmType: OsmType;
  osmId: number;
  name: string | null;
  countryCode: string | null; // ISO 3166-1 lowercase, resolved during refresh
  cragCount: number;
  routeCount: number;
  routesWithPhoto: number;
  lon: number;
  lat: number;
  viaFerrataScale?: string | null;
  city?: string | null;
};

type Row = {
  osmType: OsmType;
  osmId: number;
  name: string | null;
  members: string | null;
  tags: string | null;
  countryCode: string | null;
  routeCount: number | null;
  routesWithPhoto: number | null;
  lon: number;
  lat: number;
};

type OsmMember = { type: string; ref: number };

const parseMembers = (membersJson: string | null): OsmMember[] => {
  if (!membersJson) return [];
  try {
    const members = JSON.parse(membersJson) as unknown;
    if (!Array.isArray(members)) return [];
    return members.filter(
      (member): member is OsmMember =>
        !!member &&
        typeof member === 'object' &&
        typeof (member as OsmMember).type === 'string' &&
        typeof (member as OsmMember).ref === 'number',
    );
  } catch {
    return [];
  }
};

const membersLength = (membersJson: string | null): number => {
  if (!membersJson) return 0;
  try {
    const members = JSON.parse(membersJson) as unknown;
    return Array.isArray(members) ? members.length : 0;
  } catch {
    return 0;
  }
};

// Ferratas and gyms are often a relation plus member ways. Keep the relation
// (or a standalone node/way), not every named part of the same feature.
export const omitRelationMembers = <
  T extends { osmType: OsmType; osmId: number; members: string | null },
>(
  rows: T[],
): T[] => {
  const memberKeys = new Set<string>();
  for (const row of rows) {
    if (row.osmType !== 'relation') continue;
    for (const member of parseMembers(row.members)) {
      memberKeys.add(`${member.type}/${member.ref}`);
    }
  }
  return rows.filter((row) => !memberKeys.has(`${row.osmType}/${row.osmId}`));
};

const scaleFromTags = (tagsJson: string | null): string | null => {
  if (!tagsJson) return null;
  try {
    const tags = JSON.parse(tagsJson) as { via_ferrata_scale?: unknown };
    return typeof tags.via_ferrata_scale === 'string'
      ? tags.via_ferrata_scale.trim() || null
      : null;
  } catch {
    return null;
  }
};

const collectFerrataScales = (rows: Row[]) => {
  const scaleByKey = new Map<string, string>();
  for (const row of rows) {
    const scale = scaleFromTags(row.tags);
    if (scale) scaleByKey.set(`${row.osmType}/${row.osmId}`, scale);
  }
  return scaleByKey;
};

const resolveFerrataScale = (
  row: Row,
  scaleByKey: Map<string, string>,
): string | null => {
  const own = scaleByKey.get(`${row.osmType}/${row.osmId}`);
  if (own) return formatViaFerrataScaleRange([own]);
  return formatViaFerrataScaleRange(
    parseMembers(row.members)
      .map((member) => scaleByKey.get(`${member.type}/${member.ref}`))
      .filter((scale): scale is string => !!scale),
  );
};

const CITY_TAGS = [
  'addr:city',
  'addr:place',
  'addr:town',
  'addr:village',
  'contact:city',
] as const;

const cityFromTags = (tagsJson: string | null): string | null => {
  if (!tagsJson) return null;
  try {
    const tags = JSON.parse(tagsJson) as Record<string, unknown>;
    for (const key of CITY_TAGS) {
      const value = tags[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
  } catch {
    return null;
  }
};

const collectCities = (rows: Row[]) => {
  const cityByKey = new Map<string, string>();
  for (const row of rows) {
    const city = cityFromTags(row.tags);
    if (city) cityByKey.set(`${row.osmType}/${row.osmId}`, city);
  }
  return cityByKey;
};

const resolveCity = (
  row: Row,
  cityByKey: Map<string, string>,
): string | null => {
  const own = cityByKey.get(`${row.osmType}/${row.osmId}`);
  if (own) return own;
  for (const member of parseMembers(row.members)) {
    const city = cityByKey.get(`${member.type}/${member.ref}`);
    if (city) return city;
  }
  return null;
};

const LIST_SQL: Record<ClimbingListType, string> = {
  rock: `type = 'area' AND "osmType" = 'relation'`,
  ferrata: `type = 'ferrata' AND "nameRaw" IS NOT NULL AND "nameRaw" != ''`,
  gym: `type = 'gym' AND "nameRaw" IS NOT NULL AND "nameRaw" != ''`,
};

export const getClimbingAreas = (
  listType: ClimbingListType = 'rock',
): ClimbingArea[] => {
  const type = isClimbingListType(listType) ? listType : 'rock';
  const rows = getDb()
    .prepare<[], Row>(
      `SELECT "osmType", "osmId", COALESCE("name", "nameRaw") AS name, members,
        tags, "countryCode", "routeCount", "routesWithPhoto", "lon", "lat"
       FROM climbing_features
       WHERE ${LIST_SQL[type]}
       ORDER BY "countryCode" IS NULL, "countryCode", name COLLATE NOCASE`,
    )
    .all();

  const listRows = type === 'rock' ? rows : omitRelationMembers(rows);
  const ferrataScales =
    type === 'ferrata' ? collectFerrataScales(rows) : undefined;
  const gymCities = type === 'gym' ? collectCities(rows) : undefined;

  return listRows.map((row) => ({
    osmType: row.osmType,
    osmId: row.osmId,
    name: row.name,
    countryCode: row.countryCode,
    cragCount: membersLength(row.members),
    routeCount: row.routeCount ?? 0,
    routesWithPhoto: row.routesWithPhoto ?? 0,
    lon: row.lon,
    lat: row.lat,
    viaFerrataScale: ferrataScales
      ? resolveFerrataScale(row, ferrataScales)
      : undefined,
    city: gymCities ? resolveCity(row, gymCities) : undefined,
  }));
};
