import BetterSqlite3, { type Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import { getClimbingNearby } from '../getClimbingNearby';

let mockDb: Database;
jest.mock('../../db/db', () => ({ getDb: () => mockDb }));

type SeedRow = {
  type: string;
  osmType: 'node' | 'way' | 'relation';
  osmId: number;
  lon: number;
  lat: number;
  nameRaw: string;
  parentId?: number;
  routeCount?: number;
};

const ORIGIN = { lon: 16.12, lat: 50.62 };

const AREA: SeedRow = {
  type: 'area',
  osmType: 'relation',
  osmId: 1,
  ...ORIGIN,
  nameRaw: 'Adrspach',
};

const ORPHAN_NEAR: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 2,
  lon: ORIGIN.lon,
  lat: ORIGIN.lat + 0.005,
  nameRaw: 'Osamela skala',
};

const CHILD_OF_AREA: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 3,
  lon: ORIGIN.lon + 0.003,
  lat: ORIGIN.lat,
  nameRaw: 'Uz clenem',
  parentId: 1,
};

const PARENTED_NEAR: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 4,
  lon: ORIGIN.lon,
  lat: ORIGIN.lat + 0.002,
  nameRaw: 'Cizi sektor',
  parentId: 99,
};

const FAR_CRAG: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 5,
  lon: ORIGIN.lon + 1,
  lat: ORIGIN.lat,
  nameRaw: 'Daleko',
};

const NEAR_AREA: SeedRow = {
  type: 'area',
  osmType: 'relation',
  osmId: 10,
  lon: ORIGIN.lon + 0.01,
  lat: ORIGIN.lat,
  nameRaw: 'Sousedni oblast',
};

const OTHER_AREA: SeedRow = {
  type: 'area',
  osmType: 'relation',
  osmId: 99,
  lon: ORIGIN.lon + 0.02,
  lat: ORIGIN.lat,
  nameRaw: 'Jina oblast',
};

const CRAG_FOR_PARENTS: SeedRow = {
  type: 'crag',
  osmType: 'node',
  osmId: 20,
  ...ORIGIN,
  nameRaw: 'Sektor bez oblasti',
};

const buildDummyDb = (rows: SeedRow[]): Database => {
  const db = new BetterSqlite3(':memory:');
  const schema = readFileSync(
    path.resolve(__dirname, '../../db/schema.sql'),
    'utf8',
  );
  db.exec(schema);

  const insert = db.prepare(`
    INSERT INTO climbing_features
      (type, lon, lat, "osmType", "osmId", "nameRaw", "parentId", "routeCount")
    VALUES
      (@type, @lon, @lat, @osmType, @osmId, @nameRaw, @parentId, @routeCount)
  `);
  for (const r of rows) {
    insert.run({
      type: r.type,
      lon: r.lon,
      lat: r.lat,
      osmType: r.osmType,
      osmId: r.osmId,
      nameRaw: r.nameRaw,
      parentId: r.parentId ?? null,
      routeCount: r.routeCount ?? null,
    });
  }
  return db;
};

describe('getClimbingNearby', () => {
  beforeEach(() => {
    mockDb = buildDummyDb([
      AREA,
      ORPHAN_NEAR,
      CHILD_OF_AREA,
      PARENTED_NEAR,
      FAR_CRAG,
      NEAR_AREA,
      OTHER_AREA,
      CRAG_FOR_PARENTS,
    ]);
  });

  afterEach(() => {
    mockDb.close();
  });

  it('suggests nearby crags, orphans first, skipping members of this area', () => {
    const results = getClimbingNearby({
      type: 'crag',
      lon: ORIGIN.lon,
      lat: ORIGIN.lat,
      excludeOsmType: 'relation',
      excludeOsmId: 1,
    });

    expect(results.map((r) => r.osmId)).toEqual([20, 2, 4]);
    expect(results.find((r) => r.osmId === 2)?.name).toBe('Osamela skala');
    expect(results.find((r) => r.osmId === 4)?.parentName).toBe('Jina oblast');
    expect(results.map((r) => r.osmId)).not.toContain(3);
    expect(results.map((r) => r.osmId)).not.toContain(5);
  });

  it('looks up the origin from osm id when lon/lat are missing', () => {
    const results = getClimbingNearby({
      type: 'area',
      excludeOsmType: 'node',
      excludeOsmId: 20,
    });

    expect(results.map((r) => r.osmId)).toEqual(
      expect.arrayContaining([1, 10, 99]),
    );
    expect(results.map((r) => r.osmId)).not.toContain(20);
  });

  it('returns nothing without a usable origin', () => {
    expect(getClimbingNearby({ type: 'crag' })).toEqual([]);
  });
});
