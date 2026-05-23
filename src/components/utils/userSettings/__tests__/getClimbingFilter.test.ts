import { getClimbingFilter } from '../getClimbingFilter';

describe('getClimbingFilter poiTypes', () => {
  it('merges defaults when poiTypes is partial', () => {
    const filter = getClimbingFilter(
      {
        'climbing.gradeSystem': null,
        'climbing.filter': {
          // simulate older persisted settings that only stored one key
          poiTypes: { ferrata: false },
        },
      } as unknown as any,
      ((_key: any, _value: any) => {}) as any,
    );

    expect(filter.poiTypes).toEqual({ rock: true, ferrata: false, gym: false });
    expect(filter.isPoiTypesDefault).toBe(false);
  });

  it('gym is disabled by default', () => {
    const filter = getClimbingFilter(
      {
        'climbing.gradeSystem': null,
      } as unknown as any,
      ((_key: any, _value: any) => {}) as any,
    );

    expect(filter.poiTypes).toEqual({ rock: true, ferrata: true, gym: false });
    expect(filter.isPoiTypesDefault).toBe(true);
  });
});
