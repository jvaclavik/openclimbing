import { filterClimbingTilesFeatures } from '../climbingTilesSource';
import { ClimbingTilesFeature } from '../../../../types';

const pt = (lon = 14, lat = 50) => ({
  type: 'Point' as const,
  coordinates: [lon, lat] as [number, number],
});

const baseParams = {
  isGradeIntervalDefault: false,
  isMinimumRoutesDefault: false,
  isLengthIntervalDefault: true,
  climbingTypes: [] as string[],
  inclinations: [] as string[],
  materials: [] as string[],
  familyFriendly: false,
  photoDrawn: 'any' as const,
  lengthInterval: [0, 100] as [number, number],
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

  it('filters individual routes by climbing:length like grades', () => {
    const features: ClimbingTilesFeature[] = [
      {
        type: 'Feature',
        id: 1004, // relation/100
        geometry: pt(),
        properties: {
          type: 'crag',
          name: 'Crag',
          routeCount: 3,
          histogramCode: 'x',
          lengthMin: 10,
          lengthMax: 80,
        },
      },
      {
        type: 'Feature',
        id: 11,
        geometry: pt(),
        properties: {
          type: 'route',
          name: 'Short',
          parentId: 100,
          gradeId: 20,
          gradeTxt: '6',
          lengthMin: 12,
          lengthMax: 12,
        },
      },
      {
        type: 'Feature',
        id: 21,
        geometry: pt(),
        properties: {
          type: 'route',
          name: 'Long',
          parentId: 100,
          gradeId: 20,
          gradeTxt: '6',
          lengthMin: 80,
          lengthMax: 80,
        },
      },
      {
        type: 'Feature',
        id: 31,
        geometry: pt(),
        properties: {
          type: 'route',
          name: 'Unknown',
          parentId: 100,
          gradeId: 20,
          gradeTxt: '6',
        },
      },
    ];

    const filtered = filterClimbingTilesFeatures(features, {
      ...baseParams,
      gradeInterval: [0, 75],
      minimumRoutes: 1,
      isDefaultFilter: false,
      isGradeIntervalDefault: true,
      isMinimumRoutesDefault: true,
      isLengthIntervalDefault: false,
      lengthInterval: [0, 40],
      poiTypes: { rock: true, ferrata: true, gym: true },
    });

    expect(filtered.map((f) => f.properties.name).sort()).toEqual([
      'Crag',
      'Short',
      'Unknown',
    ]);
  });

  it('hides crag when all known child lengths are outside the filter', () => {
    const features: ClimbingTilesFeature[] = [
      {
        type: 'Feature',
        id: 1004,
        geometry: pt(),
        properties: {
          type: 'crag',
          name: 'Only long',
          routeCount: 1,
          histogramCode: 'x',
          // stale/wrong aggregate would otherwise keep it visible
          lengthMin: 10,
          lengthMax: 80,
        },
      },
      {
        type: 'Feature',
        id: 11,
        geometry: pt(),
        properties: {
          type: 'route',
          name: 'Long',
          parentId: 100,
          gradeId: 20,
          lengthMin: 80,
          lengthMax: 80,
        },
      },
    ];

    const filtered = filterClimbingTilesFeatures(features, {
      ...baseParams,
      gradeInterval: [0, 75],
      minimumRoutes: 1,
      isDefaultFilter: false,
      isGradeIntervalDefault: true,
      isMinimumRoutesDefault: true,
      isLengthIntervalDefault: false,
      lengthInterval: [0, 40],
      poiTypes: { rock: true, ferrata: true, gym: true },
    });

    expect(filtered.map((f) => f.properties.name)).toEqual([]);
  });

  it('hides crags/areas without any length data when length filter is active', () => {
    const features: ClimbingTilesFeature[] = [
      {
        type: 'Feature',
        id: 1,
        geometry: pt(),
        properties: {
          type: 'crag',
          name: 'Unknown length',
          routeCount: 5,
          histogramCode: 'x',
        },
      },
      {
        type: 'Feature',
        id: 2,
        geometry: pt(),
        properties: {
          type: 'crag',
          name: 'Long only',
          routeCount: 5,
          histogramCode: 'x',
          lengthMin: 80,
          lengthMax: 90,
        },
      },
      {
        type: 'Feature',
        id: 3,
        geometry: pt(),
        properties: {
          type: 'crag',
          name: 'Short',
          routeCount: 5,
          histogramCode: 'x',
          lengthMin: 20,
          lengthMax: 40,
        },
      },
    ];

    const filtered = filterClimbingTilesFeatures(features, {
      ...baseParams,
      gradeInterval: [0, 75],
      minimumRoutes: 1,
      isDefaultFilter: false,
      isGradeIntervalDefault: true,
      isMinimumRoutesDefault: true,
      isLengthIntervalDefault: false,
      lengthInterval: [0, 40],
      poiTypes: { rock: true, ferrata: true, gym: true },
    });

    expect(filtered.map((f) => f.properties.name)).toEqual(['Short']);
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
