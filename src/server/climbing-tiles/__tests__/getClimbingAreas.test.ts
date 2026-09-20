import BetterSqlite3, { type Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import { getClimbingAreas } from '../getClimbingAreas';

let mockDb: Database;
jest.mock('../../db/db', () => ({ getDb: () => mockDb }));

type SeedRow = {
  type: string;
  osmType: 'node' | 'way' | 'relation';
  osmId: number;
  lon: number;
  lat: number;
  nameRaw?: string | null;
  members?: unknown[] | null;
  countryCode?: string | null;
  routeCount?: number;
};

const AREA: SeedRow = {
  type: 'area',
  osmType: 'relation',
  osmId: 1,
  lon: 14,
  lat: 50,
  nameRaw: 'Adrspach',
  members: [{ ref: 10 }, { ref: 11 }],
  countryCode: 'cz',
  routeCount: 12,
};
const FERRATA: SeedRow = {
  type: 'ferrata',
  osmType: 'way',
  osmId: 2,
  lon: 11,
  lat: 47,
  nameRaw: 'Nordwandsteig',
  countryCode: 'at',
};
const UNNAMED_FERRATA: SeedRow = {
  type: 'ferrata',
  osmType: 'way',
  osmId: 3,
  lon: 11,
  lat: 47,
  nameRaw: null,
  countryCode: 'at',
};
const GYM: SeedRow = {
  type: 'gym',
  osmType: 'node',
  osmId: 4,
  lon: 14,
  lat: 50,
  nameRaw: 'Lezecká stěna',
  countryCode: 'cz',
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
      (type, lon, lat, "osmType", "osmId", "nameRaw", members, "countryCode", "routeCount")
    VALUES
      (@type, @lon, @lat, @osmType, @osmId, @nameRaw, @members, @countryCode, @routeCount)
  `);
  for (const r of rows) {
    insert.run({
      type: r.type,
      lon: r.lon,
      lat: r.lat,
      osmType: r.osmType,
      osmId: r.osmId,
      nameRaw: r.nameRaw ?? null,
      members: r.members ? JSON.stringify(r.members) : null,
      countryCode: r.countryCode ?? null,
      routeCount: r.routeCount ?? null,
    });
  }
  return db;
};

describe('getClimbingAreas', () => {
  beforeEach(() => {
    mockDb = buildDummyDb([AREA, FERRATA, UNNAMED_FERRATA, GYM]);
  });

  afterEach(() => {
    mockDb?.close();
  });

  it('returns rock areas by default', () => {
    const rows = getClimbingAreas();
    expect(rows).toEqual([
      expect.objectContaining({
        osmId: 1,
        name: 'Adrspach',
        cragCount: 2,
        routeCount: 12,
      }),
    ]);
  });

  it('returns named ferratas only', () => {
    const rows = getClimbingAreas('ferrata');
    expect(rows.map((row) => row.osmId)).toEqual([2]);
    expect(rows[0].name).toBe('Nordwandsteig');
  });

  it('returns named gyms', () => {
    const rows = getClimbingAreas('gym');
    expect(rows.map((row) => row.osmId)).toEqual([4]);
  });
});
