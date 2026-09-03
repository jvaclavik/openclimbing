import { OsmResponse } from '../overpass/types';
import { getNewRecords } from '../refreshClimbingTiles';

jest.mock('../../db/db', () => ({ getDb: () => undefined }));
jest.mock('next-codegrid', () => ({ resolveCountryCode: jest.fn() }));

const response: OsmResponse = {
  osm3s: { timestamp_osm_base: 'string' },
  elements: [
    {
      type: 'node',
      id: 10,
      lat: 49.04,
      lon: 11.97,
      tags: {
        natural: 'cliff',
        sport: 'via_ferrata',
        via_ferrata: 'start',
        name: 'Via Ferrata du Belvédère',
      },
    },
    { type: 'node', id: 1, lat: 49.1, lon: 11.9 },
    { type: 'node', id: 2, lat: 49.2, lon: 11.8 },
    {
      type: 'way',
      id: 3,
      nodes: [1, 2],
      tags: { highway: 'path', via_ferrata_scale: '2+', name: 'Nordwandsteig' },
    },
    { type: 'node', id: 4, lat: 49.3, lon: 11.7 },
    { type: 'node', id: 5, lat: 49.4, lon: 11.6 },
    {
      type: 'way',
      id: 6,
      nodes: [4, 5],
      tags: { highway: 'via_ferrata' },
    },
    {
      type: 'relation',
      id: 7,
      members: [{ type: 'way', ref: 6, role: '' }],
      tags: { route: 'via_ferrata', name: 'Klettersteig' },
    },
    {
      type: 'relation',
      id: 8,
      members: [{ type: 'way', ref: 3, role: '' }],
      tags: { sport: 'via_ferrata', name: 'Ferrata delle Taccole' },
    },
  ],
};

describe('getNewRecords', () => {
  it('keeps all via ferrata elements from the osmium filter', () => {
    const records = getNewRecords(response, () => {});

    expect(records.map(({ type, osmType }) => `${osmType}:${type}`)).toEqual([
      'node:ferrata',
      'way:route',
      'way:route',
      'relation:ferrata',
      'relation:ferrata',
    ]);
  });
});
