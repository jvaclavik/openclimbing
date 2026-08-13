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
  routesWithPhoto?: number;
  routeCount?: number;
  parentId?: number;
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
  routesWithPhoto: 3,
  routeCount: 25,
  parentId: 100,
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
  routesWithPhoto: 1,
  routeCount: 12,
  parentId: 90,
};
// area of areas - AREA lists it as its parent
const SUPERAREA: SeedRow = {
  type: 'area',
  osmType: 'relation',
  osmId: 90,
  lon: 14.3,
  lat: 49.7,
  nameRaw: 'Ceske stredohori',
  countryCode: 'cz',
  routesWithPhoto: 4,
  routeCount: 42,
};
// horosvaz link hidden behind an openclimbing selflink in `website`
const CRAG_SECONDARY_WEBSITE: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 17129043,
  lon: 14.28515,
  lat: 49.7040252,
  name: 'Sluneční stěna',
  nameRaw: 'Slunecni stena',
  countryCode: 'cz',
  routesWithPhoto: 2,
  tags: {
    website: 'https://openclimbing.org/relation/17129043',
    'website:2': 'https://www.horosvaz.cz/skaly-skala-4407/',
    'website:3': 'https://www.lezec.cz/pruvodcx.php?key=5',
  },
};
const SLOVAK_CRAG: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 200,
  lon: 19.1,
  lat: 49.2,
  name: 'Zádiel; horná stena',
  nameRaw: 'Zadiel; horna stena',
  countryCode: 'sk',
  routesWithPhoto: 5,
};
const AUSTRIAN_CRAG: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 300,
  lon: 13.0,
  lat: 47.8,
  nameRaw: 'Salzburg',
  countryCode: 'at',
  routesWithPhoto: 4,
};
const CZECH_ROUTE: SeedRow = {
  type: 'route',
  osmType: 'node',
  osmId: 400,
  lon: 14.2,
  lat: 49.4,
  nameRaw: 'Direttissima',
  countryCode: 'cz',
  routesWithPhoto: 1,
};
const NODE_CRAG: SeedRow = {
  type: 'crag',
  osmType: 'node',
  osmId: 500,
  lon: 14.2,
  lat: 49.4,
  nameRaw: 'Nodovy crag',
  countryCode: 'cz',
  routesWithPhoto: 7,
};
const CRAG_WITHOUT_PHOTO: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 600,
  lon: 14.2,
  lat: 49.4,
  nameRaw: 'Bez fotky',
  countryCode: 'cz',
  routesWithPhoto: 0,
  tags: { website: 'https://www.horosvaz.cz/skaly-skala-1/' },
};
const CRAG_NULL_PHOTO: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 700,
  lon: 14.2,
  lat: 49.4,
  nameRaw: 'Nezname fotky',
  countryCode: 'cz',
};
// horosvaz mentioned outside a website tag, plus a lookalike domain
const CRAG_NON_WEBSITE_TAGS: SeedRow = {
  type: 'crag',
  osmType: 'relation',
  osmId: 800,
  lon: 14.2,
  lat: 49.4,
  nameRaw: 'Jen source',
  countryCode: 'cz',
  routesWithPhoto: 1,
  tags: {
    source: 'horosvaz.cz',
    url: 'https://www.horosvaz.cz/skaly-skala-2/',
    website: 'https://not-horosvaz.cz/skaly-skala-3/',
  },
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
      (type, lon, lat, "osmType", "osmId", "name", "nameRaw", "countryCode",
       "routesWithPhoto", "routeCount", "parentId", tags)
    VALUES
      (@type, @lon, @lat, @osmType, @osmId, @name, @nameRaw, @countryCode,
       @routesWithPhoto, @routeCount, @parentId, @tags)
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
      routesWithPhoto: r.routesWithPhoto ?? null,
      routeCount: r.routeCount ?? null,
      parentId: r.parentId ?? null,
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
      SUPERAREA,
      CRAG_SECONDARY_WEBSITE,
      SLOVAK_CRAG,
      AUSTRIAN_CRAG,
      CZECH_ROUTE,
      NODE_CRAG,
      CRAG_WITHOUT_PHOTO,
      CRAG_NULL_PHOTO,
      CRAG_NON_WEBSITE_TAGS,
    ]);
  });

  afterEach(() => {
    mockDb.close();
  });

  it('renders the header and one line per matching relation', () => {
    const lines = getClimbingCragsCsv(BASE_URL).trim().split('\n');

    expect(lines[0]).toBe('url;name;type;routes;horosvaz;lat;lon;country');
    expect(lines).toHaveLength(7);
  });

  it('renders url, name, type, route count, horosvaz link, coordinates and country code', () => {
    const line = getClimbingCragsCsv(BASE_URL)
      .split('\n')
      .find((l) => l.includes('relation/100'));

    expect(line).toBe(
      'https://openclimbing.org/relation/100;Zupanovice;area;12;;49.6500000;14.2500000;cz',
    );
  });

  it('marks an area containing another area as superarea', () => {
    const line = getClimbingCragsCsv(BASE_URL)
      .split('\n')
      .find((l) => l.includes('relation/90'));

    expect(line).toBe(
      'https://openclimbing.org/relation/90;Ceske stredohori;superarea;42;;49.7000000;14.3000000;cz',
    );
  });

  it('renders zero routes when the route count is unknown', () => {
    const line = getClimbingCragsCsv(BASE_URL)
      .split('\n')
      .find((l) => l.includes('relation/200'));

    expect(line).toContain(';crag;0;');
  });

  it('uses the name with diacritics and the website tag', () => {
    const line = getClimbingCragsCsv(BASE_URL)
      .split('\n')
      .find((l) => l.includes('17087286'));

    expect(line).toBe(
      'https://openclimbing.org/relation/17087286;Hlavní oblast - patro;crag;25;https://www.horosvaz.cz/skaly-skala-285/;49.4622294;14.1962423;cz',
    );
  });

  it('finds the horosvaz link in a secondary website tag', () => {
    const line = getClimbingCragsCsv(BASE_URL)
      .split('\n')
      .find((l) => l.includes('17129043'));

    expect(line).toContain(';https://www.horosvaz.cz/skaly-skala-4407/;');
    expect(line).not.toContain('lezec.cz');
  });

  it('ignores horosvaz outside website tags and lookalike domains', () => {
    const line = getClimbingCragsCsv(BASE_URL)
      .split('\n')
      .find((l) => l.includes('relation/800'));

    expect(line).toBe(
      'https://openclimbing.org/relation/800;Jen source;crag;0;;49.4000000;14.2000000;cz',
    );
  });

  it('quotes names containing the delimiter', () => {
    const line = getClimbingCragsCsv(BASE_URL)
      .split('\n')
      .find((l) => l.includes('relation/200'));

    expect(line).toContain('"Zádiel; horná stena"');
  });

  it('excludes routes, nodes/ways and other countries', () => {
    const csv = getClimbingCragsCsv(BASE_URL);

    expect(csv).not.toContain('Direttissima');
    expect(csv).not.toContain('Nodovy crag');
    expect(csv).not.toContain('Salzburg');
  });

  it('excludes relations without a route drawn on a photo', () => {
    const csv = getClimbingCragsCsv(BASE_URL);

    expect(csv).not.toContain('Bez fotky');
    expect(csv).not.toContain('Nezname fotky');
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
