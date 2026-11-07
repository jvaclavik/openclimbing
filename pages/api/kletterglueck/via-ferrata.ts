import type { NextApiRequest, NextApiResponse } from 'next';
import {
  readViaFerrataRatings,
  viaFerrataPage,
} from '../../../src/server/tours/viaFerrata';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Cache-Control', 'private, max-age=3600');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const slug = String(req.query.slug ?? 'norissteig');
  if (!viaFerrataPage(slug))
    return res
      .status(404)
      .json({ error: 'Diese via-ferrata-Seite ist nicht freigegeben.' });
  try {
    const ratings = await readViaFerrataRatings(slug);
    if (!ratings)
      return res
        .status(502)
        .json({ error: 'Bewertungen konnten nicht gelesen werden.' });
    return res.status(200).json(ratings);
  } catch {
    return res
      .status(502)
      .json({ error: 'via-ferrata.de ist gerade nicht erreichbar.' });
  }
}
