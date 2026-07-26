import { getFeatureBbox } from '../getCenter';
import { Feature } from '../types';

const feature = (props: Partial<Feature>): Feature =>
  ({
    type: 'Feature',
    osmMeta: { type: 'node', id: 1 },
    tags: {},
    properties: { class: '', subclass: '' },
    ...props,
  }) as Feature;

describe('getFeatureBbox', () => {
  it('returns the bbox from the API untouched', () => {
    const crag = feature({
      center: [14, 50],
      bbox: [1, 2, 3, 4],
      memberFeatures: [feature({ center: [20, 60] })],
    });

    expect(getFeatureBbox(crag)).toEqual([1, 2, 3, 4]);
  });

  it('measures geometry, center and the memberFeatures subtree', () => {
    const crag = feature({
      center: [14, 50],
      memberFeatures: [
        feature({
          center: [14.02, 50.02],
          geometry: {
            type: 'LineString',
            coordinates: [
              [14.01, 50.01],
              [14.03, 49.99],
            ],
          },
        }),
        feature({ memberFeatures: [feature({ center: [13.99, 50.05] })] }),
      ],
    });

    expect(getFeatureBbox(crag)).toEqual([13.99, 49.99, 14.03, 50.05]);
  });

  it('degenerates to a point for a single node', () => {
    expect(getFeatureBbox(feature({ center: [14.5, 50.5] }))).toEqual([
      14.5, 50.5, 14.5, 50.5,
    ]);
  });

  it('returns undefined when there is nothing to measure', () => {
    expect(getFeatureBbox(feature({}))).toBeUndefined();
  });
});
