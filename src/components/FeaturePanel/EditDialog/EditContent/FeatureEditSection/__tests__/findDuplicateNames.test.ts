import { DataItem, Member } from '../../../context/types';
import { findDuplicateNames } from '../findDuplicateNames';

const member = (shortId: string, name?: string): Member => ({
  shortId,
  role: '',
  originalLabel: name ?? 'Climbing route',
  originalTags: name ? { name } : {},
});

const item = (shortId: string, name: string): DataItem => ({
  shortId,
  version: 1,
  tagsEntries: [['name', name]],
  toBeDeleted: false,
  originalState: {
    tags: {},
    isDeleted: false,
    nodeLonLat: undefined,
    nodes: undefined,
    members: [],
  },
  sections: [],
});

describe('findDuplicateNames', () => {
  const members = [member('n1', 'Karinca'), member('n2', 'Sarkıt')];

  it('finds names already used by members, ignoring case and spaces', () => {
    const newMembers = [member('n-1', ' karinca '), member('n-2', 'New one')];

    expect(findDuplicateNames(members, newMembers, [])).toEqual([' karinca ']);
  });

  it('finds names repeated within the added members', () => {
    const newMembers = [member('n-1', 'Twin'), member('n-2', 'Twin')];

    expect(findDuplicateNames(members, newMembers, [])).toEqual(['Twin']);
  });

  it('skips members that are already in the relation and unnamed ones', () => {
    const newMembers = [member('n1', 'Karinca'), member('n-1'), member('n-2')];

    expect(findDuplicateNames(members, newMembers, [])).toEqual([]);
  });

  it('compares with names edited in this session', () => {
    const items = [item('n1', 'Renamed')];

    expect(
      findDuplicateNames(members, [member('n-1', 'Karinca')], items),
    ).toEqual([]);
    expect(
      findDuplicateNames(members, [member('n-1', 'Renamed')], items),
    ).toEqual(['Renamed']);
  });

  it('does not treat a preset label as a name', () => {
    expect(
      findDuplicateNames([member('n1')], [member('n-1', 'Climbing route')], []),
    ).toEqual([]);
  });
});
