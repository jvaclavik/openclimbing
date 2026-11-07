import { databaseSettings } from '../../../src/server/tours/database';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  canWriteTours,
  MAX_MAP_TOURS,
  parseTourBounds,
  prepareTour,
} from '../../../src/server/tours/catalog';
import { tourRecordFromBody } from '../../../src/server/tours/osmVariant';

const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const METADATA =
  'id,name,difficulty,duration_minutes,osm_ref,source,attribution,length_m';

export const config = { api: { bodyParser: { sizeLimit: '512kb' } } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Cache-Control', 'private, no-store');
  const { database, issues } = databaseSettings();
  if (!database) {
    if (process.env.VERCEL_ENV === 'preview') {
      return res.status(503).json({ error: issues.join(' ') });
    }
    return res.status(404).json({ error: 'Tourenspeicher ist deaktiviert.' });
  }
  if (!['GET', 'POST', 'PATCH'].includes(req.method ?? '')) {
    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).end();
  }
  const admin = req.method !== 'GET' || req.query.catalog !== undefined;
  if (
    admin &&
    !canWriteTours(
      req.headers.authorization,
      process.env.KLETTERGLUECK_TOURS_ADMIN_TOKEN,
    )
  ) {
    return res.status(401).json({ error: 'Admin-Schlüssel erforderlich.' });
  }

  const { endpoint, key } = database;
  const query = endpoint.searchParams;
  const headers = {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
  let body: string | undefined;
  if (req.method === 'GET') {
    query.set('order', 'id.asc');
    if (admin) {
      const after = req.query.after;
      if (after !== undefined) {
        if (typeof after !== 'string' || !UUID.test(after))
          return res.status(400).end();
        query.set('id', 'gt.' + after);
      }
      query.set('select', METADATA);
      query.set('limit', '51');
    } else {
      const bounds = parseTourBounds(req.query.bbox);
      if (!bounds)
        return res.status(400).json({ error: 'Ungültiger Kartenausschnitt.' });
      query.set('select', METADATA + ',track');
      query.set('west', 'lte.' + bounds.east);
      query.set('east', 'gte.' + bounds.west);
      query.set('south', 'lte.' + bounds.north);
      query.set('north', 'gte.' + bounds.south);
      query.set('limit', String(MAX_MAP_TOURS + 1));
    }
  } else {
    if (req.method === 'PATCH') {
      if (typeof req.query.id !== 'string' || !UUID.test(req.query.id)) {
        return res.status(400).json({ error: 'Ungültige Touren-ID.' });
      }
      query.set('id', 'eq.' + req.query.id);
    }
    query.set('select', METADATA);
    try {
      body = JSON.stringify(prepareTour(tourRecordFromBody(req.body)));
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Ungültige Tour.',
      });
    }
  }

  try {
    const response = await fetch(endpoint, {
      method: req.method,
      headers,
      body,
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 409) {
      return res
        .status(409)
        .json({ error: 'Dieser GPS-Track ist bereits gespeichert.' });
    }
    if (!response.ok)
      return res
        .status(502)
        .json({ error: 'Tourenspeicher derzeit nicht erreichbar.' });
    const rows = await response.json();
    if (req.method !== 'GET') {
      if (!rows.length)
        return res.status(404).json({ error: 'Tour nicht gefunden.' });
      return res
        .status(req.method === 'POST' ? 201 : 200)
        .json({ tour: rows[0] });
    }
    const limit = admin ? 50 : MAX_MAP_TOURS;
    const tours = rows.slice(0, limit);
    return res.status(200).json({
      tours,
      truncated: rows.length > limit,
      ...(admin && rows.length > limit ? { next: tours.at(-1).id } : {}),
    });
  } catch {
    return res
      .status(502)
      .json({ error: 'Tourenspeicher derzeit nicht erreichbar.' });
  }
}
