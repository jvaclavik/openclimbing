import { filterClimbingTilesFeatures } from '../climbingTilesSource';
import { ClimbingTilesFeature } from '../../../../types';

const pt = (lon = 14, lat = 50) => ({
  type: 'Point' as const,
  coordinates: [lon, lat] as [number, number],
});

const baseParams = {
  isGradeIntervalDefault: false,
  isMinimumRoutesDefault: false,
  climbingTypes: [] as string[],
  inclinations: [] as string[],
  materials: [] as string[],
  familyFriendly: false,
};

describe('filterClimbingTilesFeatures', () => {
  it('does not drop gym/ferrata when other filters are active', () => {
    const features: ClimbingTilesFeature[] = [
      {
        type: 'Feature',
        id: 100,
        geometry: pt(),
        properties: { type: 'gym', name: 'Gym' },
      },
      {
        type: 'Feature',
        id: 200,
        geometry: pt(),
        properties: { type: 'ferrata', name: 'Ferrata' },
      },
    ];

    const filtered = filterClimbingTilesFeatures(features, {
      ...baseParams,
      gradeInterval: [0, 10],
      minimumRoutes: 10,
      isDefaultFilter: false, // e.g. user changed any filter
      poiTypes: { rock: true, ferrata: true, gym: true },
    });

    expect(filtered.map((f) => f.properties.type).sort()).toEqual([
      'ferrata',
      'gym',
    ]);
  });

  it('drops only disabled poi type', () => {
    const features: ClimbingTilesFeature[] = [
      {
        type: 'Feature',
        id: 100,
        geometry: pt(),
        properties: { type: 'gym', name: 'Gym' },
      },
      {
        type: 'Feature',
        id: 200,
        geometry: pt(),
        properties: { type: 'ferrata', name: 'Ferrata' },
      },
    ];

    const filtered = filterClimbingTilesFeatures(features, {
      ...baseParams,
      gradeInterval: [0, 10],
      minimumRoutes: 1,
      isDefaultFilter: false,
      poiTypes: { rock: true, ferrata: true, gym: false },
    });

    expect(filtered.map((f) => f.properties.type)).toEqual(['ferrata']);
  });
});
