import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../../../src/server/db/db';
import {
  getRouteTicks,
  OSM_TYPES,
} from '../../../../../src/server/climbing-ticks/getRouteTicks';

/** GET: public list of all climbers' ticks of a route. */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET').end();
    return;
  }
  const osmType = String(req.query.osmType);
  const osmId = Number(req.query.osmId);
  if (
    !(OSM_TYPES as readonly string[]).includes(osmType) ||
    !Number.isInteger(osmId) ||
    osmId < 1
  ) {
    res.status(400).json({ error: 'invalid_route' });
    return;
  }

  try {
    const ticks = getRouteTicks(getDb(), osmType, osmId);
    res
      .status(200)
      .setHeader('Cache-Control', 'public, max-age=60')
      .json({ ticks });
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};
