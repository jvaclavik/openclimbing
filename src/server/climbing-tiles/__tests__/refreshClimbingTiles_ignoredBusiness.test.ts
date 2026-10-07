import { OsmResponse } from '../overpass/types';
import { getNewRecords } from '../refreshClimbingTiles';

jest.mock('../../db/db', () => ({ getDb: () => undefined }));
jest.mock('next-codegrid', () => ({ resolveCountryCode: jest.fn() }));

const getTypes = (response: OsmResponse) =>
  getNewRecords(response, () => {}).map(
    ({ osmType, osmId, type }) => `${osmType}/${osmId}:${type}`,
  );

// shop=*/office=*/club=* is allowed to carry sport=climbing, but a business or
// venue is not a climbing spot
describe('getNewRecords - shops', () => {
  it('skips the bolting.eu shop (shop=sports + sport=climbing)', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        {
          type: 'node',
          id: 11161437176,
          lat: 47.2642047,
          lon: 11.3801187,
          tags: {
            'addr:city': 'Innsbruck',
            'addr:housenumber': '4',
            'addr:postcode': '6020',
            'addr:street': 'Fischnalerstraße',
            email: 'office@bolting.eu',
            name: 'bolting.eu',
            phone: '+4369919083372',
            shop: 'sports',
            sport: 'climbing',
            website: 'https://bolting.eu',
          },
        },
      ],
    };

    expect(getTypes(response)).toEqual([]);
  });

  it('skips a shop with sport=climbing regardless of the shop value', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 49.1,
          lon: 11.9,
          tags: { shop: 'outdoor', sport: 'climbing', name: 'De Steenuil' },
        },
        {
          type: 'node',
          id: 2,
          lat: 49.2,
          lon: 11.8,
          tags: { shop: 'clothes', sport: 'climbing', name: 'Columbia' },
        },
        {
          type: 'node',
          id: 3,
          lat: 49.3,
          lon: 11.7,
          tags: { shop: 'rental', sport: 'climbing' },
        },
      ],
    };

    expect(getTypes(response)).toEqual([]);
  });

  it('skips a way and a relation tagged with shop + sport=climbing', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        { type: 'node', id: 1, lat: 49.1, lon: 11.9 },
        { type: 'node', id: 2, lat: 49.2, lon: 11.8 },
        {
          type: 'way',
          id: 3,
          nodes: [1, 2],
          tags: { building: 'yes', shop: 'sports', sport: 'climbing' },
        },
        { type: 'node', id: 4, lat: 49.3, lon: 11.7 },
        { type: 'node', id: 5, lat: 49.4, lon: 11.6 },
        {
          type: 'way',
          id: 6,
          nodes: [4, 5],
          tags: { shop: 'sports', sport: 'climbing' },
        },
        {
          type: 'relation',
          id: 7,
          members: [{ type: 'way', ref: 6, role: '' }],
          tags: { shop: 'sports', sport: 'climbing', name: 'Shop' },
        },
      ],
    };

    expect(getTypes(response)).toEqual([]);
  });

  it('treats opening_hours/phone/addr:street as gym hints, not as business tags', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 49.1,
          lon: 11.9,
          tags: {
            name: 'MonkeyPark Harrachov',
            opening_hours: 'Mo-Su 10:00-20:00',
            sport: 'climbing',
          },
        },
        {
          type: 'node',
          id: 2,
          lat: 49.2,
          lon: 11.8,
          tags: {
            name: 'The Climbing Station',
            phone: '+44 1509 217 636',
            sport: 'climbing',
          },
        },
        {
          type: 'node',
          id: 3,
          lat: 49.3,
          lon: 11.7,
          tags: {
            name: 'Southampton Climbing Wall',
            'addr:street': 'St Marys Road',
            sport: 'climbing',
          },
        },
      ],
    };

    expect(getTypes(response).sort()).toEqual([
      'node/1:gym',
      'node/2:gym',
      'node/3:gym',
    ]);
  });

  it('keeps a crag with sport=climbing and no business tags', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 49.1,
          lon: 11.9,
          tags: { sport: 'climbing', name: 'Rock' },
        },
      ],
    };

    expect(getTypes(response)).toEqual(['node/1:crag']);
  });

  it('still keeps a climbing gym tagged with leisure even when it has a shop tag', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 49.1,
          lon: 11.9,
          tags: {
            leisure: 'sports_centre',
            shop: 'outdoor',
            sport: 'climbing',
            name: 'Seattle Bouldering Project',
          },
        },
      ],
    };

    expect(getTypes(response)).toEqual(['node/1:gym']);
  });

  it('keeps a real crag way with opening_hours (business tags only apply to the ambiguous sport=climbing fallback)', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        { type: 'node', id: 1, lat: 49.1, lon: 11.9 },
        { type: 'node', id: 2, lat: 49.2, lon: 11.8 },
        {
          type: 'way',
          id: 3,
          nodes: [1, 2],
          tags: {
            climbing: 'crag',
            sport: 'climbing',
            opening_hours: '24/7',
            name: 'Fels',
          },
        },
      ],
    };

    expect(getTypes(response)).toEqual(['way/3:crag']);
  });

  it('treats a building node as a gym in the sport=climbing fallback, but not a building+shop', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 49.1,
          lon: 11.9,
          tags: { building: 'yes', sport: 'climbing', name: 'Kletterhalle' },
        },
        {
          type: 'node',
          id: 2,
          lat: 49.2,
          lon: 11.8,
          tags: {
            building: 'yes',
            shop: 'sports',
            sport: 'climbing',
            name: 'Shop',
          },
        },
      ],
    };

    expect(getTypes(response)).toEqual(['node/1:gym']);
  });
});

// office=* / club=* are venues/businesses too - they must not become crags either
describe('getNewRecords - office and club', () => {
  it('skips a sport=climbing node tagged with office or club', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 49.1,
          lon: 11.9,
          tags: {
            name: 'Climbing Federation',
            office: 'association',
            sport: 'climbing',
          },
        },
        {
          type: 'node',
          id: 2,
          lat: 49.2,
          lon: 11.8,
          tags: {
            name: 'Climbing Club',
            club: 'sport',
            sport: 'climbing',
          },
        },
      ],
    };

    expect(getTypes(response)).toEqual([]);
  });

  it('skips way and relation tagged with office/club + sport=climbing', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        { type: 'node', id: 1, lat: 49.1, lon: 11.9 },
        { type: 'node', id: 2, lat: 49.2, lon: 11.8 },
        {
          type: 'way',
          id: 3,
          nodes: [1, 2],
          tags: { office: 'company', sport: 'climbing' },
        },
        { type: 'node', id: 4, lat: 49.3, lon: 11.7 },
        { type: 'node', id: 5, lat: 49.4, lon: 11.6 },
        {
          type: 'way',
          id: 6,
          nodes: [4, 5],
          tags: { club: 'sport', sport: 'climbing' },
        },
        {
          type: 'relation',
          id: 7,
          members: [{ type: 'way', ref: 6, role: '' }],
          tags: { office: 'association', sport: 'climbing', name: 'Club' },
        },
      ],
    };

    expect(getTypes(response)).toEqual([]);
  });

  it('still keeps a climbing gym tagged with leisure when it also has office/club', () => {
    const response: OsmResponse = {
      osm3s: { timestamp_osm_base: '' },
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 49.1,
          lon: 11.9,
          tags: {
            leisure: 'sports_centre',
            club: 'sport',
            office: 'company',
            sport: 'climbing',
            name: 'Climbing Hall',
          },
        },
      ],
    };

    expect(getTypes(response)).toEqual(['node/1:gym']);
  });
});
