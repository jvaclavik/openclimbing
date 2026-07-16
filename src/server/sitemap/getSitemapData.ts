import { getDb } from '../db/db';
import { OsmType } from '../../services/types';
import { getCommonsImageUrl } from '../../services/images/getCommonsImageUrl';

// Feature types worth indexing (route_top is only a route's top anchor, not a
// standalone page). Only named features are included to avoid thin/empty pages.
const INDEXABLE_TYPES = ['area', 'crag', 'route', 'gym', 'ferrata'] as const;

// Google allows max 50k URLs per sitemap file; we chunk well below that so the
// feature count can keep growing without hitting the limit.
export const SITEMAP_CHUNK_SIZE = 40000;

const TYPES_SQL = INDEXABLE_TYPES.map((t) => `'${t}'`).join(', ');
const INDEXABLE_WHERE = `type IN (${TYPES_SQL}) AND (name IS NOT NULL OR nameRaw IS NOT NULL)`;

export type SitemapFeature = {
  osmType: OsmType;
  osmId: number;
  images: string[];
};

type FeatureRow = {
  osmType: OsmType;
  osmId: number;
  hasImages: number | null;
  tags: string | null;
};

// Max Commons photos per feature exposed in the image sitemap.
const MAX_IMAGES_PER_FEATURE = 5;

const isPhotoTag = ([key, value]: [string, string]) =>
  /^wikimedia_commons(:\d+)?$/.test(key) && value.startsWith('File:');

const extractImageUrls = (tagsJson: string | null): string[] => {
  if (!tagsJson) {
    return [];
  }
  try {
    const tags = JSON.parse(tagsJson) as Record<string, string>;
    return Object.entries(tags)
      .filter(isPhotoTag)
      .slice(0, MAX_IMAGES_PER_FEATURE)
      .map(([, value]) => getCommonsImageUrl(value, 960))
      .filter((url): url is string => !!url);
  } catch {
    return [];
  }
};

export const getIndexableFeatureCount = (): number => {
  const row = getDb()
    .prepare<
      [],
      { c: number }
    >(`SELECT COUNT(*) AS c FROM climbing_features WHERE ${INDEXABLE_WHERE}`)
    .get();
  return row?.c ?? 0;
};

export const getIndexableFeatures = (
  limit: number,
  offset: number,
): SitemapFeature[] =>
  getDb()
    .prepare<[number, number], FeatureRow>(
      `SELECT "osmType", "osmId", "hasImages", tags FROM climbing_features
       WHERE ${INDEXABLE_WHERE}
       ORDER BY id
       LIMIT ? OFFSET ?`,
    )
    .all(limit, offset)
    .map(({ osmType, osmId, hasImages, tags }) => ({
      osmType,
      osmId,
      images: hasImages ? extractImageUrls(tags) : [],
    }));

export const getOsmDataTimestamp = (): string | null => {
  try {
    const row = getDb()
      .prepare<
        [],
        { osm_data_timestamp: string | null }
      >(`SELECT osm_data_timestamp FROM climbing_tiles_stats ORDER BY id DESC LIMIT 1`)
      .get();
    return row?.osm_data_timestamp ?? null;
  } catch {
    return null;
  }
};
