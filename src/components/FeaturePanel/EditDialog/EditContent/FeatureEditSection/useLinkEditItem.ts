import { getApiId } from '../../../../../services/helpers';
import { getPresetTranslation } from '../../../../../services/tagging/translations';
import { useCurrentItem, useEditContext } from '../../context/EditContext';
import { fetchFreshItem } from '../../context/itemsHelpers';
import { FeatureTags } from '../../../../../services/types';
import { Member } from '../../context/types';
import { findInItems, getPresetKey, isInItems } from '../../context/utils';

const memberFromItem = (
  shortId: string,
  tags?: FeatureTags,
  fallbackLabel?: string,
): Member => ({
  shortId,
  role: '',
  originalLabel: tags?.name ?? fallbackLabel,
  originalTags: tags,
});

export const useLinkEditItem = () => {
  const { items, addItem } = useEditContext();
  const current = useCurrentItem();

  const addAsMember = async (shortId: string) => {
    if (!current || shortId === current.shortId) return false;
    if (current.members?.some((member) => member.shortId === shortId)) {
      return false;
    }

    const existing = findInItems(items, shortId);
    if (existing) {
      current.setMembers((prev) => [
        ...(prev ?? []),
        memberFromItem(shortId, existing.tags, existing.presetLabel),
      ]);
      return true;
    }

    const newItem = await fetchFreshItem(getApiId(shortId));
    if (!isInItems(items, shortId)) {
      addItem(newItem);
    }
    const tags = Object.fromEntries(newItem.tagsEntries);
    const label = tags.name ?? getPresetTranslation(getPresetKey(newItem));
    current.setMembers((prev) => [
      ...(prev ?? []),
      memberFromItem(shortId, tags, label),
    ]);
    return true;
  };

  const addAsParent = async (parentShortId: string) => {
    if (!current || parentShortId === current.shortId) return false;
    if (!parentShortId.startsWith('r')) return false;

    const existing = findInItems(items, parentShortId);
    if (existing) {
      if (
        existing.members?.some((member) => member.shortId === current.shortId)
      ) {
        return false;
      }
      existing.setMembers((prev) => [
        ...(prev ?? []),
        memberFromItem(current.shortId, current.tags, current.presetLabel),
      ]);
      return true;
    }

    const newItem = await fetchFreshItem(getApiId(parentShortId));
    if (!newItem.shortId.startsWith('r')) return false;
    const alreadyLinked = newItem.members?.some(
      (member) => member.shortId === current.shortId,
    );
    if (!isInItems(items, parentShortId)) {
      addItem({
        ...newItem,
        members: alreadyLinked
          ? newItem.members
          : [
              ...(newItem.members ?? []),
              memberFromItem(
                current.shortId,
                current.tags,
                current.presetLabel,
              ),
            ],
      });
    }
    return true;
  };

  return { addAsMember, addAsParent };
};
