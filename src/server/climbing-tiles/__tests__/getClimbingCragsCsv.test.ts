import BetterSqlite3, { type Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import {
  getClimbingCragsCsv,
  parseCountriesParam,
} from '../getClimbingCragsCsv';

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
  name?: string;
  nameRaw: string;
  countryCode?: string;
  tags?: Record<string, string>;
};

const CRAG: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 17087286,
  lon: 14.1962423,
  lat: 49.4622294,
  name: 'Hlavní oblast - patro',
  nameRaw: 'Hlavni oblast - patro',
  countryCode: 'cz',
  tags: { website: 'https://www.horosvaz.cz/skaly-skala-285/' },
};
const AREA: SeedRow = {
  type: 'area',
  osmType: 'relation',
  osmId: 100,
  lon: 14.25,
  lat: 49.65,
  nameRaw: 'Zupanovice',
  countryCode: 'cz',
};
const SLOVAK_CRAG: SeedRow = {
  type: 'crag',
  osmType: 'node',
  osmId: 200,
  lon: 19.1,
  lat: 49.2,
  name: 'Zádiel; horná stena',
  nameRaw: 'Zadiel; horna stena',
  countryCode: 'sk',
};
const AUSTRIAN_CRAG: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 300,
  lon: 13.0,
  lat: 47.8,
  nameRaw: 'Salzburg',
  countryCode: 'at',
};
const CZECH_ROUTE: SeedRow = {
  type: 'route',
  osmType: 'node',
  osmId: 400,
  lon: 14.2,
  lat: 49.4,
  nameRaw: 'Direttissima',
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
      (type, lon, lat, "osmType", "osmId", "name", "nameRaw", "countryCode", tags)
    VALUES
      (@type, @lon, @lat, @osmType, @osmId, @name, @nameRaw, @countryCode, @tags)
  `);
  for (const r of rows) {
    insert.run({
      type: r.type,
      lon: r.lon,
      lat: r.lat,
      osmType: r.osmType,
      osmId: r.osmId,
      name: r.name ?? null,
      nameRaw: r.nameRaw,
      countryCode: r.countryCode ?? null,
      tags: r.tags ? JSON.stringify(r.tags) : null,
    });
  }
  return db;
};

const BASE_URL = 'https://openclimbing.org';

describe('getClimbingCragsCsv', () => {
  beforeEach(() => {
    mockDb = buildDummyDb([
      CRAG,
      AREA,
      SLOVAK_CRAG,
      AUSTRIAN_CRAG,
      CZECH_ROUTE,
    ]);
  });

  afterEach(() => {
    mockDb.close();
  });

  it('renders the header and one line per area/crag of the given countries', () => {
    const lines = getClimbingCragsCsv(BASE_URL).trim().split('\n');

    expect(lines[0]).toBe('url;name;horosvaz;lat;lon;country');
    expect(lines).toHaveLength(4);
  });

  it('renders url, name, website, coordinates and country code', () => {
    const [, first] = getClimbingCragsCsv(BASE_URL).split('\n');

    expect(first).toBe(
      'https://openclimbing.org/relation/100;Zupanovice;;49.6500000;14.2500000;cz',
    );
  });

  it('uses the name with diacritics and the website tag', () => {
    const line = getClimbingCragsCsv(BASE_URL)
      .split('\n')
      .find((l) => l.includes('17087286'));

    expect(line).toBe(
      'https://openclimbing.org/relation/17087286;Hlavní oblast - patro;https://www.horosvaz.cz/skaly-skala-285/;49.4622294;14.1962423;cz',
    );
  });

  it('quotes names containing the delimiter', () => {
    const line = getClimbingCragsCsv(BASE_URL)
      .split('\n')
      .find((l) => l.includes('node/200'));

    expect(line).toContain('"Zádiel; horná stena"');
  });

  it('excludes routes and other countries', () => {
    const csv = getClimbingCragsCsv(BASE_URL);

    expect(csv).not.toContain('Direttissima');
    expect(csv).not.toContain('Salzburg');
  });

  it('accepts custom country codes', () => {
    const csv = getClimbingCragsCsv(BASE_URL, ['at']);

    expect(csv).toContain('Salzburg');
    expect(csv).not.toContain('Zupanovice');
  });
});

describe('parseCountriesParam', () => {
  it('defaults to cz + sk', () => {
    expect(parseCountriesParam(undefined)).toEqual(['cz', 'sk']);
    expect(parseCountriesParam('')).toEqual(['cz', 'sk']);
  });

  it('parses a comma separated list', () => {
    expect(parseCountriesParam(' CZ , at ')).toEqual(['cz', 'at']);
    expect(parseCountriesParam(['cz', 'sk'])).toEqual(['cz', 'sk']);
  });
});
