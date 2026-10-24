import {
  countStartPhotos,
  findParentCrag,
  getCragRoutes,
  getNextRouteWithoutStartPhoto,
} from '../startPhotoRoutes';
import { EditDataItem, Member } from '../../../../context/types';
import { START_PHOTO_KEY } from '../../../../../Climbing/utils/photo';

const route = (shortId: string, startPhoto?: string) => ({
  shortId,
  tags: {
    climbing: 'route_bottom',
    name: shortId,
    ...(startPhoto ? { [START_PHOTO_KEY]: startPhoto } : {}),
  },
});

const members: Member[] = [
  { shortId: 'n1', role: '', originalTags: route('n1').tags },
  { shortId: 'n2', role: '', originalTags: route('n2', 'File:2.jpg').tags },
  { shortId: 'n3', role: '', originalTags: route('n3').tags },
  { shortId: 'n4', role: '', originalTags: { natural: 'peak' } },
];

const item = (shortId: string, tags: Record<string, string>, m?: Member[]) =>
  ({ shortId, tags, members: m }) as unknown as EditDataItem;

describe('getCragRoutes', () => {
  it('keeps the crag order, skips non-routes and prefers edited tags', () => {
    const items = [item('n3', route('n3', 'File:just uploaded.jpg').tags)];
    const routes = getCragRoutes(members, items);

    expect(routes.map(({ shortId }) => shortId)).toEqual(['n1', 'n2', 'n3']);
    expect(countStartPhotos(routes)).toBe(2);
  });

  it('handles a crag without members', () => {
    expect(getCragRoutes(undefined, [])).toEqual([]);
  });
});

describe('getNextRouteWithoutStartPhoto', () => {
  const routes = [route('a'), route('b', 'File:b.jpg'), route('c'), route('d')];

  it('starts at the beginning', () => {
    expect(getNextRouteWithoutStartPhoto(routes)?.shortId).toBe('a');
  });

  it('continues after the current route, skipping done ones', () => {
    expect(getNextRouteWithoutStartPhoto(routes, 'a')?.shortId).toBe('c');
    expect(getNextRouteWithoutStartPhoto(routes, 'c')?.shortId).toBe('d');
  });

  it('wraps around to the routes skipped at the beginning', () => {
    expect(getNextRouteWithoutStartPhoto(routes, 'd')?.shortId).toBe('a');
  });

  it('never returns the current route', () => {
    expect(
      getNextRouteWithoutStartPhoto(
        [route('a'), route('b', 'File:b.jpg')],
        'a',
      ),
    ).toBeUndefined();
  });

  it('returns nothing when all routes are done', () => {
    expect(
      getNextRouteWithoutStartPhoto([route('a', 'File:a.jpg')]),
    ).toBeUndefined();
  });
});

describe('findParentCrag', () => {
  it('finds the crag item which has the route as a member', () => {
    const crag = item('r1', { climbing: 'crag' }, members);
    const items = [item('n1', route('n1').tags), crag];

    expect(findParentCrag(items, 'n1')).toBe(crag);
    expect(findParentCrag(items, 'n9')).toBeUndefined();
  });
});
