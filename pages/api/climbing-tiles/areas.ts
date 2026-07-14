import type { NextApiRequest, NextApiResponse } from 'next';
import { addCorsAndCache } from '../../../src/server/climbing-tiles/addCorsAndCache';
import { getClimbingAreas } from '../../../src/server/climbing-tiles/getClimbingAreas';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  addCorsAndCache(res);
  try {
    res.status(200).json(getClimbingAreas());
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};
