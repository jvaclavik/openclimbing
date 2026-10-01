import { ConvertToRelation, DataItem, TagsEntries } from './types';
import { fetchParentFeatures } from '../../../../services/osm/fetchParentFeatures';
import { getApiId } from '../../../../services/helpers';
import { addEmptyOriginalState, fetchFreshItem } from './itemsHelpers';
import { Setter } from '../../../../types';
import { fetchWays } from '../../../../services/osm/fetchWays';
import { getNewId } from '../../../../services/getCoordsFeature';
import { not } from '../../../../utils';
import { findInItems, isInItems } from './utils';
import { Feature, FeatureTags, LonLat } from '../../../../services/types';
import { isValidLonLat } from '../../Climbing/utils/cragCenter';

export class AlreadyInCragError extends Error {
  constructor(shortId: string) {
    super(`Can't convert ${shortId} which already belongs to a climbing crag.`);
  }
}

const updateMemberLinks = (
  item: DataItem,
  oldShortId: string,
  newRelation: DataItem,
) => {
  if (item.shortId === newRelation.shortId) {
    return item;
  }

  return {
    ...item,
    members: item.members?.map((member) =>
      member.shortId === oldShortId
        ? {
            shortId: newRelation.shortId,
            role: member.role,
          }
        : member,
    ),
  };
};

const copiedClimbingTags = ([k, v]) =>
  k.startsWith('name') ||
  k.startsWith('climbing') ||
  k.startsWith('description') ||
  k.startsWith('wikimedia_commons') ||
  k.startsWith('website') ||
  (k === 'sport' && v === 'climbing');

const toBeRemovedTags = ([k, v]) =>
  k.startsWith('climbing') || (k === 'sport' && v === 'climbing');

const isNew = (item: DataItem) => item.shortId.includes('-');

const tagValue = (entries: TagsEntries, key: string) =>
  entries.find(([k]) => k === key)?.[1];

const isPeak = (item: DataItem) =>
  item.shortId.startsWith('n') &&
  tagValue(item.tagsEntries, 'natural') === 'peak';

const isWay = (item: DataItem) => item.shortId.startsWith('w');

// Cliff line and summit stay separate features. The crag relation does not list them.
const staysBeside = (item: DataItem) => isWay(item) || isPeak(item);

const isCragTags = (tags: FeatureTags | undefined) => tags?.climbing === 'crag';

const isClimbingContainerTags = (tags: FeatureTags | undefined) => {
  if (tags?.climbing === 'crag') return false;
  return tags?.climbing === 'area' || tags?.site === 'climbing';
};

const withCliffTag = (item: DataItem): DataItem => {
  if (!isWay(item) || tagValue(item.tagsEntries, 'climbing') !== 'crag') {
    return item;
  }
  if (item.tagsEntries.some(([key]) => key === 'natural')) {
    return item;
  }
  return {
    ...item,
    tagsEntries: [...item.tagsEntries, ['natural', 'cliff']],
  };
};

const getConversionTags = (node: DataItem, forceKeep: boolean) => {
  const tagsToCopy = node.tagsEntries.filter(copiedClimbingTags);
  const restTags = node.tagsEntries.filter(not(copiedClimbingTags));

  const keepNode = forceKeep || (!isNew(node) && restTags.length > 0);
  const keptTags = keepNode
    ? node.tagsEntries.filter(not(toBeRemovedTags))
    : [];

  return { tagsToCopy, keepNode, keptTags };
};

const relationCenter = (item: DataItem, center: LonLat | undefined) => {
  if (isValidLonLat(item.nodeLonLat)) return item.nodeLonLat;
  if (isValidLonLat(center)) return center;
  return undefined;
};

const parentsToLoad = (features: Feature[], beside: boolean) => {
  if (!beside) return features;
  return features.filter(
    (feature) =>
      isCragTags(feature.tags) || isClimbingContainerTags(feature.tags),
  );
};

export const convertToRelationFactory = (
  setData: Setter<DataItem[]>,
  shortId: string,
  getItem: () => DataItem | undefined = () => undefined,
): ConvertToRelation => {
  return async (center) => {
    const source = getItem();
    const beside = source ? staysBeside(source) : false;
    const parentFeatures = await fetchParentFeatures(getApiId(shortId));

    if (beside && parentFeatures.some((feature) => isCragTags(feature.tags))) {
      throw new AlreadyInCragError(shortId);
    }

    const [parentItems, waysFeatures] = await Promise.all([
      Promise.all(
        parentsToLoad(parentFeatures, beside).map((feature) =>
          fetchFreshItem(feature.osmMeta),
        ),
      ),
      fetchWays(getApiId(shortId)),
    ]);

    if (!beside && shortId.startsWith('n') && waysFeatures.length > 0) {
      throw new Error(`Can't convert node ${shortId} which is part of a way.`);
    }

    const newShortId = `r${getNewId()}`;
    setData((prevData) => {
      const current = findInItems(prevData, shortId);
      const prepared = withCliffTag(current);
      const besideItem = staysBeside(prepared);
      const { tagsToCopy, keepNode, keptTags } = getConversionTags(
        prepared,
        besideItem && !isNew(prepared),
      );

      const newRelation: DataItem = addEmptyOriginalState({
        shortId: newShortId,
        version: undefined,
        tagsEntries: Object.entries(
          Object.fromEntries([
            ['type', 'site'],
            ['site', 'climbing'],
            ...tagsToCopy,
          ]),
        ),
        toBeDeleted: false,
        relationClickedLonLat: relationCenter(prepared, center),
        members: besideItem || !keepNode ? [] : [{ shortId, role: '' }],
        sections: ['members'],
      });

      const newData = prevData.map((item) =>
        item.shortId === shortId
          ? keepNode
            ? { ...item, tagsEntries: keptTags }
            : { ...item, toBeDeleted: true, tagsEntries: [] }
          : item,
      );
      newData.push(newRelation);
      newData.push(
        ...parentItems.filter((parent) => !isInItems(newData, parent.shortId)),
      );

      return newData.map((item) => {
        if (!item.members?.some((member) => member.shortId === shortId)) {
          return item;
        }
        if (
          besideItem &&
          !isClimbingContainerTags(Object.fromEntries(item.tagsEntries))
        ) {
          return item;
        }
        return updateMemberLinks(item, shortId, newRelation);
      });
    });

    return newShortId;
  };
};
