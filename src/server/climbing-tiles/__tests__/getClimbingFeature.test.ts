import BetterSqlite3, { type Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import {
  ClimbingFeatureNotFoundError,
  getClimbingFeature,
  parseFeatureId,
} from '../getClimbingFeature';

// getDb() is replaced by an in-memory SQLite DB seeded below (see buildDummyDb).
// The var must be prefixed `mock` so jest allows the factory to reference it.
let mockDb: Database;
jest.mock('../../db/db', () => ({ getDb: () => mockDb }));

// resolveCountryCode() bundles a large offline dataset - stub it for a fast,
// deterministic test.
jest.mock('../../../services/osm/getCountryCode', () => ({
  getCountryCode: jest.fn().mockResolvedValue('cz'),
}));

type SeedRow = {
  type: string;
  osmType: 'node' | 'way' | 'relation';
  osmId: number;
  lon: number;
  lat: number;
  nameRaw: string;
  parentId?: number;
  line?: [number, number][];
  tags: Record<string, string>;
  members?: { type: string; ref: number; role: string }[];
};

// Minimal but realistic climbing tree:
//   area (relation) -> crag (relation) -> route (node) + route (way)
const AREA: SeedRow = {
  type: 'area',
  osmType: 'relation',
  osmId: 100,
  lon: 14,
  lat: 50,
  nameRaw: 'Test Area',
  tags: {
    climbing: 'area',
    name: 'Test Area',
    sport: 'climbing',
    type: 'site',
  },
  members: [{ type: 'relation', ref: 200, role: '' }],
};

const CRAG: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 200,
  lon: 14.01,
  lat: 50.01,
  nameRaw: 'Test Crag',
  parentId: 100,
  tags: {
    climbing: 'crag',
    name: 'Test Crag',
    sport: 'climbing',
    type: 'site',
  },
  members: [
    { type: 'node', ref: 300, role: '' },
    { type: 'way', ref: 400, role: '' },
  ],
};

const ROUTE_NODE: SeedRow = {
  type: 'route',
  osmType: 'node',
  osmId: 300,
  lon: 14.011,
  lat: 50.011,
  nameRaw: 'Node Route',
  parentId: 200,
  tags: {
    sport: 'climbing',
    climbing: 'route_bottom',
    name: 'Node Route',
    'climbing:grade:uiaa': '5',
  },
};

const ROUTE_WAY: SeedRow = {
  type: 'route',
  osmType: 'way',
  osmId: 400,
  lon: 14.02,
  lat: 50.02,
  nameRaw: 'Way Route',
  parentId: 200,
  line: [
    [14.02, 50.02],
    [14.021, 50.021],
  ],
  tags: { sport: 'climbing', climbing: 'route', name: 'Way Route' },
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
      (type, lon, lat, "osmType", "osmId", "nameRaw", "parentId", line, tags, members)
    VALUES
      (@type, @lon, @lat, @osmType, @osmId, @nameRaw, @parentId, @line, @tags, @members)
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
      line: r.line ? JSON.stringify(r.line) : null,
      tags: JSON.stringify(r.tags),
      members: r.members ? JSON.stringify(r.members) : null,
    });
  }
  return db;
};

describe('getClimbingFeature (dummy SQLite DB)', () => {
  beforeEach(() => {
    mockDb = buildDummyDb([AREA, CRAG, ROUTE_NODE, ROUTE_WAY]);
  });

  afterEach(() => {
    mockDb.close();
  });

  it('resolves a crag relation with member tree and parent chain', async () => {
    const crag = await getClimbingFeature('relation', 200);

    expect(crag.osmMeta).toEqual({ type: 'relation', id: 200 });
    expect(crag.tags.name).toBe('Test Crag');
    expect(crag.center).toEqual([14.01, 50.01]);
    expect(crag.countryCode).toBe('cz');

    // members resolved from DB (node + way)
    const memberIds = crag.memberFeatures?.map((m) => m.osmMeta);
    expect(memberIds).toEqual([
      { type: 'node', id: 300 },
      { type: 'way', id: 400 },
    ]);

    // geometry per member type
    const node = crag.memberFeatures?.find((m) => m.osmMeta.type === 'node');
    const way = crag.memberFeatures?.find((m) => m.osmMeta.type === 'way');
    expect(node?.geometry).toEqual({
      type: 'Point',
      coordinates: [14.011, 50.011],
    });
    expect(way?.geometry?.type).toBe('LineString');

    // parent chain (crag -> area)
    expect(crag.parentFeatures?.map((p) => p.osmMeta)).toEqual([
      { type: 'relation', id: 100 },
    ]);
  });

  it('walks the full parentId chain for a route node (crag -> area)', async () => {
    const route = await getClimbingFeature('node', 300);

    expect(route.osmMeta).toEqual({ type: 'node', id: 300 });
    expect(route.memberFeatures).toEqual([]);
    expect(route.parentFeatures?.map((p) => p.osmMeta)).toEqual([
      { type: 'relation', id: 200 },
      { type: 'relation', id: 100 },
    ]);
  });

  it('builds a LineString geometry for a way route from `line`', async () => {
    const way = await getClimbingFeature('way', 400);
    expect(way.geometry).toEqual({
      type: 'LineString',
      coordinates: [
        [14.02, 50.02],
        [14.021, 50.021],
      ],
    });
  });

  it('returns only class/subclass in properties (tile props computed on FE)', async () => {
    const crag = await getClimbingFeature('relation', 200);

    // reduced payload: no routeCount / histogram / gradeTxt / materials ...
    expect(Object.keys(crag.properties).sort()).toEqual(['class', 'subclass']);
    expect(crag.properties.class).toBeTruthy();
    expect(crag.properties).not.toHaveProperty('histogram');
    expect(crag.properties).not.toHaveProperty('routeCount');
  });

  it('throws ClimbingFeatureNotFoundError for a feature missing from the DB', async () => {
    await expect(getClimbingFeature('node', 999999)).rejects.toBeInstanceOf(
      ClimbingFeatureNotFoundError,
    );
  });
});

describe('parseFeatureId', () => {
  it('parses OSM url id, short id and mapId', () => {
    expect(parseFeatureId('way/123')).toEqual({ type: 'way', id: 123 });
    expect(parseFeatureId('n5')).toEqual({ type: 'node', id: 5 });
    // mapId: last digit encodes the type (0=node, 1=way, 4=relation)
    expect(parseFeatureId('2004')).toEqual({ type: 'relation', id: 200 });
  });
});
