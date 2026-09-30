import { fetchParentFeatures } from '../../../../../services/osm/fetchParentFeatures';
import { fetchWays } from '../../../../../services/osm/fetchWays';
import { addEmptyOriginalState, fetchFreshItem } from '../itemsHelpers';
import { getNewId } from '../../../../../services/getCoordsFeature';

import { DataItem } from '../types';
import {
  AlreadyInCragError,
  convertToRelationFactory,
} from '../convertToRelationFactory';
import { FeatureTags } from '../../../../../services/types';

jest.mock('../../../../../services/osm/fetchParentFeatures', () => ({
  fetchParentFeatures: jest.fn(),
}));
jest.mock('../../../../../services/osm/fetchWays', () => ({
  fetchWays: jest.fn(),
}));
jest.mock('../itemsHelpers', () => {
  const actual = jest.requireActual('../itemsHelpers');
  return { ...actual, fetchFreshItem: jest.fn() };
});
jest.mock('../../../../../services/getCoordsFeature', () => ({
  getNewId: jest.fn(),
}));

const item = (
  shortId: string,
  tags: FeatureTags,
  extra: Partial<DataItem> = {},
): DataItem =>
  addEmptyOriginalState({
    shortId,
    version: 1,
    tagsEntries: Object.entries(tags),
    toBeDeleted: false,
    sections: [],
    ...extra,
  });

const peakNode = item(
  'n123',
  {
    natural: 'peak',
    name: 'stays in both',
    climbing: 'crag',
    'climbing:asdf': 'ghj',
    sport: 'climbing',
  },
  { nodeLonLat: [14, 50] },
);

const areaParent = (memberShortId: string) =>
  ({
    shortId: 'r99',
    tagsEntries: [
      ['type', 'site'],
      ['site', 'climbing'],
      ['climbing', 'area'],
    ],
    version: 1,
    toBeDeleted: false,
    members: [{ shortId: memberShortId, role: '' }],
  }) as DataItem;

const parentFeature = (id: number, tags: FeatureTags) => ({
  osmMeta: { type: 'relation' as const, id },
  tags,
});

const convert = async (source: DataItem, center?: [number, number]) => {
  let data = [source];
  const setData = (fn: (prev: DataItem[]) => DataItem[]) => {
    data = fn(data);
  };
  const convertToRelation = convertToRelationFactory(
    setData,
    source.shortId,
    () => data.find((entry) => entry.shortId === source.shortId),
  );
  const newShortId = await convertToRelation(center);
  return { data, newShortId };
};

describe('convertToRelationFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchWays as jest.Mock).mockResolvedValue([]);
    (getNewId as jest.Mock).mockReturnValue(-1);
  });

  it('leaves a peak beside the new relation', async () => {
    (fetchParentFeatures as jest.Mock).mockResolvedValue([
      parentFeature(99, {
        type: 'site',
        site: 'climbing',
        climbing: 'area',
      }),
      parentFeature(50, { type: 'boundary', boundary: 'administrative' }),
    ]);
    (fetchFreshItem as jest.Mock).mockResolvedValue(areaParent('n123'));

    const { data, newShortId } = await convert(peakNode);

    expect(newShortId).toBe('r-1');
    expect(fetchFreshItem).toHaveBeenCalledTimes(1);
    expect(data.map((entry) => entry.shortId)).toEqual(['n123', 'r-1', 'r99']);
    expect(data[0].tagsEntries).toEqual([
      ['natural', 'peak'],
      ['name', 'stays in both'],
    ]);
    expect(data[0].toBeDeleted).toBe(false);
    expect(data[1].tagsEntries).toEqual([
      ['type', 'site'],
      ['site', 'climbing'],
      ['name', 'stays in both'],
      ['climbing', 'crag'],
      ['climbing:asdf', 'ghj'],
      ['sport', 'climbing'],
    ]);
    expect(data[1].members).toEqual([]);
    expect(data[1].relationClickedLonLat).toEqual([14, 50]);
    expect(data[2].members).toEqual([{ shortId: 'r-1', role: '' }]);
  });

  it('converts a peak that is also a way vertex', async () => {
    (fetchParentFeatures as jest.Mock).mockResolvedValue([]);
    (fetchWays as jest.Mock).mockResolvedValue([{}]);

    const { data } = await convert(peakNode);

    expect(data[0].toBeDeleted).toBe(false);
    expect(data[1].members).toEqual([]);
  });

  it('throws when a non-peak node is part of a way', async () => {
    (fetchParentFeatures as jest.Mock).mockResolvedValue([]);
    (fetchWays as jest.Mock).mockResolvedValue([{}]);

    const cragNode = item('n123', {
      name: 'crag node',
      climbing: 'crag',
      sport: 'climbing',
    });

    await expect(convert(cragNode)).rejects.toThrow(
      "Can't convert node n123 which is part of a way.",
    );
  });

  it('keeps a non-peak node as a member of the relation', async () => {
    (fetchParentFeatures as jest.Mock).mockResolvedValue([
      parentFeature(99, { type: 'site' }),
    ]);
    (fetchFreshItem as jest.Mock).mockResolvedValue({
      shortId: 'r99',
      tagsEntries: [['type', 'site']],
      version: 1,
      toBeDeleted: false,
      members: [{ shortId: 'n123', role: 'summit' }],
    });

    const stoneNode = item(
      'n123',
      {
        natural: 'stone',
        name: 'boulder',
        climbing: 'crag',
        sport: 'climbing',
      },
      { nodeLonLat: [14, 50] },
    );

    const { data } = await convert(stoneNode);

    expect(data[0].tagsEntries).toEqual([
      ['natural', 'stone'],
      ['name', 'boulder'],
    ]);
    expect(data[1].members).toEqual([{ shortId: 'n123', role: '' }]);
    expect(data[2].members).toEqual([{ shortId: 'r-1', role: 'summit' }]);
  });

  it('converts a cliff way and leaves it beside the relation', async () => {
    (fetchParentFeatures as jest.Mock).mockResolvedValue([
      parentFeature(99, {
        type: 'site',
        site: 'climbing',
        climbing: 'area',
      }),
      parentFeature(50, { type: 'boundary', boundary: 'administrative' }),
    ]);
    (fetchFreshItem as jest.Mock).mockResolvedValue(areaParent('w55'));

    const cliffWay = item(
      'w55',
      {
        climbing: 'crag',
        'climbing:rock': 'limestone',
        name: 'Hühnersteinwand',
        natural: 'cliff',
        sport: 'climbing',
        website: 'https://www.thecrag.com/example',
      },
      { nodes: [1, 2, 3] },
    );

    const { data, newShortId } = await convert(cliffWay, [12, 49]);

    expect(newShortId).toBe('r-1');
    expect(fetchFreshItem).toHaveBeenCalledTimes(1);
    expect(data[0].tagsEntries).toEqual([
      ['name', 'Hühnersteinwand'],
      ['natural', 'cliff'],
      ['website', 'https://www.thecrag.com/example'],
    ]);
    expect(data[0].nodes).toEqual([1, 2, 3]);
    expect(data[0].toBeDeleted).toBe(false);
    expect(data[1].tagsEntries).toEqual([
      ['type', 'site'],
      ['site', 'climbing'],
      ['climbing', 'crag'],
      ['climbing:rock', 'limestone'],
      ['name', 'Hühnersteinwand'],
      ['sport', 'climbing'],
      ['website', 'https://www.thecrag.com/example'],
    ]);
    expect(data[1].members).toEqual([]);
    expect(data[1].relationClickedLonLat).toEqual([12, 49]);
    expect(data[2].members).toEqual([{ shortId: 'r-1', role: '' }]);
  });

  it('adds natural=cliff when the crag way has no natural tag', async () => {
    (fetchParentFeatures as jest.Mock).mockResolvedValue([]);

    const cragWay = item(
      'w55',
      {
        climbing: 'crag',
        name: 'Wand',
        sport: 'climbing',
      },
      { nodes: [4, 5] },
    );

    const { data } = await convert(cragWay);

    expect(data[0].tagsEntries).toEqual([
      ['name', 'Wand'],
      ['natural', 'cliff'],
    ]);
    expect(data[1].members).toEqual([]);
  });

  it('refuses to convert a cliff that already belongs to a crag', async () => {
    (fetchParentFeatures as jest.Mock).mockResolvedValue([
      parentFeature(77, {
        type: 'site',
        site: 'climbing',
        climbing: 'crag',
      }),
    ]);

    const cliffWay = item('w55', {
      climbing: 'crag',
      natural: 'cliff',
      name: 'Wand',
    });
    let data = [cliffWay];
    const setData = jest.fn((fn: (prev: DataItem[]) => DataItem[]) => {
      data = fn(data);
    });
    const convertToRelation = convertToRelationFactory(
      setData,
      'w55',
      () => cliffWay,
    );

    await expect(convertToRelation()).rejects.toBeInstanceOf(
      AlreadyInCragError,
    );
    expect(setData).not.toHaveBeenCalled();
    expect(fetchFreshItem).not.toHaveBeenCalled();
  });
});
