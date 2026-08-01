import { ClimbingStatsResponse } from '../../types';
import { getDb } from '../db/db';
import { ClimbingStatsRow } from '../db/types';

type AreaAggregate = {
  areasCount: number;
  routesWithPhotoCount: number;
  countriesCount: number;
};

// climbing_tiles_stats is written by /refresh and knows nothing about areas,
// so these are aggregated live - it is a single indexed scan over ~700 rows
const getAreaAggregate = (): AreaAggregate =>
  getDb()
    .prepare<[], AreaAggregate>(
      `SELECT COUNT(*) AS "areasCount",
          COALESCE(SUM("routesWithPhoto"), 0) AS "routesWithPhotoCount",
          COUNT(DISTINCT "countryCode") AS "countriesCount"
       FROM climbing_features
       WHERE type = 'area' AND "osmType" = 'relation'`,
    )
    .get();

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
