import type { NextApiRequest, NextApiResponse } from 'next';
import { serverFetchOsmUser } from '../../../src/server/osmApiAuthServer';
import { OSM_TOKEN_COOKIE } from '../../../src/services/osm/consts';
import { getDb } from '../../../src/server/db/db';
import { getTicksMentioningUser } from '../../../src/server/climbing-ticks/getTicksMentioningUser';

/** GET: other users' ticks that mention the logged-in user as a partner. */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET').end();
    return;
  }
  try {
    const user = await serverFetchOsmUser(req.cookies[OSM_TOKEN_COOKIE]);
    const ticks = getTicksMentioningUser(getDb(), user.id, user.username);
    res.status(200).json({ ticks });
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};
