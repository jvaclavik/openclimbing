import { ClimbingStatsResponse } from '../../types';
import { getDb } from '../db/db';
import { ClimbingStatsRow } from '../db/types';
import { OsmType } from '../../services/types';
import { omitRelationMembers } from './getClimbingAreas';

type FeatureAggregate = {
  areasCount: number;
  countriesCount: number;
  routesWithPhotoCount: number;
  ferratasCount: number;
  ferratasCountriesCount: number;
  gymsCount: number;
  gymsCountriesCount: number;
};

type NamedPoiRow = {
  osmType: OsmType;
  osmId: number;
  members: string | null;
  countryCode: string | null;
};

const NAMED = `"nameRaw" IS NOT NULL AND "nameRaw" != ''`;

const getListablePoiAggregate = (type: 'ferrata' | 'gym') => {
  const rows = getDb()
    .prepare<[string], NamedPoiRow>(
      `SELECT "osmType", "osmId", members, "countryCode"
       FROM climbing_features
       WHERE type = ? AND ${NAMED}`,
    )
    .all(type);
  const listable = omitRelationMembers(rows);
  return {
    count: listable.length,
    countriesCount: new Set(
      listable.map((row) => row.countryCode).filter(Boolean),
    ).size,
  };
};

// climbing_tiles_stats is written by /refresh and knows nothing about areas,
// so these are aggregated live – one pass over climbing_features.
const getFeatureAggregate = (): FeatureAggregate => {
  const row = getDb()
    .prepare<
      [],
      Pick<
        FeatureAggregate,
        'areasCount' | 'countriesCount' | 'routesWithPhotoCount'
      >
    >(
      `SELECT
          COALESCE(SUM(CASE WHEN type = 'area' AND "osmType" = 'relation' THEN 1 ELSE 0 END), 0) AS "areasCount",
          COUNT(DISTINCT CASE WHEN type = 'area' AND "osmType" = 'relation' THEN "countryCode" END) AS "countriesCount",
          COALESCE(SUM(CASE WHEN type = 'crag' THEN "routesWithPhoto" ELSE 0 END), 0) AS "routesWithPhotoCount"
       FROM climbing_features`,
    )
    .get();

  const ferratas = getListablePoiAggregate('ferrata');
  const gyms = getListablePoiAggregate('gym');

  return {
    areasCount: 0,
    countriesCount: 0,
    routesWithPhotoCount: 0,
    ...row,
    ferratasCount: ferratas.count,
    ferratasCountriesCount: ferratas.countriesCount,
    gymsCount: gyms.count,
    gymsCountriesCount: gyms.countriesCount,
  };
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
