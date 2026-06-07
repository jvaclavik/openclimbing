import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../../src/server/db/db';
import { serverFetchOsmUser } from '../../../../src/server/osmApiAuthServer';
import { OSM_TOKEN_COOKIE } from '../../../../src/services/osm/consts';
import { sanitizeListColor } from '../../../../src/services/my-lists/listColors';

class HttpError extends Error {
  constructor(
    public message: string = '',
    public code: number,
  ) {
    super();
  }
}

const validateOwnership = async (req: NextApiRequest): Promise<number> => {
  const user = await serverFetchOsmUser(req.cookies[OSM_TOKEN_COOKIE]);
  const id = parseInt(String(req.query.id), 10);
  if (!Number.isFinite(id)) {
    throw new HttpError('Invalid id', 400);
  }

  const row = getDb()
    .prepare<
      [number],
      { osmUserId: number }
    >('SELECT "osmUserId" FROM user_lists WHERE id = ?')
    .get(id);

  if (!row) {
    throw new HttpError('List not found', 404);
  }
  if (row.osmUserId !== user.id) {
    throw new HttpError('Forbidden', 403);
  }

  return id;
};

const updateList = async (req: NextApiRequest) => {
  const id = await validateOwnership(req);
  const { name, emoji, color } = req.body ?? {};

  const updates: Record<string, string> = {};
  if (typeof name === 'string' && name.trim()) {
    updates.name = name.trim().slice(0, 100);
  }
  if (typeof emoji === 'string') {
    updates.emoji = emoji.trim().slice(0, 16);
  }
  if (color !== undefined) {
    updates.color = sanitizeListColor(color);
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  const setClause = Object.keys(updates)
    .map((k) => `"${k}" = @${k}`)
    .join(', ');

  getDb()
    .prepare(`UPDATE user_lists SET ${setClause} WHERE id = @id`)
    .run({ ...updates, id });
};

const deleteList = async (req: NextApiRequest) => {
  const id = await validateOwnership(req);
  const db = getDb();
  db.transaction(() => {
    db.prepare('DELETE FROM user_list_items WHERE "listId" = ?').run(id);
    db.prepare('DELETE FROM user_lists WHERE id = ?').run(id);
  })();
};

const performPutOrDelete = async (req: NextApiRequest) => {
  if (req.method === 'PUT') {
    return updateList(req);
  }
  if (req.method === 'DELETE') {
    return deleteList(req);
  }
  throw new Error('Method not implemented.');
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await performPutOrDelete(req);
    res.status(200).setHeader('Content-Type', 'application/json').send({});
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.code).send(err.message);
    } else {
      console.error(err); // eslint-disable-line no-console
      res.status(500).send(String(err));
    }
  }
};
