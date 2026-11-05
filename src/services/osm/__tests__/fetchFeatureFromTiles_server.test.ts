import { OsmId } from '../../types';

jest.mock('../../../components/helpers', () => ({
  isServer: () => true,
  isBrowser: () => false,
}));
jest.mock('../../fetch', () => ({ fetchJson: jest.fn() }));
jest.mock('../osmApi', () => ({
  fetchFeature: jest.fn(async (apiId) => ({ osmMeta: apiId, __fromOsm: true })),
}));
jest.mock('../../tagging/translations', () => ({
  fetchSchemaTranslations: jest.fn(),
}));
jest.mock('../../tagging/idTaggingScheme', () => ({
  addSchemaToFeature: (f: unknown) => f,
}));
jest.mock('../../../server/climbing-tiles/getClimbingFeature', () => ({
  getClimbingFeature: jest.fn((type, id) => ({
    type: 'Feature',
    osmMeta: { type, id },
    __fromSqlite: true,
  })),
}));

const apiId: OsmId = { type: 'way', id: 128322791 };

const load = (climbingTilesHost: string) => {
  jest.resetModules();
  jest.doMock('../consts', () => ({ CLIMBING_TILES_HOST: climbingTilesHost }));
  const { fetchFeatureFromTiles } = require('../fetchFeatureFromTiles');
  const { fetchJson } = require('../../fetch');
  const {
    getClimbingFeature,
  } = require('../../../server/climbing-tiles/getClimbingFeature');
  return { fetchFeatureFromTiles, fetchJson, getClimbingFeature };
};

describe('fetchFeatureFromTiles on the server', () => {
  it('uses the remote API when this host has no SQLite DB (e.g. Vercel)', async () => {
    const { fetchFeatureFromTiles, fetchJson, getClimbingFeature } = load(
      'https://openclimbing.org/',
    );
    fetchJson.mockResolvedValue({ type: 'Feature', osmMeta: apiId });

    const feature = await fetchFeatureFromTiles(apiId);

    expect(fetchJson).toHaveBeenCalledWith(
      'https://openclimbing.org/api/climbing-tiles/get?osmType=way&osmId=128322791',
    );
    expect(getClimbingFeature).not.toHaveBeenCalled();
    expect(feature.osmMeta).toEqual(apiId);
  });

  it('reads the local SQLite DB on the canonical host', async () => {
    const { fetchFeatureFromTiles, fetchJson, getClimbingFeature } = load('/');

    const feature = await fetchFeatureFromTiles(apiId);

    expect(getClimbingFeature).toHaveBeenCalledWith('way', 128322791);
    expect(fetchJson).not.toHaveBeenCalled();
    expect(feature).toMatchObject({ __fromSqlite: true });
  });
});
