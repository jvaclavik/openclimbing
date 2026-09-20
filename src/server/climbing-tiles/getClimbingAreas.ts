import { getDb } from '../db/db';
import { OsmType } from '../../services/types';
import {
  ClimbingListType,
  isClimbingListType,
} from '../../services/climbing-areas/climbingListTypes';

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
};

type Row = {
  osmType: OsmType;
  osmId: number;
  name: string | null;
  members: string | null;
  countryCode: string | null;
  routeCount: number | null;
  routesWithPhoto: number | null;
  lon: number;
  lat: number;
};

const LIST_SQL: Record<ClimbingListType, string> = {
  rock: `type = 'area' AND "osmType" = 'relation'`,
  ferrata: `type = 'ferrata' AND "nameRaw" IS NOT NULL AND "nameRaw" != ''`,
  gym: `type = 'gym' AND "nameRaw" IS NOT NULL AND "nameRaw" != ''`,
};

export const getClimbingAreas = (
  listType: ClimbingListType = 'rock',
): ClimbingArea[] => {
  const where = LIST_SQL[isClimbingListType(listType) ? listType : 'rock'];
  const rows = getDb()
    .prepare<[], Row>(
      `SELECT "osmType", "osmId", COALESCE("name", "nameRaw") AS name, members,
        "countryCode", "routeCount", "routesWithPhoto", "lon", "lat"
       FROM climbing_features
       WHERE ${where}
       ORDER BY "countryCode" IS NULL, "countryCode", name COLLATE NOCASE`,
    )
    .all();

  return rows.map((row) => ({
    osmType: row.osmType,
    osmId: row.osmId,
    name: row.name,
    countryCode: row.countryCode,
    cragCount: row.members ? (JSON.parse(row.members) as unknown[]).length : 0,
    routeCount: row.routeCount ?? 0,
    routesWithPhoto: row.routesWithPhoto ?? 0,
    lon: row.lon,
    lat: row.lat,
  }));
};
