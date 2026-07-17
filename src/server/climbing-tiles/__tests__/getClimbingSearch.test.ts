import BetterSqlite3, { type Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import { getClimbingSearch } from '../getClimbingSearch';

// getDb() is replaced by an in-memory SQLite DB seeded below (see buildDummyDb).
// The var must be prefixed `mock` so jest allows the factory to reference it.
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
};

// A deep chain: country (rel) -> area (rel) -> subarea (rel) -> crag (rel) -> route (node)
// so the route has 4 relation ancestors (exactly MAX_PARENT_DEPTH).
const ROOT: SeedRow = {
  type: 'area',
  osmType: 'relation',
  osmId: 1,
  lon: 14,
  lat: 50,
  nameRaw: 'Cesko',
};
const AREA: SeedRow = {
  type: 'area',
  osmType: 'relation',
  osmId: 2,
  lon: 14,
  lat: 50,
  nameRaw: 'Adrspach',
  parentId: 1,
};
const SUBAREA: SeedRow = {
  type: 'area',
  osmType: 'relation',
  osmId: 3,
  lon: 14,
  lat: 50,
  nameRaw: 'Skalni mesto',
  parentId: 2,
};
const CRAG: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 4,
  lon: 14,
  lat: 50,
  nameRaw: 'Sluncni stena',
  parentId: 3,
};
const ROUTE: SeedRow = {
  type: 'route',
  osmType: 'node',
  osmId: 5,
  lon: 14,
  lat: 50,
  nameRaw: 'Direttissima',
  parentId: 4,
};
// standalone crag without a parent
const LONELY: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 6,
  lon: 14,
  lat: 50,
  nameRaw: 'Osamela skala',
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
      (type, lon, lat, "osmType", "osmId", "nameRaw", "parentId")
    VALUES
      (@type, @lon, @lat, @osmType, @osmId, @nameRaw, @parentId)
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
    });
  }
  return db;
};

describe('getClimbingSearch parent chain', () => {
  beforeEach(() => {
    mockDb = buildDummyDb([ROOT, AREA, SUBAREA, CRAG, ROUTE, LONELY]);
  });

  afterEach(() => {
    mockDb.close();
  });

  it('attaches the parentId chain (nearest first) capped at 4 hops', () => {
    const [route] = getClimbingSearch('Direttissima', 14, 50);

    expect(route.osmId).toBe(5);
    expect(route.parents).toEqual([
      { name: 'Sluncni stena', osmType: 'relation', osmId: 4 },
      { name: 'Skalni mesto', osmType: 'relation', osmId: 3 },
      { name: 'Adrspach', osmType: 'relation', osmId: 2 },
      { name: 'Cesko', osmType: 'relation', osmId: 1 },
    ]);
  });

  it('omits parents for a feature without a parent and never leaks parentId', () => {
    const [lonely] = getClimbingSearch('Osamela', 14, 50);

    expect(lonely.osmId).toBe(6);
    expect(lonely.parents).toBeUndefined();
    expect(lonely).not.toHaveProperty('parentId');
  });
});
