import BetterSqlite3, { type Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import { getTicksMentioningUser } from '../getTicksMentioningUser';

const buildDb = (): Database => {
  const db = new BetterSqlite3(':memory:');
  db.exec(readFileSync(path.resolve(__dirname, '../../db/schema.sql'), 'utf8'));
  const insert = db.prepare(
    `INSERT INTO climbing_ticks (id, "osmUserId", "osmType", "osmId", timestamp, style, pairing)
     VALUES (@id, @osmUserId, @osmType, @osmId, @timestamp, 'RP', @pairing)`,
  );
  const base = { osmType: 'node', osmId: 7, timestamp: '2025-01-01T12:00:00Z' };
  [
    { id: 1, osmUserId: 2, pairing: '{"partners":"s @Jan"}' },
    { id: 2, osmUserId: 2, pairing: '{"partners":"s @janek"}' },
    { id: 3, osmUserId: 1, pairing: '{"partners":"s @jan"}' }, // own tick
    { id: 4, osmUserId: 3, pairing: '{"partners":"@jan, @pepa"}' },
    { id: 5, osmUserId: 2, pairing: '{"partners":"@jan"}', osmId: null },
    { id: 6, osmUserId: 2, pairing: null },
  ].forEach((row) => insert.run({ ...base, ...row }));
  db.prepare(
    `INSERT INTO osm_user_display_names ("osmUserId", "displayName") VALUES (2, 'pepa')`,
  ).run();
  return db;
};

describe('getTicksMentioningUser', () => {
  it('returns other users ticks mentioning me with owner names', () => {
    const ticks = getTicksMentioningUser(buildDb(), 1, 'jan');
    expect(ticks.map((t) => [t.id, t.ownerDisplayName]).sort()).toEqual([
      [1, 'pepa'],
      [4, null],
    ]);
    expect(ticks[0].shortId).toBe('n7');
  });
});
