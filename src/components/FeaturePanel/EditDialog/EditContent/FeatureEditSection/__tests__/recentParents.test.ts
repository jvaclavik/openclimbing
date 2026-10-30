import { getRecentParents, rememberParent } from '../recentParents';

describe('recentParents', () => {
  beforeEach(() => window.localStorage.clear());

  it('keeps the most recently linked parents first, without duplicates', () => {
    rememberParent('r1', { climbing: 'area', name: 'Adršpach' });
    rememberParent('r2', { climbing: 'area', name: 'Teplice' });
    rememberParent('r1', { climbing: 'area', name: 'Adršpach' });

    expect(getRecentParents('area').map(({ shortId }) => shortId)).toEqual([
      'r1',
      'r2',
    ]);
  });

  it('separates areas from crags', () => {
    rememberParent('r1', { climbing: 'area', name: 'Adršpach' });
    rememberParent('r3', { climbing: 'crag', name: 'Starosta' });

    expect(getRecentParents('crag')).toEqual([
      { shortId: 'r3', name: 'Starosta', type: 'crag' },
    ]);
  });

  it('skips new relations and other types', () => {
    rememberParent('r-5', { climbing: 'area', name: 'New' });
    rememberParent('r6', { type: 'route', name: 'Bus' });

    expect(getRecentParents('area')).toEqual([]);
  });
});
