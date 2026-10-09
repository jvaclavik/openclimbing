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
  routeCount?: number;
};

// A deep chain: country (rel) -> area (rel) -> subarea (rel) -> crag (rel) -> route (node)
// so the route has more relation ancestors than we resolve (only parent + grandparent).
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
  routeCount: 12,
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

// All match "Konstein" (#292), each row farther from the map center than the
// previous one - so sorting by distance alone would reverse the expected order.
const addGrowingDistance = (rows: Omit<SeedRow, 'lon' | 'lat'>[]): SeedRow[] =>
  rows.map((row, index) => ({ ...row, lon: 14 + index / 100, lat: 50 }));

const ORDERING_ROWS = addGrowingDistance([
  { type: 'route', osmType: 'node', osmId: 107, nameRaw: 'Konsteinova cesta' },
  {
    type: 'gym',
    osmType: 'way',
    osmId: 105,
    nameRaw: 'Naturfreundehaus Konstein',
  },
  {
    type: 'ferrata',
    osmType: 'way',
    osmId: 106,
    nameRaw: 'Konsteiner Klettersteig',
  },
  {
    type: 'crag',
    osmType: 'relation',
    osmId: 103,
    nameRaw: 'Hintere Konsteiner Wand',
  },
  { type: 'crag', osmType: 'relation', osmId: 104, nameRaw: 'Konsteiner Wand' },
  {
    type: 'area',
    osmType: 'relation',
    osmId: 101,
    nameRaw: 'Konsteiner Gebiet',
  },
  { type: 'area', osmType: 'relation', osmId: 102, nameRaw: 'Konstein' },
]);

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

describe('getClimbingSearch parent chain', () => {
  beforeEach(() => {
    mockDb = buildDummyDb([ROOT, AREA, SUBAREA, CRAG, ROUTE, LONELY]);
  });

  afterEach(() => {
    mockDb.close();
  });

  it('attaches only parent and grandparent (nearest first)', () => {
    const [route] = getClimbingSearch('Direttissima', 14, 50);

    expect(route.osmId).toBe(5);
    expect(route.parents).toEqual([
      { name: 'Sluncni stena', osmType: 'relation', osmId: 4 },
      { name: 'Skalni mesto', osmType: 'relation', osmId: 3 },
    ]);
  });

  it('omits parents for a feature without a parent and never leaks parentId', () => {
    const [lonely] = getClimbingSearch('Osamela', 14, 50);

    expect(lonely.osmId).toBe(6);
    expect(lonely.parents).toBeUndefined();
    expect(lonely).not.toHaveProperty('parentId');
  });

  it('returns routeCount for crags/areas', () => {
    const [crag] = getClimbingSearch('Sluncni', 14, 50);

    expect(crag.osmId).toBe(4);
    expect(crag.routeCount).toBe(12);
  });
});

describe('getClimbingSearch order', () => {
  beforeEach(() => {
    mockDb = buildDummyDb(ORDERING_ROWS);
  });

  afterEach(() => {
    mockDb.close();
  });

  it('sorts areas first, then crags, gyms and ferratas, routes last', () => {
    const records = getClimbingSearch('Konstein', 14, 50);

    expect(records.map((record) => record.type)).toEqual([
      'area',
      'area',
      'crag',
      'crag',
      'gym',
      'ferrata',
      'route',
    ]);
  });

  it('sorts features of the same type by distance', () => {
    const records = getClimbingSearch('Konstein', 14, 50);

    expect(records.map((record) => record.name)).toEqual([
      'Konsteiner Gebiet',
      'Konstein',
      'Hintere Konsteiner Wand',
      'Konsteiner Wand',
      'Naturfreundehaus Konstein',
      'Konsteiner Klettersteig',
      'Konsteinova cesta',
    ]);
  });
});
