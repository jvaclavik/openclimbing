import { OsmResponse } from '../overpass/types';
import { getNewRecords } from '../refreshClimbingTiles';

jest.mock('../../db/db', () => ({ getDb: () => undefined }));
jest.mock('next-codegrid', () => ({ resolveCountryCode: jest.fn() }));

const response: OsmResponse = {
  osm3s: { timestamp_osm_base: 'string' },
  elements: [
    {
      type: 'node',
      id: 13991670392,
      lat: 49.040314,
      lon: 11.9750654,
      tags: {
        climbing: 'abseil_route',
        name: 'Abseilstelle',
        sport: 'climbing',
      },
    },
    { type: 'node', id: 1, lat: 49.1, lon: 11.9 },
    { type: 'node', id: 2, lat: 49.2, lon: 11.8 },
    {
      type: 'way',
      id: 3,
      nodes: [1, 2],
      tags: { climbing: 'abseil_route', sport: 'climbing' },
    },
  ],
};

describe('getNewRecords', () => {
  it('treats climbing=abseil_route as a route, not a crag', () => {
    const records = getNewRecords(response, () => {});

    expect(records.map(({ type, osmType }) => `${osmType}:${type}`)).toEqual([
      'node:route',
      'way:route',
    ]);
  });
});
