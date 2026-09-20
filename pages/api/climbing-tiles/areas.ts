import type { NextApiRequest, NextApiResponse } from 'next';
import { addCorsAndCache } from '../../../src/server/climbing-tiles/addCorsAndCache';
import { getClimbingAreas } from '../../../src/server/climbing-tiles/getClimbingAreas';
import { isClimbingListType } from '../../../src/services/climbing-areas/climbingListTypes';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  addCorsAndCache(res);
  try {
    const rawType = req.query.type;
    const type = Array.isArray(rawType) ? rawType[0] : rawType;
    res
      .status(200)
      .json(getClimbingAreas(isClimbingListType(type) ? type : 'rock'));
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};
