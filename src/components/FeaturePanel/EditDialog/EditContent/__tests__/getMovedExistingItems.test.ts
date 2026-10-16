import { LonLat } from '../../../../../services/types';
import { DataItem } from '../../context/types';
import { getMovedExistingItems } from '../getMovedExistingItems';

const ORIGINAL: LonLat = [30.5, 37.0];

type Options = { originalLonLat?: LonLat | null; toBeDeleted?: boolean };

const node = (
  shortId: string,
  nodeLonLat: LonLat | undefined,
  { originalLonLat = ORIGINAL, toBeDeleted = false }: Options = {},
): DataItem => ({
  shortId,
  version: shortId.includes('-') ? undefined : 1,
  tagsEntries: [['climbing', 'route_bottom']],
  toBeDeleted,
  originalState: {
    tags: { climbing: 'route_bottom' },
    isDeleted: false,
    nodeLonLat: originalLonLat ?? undefined,
    nodes: undefined,
    members: [],
  },
  sections: [],
  nodeLonLat,
});

describe('getMovedExistingItems', () => {
  it('reports an existing node moved by the distribute tool', () => {
    const moved = node('n1', [30.5, 37.0003]);

    expect(getMovedExistingItems([moved])).toEqual([
      { item: moved, meters: 33 },
    ]);
  });

  it('ignores moves under one meter', () => {
    expect(getMovedExistingItems([node('n1', [30.5, 37.000001])])).toEqual([]);
  });

  it('ignores new, deleted and unlocated nodes', () => {
    const items = [
      node('n-1', [30.5, 37.0003]),
      node('n2', [30.5, 37.0003], { toBeDeleted: true }),
      node('n3', [30.5, 37.0003], { originalLonLat: null }),
      node('n4', undefined),
    ];

    expect(getMovedExistingItems(items)).toEqual([]);
  });
});
