import type { NextApiRequest, NextApiResponse } from 'next';
import { addCorsAndCache } from '../../../src/server/climbing-tiles/addCorsAndCache';
import { getClimbingNearby } from '../../../src/server/climbing-tiles/getClimbingNearby';
import { OsmType } from '../../../src/services/types';

const OSM_TYPES: OsmType[] = ['node', 'way', 'relation'];

const asSingle = (value: string | string[] | undefined) => {
  if (value instanceof Array) {
    throw new Error('Each param must be present only once');
  }
  return value;
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  addCorsAndCache(res);
  try {
    const type = asSingle(req.query.type);
    const lon = asSingle(req.query.lon);
    const lat = asSingle(req.query.lat);
    const osmType = asSingle(req.query.osmType);
    const osmId = asSingle(req.query.osmId);

    if (type !== 'crag' && type !== 'area') {
      throw new Error('type must be crag or area');
    }
    if (osmType && !OSM_TYPES.includes(osmType as OsmType)) {
      throw new Error('osmType must be node, way or relation');
    }

    const json = getClimbingNearby({
      type,
      lon: lon != null ? Number(lon) : undefined,
      lat: lat != null ? Number(lat) : undefined,
      excludeOsmType: osmType as OsmType | undefined,
      excludeOsmId: osmId != null ? Number(osmId) : undefined,
    });

    res.status(200).setHeader('Content-Type', 'application/json').send(json);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};
