import { OsmResponse } from '../overpass/types';
import { getNewRecords } from '../refreshClimbingTiles';

jest.mock('../../db/db', () => ({ getDb: () => undefined }));
jest.mock('next-codegrid', () => ({ resolveCountryCode: jest.fn() }));

const getTypes = (response: OsmResponse) =>
  getNewRecords(response, () => {}).map(
    ({ osmType, osmId, type }) => `${osmType}/${osmId}:${type}`,
  );

describe('getNewRecords - elements without own climbing tags', () => {
  it('skips natural=peak which is only a geometry node of a climbing* way', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        {
          type: 'node',
          id: 1499407286,
          lat: 47.2956865,
          lon: 11.3434741,
          tags: { natural: 'peak', name: 'Brandjochkreuz', ele: '2268' },
        },
        { type: 'node', id: 2, lat: 47.29, lon: 11.34 },
        {
          type: 'way',
          id: 136666845,
          nodes: [1499407286, 2],
          tags: { highway: 'path', 'climbing:grade:uiaa': '3' },
        },
      ],
    };

    expect(getTypes(response)).toEqual([]);
  });

  it('keeps natural=peak which is a member of a climbing relation', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        {
          type: 'node',
          id: 1499407286,
          lat: 47.2956865,
          lon: 11.3434741,
          tags: { natural: 'peak', name: 'Brandjochkreuz' },
        },
        {
          type: 'relation',
          id: 10,
          members: [{ type: 'node', ref: 1499407286, role: '' }],
          tags: { climbing: 'area', name: 'Area' },
        },
      ],
    };

    expect(getTypes(response)).toEqual([
      'node/1499407286:crag',
      'relation/10:area',
    ]);
  });

  it('keeps natural=peak tagged with climbing itself', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        {
          type: 'node',
          id: 3,
          lat: 47.29,
          lon: 11.34,
          tags: { natural: 'peak', 'climbing:sport': '5' },
        },
      ],
    };

    expect(getTypes(response)).toEqual(['node/3:crag']);
  });

  it('skips a building which is only a member of a non-climbing relation', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        {
          type: 'node',
          id: 4,
          lat: 47.29,
          lon: 11.34,
          tags: { building: 'yes', name: 'Hut' },
        },
        {
          type: 'relation',
          id: 11,
          members: [{ type: 'node', ref: 4, role: '' }],
          tags: { type: 'mountain_range' },
        },
      ],
    };

    expect(getTypes(response)).toEqual([]);
  });

  it('keeps a gym with leisure + sport=climbing', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        {
          type: 'node',
          id: 5,
          lat: 47.29,
          lon: 11.34,
          tags: { leisure: 'sports_centre', sport: 'climbing', name: 'Gym' },
        },
      ],
    };

    expect(getTypes(response)).toEqual(['node/5:gym']);
  });
});
