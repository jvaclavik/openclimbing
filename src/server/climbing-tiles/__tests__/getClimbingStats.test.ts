import BetterSqlite3, { type Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import { getClimbingStats } from '../getClimbingStats';

let mockDb: Database;
jest.mock('../../db/db', () => ({ getDb: () => mockDb }));

type SeedRow = {
  type: string;
  osmType: 'node' | 'way' | 'relation';
  osmId: number;
  lon: number;
  lat: number;
  nameRaw?: string | null;
  countryCode?: string | null;
  routesWithPhoto?: number;
  hasImages?: number;
  members?: unknown[] | null;
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
      (type, lon, lat, "osmType", "osmId", "nameRaw", "countryCode",
       "routesWithPhoto", "hasImages", members)
    VALUES
      (@type, @lon, @lat, @osmType, @osmId, @nameRaw, @countryCode,
       @routesWithPhoto, @hasImages, @members)
  `);
  for (const row of rows) {
    insert.run({
      type: row.type,
      lon: row.lon,
      lat: row.lat,
      osmType: row.osmType,
      osmId: row.osmId,
      nameRaw: row.nameRaw ?? null,
      countryCode: row.countryCode ?? null,
      routesWithPhoto: row.routesWithPhoto ?? null,
      hasImages: row.hasImages ?? 0,
      members: row.members ? JSON.stringify(row.members) : null,
    });
  }

  db.prepare(
    `INSERT INTO climbing_tiles_stats
      (timestamp, osm_data_timestamp, build_log, build_duration, max_size,
       max_size_zxy, max_time, max_time_zxy, groups_count,
       groups_with_name_count, routes_count)
     VALUES
      ('2026-01-01', '2026-01-01', '', 0, 0, '', 0, '', 0, 0, 42)`,
  ).run();

  return db;
};

describe('getClimbingStats', () => {
  afterEach(() => {
    mockDb?.close();
  });

  it('counts named ferratas and gyms separately from climbing areas', () => {
    mockDb = buildDummyDb([
      {
        type: 'area',
        osmType: 'relation',
        osmId: 1,
        lon: 14,
        lat: 50,
        nameRaw: 'Adrspach',
        countryCode: 'cz',
      },
      {
        type: 'crag',
        osmType: 'relation',
        osmId: 2,
        lon: 14,
        lat: 50,
        nameRaw: 'Slunecni',
        countryCode: 'cz',
        routesWithPhoto: 5,
      },
      {
        type: 'ferrata',
        osmType: 'relation',
        osmId: 8,
        lon: 11,
        lat: 47,
        nameRaw: 'Nordwandsteig',
        countryCode: 'at',
        members: [
          { type: 'way', ref: 3 },
          { type: 'way', ref: 4 },
        ],
      },
      {
        type: 'ferrata',
        osmType: 'way',
        osmId: 3,
        lon: 11,
        lat: 47,
        nameRaw: 'Nordwandsteig',
        countryCode: 'at',
        hasImages: 1,
      },
      {
        type: 'ferrata',
        osmType: 'way',
        osmId: 4,
        lon: 11,
        lat: 47,
        nameRaw: 'Nordwandsteig section 2',
        countryCode: 'at',
        hasImages: 1,
      },
      {
        type: 'ferrata',
        osmType: 'way',
        osmId: 9,
        lon: 11,
        lat: 47,
        nameRaw: null,
        countryCode: 'at',
        hasImages: 1,
      },
      {
        type: 'ferrata',
        osmType: 'way',
        osmId: 5,
        lon: 12,
        lat: 46,
        nameRaw: 'Brigata Tridentina',
        countryCode: 'it',
      },
      {
        type: 'gym',
        osmType: 'relation',
        osmId: 16,
        lon: 14,
        lat: 50,
        nameRaw: 'Smichoff',
        countryCode: 'cz',
        members: [{ type: 'way', ref: 6 }],
      },
      {
        type: 'gym',
        osmType: 'way',
        osmId: 6,
        lon: 14,
        lat: 50,
        nameRaw: 'Smichoff',
        countryCode: 'cz',
        hasImages: 1,
      },
      {
        type: 'gym',
        osmType: 'node',
        osmId: 7,
        lon: 16,
        lat: 48,
        nameRaw: 'Boulder Bar',
        countryCode: 'at',
      },
    ]);

    const stats = getClimbingStats();

    expect(stats.areasCount).toBe(1);
    expect(stats.countriesCount).toBe(1);
    expect(stats.routesCount).toBe(42);
    expect(stats.routesWithPhotoCount).toBe(5);
    expect(stats.ferratasCount).toBe(2);
    expect(stats.ferratasCountriesCount).toBe(2);
    expect(stats.gymsCount).toBe(2);
    expect(stats.gymsCountriesCount).toBe(2);
  });
});
