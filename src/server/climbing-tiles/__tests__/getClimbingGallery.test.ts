import BetterSqlite3, { type Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import { getClimbingGallery } from '../getClimbingGallery';

// getDb() is replaced by an in-memory SQLite DB seeded below (see buildDummyDb).
// The var must be prefixed `mock` so jest allows the factory to reference it.
let mockDb: Database;
jest.mock('../../db/db', () => ({ getDb: () => mockDb }));

// Photo ratios come from Commons; the tests only care about the aggregation.
jest.mock('../getCommonsImageRatios', () => ({
  getCommonsImageRatios: async () => () => 1.5,
}));

type SeedRow = {
  type: string;
  osmType: 'node' | 'way' | 'relation';
  osmId: number;
  lon: number;
  lat: number;
  nameRaw?: string;
  parentId?: number;
  routeCount?: number;
  routesWithPhoto?: number;
  countryCode?: string;
  tags?: Record<string, string>;
};

// area (rel 1) -> crag (rel 2) -> routes, plus a standalone crag (rel 5)
const AREA: SeedRow = {
  type: 'area',
  osmType: 'relation',
  osmId: 1,
  lon: 14,
  lat: 50,
  nameRaw: 'Adrspach',
  routeCount: 30,
  routesWithPhoto: 3,
  countryCode: 'cz',
};
const CRAG: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 2,
  lon: 14,
  lat: 50,
  nameRaw: 'Sluncni stena',
  parentId: 1,
};
const route = (osmId: number, tags: Record<string, string>): SeedRow => ({
  type: 'route',
  osmType: 'node',
  osmId,
  lon: 14,
  lat: 50,
  parentId: 2,
  tags,
});
const POPULAR = 'File:Popular.jpg';
const OTHER = 'File:Other.jpg';

const LONELY_CRAG: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 5,
  lon: 20,
  lat: 40,
  nameRaw: 'Osamela skala',
  routeCount: 4,
  routesWithPhoto: 1,
};
const LONELY_ROUTE = {
  ...route(6, {
    wikimedia_commons: OTHER,
    'wikimedia_commons:path': '0.1,0.2|0.3,0.4',
  }),
  parentId: 5,
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
      (type, lon, lat, "osmType", "osmId", "nameRaw", "parentId", "routeCount",
       "routesWithPhoto", "countryCode", tags)
    VALUES
      (@type, @lon, @lat, @osmType, @osmId, @nameRaw, @parentId, @routeCount,
       @routesWithPhoto, @countryCode, @tags)
  `);
  for (const r of rows) {
    insert.run({
      type: r.type,
      lon: r.lon,
      lat: r.lat,
      osmType: r.osmType,
      osmId: r.osmId,
      nameRaw: r.nameRaw ?? null,
      parentId: r.parentId ?? null,
      routeCount: r.routeCount ?? null,
      routesWithPhoto: r.routesWithPhoto ?? null,
      countryCode: r.countryCode ?? null,
      tags: r.tags ? JSON.stringify(r.tags) : null,
    });
  }
  return db;
};

describe('getClimbingGallery', () => {
  beforeEach(() => {
    delete (global as { climbingGallery?: unknown }).climbingGallery;
    mockDb = buildDummyDb([
      AREA,
      CRAG,
      route(10, {
        wikimedia_commons: POPULAR,
        'wikimedia_commons:path': '0.1,0.2|0.3,0.4',
      }),
      route(11, {
        wikimedia_commons: POPULAR,
        'wikimedia_commons:path': '0.5,0.6|0.7,0.8',
      }),
      route(12, {
        wikimedia_commons: OTHER,
        'wikimedia_commons:path': '0.5,0.6',
        'wikimedia_commons:2': POPULAR,
        'wikimedia_commons:2:path': '0.2,0.3',
      }),
      route(13, { wikimedia_commons: OTHER, 'wikimedia_commons:path': '  ' }),
      LONELY_CRAG,
      LONELY_ROUTE,
    ]);
  });

  afterEach(() => {
    mockDb.close();
  });

  it('picks the photo with the most routes drawn on it', async () => {
    const [area] = await getClimbingGallery();

    expect(area.osmId).toBe(1);
    expect(area.name).toBe('Adrspach');
    expect(area.photo).toBe(POPULAR);
    expect(area.routesOnPhoto).toBe(3);
    expect(area.routeCount).toBe(30);
  });

  it('ignores empty path tags', async () => {
    const [area] = await getClimbingGallery();

    // OTHER is drawn only by route 12, route 13 has a blank path
    expect(area.routesOnPhoto).toBeGreaterThan(1);
  });

  it('falls back to a crag when there is no area above it', async () => {
    const items = await getClimbingGallery();
    const lonely = items.find((item) => item.osmId === 5);

    expect(lonely?.name).toBe('Osamela skala');
    expect(lonely?.photo).toBe(OTHER);
  });

  it('sorts by the number of drawn routes', async () => {
    const items = await getClimbingGallery();

    expect(items.map((item) => item.osmId)).toEqual([1, 5]);
  });

  it('attaches the photo aspect ratio', async () => {
    const [area] = await getClimbingGallery();

    expect(area.photoRatio).toBe(1.5);
  });
});
