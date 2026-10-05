import { fetchAncestorFeatures } from '../fetchParentFeatures';
import * as fetch from '../../fetch';
import * as idTaggingScheme from '../../tagging/idTaggingScheme';

jest.mock('../../fetch', () => ({
  fetchJson: jest.fn(),
}));

jest.mock('../../tagging/idTaggingScheme', () => ({
  addSchemaToFeature: jest.fn((feature) => feature),
}));

const relation = (
  id: number,
  members: { type: string; ref: number; role: string }[],
) => ({
  type: 'relation',
  id,
  tags: { climbing: 'area', name: String(id) },
  members,
});

const member = (ref: number) => ({ type: 'relation', ref, role: '' });

describe('fetchAncestorFeatures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(idTaggingScheme, 'addSchemaToFeature')
      .mockImplementation((feature) => feature);
  });

  it('walks every area branch, nearest first', async () => {
    jest.spyOn(fetch, 'fetchJson').mockImplementation((url: string) => {
      const id = Number(url.match(/relation\/(\d+)/)?.[1]);
      const parents = {
        4: [relation(3, [member(4)]), relation(5, [member(4)])],
        3: [relation(2, [member(3)])],
        5: [],
        2: [relation(1, [member(2)])],
        1: [],
      }[id];
      return Promise.resolve({ elements: parents ?? [] });
    });

    const ancestors = await fetchAncestorFeatures({
      type: 'relation',
      id: 4,
    });

    expect(ancestors.map((parent) => parent.osmMeta.id)).toEqual([3, 5, 2, 1]);
    expect(fetch.fetchJson).toHaveBeenCalledTimes(5);
  });
});
