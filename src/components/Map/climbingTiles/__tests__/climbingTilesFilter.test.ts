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
  photoDrawn: 'any' as const,
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

  it('filters crags by hasImages (map marker colour)', () => {
    const features: ClimbingTilesFeature[] = [
      {
        type: 'Feature',
        id: 1,
        geometry: pt(),
        properties: {
          type: 'crag',
          name: 'With photo',
          routeCount: 5,
          hasImages: true,
          histogramCode: 'x',
        },
      },
      {
        type: 'Feature',
        id: 2,
        geometry: pt(),
        properties: {
          type: 'crag',
          name: 'Without photo',
          routeCount: 5,
          hasImages: false,
          histogramCode: 'x',
        },
      },
    ];

    const without = filterClimbingTilesFeatures(features, {
      ...baseParams,
      gradeInterval: [0, 75],
      minimumRoutes: 1,
      isDefaultFilter: false,
      isGradeIntervalDefault: true,
      isMinimumRoutesDefault: true,
      poiTypes: { rock: true, ferrata: true, gym: true },
      photoDrawn: 'without',
    });
    expect(without.map((f) => f.properties.name)).toEqual(['Without photo']);

    const withPhoto = filterClimbingTilesFeatures(features, {
      ...baseParams,
      gradeInterval: [0, 75],
      minimumRoutes: 1,
      isDefaultFilter: false,
      isGradeIntervalDefault: true,
      isMinimumRoutesDefault: true,
      poiTypes: { rock: true, ferrata: true, gym: true },
      photoDrawn: 'with',
    });
    expect(withPhoto.map((f) => f.properties.name)).toEqual(['With photo']);
  });
});
