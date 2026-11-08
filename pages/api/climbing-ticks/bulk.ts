import type { NextApiRequest, NextApiResponse } from 'next';
import { serverFetchOsmUser } from '../../../src/server/osmApiAuthServer';
import { OSM_TOKEN_COOKIE } from '../../../src/services/osm/consts';
import { getDb } from '../../../src/server/db/db';
import {
  getSafeTickUpdates,
  insertTickRow,
  updateTickRow,
} from '../../../src/server/climbing-ticks/climbingTickUpdates';

class HttpError extends Error {
  constructor(
    message: string,
    public code: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const MAX_BULK_TICKS = 5000;

type BulkBody =
  | { action: 'delete'; ids: unknown }
  | { action: 'update'; ticks: unknown }
  | { action: 'create'; ticks: unknown };

const parseIds = (raw: unknown): number[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new HttpError('Expected non-empty array of tick ids', 400);
  }
  if (raw.length > MAX_BULK_TICKS) {
    throw new HttpError(`Too many ticks (max ${MAX_BULK_TICKS})`, 400);
  }
  const ids = raw.map((id) => Number(id));
  if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
    throw new HttpError('Invalid tick id', 400);
  }
  return [...new Set(ids)];
};

/** All ticks must exist and belong to the user — otherwise nothing happens. */
const assertOwnership = (ids: number[], osmUserId: number) => {
  const placeholders = ids.map(() => '?').join(', ');
  const rows = getDb()
    .prepare<number[], { id: number; osmUserId: number }>(
      `SELECT id, osmUserId FROM climbing_ticks WHERE id IN (${placeholders})`,
    )
    .all(...ids);

  if (rows.length !== ids.length) {
    throw new HttpError('Tick not found', 404);
  }
  if (rows.some((row) => row.osmUserId !== osmUserId)) {
    throw new HttpError('Some ticks are owned by different user.', 401);
  }
};

const bulkDelete = (ids: number[]) => {
  const db = getDb();
  const statement = db.prepare('DELETE FROM climbing_ticks WHERE id = ?');
  db.transaction(() => {
    ids.forEach((id) => statement.run(id));
  })();
  return { deleted: ids.length };
};

const bulkUpdate = (rawTicks: unknown, osmUserId: number) => {
  if (!Array.isArray(rawTicks)) {
    throw new HttpError('Expected array of ticks', 400);
  }
  const ids = parseIds(rawTicks.map((tick) => tick?.id));
  if (ids.length !== rawTicks.length) {
    throw new HttpError('Duplicate tick ids', 400);
  }
  assertOwnership(ids, osmUserId);

  const db = getDb();
  db.transaction(() => {
    rawTicks.forEach((tick) => {
      const updates = getSafeTickUpdates(tick);
      if (Object.keys(updates).length > 0) {
        updateTickRow(db, Number(tick.id), updates);
      }
    });
  })();
  return { updated: ids.length };
};

const bulkCreate = (rawTicks: unknown, osmUserId: number) => {
  if (!Array.isArray(rawTicks) || rawTicks.length === 0) {
    throw new HttpError('Expected non-empty array of ticks', 400);
  }
  if (rawTicks.length > MAX_BULK_TICKS) {
    throw new HttpError(`Too many ticks (max ${MAX_BULK_TICKS})`, 400);
  }
  if (
    rawTicks.some(
      (tick) => typeof tick?.timestamp !== 'string' || !tick.timestamp.trim(),
    )
  ) {
    throw new HttpError('Every tick needs a timestamp', 400);
  }

  const db = getDb();
  const ids = db.transaction(() =>
    rawTicks.map((tick) => insertTickRow(db, osmUserId, tick)),
  )();
  return { ids };
};

const performBulk = async (req: NextApiRequest) => {
  if (req.method !== 'POST') {
    throw new HttpError('Method not allowed', 405);
  }
  const user = await serverFetchOsmUser(req.cookies[OSM_TOKEN_COOKIE]);
  const body = (req.body ?? {}) as BulkBody;

  if (body.action === 'delete') {
    const ids = parseIds(body.ids);
    assertOwnership(ids, user.id);
    return bulkDelete(ids);
  }
  if (body.action === 'update') {
    return bulkUpdate(body.ticks, user.id);
  }
  if (body.action === 'create') {
    return bulkCreate(body.ticks, user.id);
  }
  throw new HttpError('Unknown action', 400);
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const result = await performBulk(req);
    res.status(200).setHeader('Content-Type', 'application/json').send(result);
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.code).send(err.message);
    } else {
      console.error(err); // eslint-disable-line no-console
      res.status(500).send(String(err));
    }
  }
};
