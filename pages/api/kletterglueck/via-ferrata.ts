import type { NextApiRequest, NextApiResponse } from 'next';
import {
  loadClimbSlugs,
  matchClimbSlug,
  readViaFerrataRatings,
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
  const requested = String(req.query.slug ?? '');
  const name = String(req.query.name ?? '');
  try {
    const slugs = await loadClimbSlugs();
    const slug = requested
      ? slugs.includes(requested)
        ? requested
        : ''
      : (matchClimbSlug(name, slugs) ?? '');
    if (!slug)
      return res
        .status(404)
        .json({ error: 'Keine passende via-ferrata.de-Seite.' });
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
