import { getDb } from '../db/db';
import { ClimbingFeaturesRow } from '../db/types';

const QUERY = `
    SELECT feature
    FROM climbing_features
    WHERE "osmType" = @osmType AND "osmId" = @osmId
    LIMIT 1`;

export const getClimbingFeature = (
  osmType: string,
  osmId: number,
): string | null => {
  const row = getDb()
    .prepare(QUERY)
    .get({ osmType, osmId }) as Pick<ClimbingFeaturesRow, 'feature'> | undefined;

  return row?.feature ?? null;
};
