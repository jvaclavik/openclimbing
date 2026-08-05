import { ClimbingStatsResponse } from '../../types';
import { getDb } from '../db/db';
import { ClimbingStatsRow } from '../db/types';

type AreaAggregate = {
  areasCount: number;
  routesWithPhotoCount: number;
  countriesCount: number;
};

// climbing_tiles_stats is written by /refresh and knows nothing about areas,
// so these are aggregated live – cheap scans over a few thousand rows.
const getAreaAggregate = (): AreaAggregate => {
  const db = getDb();
  const areas = db
    .prepare<[], Pick<AreaAggregate, 'areasCount' | 'countriesCount'>>(
      `SELECT COUNT(*) AS "areasCount",
          COUNT(DISTINCT "countryCode") AS "countriesCount"
       FROM climbing_features
       WHERE type = 'area' AND "osmType" = 'relation'`,
    )
    .get();

  // Sum crags (not areas): each route typically sits in one crag. Summing areas
  // double-counted nested/overlapping areas (parent + child both include the
  // same drawn routes).
  const photos = db
    .prepare<[], Pick<AreaAggregate, 'routesWithPhotoCount'>>(
      `SELECT COALESCE(SUM("routesWithPhoto"), 0) AS "routesWithPhotoCount"
       FROM climbing_features
       WHERE type = 'crag'`,
    )
    .get();

  return { ...areas, ...photos };
};

export const getClimbingStats = (): ClimbingStatsResponse => {
  const row = getDb()
    .prepare<
      [],
      ClimbingStatsRow
    >(`SELECT * FROM climbing_tiles_stats ORDER BY id DESC LIMIT 1`)
    .get();

  if (!row) {
    throw new Error(
      'No row found in climbing_tiles_stats, you should run /refresh',
    );
  }

  const {
    timestamp,
    osm_data_timestamp,
    groups_count,
    groups_with_name_count,
    routes_count,
    build_log, // only in db
    ...devStats
  } = row;

  return {
    lastRefresh: timestamp,
    osmDataTimestamp: osm_data_timestamp,
    devStats,
    groupsCount: groups_count,
    groupsWithNameCount: groups_with_name_count,
    routesCount: routes_count,
    ...getAreaAggregate(),
  };
};
