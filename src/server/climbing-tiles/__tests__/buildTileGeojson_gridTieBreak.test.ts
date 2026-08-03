import { buildTileGeojson } from '../buildTileGeojson';
import { ClimbingFeaturesRow } from '../../db/types';

const row = (
  type: string,
  osmId: number,
  routeCount: number,
): ClimbingFeaturesRow =>
  ({
    type,
    osmType: 'relation',
    osmId,
    lon: 1,
    lat: 1,
    nameRaw: type,
    routeCount,
    hasImages: 1,
  }) as ClimbingFeaturesRow;

const typesOf = (rows: ClimbingFeaturesRow[]) =>
  buildTileGeojson(true, rows, [0, 0, 2, 2]).features.map(
    (f) => (f as any).properties.type,
  );

describe('buildTileGeojson optimizeFeaturesToGrid', () => {
  it('keeps the area when it shares the cell and routeCount with its only crag', () => {
    expect(typesOf([row('crag', 1, 21), row('area', 2, 21)])).toEqual(['area']);
    expect(typesOf([row('area', 2, 21), row('crag', 1, 21)])).toEqual(['area']);
  });

  it('still keeps the feature with more routes', () => {
    expect(typesOf([row('area', 2, 21), row('crag', 1, 50)])).toEqual(['crag']);
  });
});
