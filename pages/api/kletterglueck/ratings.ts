import type { NextApiRequest, NextApiResponse } from 'next';
import { databaseSettings } from '../../../src/server/tours/database';
import { UUID, validateRating } from '../../../src/services/tours/ratings';

export const config = { api: { bodyParser: { sizeLimit: '12kb' } } };
const FIELDS = 'tour_id,profile,stars,visited,visited_at,note';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Cache-Control', 'private, no-store');
  const { database } = databaseSettings();
  if (!database)
    return res
      .status(503)
      .json({ error: 'Zentraler Tourenspeicher ist nicht eingerichtet.' });
  if (!['GET', 'PUT', 'DELETE'].includes(req.method ?? '')) {
    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).end();
  }
  if (req.method !== 'GET') {
    let origin: URL;
    try {
      origin = new URL(req.headers.origin ?? '');
    } catch {
      return res.status(403).end();
    }
    if (
      origin.host !== req.headers.host ||
      !['https:', 'http:'].includes(origin.protocol)
    )
      return res.status(403).end();
    if (!req.headers['content-type']?.startsWith('application/json'))
      return res.status(415).end();
  }
  const request = async (
    table: string,
    params: Record<string, string>,
    method = 'GET',
    body?: unknown,
  ) => {
    const url = new URL('/rest/v1/' + table, database.endpoint);
    for (const [key, value] of Object.entries(params))
      url.searchParams.set(key, value);
    const response = await fetch(url, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        apikey: database.key,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'error',
    });
    if (!response.ok) throw new Error('storage');
    return response.json();
  };
  try {
    if (req.method !== 'GET') {
      let rating;
      try {
        rating = validateRating(
          req.method === 'DELETE'
            ? {
                ...req.body,
                stars: null,
                visited: false,
                visited_at: null,
                note: '',
              }
            : req.body,
        );
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
      if (req.method === 'DELETE') {
        await request(
          'kletterglueck_tour_ratings',
          {
            tour_id: 'eq.' + rating.tour_id,
            profile: 'eq.' + rating.profile,
          },
          'DELETE',
        );
        return res.status(200).json({ saved: true });
      }
      await request(
        'kletterglueck_tour_ratings',
        { on_conflict: 'tour_id,profile', select: FIELDS },
        'POST',
        rating,
      );
      return res.status(200).json({ saved: true });
    }
    const id = req.query.tour;
    if (id !== undefined) {
      if (typeof id !== 'string' || !UUID.test(id))
        return res.status(400).end();
      const tours = await request('kletterglueck_tours', {
        id: 'eq.' + id,
        select: 'id,name',
        limit: '1',
      });
      if (!tours.length)
        return res.status(404).json({ error: 'Tour nicht gefunden.' });
      const ratings = await request('kletterglueck_tour_ratings', {
        tour_id: 'eq.' + id,
        select: FIELDS,
        order: 'profile.asc',
      });
      return res.status(200).json({ tour: tours[0], ratings });
    }
    const params: Record<string, string> = {
      select: 'id,name',
      order: 'id.asc',
      limit: '51',
    };
    if (req.query.osm !== undefined) {
      if (
        typeof req.query.osm !== 'string' ||
        !/^(way|relation)\/[1-9]\d{0,17}$/.test(req.query.osm)
      )
        return res.status(400).end();
      params.osm_ref = 'eq.' + req.query.osm;
    }
    if (req.query.after !== undefined) {
      if (typeof req.query.after !== 'string' || !UUID.test(req.query.after))
        return res.status(400).end();
      params.id = 'gt.' + req.query.after;
    }
    if (req.query.q !== undefined) {
      if (typeof req.query.q !== 'string' || req.query.q.length > 120)
        return res.status(400).end();
      const term = req.query.q.replace(/[^\p{L}\p{N}\s-]/gu, '').trim();
      if (term) params.name = 'ilike.*' + term + '*';
    }
    const tours = await request('kletterglueck_tours', params);
    return res.status(200).json({
      tours: tours.slice(0, 50),
      next: tours.length > 50 ? tours[49].id : null,
    });
  } catch {
    return res.status(502).json({
      error:
        'Bewertungen derzeit nicht erreichbar. Bitte Einrichtung der Bewertungstabelle prüfen.',
    });
  }
}
