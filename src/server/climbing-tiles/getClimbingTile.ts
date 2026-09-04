import { getDb } from '../db/db';
import { tileToBBOX } from './tileToBBOX';
import { Tile } from '../../types';
import { buildTileGeojson } from './buildTileGeojson';
import { BBox } from 'geojson';
import { ClimbingFeaturesRow } from '../db/types';

const getBboxCondition = (bbox: BBox) =>
  `lon >= ${bbox[0]} AND lon <= ${bbox[2]} AND lat >= ${bbox[1]} AND lat <= ${bbox[3]}`;

const logCacheMiss = (duration: number, count: number) =>
  console.log(`climbing_tiles_cache MISS ${duration}ms ${count}`); //eslint-disable-line no-console

const logCacheHit = (start: number) => {
  const duration = Math.round(performance.now() - start);
  console.log(`climbing_tiles_cache HIT ${duration}ms`); //eslint-disable-line no-console
};

const ZOOM_LEVELS = [0, 6, 9, 12]; // the zoom level is fetched, when Map reaches zoom+1, see climbingTilesSource.ts

const NAMED_FERRATA_CONDITION = `(type != 'ferrata' OR ("nameRaw" IS NOT NULL AND "nameRaw" != ''))`;

export const hasFerrataName = (record: ClimbingFeaturesRow) =>
  record.type !== 'ferrata' || !!(record.name || record.nameRaw);

export const getClimbingTile = ({ z, x, y }: Tile): string => {
  const start = performance.now();
  const isOptimizedToGrid = z <= 6;
  const hasRoutes = z == 12;
  const hasUnnamedFerratas = z === 12;
  if (!ZOOM_LEVELS.includes(z)) {
    throw new Error('Zoom level not available');
  }

  const cacheKey = `${z}/${x}/${y}`;
  const cache = getDb()
    .prepare<
      [string],
      { tile_geojson: string }
    >('SELECT tile_geojson FROM climbing_tiles_cache WHERE zxy = ?')
    .get(cacheKey);

  if (cache) {
    logCacheHit(start);
    return cache.tile_geojson;
  }

  const bbox = tileToBBOX({ z, x, y });
  const bboxCondition = getBboxCondition(bbox);
  const conditions = [bboxCondition];
  if (!hasRoutes) {
    conditions.push(`type != 'route' AND type != 'route_top'`);
  }
  if (!hasUnnamedFerratas) {
    conditions.push(NAMED_FERRATA_CONDITION);
  }
  const query = `SELECT * FROM climbing_features WHERE ${conditions.join(' AND ')}`;

  const rows = getDb().prepare<[], ClimbingFeaturesRow>(query).all();
  const geojson = buildTileGeojson(isOptimizedToGrid, rows, bbox);

  const duration = Math.round(performance.now() - start);
  logCacheMiss(duration, geojson.features.length);

  getDb()
    .prepare(
      `INSERT INTO climbing_tiles_cache VALUES (?,?,?,?) ON CONFLICT (zxy) DO NOTHING`,
    )
    .run(cacheKey, JSON.stringify(geojson), duration, geojson.features.length);

  return JSON.stringify(geojson);
};

export const cacheTile000 = (allRecords: ClimbingFeaturesRow[]) => {
  const bbox = tileToBBOX({ z: 0, x: 0, y: 0 });
  const records = allRecords.filter(
    (r) => !r.type.startsWith('route') && hasFerrataName(r),
  );
  const tile000 = buildTileGeojson(true, records, bbox);
  const count = records.length;

  getDb()
    .prepare(`INSERT INTO climbing_tiles_cache VALUES ('0/0/0', ?, -1, ?)`)
    .run(JSON.stringify(tile000), count);
};
