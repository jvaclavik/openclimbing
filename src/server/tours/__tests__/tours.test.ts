import { readFileSync } from 'node:fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../../pages/api/kletterglueck/tours';
import { parseTourGpx, Track } from '../../../services/tours/tracks';
import { parseTourBounds, prepareTour } from '../catalog';
import { parseServerGpx, tourRecordFromBody } from '../osmVariant';

const secret = 'example-admin-token-with-at-least-32-chars';
const bbox = '11.5,49.5,11.6,49.6';
const track: Track = [
  [
    [11.52, 49.55],
    [11.53, 49.54],
  ],
  [
    [11.54, 49.54],
    [11.55, 49.55],
  ],
];
const tour = {
  name: 'Norissteig',
  source: 'Test',
  track,
  rights_confirmed: true,
};
const originalEnv = process.env;
const originalFetch = global.fetch;
const database = jest.fn();

beforeEach(() => {
  process.env = {
    ...originalEnv,
    KLETTERGLUECK_TOURS_ENABLED: 'true',
    KLETTERGLUECK_SUPABASE_URL: 'https://project.supabase.co',
    KLETTERGLUECK_SUPABASE_SECRET_KEY: 'sb_secret_example',
    KLETTERGLUECK_TOURS_ADMIN_TOKEN: secret,
  };
  database.mockReset();
  global.fetch = database;
});
afterEach(() => {
  process.env = originalEnv;
  global.fetch = originalFetch;
});

const request = async (request: Partial<NextApiRequest>) => {
  const res = {
    setHeader: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn(),
  };
  await handler(
    { query: {}, headers: {}, ...request } as NextApiRequest,
    res as unknown as NextApiResponse,
  );
  return res;
};

test('requires explicit enablement, admin authorization and rights confirmation', async () => {
  process.env.KLETTERGLUECK_TOURS_ENABLED = 'false';
  expect(
    (await request({ method: 'GET', query: { bbox } })).status,
  ).toHaveBeenCalledWith(404);
  process.env.KLETTERGLUECK_TOURS_ENABLED = 'true';
  expect(
    (await request({ method: 'POST', body: tour })).status,
  ).toHaveBeenCalledWith(401);
  expect(
    (await request({ method: 'GET', query: { catalog: '1' } })).status,
  ).toHaveBeenCalledWith(401);
  const denied = await request({
    method: 'POST',
    headers: { authorization: 'Bearer ' + secret },
    body: { ...tour, rights_confirmed: false },
  });
  expect(denied.status).toHaveBeenCalledWith(400);
  expect(database).not.toHaveBeenCalled();
});

test('retrieves only the requested map area without an admin key or a shared HTTP cache', async () => {
  const rows = [{ id: 'tour-1', name: 'Norissteig', track }];
  database.mockResolvedValue({ ok: true, json: async () => rows });
  const result = await request({ method: 'GET', query: { bbox } });
  expect(result.status).toHaveBeenCalledWith(200);
  expect(result.setHeader).toHaveBeenCalledWith(
    'Cache-Control',
    'private, no-store',
  );
  expect(result.json).toHaveBeenCalledWith({ tours: rows, truncated: false });
  const url: URL = database.mock.calls[0][0];
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    west: 'lte.11.6',
    east: 'gte.11.5',
    south: 'lte.49.6',
    north: 'gte.49.5',
    limit: '26',
  });
  expect(parseTourBounds('11.5,,11.6,49.6')).toBeNull();
  expect(parseTourBounds('-180,-90,180,90')).toBeNull();
});

test('returns a conflict when the database rejects a duplicate', async () => {
  database.mockResolvedValue({ ok: false, status: 409 });
  const result = await request({
    method: 'POST',
    headers: { authorization: 'Bearer ' + secret },
    body: tour,
  });
  expect(result.status).toHaveBeenCalledWith(409);
  const body = JSON.parse(database.mock.calls[0][1].body);
  expect(body.track).toEqual(track);
  expect(body.track_hash).toBe(
    prepareTour({
      ...tour,
      track: track
        .slice()
        .reverse()
        .map((segment) => segment.slice().reverse()),
    }).track_hash,
  );
});

test('keeps the ID when replacing a tour and paginates the admin catalog', async () => {
  const id = '241ca1fa-7cb5-4b5d-8a13-9da8fae95ac4';
  const headers = { authorization: 'Bearer ' + secret };
  database.mockResolvedValueOnce({ ok: true, json: async () => [{ id }] });
  const changed = await request({
    method: 'PATCH',
    query: { id },
    headers,
    body: tour,
  });
  expect(changed.status).toHaveBeenCalledWith(200);
  expect(database.mock.calls[0][0].searchParams.get('id')).toBe('eq.' + id);
  expect(JSON.parse(database.mock.calls[0][1].body).id).toBeUndefined();
  const rows = Array.from({ length: 51 }, (_, i) => ({ id: String(i) }));
  database.mockResolvedValueOnce({ ok: true, json: async () => rows });
  const catalog = await request({
    method: 'GET',
    query: { catalog: '1', after: id },
    headers,
  });
  expect(catalog.json).toHaveBeenCalledWith({
    tours: rows.slice(0, 50),
    next: '49',
    truncated: true,
  });
  expect(database.mock.calls[1][0].searchParams.get('id')).toBe('gt.' + id);
});

test('stores the named OSM variant without a client GPX upload', async () => {
  database.mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => [{ id: '241ca1fa-7cb5-4b5d-8a13-9da8fae95ac4' }],
  });
  const denied = await request({
    method: 'POST',
    headers: { authorization: 'Bearer ' + secret },
    body: { pilot: 'norissteig-osm-variante', rights_confirmed: false },
  });
  expect(denied.status).toHaveBeenCalledWith(400);
  expect(database).not.toHaveBeenCalled();
  const unknown = await request({
    method: 'POST',
    headers: { authorization: 'Bearer ' + secret },
    body: { pilot: 'original', rights_confirmed: true },
  });
  expect(unknown.status).toHaveBeenCalledWith(400);
  const saved = await request({
    method: 'POST',
    headers: { authorization: 'Bearer ' + secret },
    body: { pilot: 'norissteig-osm-variante', rights_confirmed: true },
  });
  expect(saved.status).toHaveBeenCalledWith(201);
  const body = JSON.parse(database.mock.calls[0][1].body);
  expect(body.name).toBe('Norissteig ab Hirschbach – OSM-Variante');
  expect(body.osm_ref).toBe('way/1156787758');
  expect(body.source).toContain('ODbL');
  expect(body.source).toContain('Nicht der 291-Punkte-Originaltrack');
  expect(body.track).toHaveLength(3);
  expect(body.track.flat()).toHaveLength(476);
  expect(body.difficulty).toBeNull();
  const xml = readFileSync('docs/project/norissteig-osm-variante.gpx', 'utf8');
  expect(parseServerGpx(xml)).toEqual(parseTourGpx(xml));
  expect(tourRecordFromBody(undefined)).toBeUndefined();
});

test('imports GPX segments without connecting them or keeping private metadata', () => {
  const xml = `<gpx xmlns="http://www.topografix.com/GPX/1/1"><trk>${track
    .map(
      (segment) =>
        '<trkseg>' +
        segment
          .map(
            ([lon, lat]) =>
              `<trkpt lon="${lon}" lat="${lat}"><time>2025-01-01T12:00:00Z</time></trkpt>`,
          )
          .join('') +
        '</trkseg>',
    )
    .join('')}</trk></gpx>`;
  expect(parseTourGpx(xml)).toEqual(track);
  expect(() => parseTourGpx(xml.replace('lon="11.52"', 'lon=""'))).toThrow();
});

const pilot = process.env.NORISSTEIG_TEST_GPX;
(pilot ? test : test.skip)(
  'validates the original Norissteig pilot locally',
  () => {
    const track = parseTourGpx(readFileSync(pilot!, 'utf8'));
    expect(track).toHaveLength(1);
    expect(track[0]).toHaveLength(291);
    const result = prepareTour({ ...tour, track });
    expect(result.length_m).toBeGreaterThanOrEqual(3500);
    expect(result.length_m).toBeLessThanOrEqual(3540);
  },
);
