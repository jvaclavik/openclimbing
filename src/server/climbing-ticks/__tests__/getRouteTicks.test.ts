import BetterSqlite3, { type Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import { getRouteTicks } from '../getRouteTicks';
import { getRouteMetaMap } from '../../db/enrichClimbingTicksWithRouteMeta';
import { ClimbingTickDb } from '../../../types';

const buildDb = (): Database => {
  const db = new BetterSqlite3(':memory:');
  db.exec(readFileSync(path.resolve(__dirname, '../../db/schema.sql'), 'utf8'));
  const insert = db.prepare(
    `INSERT INTO climbing_ticks (id, "osmUserId", "osmType", "osmId", timestamp, style, note, pairing)
     VALUES (@id, @osmUserId, @osmType, @osmId, @timestamp, 'RP', @note, @pairing)`,
  );
  [
    { id: 1, osmUserId: 1, osmId: 7, timestamp: '2025-01-01T12:00:00Z' },
    { id: 2, osmUserId: 2, osmId: 7, timestamp: '2025-03-01T12:00:00Z' },
    { id: 3, osmUserId: 2, osmId: 8, timestamp: '2025-03-01T12:00:00Z' },
  ].forEach((row) =>
    insert.run({
      osmType: 'way',
      note: row.id === 2 ? 'Mokro' : null,
      pairing: row.id === 2 ? '{"partners":"s @jan"}' : null,
      ...row,
    }),
  );
  db.prepare(
    `INSERT INTO osm_user_display_names ("osmUserId", "displayName") VALUES (2, 'pepa')`,
  ).run();
  return db;
};

describe('getRouteTicks', () => {
  it('returns ticks of one route newest first with owner names', () => {
    const ticks = getRouteTicks(buildDb(), 'way', 7);
    expect(ticks.map((t) => [t.id, t.ownerDisplayName])).toEqual([
      [2, 'pepa'],
      [1, null],
    ]);
    expect(ticks[0]).toMatchObject({
      shortId: 'w7',
      note: 'Mokro',
      pairing: { partners: 's @jan' },
    });
  });
});

describe('route meta for long diaries', () => {
  it('handles more routes than the SQLite expression limit', () => {
    const rows = Array.from({ length: 1500 }, (_, i) => ({
      osmType: 'way',
      osmId: i + 1,
    }));
    expect(() =>
      getRouteMetaMap(buildDb(), rows as unknown as ClimbingTickDb[]),
    ).not.toThrow();
  });
});
