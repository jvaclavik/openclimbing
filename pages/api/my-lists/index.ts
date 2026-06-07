import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../src/server/db/db';
import { serverFetchOsmUser } from '../../../src/server/osmApiAuthServer';
import { OSM_TOKEN_COOKIE } from '../../../src/services/osm/consts';
import {
  UserList,
  UserListItem,
} from '../../../src/services/my-lists/myListsTypes';
import { sanitizeListColor } from '../../../src/services/my-lists/listColors';

type ListRow = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  sortOrder: number;
};

type ItemRow = {
  listId: number;
  shortId: string;
  label: string;
  poiType: string;
  lon: number;
  lat: number;
  addedAt: string;
};

const getLists = async (req: NextApiRequest): Promise<UserList[]> => {
  const user = await serverFetchOsmUser(req.cookies[OSM_TOKEN_COOKIE]);
  const db = getDb();

  const lists = db
    .prepare<
      [number],
      ListRow
    >('SELECT id, name, emoji, color, "createdAt", "sortOrder" FROM user_lists WHERE "osmUserId" = ? ORDER BY "sortOrder", id')
    .all(user.id);

  if (lists.length === 0) {
    return [];
  }

  const ids = lists.map((l) => l.id);
  const placeholders = ids.map(() => '?').join(',');
  const items = db
    .prepare<number[], ItemRow>(
      `SELECT "listId", "shortId", label, "poiType", lon, lat, "addedAt"
       FROM user_list_items WHERE "listId" IN (${placeholders}) ORDER BY "addedAt" DESC`,
    )
    .all(...ids);

  const itemsByList = new Map<number, UserListItem[]>();
  for (const row of items) {
    const arr = itemsByList.get(row.listId) ?? [];
    arr.push({
      shortId: row.shortId,
      label: row.label,
      poiType: row.poiType,
      center: [row.lon, row.lat],
      addedAt: row.addedAt,
    });
    itemsByList.set(row.listId, arr);
  }

  return lists.map((list) => ({
    ...list,
    items: itemsByList.get(list.id) ?? [],
  }));
};

const createList = async (req: NextApiRequest): Promise<{ id: number }> => {
  const user = await serverFetchOsmUser(req.cookies[OSM_TOKEN_COOKIE]);
  const { name, emoji, color } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Missing name');
  }
  const emojiStr = typeof emoji === 'string' ? emoji.trim().slice(0, 16) : '';
  const colorStr = sanitizeListColor(color);

  const result = getDb()
    .prepare(
      `INSERT INTO user_lists ("osmUserId", name, emoji, color, "createdAt", "sortOrder")
       VALUES (@osmUserId, @name, @emoji, @color, @createdAt, @sortOrder)`,
    )
    .run({
      osmUserId: user.id,
      name: name.trim().slice(0, 100),
      emoji: emojiStr,
      color: colorStr,
      createdAt: new Date().toISOString(),
      sortOrder: 0,
    });

  return { id: Number(result.lastInsertRowid) };
};

const performGetOrPost = async (req: NextApiRequest) => {
  if (req.method === 'GET') {
    return getLists(req);
  }
  if (req.method === 'POST') {
    return createList(req);
  }
  throw new Error('Method not implemented.');
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const result = await performGetOrPost(req);
    res.status(200).setHeader('Content-Type', 'application/json').send(result);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};
