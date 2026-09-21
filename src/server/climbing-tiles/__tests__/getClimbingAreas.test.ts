import BetterSqlite3, { type Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import { getClimbingAreas, omitRelationMembers } from '../getClimbingAreas';

let mockDb: Database;
jest.mock('../../db/db', () => ({ getDb: () => mockDb }));

type SeedRow = {
  type: string;
  osmType: 'node' | 'way' | 'relation';
  osmId: number;
  lon: number;
  lat: number;
  nameRaw?: string | null;
  members?: unknown[] | string | null;
  tags?: Record<string, string> | null;
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
  tags: { via_ferrata_scale: '2+' },
  countryCode: 'at',
};
const FERRATA_RELATION: SeedRow = {
  type: 'ferrata',
  osmType: 'relation',
  osmId: 10,
  lon: 11.1,
  lat: 47.1,
  nameRaw: 'Klettersteig',
  members: [
    { type: 'way', ref: 11 },
    { type: 'way', ref: 12 },
  ],
  countryCode: 'at',
};
const FERRATA_RELATION_WAY: SeedRow = {
  type: 'ferrata',
  osmType: 'way',
  osmId: 11,
  lon: 11.1,
  lat: 47.1,
  nameRaw: 'Klettersteig',
  tags: { via_ferrata_scale: '3' },
  countryCode: 'at',
};
const FERRATA_RELATION_WAY_PART: SeedRow = {
  type: 'ferrata',
  osmType: 'way',
  osmId: 12,
  lon: 11.12,
  lat: 47.12,
  nameRaw: 'Klettersteig section 2',
  tags: { via_ferrata_scale: '4' },
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
const BROKEN_FERRATA: SeedRow = {
  type: 'ferrata',
  osmType: 'relation',
  osmId: 30,
  lon: 8,
  lat: 48,
  nameRaw: 'Broken members',
  members: '{not-json',
  countryCode: 'de',
};
const GYM: SeedRow = {
  type: 'gym',
  osmType: 'node',
  osmId: 4,
  lon: 14,
  lat: 50,
  nameRaw: 'Lezecká stěna',
  tags: { 'addr:city': 'Praha' },
  countryCode: 'cz',
};
const GYM_RELATION: SeedRow = {
  type: 'gym',
  osmType: 'relation',
  osmId: 20,
  lon: 16,
  lat: 48,
  nameRaw: 'Boulder Bar',
  members: [{ type: 'way', ref: 21 }],
  countryCode: 'at',
};
const GYM_RELATION_WAY: SeedRow = {
  type: 'gym',
  osmType: 'way',
  osmId: 21,
  lon: 16,
  lat: 48,
  nameRaw: 'Boulder Bar',
  tags: { 'addr:city': 'Wien' },
  countryCode: 'at',
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
      (type, lon, lat, "osmType", "osmId", "nameRaw", members, tags, "countryCode", "routeCount")
    VALUES
      (@type, @lon, @lat, @osmType, @osmId, @nameRaw, @members, @tags, @countryCode, @routeCount)
  `);
  for (const r of rows) {
    insert.run({
      type: r.type,
      lon: r.lon,
      lat: r.lat,
      osmType: r.osmType,
      osmId: r.osmId,
      nameRaw: r.nameRaw ?? null,
      members: Array.isArray(r.members)
        ? JSON.stringify(r.members)
        : (r.members ?? null),
      tags: r.tags ? JSON.stringify(r.tags) : null,
      countryCode: r.countryCode ?? null,
      routeCount: r.routeCount ?? null,
    });
  }
  return db;
};

describe('getClimbingAreas', () => {
  beforeEach(() => {
    mockDb = buildDummyDb([
      AREA,
      FERRATA,
      FERRATA_RELATION,
      FERRATA_RELATION_WAY,
      FERRATA_RELATION_WAY_PART,
      UNNAMED_FERRATA,
      BROKEN_FERRATA,
      GYM,
      GYM_RELATION,
      GYM_RELATION_WAY,
    ]);
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

  it('returns named ferrata relations and standalone ways, not relation members', () => {
    const rows = getClimbingAreas('ferrata');
    expect(
      rows.map((row) => ({
        osmId: row.osmId,
        name: row.name,
        viaFerrataScale: row.viaFerrataScale,
      })),
    ).toEqual([
      { osmId: 10, name: 'Klettersteig', viaFerrataScale: '3–4' },
      { osmId: 2, name: 'Nordwandsteig', viaFerrataScale: '2+' },
      { osmId: 30, name: 'Broken members', viaFerrataScale: null },
    ]);
  });

  it('returns named gym relations and standalone nodes, not relation members', () => {
    const rows = getClimbingAreas('gym');
    expect(
      rows.map((row) => ({ osmId: row.osmId, name: row.name, city: row.city })),
    ).toEqual([
      { osmId: 20, name: 'Boulder Bar', city: 'Wien' },
      { osmId: 4, name: 'Lezecká stěna', city: 'Praha' },
    ]);
  });
});

describe('omitRelationMembers', () => {
  it('keeps rows when members JSON is malformed', () => {
    expect(
      omitRelationMembers([
        { osmType: 'relation', osmId: 1, members: '{not-json' },
        { osmType: 'relation', osmId: 2, members: '{"type":"way"}' },
        { osmType: 'way', osmId: 11, members: null },
      ]).map((row) => row.osmId),
    ).toEqual([1, 2, 11]);
  });
});
