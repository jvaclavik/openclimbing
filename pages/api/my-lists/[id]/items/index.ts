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

const addItem = async (req: NextApiRequest) => {
  const listId = await validateOwnership(req);
  const { shortId, label, poiType, lon, lat } = req.body ?? {};

  if (typeof shortId !== 'string' || !shortId.trim()) {
    throw new HttpError('Missing shortId', 400);
  }
  if (typeof lon !== 'number' || typeof lat !== 'number') {
    throw new HttpError('Missing or invalid lon/lat', 400);
  }

  getDb()
    .prepare(
      `INSERT INTO user_list_items
         ("listId", "shortId", label, "poiType", lon, lat, "addedAt")
       VALUES (@listId, @shortId, @label, @poiType, @lon, @lat, @addedAt)
       ON CONFLICT("listId", "shortId") DO NOTHING`,
    )
    .run({
      listId,
      shortId: shortId.trim(),
      label: String(label ?? '').slice(0, 200),
      poiType: String(poiType ?? '').slice(0, 80),
      lon,
      lat,
      addedAt: new Date().toISOString(),
    });
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'POST') {
      throw new Error('Method not implemented.');
    }
    await addItem(req);
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
