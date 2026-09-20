import {
  listTypeFromPoiTypes,
  nextListTypeFromFilter,
} from '../climbingListTypes';

describe('nextListTypeFromFilter', () => {
  it('stays when the current type is still enabled', () => {
    expect(
      nextListTypeFromFilter('rock', {
        rock: true,
        ferrata: true,
        gym: false,
      }),
    ).toBeNull();
  });

  it('switches when exactly one other type is enabled', () => {
    expect(
      nextListTypeFromFilter('rock', {
        rock: false,
        ferrata: true,
        gym: false,
      }),
    ).toBe('ferrata');
  });

  it('falls back to the first enabled type after reset on another page', () => {
    expect(
      nextListTypeFromFilter('gym', {
        rock: true,
        ferrata: true,
        gym: false,
      }),
    ).toBe('rock');
  });

  it('stays when every type is off', () => {
    expect(
      nextListTypeFromFilter('ferrata', {
        rock: false,
        ferrata: false,
        gym: false,
      }),
    ).toBeNull();
  });
});

describe('listTypeFromPoiTypes', () => {
  it('prefers rock when several types are enabled', () => {
    expect(
      listTypeFromPoiTypes({ rock: true, ferrata: true, gym: false }),
    ).toBe('rock');
  });

  it('uses the first enabled type', () => {
    expect(
      listTypeFromPoiTypes({ rock: false, ferrata: true, gym: true }),
    ).toBe('ferrata');
  });

  it('falls back to rock when every type is off', () => {
    expect(
      listTypeFromPoiTypes({ rock: false, ferrata: false, gym: false }),
    ).toBe('rock');
  });
});
