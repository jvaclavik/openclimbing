import { OsmResponse } from '../types';
import { overpassToGeojsons } from '../overpassToGeojsons';

// mirrors relation/20948435 - a climbing site with a parking node and an
// approach path reaching far north of the boulders
const response: OsmResponse = {
  osm3s: { timestamp_osm_base: 'string' },
  elements: [
    {
      type: 'node',
      id: 1,
      lat: 45.71,
      lon: 4.592,
      tags: { climbing: 'route', name: 'south boulder' },
    },
    {
      type: 'node',
      id: 2,
      lat: 45.711,
      lon: 4.594,
      tags: { climbing: 'route', name: 'north boulder' },
    },
    {
      type: 'node',
      id: 3,
      lat: 45.713,
      lon: 4.59,
      tags: { amenity: 'parking', site: 'climbing', type: 'site' },
    },
    {
      type: 'node',
      id: 4,
      lat: 45.715,
      lon: 4.596,
      tags: {},
    },
    {
      type: 'way',
      id: 5,
      nodes: [4],
      tags: { highway: 'path', route: 'hiking', path: 'climbing_access' },
    },
    {
      type: 'relation',
      id: 6,
      members: [
        { type: 'node', ref: 1, role: '' },
        { type: 'node', ref: 2, role: '' },
        { type: 'node', ref: 3, role: 'parking' },
        { type: 'way', ref: 5, role: '' },
      ],
      tags: {
        climbing: 'area',
        name: 'Yzeron - Cascade',
        site: 'climbing',
        sport: 'climbing',
        type: 'site',
      },
    },
  ],
};

test('site relation is centered by its climbing members only', () => {
  const [area] = overpassToGeojsons(response, () => {}).relation;

  expect(area.center[0]).toBeCloseTo(4.593, 6);
  expect(area.center[1]).toBeCloseTo(45.7105, 6);
});
