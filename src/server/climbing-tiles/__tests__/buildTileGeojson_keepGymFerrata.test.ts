import { buildTileGeojson } from '../buildTileGeojson';
import { ClimbingFeaturesRow } from '../../db/types';

describe('buildTileGeojson optimizeFeaturesToGrid', () => {
  it('keeps gym even when grid optimization is enabled', () => {
    const rows: ClimbingFeaturesRow[] = [
      {
        type: 'crag',
        osmType: 'node',
        osmId: 1,
        lon: 1,
        lat: 1,
        nameRaw: 'Crag',
        routeCount: 100,
        hasImages: 0,
      },
      {
        type: 'gym',
        osmType: 'node',
        osmId: 2,
        lon: 1,
        lat: 1,
        nameRaw: 'Gym',
        hasImages: 0,
      },
    ];

    const geojson = buildTileGeojson(true, rows, [0, 0, 2, 2]);
    const types = geojson.features.map((f) => (f as any).properties.type);

    expect(types).toContain('crag');
    expect(types).toContain('gym');
  });
});
