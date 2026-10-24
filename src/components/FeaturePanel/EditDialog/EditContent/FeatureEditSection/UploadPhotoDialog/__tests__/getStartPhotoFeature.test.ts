import { getStartPhotoFeature } from '../getStartPhotoFeature';
import { Feature } from '../../../../../../../services/types';

const route = {
  osmMeta: { type: 'node', id: 2 },
  tags: { climbing: 'route_bottom', name: 'Old name' },
  center: [14.1, 50.1],
} as unknown as Feature;

const crag = {
  osmMeta: { type: 'relation', id: 1 },
  tags: { climbing: 'crag', name: 'Crag' },
  center: [14, 50],
  countryCode: 'cz',
  memberFeatures: [route],
  parentFeatures: [],
} as unknown as Feature;

describe('getStartPhotoFeature', () => {
  it('keeps the opened feature', () => {
    expect(getStartPhotoFeature(route, { shortId: 'n2', tags: {} })).toBe(
      route,
    );
  });

  it('uses the route of the opened crag, with the edited tags', () => {
    const tags = { climbing: 'route_bottom', name: 'New name' };
    const result = getStartPhotoFeature(crag, { shortId: 'n2', tags });

    expect(result.osmMeta).toEqual({ type: 'node', id: 2 });
    expect(result.center).toEqual([14.1, 50.1]);
    expect(result.tags).toBe(tags);
    expect(result.parentFeatures).toEqual([crag]);
    expect(result.countryCode).toBe('cz');
  });

  it('falls back to the crag for a route not loaded with it', () => {
    const tags = { climbing: 'route_bottom', name: 'Brand new' };
    const result = getStartPhotoFeature(crag, { shortId: 'n-1', tags });

    expect(result.osmMeta).toEqual(crag.osmMeta);
    expect(result.tags).toBe(tags);
    expect(result.parentFeatures).toEqual([crag]);
  });
});
