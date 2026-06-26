import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrCreateExport } from '../../../src/server/climbing-tiles/exportDatabase';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    if (!process.env.NEXT_PUBLIC_ENABLE_CLIMBING_TILES) {
      throw new Error('NEXT_PUBLIC_ENABLE_CLIMBING_TILES must be on');
    }

    const fileName = await getOrCreateExport();

    res.redirect(302, `/download/${fileName}`);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};
