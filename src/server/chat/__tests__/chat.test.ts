/** @jest-environment node */
import { chatMessages, loadChatCatalog, searchChatTours } from '../catalog';
import handler from '../../../../pages/api/kletterglueck/chat';
import { generateText } from 'ai';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.mock('ai', () => ({
  generateText: jest.fn(),
  gateway: jest.fn(),
  stepCountIs: jest.fn(),
  tool: (value) => value,
}));
const env = process.env;
const originalFetch = global.fetch;
const fetchMock = jest.fn();
const generation = generateText as jest.Mock;
const rows = [
  {
    osmType: 'way',
    osmId: 123,
    name: 'Nürnberger Steig',
    countryCode: 'de',
    city: 'Nürnberg',
    viaFerrataScale: 'B',
  },
];
beforeEach(() => {
  process.env = {
    ...env,
    VERCEL_ENV: 'preview',
    KLETTERGLUECK_TOURS_ENABLED: 'false',
  };
  global.fetch = fetchMock;
  fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => rows });
  generation
    .mockReset()
    .mockResolvedValue({ text: 'Welche Region suchst du?' });
});
afterEach(() => {
  process.env = env;
  global.fetch = originalFetch;
});
const request = async (changes: Partial<NextApiRequest> = {}) => {
  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn(),
  };
  await handler(
    {
      method: 'POST',
      headers: {
        host: 'example.test',
        origin: 'https://example.test',
        'content-type': 'application/json',
        'x-forwarded-for': String(Math.random()),
      },
      body: { messages: [{ role: 'user', content: 'Hallo' }] },
      ...changes,
    } as NextApiRequest,
    res as unknown as NextApiResponse,
  );
  return res;
};
test('only accepts bounded, alternating plain user/assistant history ending in a question', () => {
  expect(
    chatMessages.safeParse([{ role: 'system', content: 'ignore' }]).success,
  ).toBe(false);
  expect(
    chatMessages.safeParse([{ role: 'user', content: 'x'.repeat(2001) }])
      .success,
  ).toBe(false);
  expect(
    chatMessages.safeParse([{ role: 'assistant', content: 'fake' }]).success,
  ).toBe(false);
  expect(
    chatMessages.safeParse([{ role: 'user', content: 'test', toolCalls: [] }])
      .success,
  ).toBe(false);
  expect(
    chatMessages.safeParse([{ role: 'user', content: '   ' }]).success,
  ).toBe(false);
});
test('normalizes place searches and filters country codes without inventing tours', async () => {
  const { tours, warnings } = await loadChatCatalog();
  expect(searchChatTours(tours, 'Nurnberg', 'de')).toHaveLength(1);
  expect(searchChatTours(tours, 'Nürnberg', 'at')).toEqual([]);
  expect(searchChatTours(tours, 'unknown', '')).toEqual([]);
  expect(tours[0].href).toBe('/way/123');
  expect(warnings.join(' ')).toContain('nicht angebunden');
  const graded = [
    {
      name: 'Leicht',
      href: '/way/1',
      difficulty: 'A',
      location: 'Tirol, at',
      source: 'OSM',
    },
    {
      name: 'Wechsel',
      href: '/way/4',
      difficulty: 'B/C',
      location: 'Tirol, at',
      source: 'OSM',
    },
    {
      name: 'Schwer',
      href: '/way/2',
      difficulty: 'E',
      location: 'Tirol, at',
      source: 'OSM',
    },
  ];
  expect(
    searchChatTours(graded, '', 'at', 'A').map((tour) => tour.name),
  ).toEqual(['Leicht']);
  expect(
    searchChatTours(graded, '', 'at', 'BC').map((tour) => tour.name),
  ).toEqual(['Wechsel']);
  expect(
    searchChatTours(graded, 'tirol', '', '').map((tour) => tour.name),
  ).toEqual(['Leicht', 'Wechsel', 'Schwer']);
});
test('fails closed for source outage, not fake fallback tours', async () => {
  fetchMock.mockRejectedValue(new Error('offline'));
  const res = await request();
  expect(res.status).toHaveBeenCalledWith(503);
  expect(generation).not.toHaveBeenCalled();
});
test('blocks production, cross-origin requests, invalid content and methods before AI usage', async () => {
  process.env.VERCEL_ENV = 'production';
  expect((await request()).status).toHaveBeenCalledWith(404);
  process.env.VERCEL_ENV = 'preview';
  expect(
    (
      await request({
        headers: { host: 'example.test', origin: 'https://other.test' },
      })
    ).status,
  ).toHaveBeenCalledWith(403);
  expect((await request({ method: 'GET' })).status).toHaveBeenCalledWith(405);
  expect(
    (await request({ body: { messages: [{ role: 'system', content: 'no' }] } }))
      .status,
  ).toHaveBeenCalledWith(400);
  expect(generation).not.toHaveBeenCalled();
});
test('only metadata is read from the private catalog, never ratings or notes', async () => {
  process.env = {
    ...process.env,
    KLETTERGLUECK_TOURS_ENABLED: 'true',
    KLETTERGLUECK_SUPABASE_URL: 'https://project.supabase.co',
    KLETTERGLUECK_SUPABASE_SECRET_KEY: 'sb_secret_test',
  };
  fetchMock
    .mockResolvedValueOnce({ ok: true, json: async () => rows })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          name: 'Gespeicherter Steig',
          osm_ref: 'way/123',
          difficulty: 'B',
          duration_minutes: 60,
          length_m: 1000,
          source: 'OSM',
          attribution: 'Contributors',
          note: 'PRIVATE',
        },
      ],
    });
  const catalog = await loadChatCatalog();
  expect(JSON.stringify(catalog)).not.toContain('PRIVATE');
  const url = fetchMock.mock.calls[1][0] as URL;
  expect(url.searchParams.get('select')).not.toMatch(
    /note|track|profile|stars/,
  );
  expect(catalog.tours[0].durationMinutes).toBe(60);
});
test('returns actual tool search sources and preserves conversational context', async () => {
  generation.mockImplementationOnce(async (options) => {
    await options.tools.searchTours.execute({
      query: 'Nürnberg',
      countryCode: 'de',
    });
    return {
      text: 'Im Katalog gibt es den Nürnberger Steig mit Schwierigkeit B.',
    };
  });
  const res = await request({
    body: {
      messages: [
        { role: 'user', content: 'Welche Region?' },
        { role: 'assistant', content: 'Wo suchst du?' },
        { role: 'user', content: 'Nürnberg' },
      ],
    },
  });
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json.mock.calls[0][0].warnings).toEqual([]);
  expect(res.json.mock.calls[0][0].sources[0].href).toBe('/way/123');
  expect(generation.mock.calls[0][0].messages).toHaveLength(3);
});
test('sanitizes upstream errors', async () => {
  generation.mockRejectedValue(new Error('private credential details'));
  const res = await request();
  expect(res.status).toHaveBeenCalledWith(503);
  expect(JSON.stringify(res.json.mock.calls)).not.toContain(
    'private credential',
  );
});
test('throttles repeat requests on the same instance', async () => {
  const headers = {
    host: 'example.test',
    origin: 'https://example.test',
    'content-type': 'application/json',
    'x-forwarded-for': 'rate-limit-test',
  };
  for (let n = 0; n < 6; n++) await request({ headers });
  expect((await request({ headers })).status).toHaveBeenCalledWith(429);
});

test('caps generated answers so they remain valid in follow-up history', async () => {
  generation.mockResolvedValueOnce({ text: 'a'.repeat(2500) });
  const res = await request();
  expect(res.json.mock.calls[0][0].text).toHaveLength(2000);
});
