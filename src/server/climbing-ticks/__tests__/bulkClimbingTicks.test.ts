import BetterSqlite3, { type Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../../pages/api/climbing-ticks/bulk';

let mockDb: Database;
jest.mock('../../db/db', () => ({ getDb: () => mockDb }));
jest.mock('../../osmApiAuthServer', () => ({
  serverFetchOsmUser: async () => ({ id: 1 }),
}));

const buildDb = () => {
  const db = new BetterSqlite3(':memory:');
  db.exec(readFileSync(path.resolve(__dirname, '../../db/schema.sql'), 'utf8'));
  const insert = db.prepare(
    `INSERT INTO climbing_ticks (id, "osmUserId", timestamp, style, pairing)
     VALUES (@id, @osmUserId, @timestamp, 'OS', '{"partners":"@a","x":"y"}')`,
  );
  [
    { id: 1, osmUserId: 1 },
    { id: 2, osmUserId: 1 },
    { id: 3, osmUserId: 1 },
    { id: 4, osmUserId: 2 },
  ].forEach((row) =>
    insert.run({ ...row, timestamp: '2025-01-01T12:00:00.000Z' }),
  );
  return db;
};

const call = async (body: unknown) => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader() {
      return this;
    },
    send(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  await handler(
    { method: 'POST', body, cookies: {} } as unknown as NextApiRequest,
    res as unknown as NextApiResponse,
  );
  return res;
};

const getRows = () =>
  mockDb.prepare('SELECT * FROM climbing_ticks ORDER BY id').all() as {
    id: number;
    style: string;
    pairing: string;
    timestamp: string;
  }[];

beforeEach(() => {
  mockDb = buildDb();
});

describe('POST /api/climbing-ticks/bulk', () => {
  it('deletes own ticks', async () => {
    const res = await call({ action: 'delete', ids: [1, 3] });
    expect(res.statusCode).toBe(200);
    expect(getRows().map((r) => r.id)).toEqual([2, 4]);
  });

  it('refuses to delete anything when one tick belongs to another user', async () => {
    const res = await call({ action: 'delete', ids: [1, 4] });
    expect(res.statusCode).toBe(401);
    expect(getRows()).toHaveLength(4);
  });

  it('returns 404 for unknown ids', async () => {
    const res = await call({ action: 'delete', ids: [1, 999] });
    expect(res.statusCode).toBe(404);
    expect(getRows()).toHaveLength(4);
  });

  it('updates only allowed fields per tick', async () => {
    const res = await call({
      action: 'update',
      ticks: [
        { id: 1, style: 'RP', osmUserId: 2 },
        { id: 2, timestamp: '2025-02-02T12:00:00.000Z', pairing: null },
      ],
    });
    expect(res.statusCode).toBe(200);
    const rows = getRows();
    expect(rows[0]).toMatchObject({ id: 1, style: 'RP', osmUserId: 1 });
    expect(rows[1]).toMatchObject({
      id: 2,
      style: 'OS',
      timestamp: '2025-02-02T12:00:00.000Z',
      pairing: null,
    });
    expect(rows[2].style).toBe('OS');
  });

  it('refuses update of foreign ticks', async () => {
    const res = await call({
      action: 'update',
      ticks: [
        { id: 1, style: 'RP' },
        { id: 4, style: 'RP' },
      ],
    });
    expect(res.statusCode).toBe(401);
    expect(getRows().every((r) => r.style === 'OS')).toBe(true);
  });

  it('rejects invalid payloads', async () => {
    expect((await call({ action: 'delete', ids: [] })).statusCode).toBe(400);
    expect((await call({ action: 'delete', ids: ['x'] })).statusCode).toBe(400);
    expect((await call({ action: 'nope' })).statusCode).toBe(400);
  });

  it('creates ticks for the logged-in user only', async () => {
    const res = await call({
      action: 'create',
      ticks: [
        {
          osmType: 'node',
          osmId: 5,
          timestamp: '2025-03-03T12:00:00.000Z',
          style: 'RP',
          pairing: { partners: '@pepa' },
          osmUserId: 2,
          id: 1,
        },
      ],
    });
    expect(res.statusCode).toBe(200);
    const { ids } = res.body as { ids: number[] };
    expect(ids).toHaveLength(1);
    const created = mockDb
      .prepare('SELECT * FROM climbing_ticks WHERE id = ?')
      .get(ids[0]);
    expect(created).toMatchObject({
      osmUserId: 1,
      osmType: 'node',
      osmId: 5,
      style: 'RP',
      pairing: '{"partners":"@pepa"}',
    });
  });

  it('rejects create without timestamp', async () => {
    const res = await call({ action: 'create', ticks: [{ style: 'RP' }] });
    expect(res.statusCode).toBe(400);
    expect(getRows()).toHaveLength(4);
  });
});
