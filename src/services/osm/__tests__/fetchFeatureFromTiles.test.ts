import { fetchFeatureFromTiles } from '../fetchFeatureFromTiles';
import { markFeatureAsRecentlyEdited } from '../recentlyEditedFeatures';
import * as fetch from '../../fetch';
import * as osmApi from '../osmApi';

// browser path (isServer=false -> hits the /api/climbing-tiles/get endpoint)
jest.mock('../../../components/helpers', () => ({
  isServer: () => false,
  isBrowser: () => true,
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

const fetchJson = fetch.fetchJson as jest.Mock;
const fetchFeature = osmApi.fetchFeature as jest.Mock;

const tilesFeature = (apiId: { type: string; id: number }) => ({
  type: 'Feature',
  osmMeta: apiId,
  tags: {},
  center: [14, 50],
  geometry: { type: 'Point', coordinates: [14, 50] },
  properties: { class: 'climbing', subclass: 'climbing' },
});

describe('fetchFeatureFromTiles', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses the climbing-tiles endpoint for a normal feature', async () => {
    fetchJson.mockResolvedValue(tilesFeature({ type: 'node', id: 2 }));

    const feature = await fetchFeatureFromTiles({ type: 'node', id: 2 });

    expect(fetchJson).toHaveBeenCalledWith(
      expect.stringContaining('/api/climbing-tiles/get?osmType=node&osmId=2'),
    );
    expect(fetchFeature).not.toHaveBeenCalled();
    expect(feature.osmMeta).toEqual({ type: 'node', id: 2 });
  });

  it('bypasses tiles and fetches fresh OSM for a recently edited feature', async () => {
    markFeatureAsRecentlyEdited({ type: 'node', id: 1 });

    const feature = await fetchFeatureFromTiles({ type: 'node', id: 1 });

    expect(fetchFeature).toHaveBeenCalledWith({ type: 'node', id: 1 });
    expect(fetchJson).not.toHaveBeenCalled();
    expect(feature).toMatchObject({ __fromOsm: true });
  });

  it('falls back to OSM when the tiles endpoint fails', async () => {
    fetchJson.mockRejectedValue(new Error('500 Server Error'));

    const feature = await fetchFeatureFromTiles({ type: 'way', id: 3 });

    expect(fetchJson).toHaveBeenCalled();
    expect(fetchFeature).toHaveBeenCalledWith({ type: 'way', id: 3 });
    expect(feature).toMatchObject({ __fromOsm: true });
  });
});
