import {
  canHaveStartPhoto,
  getNextWikimediaCommonsIndex,
  getWikimediaCommonsPhotoTags,
  hasStartPhoto,
  hasWikimediaCommonsSlot,
  START_PHOTO_KEY,
} from '../photo';
import { FeatureTags } from '../../../../../services/types';

describe('getNextWikimediaCommonsIndex', () => {
  it('should return 0 when there are no wikimedia_commons keys', () => {
    const tags: FeatureTags = {};
    expect(getNextWikimediaCommonsIndex(tags)).toBe(0);
  });

  it('should return 1 when there is one wikimedia_commons key', () => {
    const tags: FeatureTags = { wikimedia_commons: 'File:example.jpg' };
    expect(getNextWikimediaCommonsIndex(tags)).toBe(1);
  });

  it('should return the next index when there are multiple wikimedia_commons keys', () => {
    const tags: FeatureTags = {
      wikimedia_commons: 'File:example1.jpg',
      'wikimedia_commons:2': 'File:example2.jpg',
    };
    expect(getNextWikimediaCommonsIndex(tags)).toBe(2);
  });

  it('should handle non-numeric wikimedia_commons keys correctly', () => {
    const tags: FeatureTags = {
      wikimedia_commons: 'File:example1.jpg',
      'wikimedia_commons:path': 'some/path',
    };
    expect(getNextWikimediaCommonsIndex(tags)).toBe(1);
  });

  it('should handle gaps in the sequence of wikimedia_commons keys', () => {
    const tags: FeatureTags = {
      wikimedia_commons: 'File:example1.jpg',
      'wikimedia_commons:3': 'File:example3.jpg',
    };
    expect(getNextWikimediaCommonsIndex(tags)).toBe(3);
  });
});

describe('start photo', () => {
  const route: FeatureTags = {
    climbing: 'route_bottom',
    wikimedia_commons: 'File:Crag.jpg',
    'wikimedia_commons:path': '0.1,0.9|0.2,0.1',
  };

  it('is recognised only when filled in', () => {
    expect(hasStartPhoto(route)).toBe(false);
    expect(
      hasStartPhoto({ ...route, [START_PHOTO_KEY]: 'File:Start.jpg' }),
    ).toBe(true);
    expect(hasStartPhoto({ ...route, [START_PHOTO_KEY]: '  ' })).toBe(false);
    expect(hasStartPhoto(undefined)).toBe(false);
  });

  it('is not a photo slot which routes are drawn on', () => {
    const onlyStart = {
      climbing: 'route_bottom',
      [START_PHOTO_KEY]: 'File:S.jpg',
    };
    expect(hasWikimediaCommonsSlot(onlyStart)).toBe(false);
    expect(hasWikimediaCommonsSlot(route)).toBe(true);
    expect(getWikimediaCommonsPhotoTags(onlyStart)).toEqual([]);
  });

  it('does not take a numbered slot', () => {
    expect(
      getNextWikimediaCommonsIndex({
        ...route,
        [START_PHOTO_KEY]: 'File:Start.jpg',
      }),
    ).toBe(1);
  });

  it('belongs to routes only', () => {
    expect(canHaveStartPhoto({ climbing: 'route_bottom' })).toBe(true);
    expect(canHaveStartPhoto({ climbing: 'route' })).toBe(true);
    expect(canHaveStartPhoto({ climbing: 'route_top' })).toBe(false);
    expect(canHaveStartPhoto({ climbing: 'crag' })).toBe(false);
  });
});
