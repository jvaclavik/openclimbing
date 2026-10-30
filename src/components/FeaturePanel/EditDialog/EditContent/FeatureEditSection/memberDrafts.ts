import { getPresetTranslation } from '../../../../../services/tagging/translations';
import { FeatureTags } from '../../../../../services/types';
import { getNewNodeItem } from '../../context/itemsHelpers';
import { DataItem } from '../../context/types';
import { getPresetKey } from '../../context/utils';

const ROUTE_BOTTOM_TAGS = {
  climbing: 'route_bottom',
  sport: 'climbing',
};

const CRAG_TAGS = {
  climbing: 'crag',
  sport: 'climbing',
};

export const getMemberTags = (parentTags: FeatureTags) => {
  if (parentTags.climbing === 'crag') {
    return ROUTE_BOTTOM_TAGS;
  }
  if (parentTags.climbing === 'area') {
    return CRAG_TAGS;
  }
  return {};
};

const applyMissingTags = (tags: FeatureTags, defaults: FeatureTags) => {
  const merged = { ...tags };
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in merged)) merged[key] = value;
  }
  return merged;
};

export const toMemberDraft = (newItem: DataItem) => {
  // TODO this code could be removed, if we lookup the label in render among editItems
  const presetKey = getPresetKey(newItem);
  const presetLabel = getPresetTranslation(presetKey);
  const tags = Object.fromEntries(newItem.tagsEntries);
  return {
    newItem,
    newMember: {
      shortId: newItem.shortId,
      role: '',
      originalLabel: tags.name ?? presetLabel,
      originalTags: tags,
    },
  };
};

// Members from the "key=value, blank line between items" batch format – used by
// the batch form and by pasting into the edit dialog.
export const getTagBatchDrafts = (
  tagBlocks: FeatureTags[],
  parentTags: FeatureTags,
) =>
  tagBlocks.map((tags) =>
    toMemberDraft(
      getNewNodeItem(
        undefined,
        applyMissingTags(tags, getMemberTags(parentTags)),
      ),
    ),
  );
