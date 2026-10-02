import React, { useRef } from 'react';
import { useCurrentItem, useEditContext } from '../context/EditContext';
import { getApiId, getShortId } from '../../../../services/helpers';
import { fetchFreshItem } from '../context/itemsHelpers';
import { Feature } from '../../../../services/types';
import { DataItem, EditDataItem } from '../context/types';
import { isInItems } from '../context/utils';
import { getRangeSelection, toggleSelectedId } from '../context/selection';
import { useEnsureEditItems } from '../context/useEnsureEditItems';

// Opens an item, and participates in the multi-selection. Shift+click selects
// the range in `orderedIds` (route list, parents, …). Ctrl/Cmd+click loads the
// item into the dialog and toggles it in the selection, but leaves the open
// item in place so the member/parent list stays usable.
export const useHandleItemClick = (orderedIds?: string[]) => {
  const { setCurrent, setSelectedIds, current, selectedIds } = useEditContext();
  const ensureItems = useEnsureEditItems();
  const orderedRef = useRef(orderedIds);
  orderedRef.current = orderedIds;
  const currentRef = useRef(current);
  currentRef.current = current;
  const selectedRef = useRef(selectedIds);
  selectedRef.current = selectedIds;

  return async (event: React.MouseEvent, shortId: string) => {
    const ordered = orderedRef.current;
    const idsAtClick = selectedRef.current;
    const currentAtClick = currentRef.current;

    try {
      if (event.shiftKey && ordered?.length) {
        event.preventDefault();
        const anchor = ordered.includes(currentAtClick)
          ? currentAtClick
          : [...idsAtClick].reverse().find((id) => ordered.includes(id));
        const range = getRangeSelection(ordered, anchor, shortId);
        await ensureItems(range);
        setSelectedIds(range);
        setCurrent(shortId);
        return;
      }

      if (event.metaKey || event.ctrlKey) {
        event.preventDefault();
        await ensureItems([shortId]);
        setSelectedIds((prev) => toggleSelectedId(prev, shortId));
        return;
      }

      if (event.shiftKey) {
        event.preventDefault();
        await ensureItems([shortId]);
        const wasSelected = idsAtClick.includes(shortId);
        const next = toggleSelectedId(idsAtClick, shortId);
        setSelectedIds(next);
        if (!wasSelected) {
          setCurrent(shortId);
        } else if (shortId === currentAtClick && next.length > 0) {
          setCurrent(next[next.length - 1]);
        }
        return;
      }

      await ensureItems([shortId]);
      setSelectedIds([shortId]);
      setCurrent(shortId);
    } catch {
      // A failed fetch leaves the previous selection in place.
    }
  };
};

const addAllItems = async (
  shortIds: string[],
  addItem: (newItem: DataItem) => void,
  items: Array<EditDataItem>,
) => {
  const promises = shortIds
    .filter((shortId) => !isInItems(items, shortId))
    .map((shortId) => fetchFreshItem(getApiId(shortId)));

  const newItems = await Promise.all(promises);
  newItems.forEach((item) => addItem(item));
};

export const useHandleOpenAllParents = (parents: Feature[]) => {
  const { addItem, items } = useEditContext();
  const shortIds = parents.map((parent) => getShortId(parent.osmMeta));

  return async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addAllItems(shortIds, addItem, items);
  };
};

export const useHandleOpenAllMembers = () => {
  const { members } = useCurrentItem();
  const { addItem, items } = useEditContext();
  const shortIds = members?.map(({ shortId }) => shortId);

  if (!members || members.length < 2) {
    return undefined;
  }

  if (members.every((member) => isInItems(items, member.shortId))) {
    return undefined;
  }

  return async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addAllItems(shortIds, addItem, items);
  };
};
