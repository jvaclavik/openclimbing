import type { NextApiRequest, NextApiResponse } from 'next';
import { addCorsAndCache } from '../../../src/server/climbing-tiles/addCorsAndCache';
import { getClimbingFeature } from '../../../src/server/climbing-tiles/getClimbingFeature';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  addCorsAndCache(res);
  try {
    const { osmType, osmId } = req.query;
    if (
      osmType instanceof Array ||
      osmId instanceof Array ||
      !osmType ||
      !osmId
    ) {
      throw new Error('osmType and osmId must be provided as single values');
    }

    const osmIdNum = Number(osmId);
    if (!Number.isFinite(osmIdNum)) {
      throw new Error('osmId must be a valid number');
    }

    const feature = getClimbingFeature(osmType, osmIdNum);

    if (!feature) {
      res.status(404).send('Feature not found');
      return;
    }

    res.status(200).setHeader('Content-Type', 'application/json').send(feature);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};
