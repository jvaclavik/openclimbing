import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../../../src/server/db/db';
import { serverFetchOsmUser } from '../../../../../src/server/osmApiAuthServer';
import { OSM_TOKEN_COOKIE } from '../../../../../src/services/osm/consts';

class HttpError extends Error {
  constructor(
    public message: string = '',
    public code: number,
  ) {
    super();
  }
}

const deleteItem = async (req: NextApiRequest) => {
  const user = await serverFetchOsmUser(req.cookies[OSM_TOKEN_COOKIE]);
  const listId = parseInt(String(req.query.id), 10);
  const shortId = String(req.query.shortId ?? '').trim();
  if (!Number.isFinite(listId) || !shortId) {
    throw new HttpError('Invalid params', 400);
  }

  const row = getDb()
    .prepare<
      [number],
      { osmUserId: number }
    >('SELECT "osmUserId" FROM user_lists WHERE id = ?')
    .get(listId);

  if (!row) {
    throw new HttpError('List not found', 404);
  }
  if (row.osmUserId !== user.id) {
    throw new HttpError('Forbidden', 403);
  }

  getDb()
    .prepare('DELETE FROM user_list_items WHERE "listId" = ? AND "shortId" = ?')
    .run(listId, shortId);
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'DELETE') {
      throw new Error('Method not implemented.');
    }
    await deleteItem(req);
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
