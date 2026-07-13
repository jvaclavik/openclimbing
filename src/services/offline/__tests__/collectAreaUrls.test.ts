import { collectAreaUrls } from '../collectAreaUrls';
import { ClimbingFeatureFull } from '../../../types';

// A crag (relation) at ~Prague with two route children, one carrying a topo
// photo tag. Shape mirrors the GET /api/climbing-tiles/get response.
const crag = {
  type: 'Feature',
  id: 1,
  osmMeta: { type: 'relation', id: 100 },
  tags: { name: 'Test Crag', climbing: 'crag' },
  center: [14.4, 50.08],
  geometry: { type: 'Point', coordinates: [14.4, 50.08] },
  properties: {},
  memberFeatures: [
    {
      type: 'Feature',
      id: 2,
      osmMeta: { type: 'way', id: 201 },
      tags: {
        name: 'Route A',
        climbing: 'route_bottom',
        wikimedia_commons: 'File:Topo A.jpg',
      },
      center: [14.401, 50.081],
      geometry: {
        type: 'LineString',
        coordinates: [
          [14.401, 50.081],
          [14.402, 50.082],
        ],
      },
      properties: {},
    },
    {
      type: 'Feature',
      id: 3,
      osmMeta: { type: 'way', id: 202 },
      tags: { name: 'Route B', climbing: 'route_bottom' },
      center: [14.399, 50.079],
      geometry: { type: 'Point', coordinates: [14.399, 50.079] },
      properties: {},
    },
  ],
} as unknown as ClimbingFeatureFull;

describe('collectAreaUrls', () => {
  const result = collectAreaUrls(crag);

  it('emits a /get URL for the crag and every child', () => {
    expect(result.featureUrls).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          '/api/climbing-tiles/get?osmType=relation&osmId=100',
        ),
        expect.stringContaining(
          '/api/climbing-tiles/get?osmType=way&osmId=201',
        ),
        expect.stringContaining(
          '/api/climbing-tiles/get?osmType=way&osmId=202',
        ),
      ]),
    );
    expect(result.featureCount).toBe(3);
  });

  it('covers the bbox with tiles at zooms 6, 9 and 12', () => {
    const zooms = new Set(
      result.tileUrls.map((u) => new URL(u).searchParams.get('z')),
    );
    expect(zooms).toEqual(new Set(['6', '9', '12']));
    expect(result.tileUrls.length).toBeGreaterThanOrEqual(3);
  });

  it('derives a bbox enclosing all coordinates', () => {
    expect(result.bbox.w).toBeCloseTo(14.399, 3);
    expect(result.bbox.e).toBeCloseTo(14.402, 3);
    expect(result.bbox.s).toBeCloseTo(50.079, 3);
    expect(result.bbox.n).toBeCloseTo(50.082, 3);
  });

  it('builds wikimedia thumbnail URLs for each configured width', () => {
    expect(result.photoCount).toBe(1);
    const widths = result.photoUrls
      .filter((u) => u.includes('Topo_A.jpg'))
      .map((u) => u.match(/\/(\d+)px-/)?.[1]);
    expect(new Set(widths)).toEqual(new Set(['500', '1920']));
    expect(result.photoUrls[0]).toContain('upload.wikimedia.org');
  });
});
