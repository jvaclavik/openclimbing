import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../../src/server/db/db';
import { findOsmUserIdByDisplayName } from '../../../../src/server/db/osmUserDisplayNames';
import { climbingTickDbsToResponseTicks } from '../../../../src/server/db/enrichClimbingTicksWithRouteMeta';
import { ClimbingTickDb } from '../../../../src/types';

const MAX_NAME_LEN = 255;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET').end();
    return;
  }

  const raw = req.query.displayName;
  const segment = Array.isArray(raw) ? raw[0] : raw;
  if (typeof segment !== 'string') {
    res.status(400).json({ error: 'invalid_username' });
    return;
  }

  const trimmed = segment.trim();
  if (!trimmed || trimmed.length > MAX_NAME_LEN) {
    res.status(400).json({ error: 'invalid_username' });
    return;
  }

  try {
    const db = getDb();
    const osmUserId = findOsmUserIdByDisplayName(db, trimmed);
    if (osmUserId == null) {
      res.status(404).json({ error: 'unknown_user' });
      return;
    }

    const nameRow = db
      .prepare<
        [number],
        { displayName: string }
      >(`SELECT "displayName" FROM osm_user_display_names WHERE "osmUserId" = ?`)
      .get(osmUserId);

    const statement = db.prepare<[number], ClimbingTickDb>(
      'SELECT * FROM climbing_ticks WHERE "osmUserId" = ?',
    );
    const rows = statement.all(osmUserId);

    res.status(200).json({
      displayName: nameRow?.displayName ?? trimmed,
      ticks: climbingTickDbsToResponseTicks(db, rows),
    });
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};
