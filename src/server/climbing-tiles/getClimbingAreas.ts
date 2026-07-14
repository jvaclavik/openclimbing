import { getDb } from '../db/db';
import { OsmType } from '../../services/types';

export type ClimbingArea = {
  osmType: OsmType;
  osmId: number;
  name: string | null;
  countryCode: string | null; // ISO 3166-1 lowercase, resolved during refresh
  cragCount: number;
  routeCount: number;
  routesWithPhoto: number;
};

type Row = {
  osmType: OsmType;
  osmId: number;
  name: string | null;
  members: string | null;
  countryCode: string | null;
  routeCount: number | null;
  routesWithPhoto: number | null;
};

export const getClimbingAreas = (): ClimbingArea[] => {
  const rows = getDb()
    .prepare<[], Row>(
      `SELECT "osmType", "osmId", COALESCE("name", "nameRaw") AS name, members,
        "countryCode", "routeCount", "routesWithPhoto"
       FROM climbing_features
       WHERE type = 'area' AND "osmType" = 'relation'
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
  }));
};
