import BetterSqlite3, { type Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import { getClimbingTile } from '../getClimbingTile';

// getDb() is replaced by an in-memory SQLite DB seeded below (see buildDummyDb).
// The var must be prefixed `mock` so jest allows the factory to reference it.
let mockDb: Database;
jest.mock('../../db/db', () => ({ getDb: () => mockDb }));

type SeedRow = {
  type: string;
  osmType: 'node' | 'way' | 'relation';
  osmId: number;
  nameRaw: string | null;
};

const NAMED_FERRATA: SeedRow = {
  type: 'ferrata',
  osmType: 'way',
  osmId: 1,
  nameRaw: 'Klettersteig',
};
const UNNAMED_FERRATA: SeedRow = {
  type: 'ferrata',
  osmType: 'way',
  osmId: 2,
  nameRaw: null,
};
const EMPTY_NAME_FERRATA: SeedRow = {
  type: 'ferrata',
  osmType: 'way',
  osmId: 3,
  nameRaw: '',
};
const UNNAMED_CRAG: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 4,
  nameRaw: null,
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
      (type, lon, lat, "osmType", "osmId", "nameRaw", "hasImages")
    VALUES
      (@type, 14, 50, @osmType, @osmId, @nameRaw, 0)
  `);
  for (const r of rows) {
    insert.run({
      type: r.type,
      osmType: r.osmType,
      osmId: r.osmId,
      nameRaw: r.nameRaw,
    });
  }
  return db;
};

const ferrataIdsInTile = (z: number, x: number, y: number) => {
  const geojson = JSON.parse(getClimbingTile({ z, x, y }));
  return geojson.features
    .filter((f: any) => f.properties.type === 'ferrata')
    .map((f: any) => Math.floor(f.id / 10))
    .sort();
};

describe('getClimbingTile ferrata names', () => {
  beforeEach(() => {
    mockDb = buildDummyDb([
      NAMED_FERRATA,
      UNNAMED_FERRATA,
      EMPTY_NAME_FERRATA,
      UNNAMED_CRAG,
    ]);
  });

  afterEach(() => {
    mockDb.close();
  });

  it.each([
    [0, 0, 0],
    [6, 34, 21],
    [9, 275, 173],
  ])('skips unnamed ferratas in zoom %i', (z, x, y) => {
    expect(ferrataIdsInTile(z, x, y)).toEqual([1]);
  });

  it('keeps unnamed ferratas in zoom 12', () => {
    expect(ferrataIdsInTile(12, 2207, 1389)).toEqual([1, 2, 3]);
  });
});
