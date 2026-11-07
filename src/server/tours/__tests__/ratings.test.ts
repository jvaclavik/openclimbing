import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../../pages/api/kletterglueck/ratings';
import {
  ratingAverage,
  validateRating,
  TourRating,
} from '../../../services/tours/ratings';

const id = '241ca1fa-7cb5-4b5d-8a13-9da8fae95ac4';
const entry: TourRating = {
  tour_id: id,
  profile: 'Simon',
  stars: 4,
  visited: true,
  visited_at: '2026-11-07',
  note: 'Unsere Tour',
};
const environment = process.env;
const originalFetch = global.fetch;
const database = jest.fn();

beforeEach(() => {
  process.env = {
    ...environment,
    KLETTERGLUECK_TOURS_ENABLED: 'true',
    KLETTERGLUECK_SUPABASE_URL: 'https://project.supabase.co',
    KLETTERGLUECK_SUPABASE_SECRET_KEY: 'sb_secret_example',
  };
  database.mockReset();
  global.fetch = database;
});
afterEach(() => {
  process.env = environment;
  global.fetch = originalFetch;
});

const request = async (data: Partial<NextApiRequest>) => {
  const res = {
    setHeader: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn(),
  };
  await handler(
    { query: {}, headers: {}, ...data } as NextApiRequest,
    res as unknown as NextApiResponse,
  );
  return res;
};
test('averages only awarded stars and keeps visits independent', () => {
  expect(ratingAverage([entry, { ...entry, profile: 'Mama', stars: 5 }])).toBe(
    4.5,
  );
  expect(
    ratingAverage([entry, { ...entry, profile: 'Mama', stars: null }]),
  ).toBe(4);
  expect(ratingAverage([{ ...entry, stars: null }])).toBeNull();
  expect(validateRating({ ...entry, visited: false }).visited_at).toBeNull();
  expect(() =>
    validateRating({ ...entry, visited_at: '2026-02-31' }),
  ).toThrow();
  expect(() => validateRating({ ...entry, stars: 0 })).toThrow();
  expect(() => validateRating({ ...entry, note: 'x'.repeat(2001) })).toThrow();
});
test('blocks cross-origin or missing-origin writes before touching storage', async () => {
  const result = await request({
    method: 'PUT',
    body: entry,
    headers: {
      host: 'app.vercel.app',
      origin: 'https://attacker.example',
      'content-type': 'application/json',
    },
  });
  expect(result.status).toHaveBeenCalledWith(403);
  expect(database).not.toHaveBeenCalled();
  expect(
    (await request({ method: 'PUT', body: entry })).status,
  ).toHaveBeenCalledWith(403);
});
test('upserts one rating per exact tour and profile, with independent Mama entry', async () => {
  database.mockResolvedValue({ ok: true, json: async () => [] });
  const headers = {
    host: 'app.vercel.app',
    origin: 'https://app.vercel.app',
    'content-type': 'application/json',
  };
  const result = await request({ method: 'PUT', body: entry, headers });
  expect(result.status).toHaveBeenCalledWith(200);
  expect(database.mock.calls[0][0].searchParams.get('on_conflict')).toBe(
    'tour_id,profile',
  );
  expect(JSON.parse(database.mock.calls[0][1].body)).toEqual(entry);
  await request({
    method: 'PUT',
    body: { ...entry, profile: 'Mama', stars: 5 },
    headers,
  });
  expect(JSON.parse(database.mock.calls[1][1].body).profile).toBe('Mama');
});
test('reads ratings by UUID instead of the display name', async () => {
  database.mockResolvedValueOnce({
    ok: true,
    json: async () => [{ id, name: 'Norissteig' }],
  });
  database.mockResolvedValueOnce({ ok: true, json: async () => [entry] });
  const result = await request({ method: 'GET', query: { tour: id } });
  expect(result.json).toHaveBeenCalledWith({
    tour: { id, name: 'Norissteig' },
    ratings: [entry],
  });
  expect(database.mock.calls[1][0].searchParams.get('tour_id')).toBe(
    'eq.' + id,
  );
  expect(result.setHeader).toHaveBeenCalledWith(
    'Cache-Control',
    'private, no-store',
  );
});
test('deletes only the selected profile without accepting malformed IDs', async () => {
  const headers = {
    host: 'app.vercel.app',
    origin: 'https://app.vercel.app',
    'content-type': 'application/json',
  };
  database.mockResolvedValue({ ok: true, json: async () => [] });
  await request({
    method: 'DELETE',
    headers,
    body: { tour_id: id, profile: 'Mama' },
  });
  expect(database.mock.calls[0][1].method).toBe('DELETE');
  expect(database.mock.calls[0][0].searchParams.get('profile')).toBe('eq.Mama');
  const invalid = await request({
    method: 'DELETE',
    headers,
    body: { tour_id: 'not-a-uuid', profile: 'Mama' },
  });
  expect(invalid.status).toHaveBeenCalledWith(400);
});
