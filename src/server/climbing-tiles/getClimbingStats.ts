import { ClimbingStatsResponse } from '../../types';
import { getDb } from '../db/db';
import { ClimbingStatsRow } from '../db/types';

type FeatureAggregate = {
  areasCount: number;
  countriesCount: number;
  routesWithPhotoCount: number;
  ferratasCount: number;
  ferratasCountriesCount: number;
  gymsCount: number;
  gymsCountriesCount: number;
};

const NAMED = `"nameRaw" IS NOT NULL AND "nameRaw" != ''`;

// climbing_tiles_stats is written by /refresh and knows nothing about areas,
// so these are aggregated live – one pass over climbing_features.
const getFeatureAggregate = (): FeatureAggregate => {
  const row = getDb()
    .prepare<[], FeatureAggregate>(
      `SELECT
          COALESCE(SUM(CASE WHEN type = 'area' AND "osmType" = 'relation' THEN 1 ELSE 0 END), 0) AS "areasCount",
          COUNT(DISTINCT CASE WHEN type = 'area' AND "osmType" = 'relation' THEN "countryCode" END) AS "countriesCount",
          COALESCE(SUM(CASE WHEN type = 'crag' THEN "routesWithPhoto" ELSE 0 END), 0) AS "routesWithPhotoCount",
          COALESCE(SUM(CASE WHEN type = 'ferrata' AND ${NAMED} THEN 1 ELSE 0 END), 0) AS "ferratasCount",
          COUNT(DISTINCT CASE WHEN type = 'ferrata' AND ${NAMED} THEN "countryCode" END) AS "ferratasCountriesCount",
          COALESCE(SUM(CASE WHEN type = 'gym' AND ${NAMED} THEN 1 ELSE 0 END), 0) AS "gymsCount",
          COUNT(DISTINCT CASE WHEN type = 'gym' AND ${NAMED} THEN "countryCode" END) AS "gymsCountriesCount"
       FROM climbing_features`,
    )
    .get();

  return (
    row ?? {
      areasCount: 0,
      countriesCount: 0,
      routesWithPhotoCount: 0,
      ferratasCount: 0,
      ferratasCountriesCount: 0,
      gymsCount: 0,
      gymsCountriesCount: 0,
    }
  );
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
    ...getFeatureAggregate(),
  };
};
