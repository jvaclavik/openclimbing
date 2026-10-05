import { groupParentFeatures } from '../parentHierarchy';

const relation = (
  id: number,
  members: { type: string; ref: number }[] = [],
) => ({
  osmMeta: { type: 'relation' as const, id },
  members,
  tags: { name: String(id) },
});

const member = (id: number) => ({ type: 'relation', ref: id });

describe('groupParentFeatures', () => {
  it('orders a chain from the largest area to the direct parent', () => {
    const area = relation(1, [member(2)]);
    const crag = relation(2, [member(3)]);
    const route = relation(3);

    expect(groupParentFeatures(route, [crag, area])).toEqual([[area], [crag]]);
  });

  it('puts a second direct parent beside the longer chain (A > B > C E)', () => {
    const A = relation(1, [member(2)]);
    const B = relation(2, [member(3)]);
    const C = relation(3, [member(4)]);
    const E = relation(5, [member(4)]);
    const D = relation(4);

    // E is listed before C on purpose — the longer chain still leads.
    expect(groupParentFeatures(D, [E, C, B, A])).toEqual([[A], [B], [C, E]]);
  });

  it('keeps a parent that also contains the feature only at its furthest level', () => {
    const A = relation(1, [member(2), member(4)]);
    const B = relation(2, [member(4)]);
    const D = relation(4);

    expect(groupParentFeatures(D, [B, A])).toEqual([[A], [B]]);
  });

  it('reverses a nearest-first list when members are missing', () => {
    const crag = relation(2);
    const area = relation(1);

    expect(groupParentFeatures(relation(3), [crag, area])).toEqual([
      [area],
      [crag],
    ]);
  });

  it('returns one level for a single parent and nothing when there are none', () => {
    const parent = relation(1, [member(2)]);
    expect(groupParentFeatures(relation(2), [parent])).toEqual([[parent]]);
    expect(groupParentFeatures(relation(2), [])).toEqual([]);
  });
});
