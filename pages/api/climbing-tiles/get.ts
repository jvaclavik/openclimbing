import type { NextApiRequest, NextApiResponse } from 'next';
import { addCorsAndCache } from '../../../src/server/climbing-tiles/addCorsAndCache';
import {
  getClimbingFeature,
  parseFeatureId,
} from '../../../src/server/climbing-tiles/getClimbingFeature';
import { OsmType } from '../../../src/services/types';

const OSM_TYPES: OsmType[] = ['node', 'way', 'relation'];

// Accepts ?id=<id> where id is an OSM URL id (`way/123`), a short id (`w123`)
// or a mapId (`1231`). Alternatively ?osmType=node&osmId=123.
const parseParams = (
  query: NextApiRequest['query'],
): { osmType: OsmType; osmId: number } => {
  const { osmType, osmId, id } = query;

  if (
    osmType instanceof Array ||
    osmId instanceof Array ||
    id instanceof Array
  ) {
    throw new Error('Each param must be present only once');
  }

  if (id) {
    const { type, id: osm } = parseFeatureId(id);
    return { osmType: type, osmId: osm };
  }

  if (!osmType || !osmId) {
    throw new Error(
      'Provide `id` (OSM url id `way/123`, short id `w123` or mapId) or `osmType` + `osmId`',
    );
  }
  if (!OSM_TYPES.includes(osmType as OsmType)) {
    throw new Error(`Invalid osmType: ${osmType}`);
  }

  return { osmType: osmType as OsmType, osmId: Number(osmId) };
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  addCorsAndCache(res);
  try {
    const { osmType, osmId } = parseParams(req.query);

    const feature = await getClimbingFeature(osmType, osmId);

    res.status(200).setHeader('Content-Type', 'application/json').send(feature);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};
