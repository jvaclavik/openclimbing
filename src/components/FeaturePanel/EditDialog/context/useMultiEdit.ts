import { useCallback, useMemo } from 'react';
import { useEditContext } from './EditContext';
import { combineTags, CombinedTags } from './combinedTags';
import { EditDataItem } from './types';

const replaceTagKey = (
  entries: [string, string][],
  oldKey: string,
  newKey: string,
): [string, string][] => {
  const index = entries.findIndex(([key]) => key === oldKey);
  if (index === -1) return entries;
  const value = entries[index][1];
  const without = entries.filter((_, i) => i !== index);
  const existing = without.findIndex(([key]) => key === newKey);
  if (existing === -1) {
    const copy = [...without];
    copy.splice(Math.min(index, copy.length), 0, [newKey, value]);
    return copy;
  }
  return without.map((entry, i) => (i === existing ? [newKey, value] : entry));
};

export const useSelectedEditItems = (): EditDataItem[] => {
  const { items, selectedIds, current } = useEditContext();
  return useMemo(() => {
    const selected = items.filter((item) => selectedIds.includes(item.shortId));
    if (selected.length > 1) return selected;
    const currentItem = items.find((item) => item.shortId === current);
    return currentItem ? [currentItem] : [];
  }, [items, selectedIds, current]);
};

// Tag reads/writes for the current selection. With one item this matches
// useCurrentItem(). With several, fields show the shared value (or "multiple
// values") and every write is applied to each selected item — the same model
// as the iD editor.
export const useMultiEdit = () => {
  const targets = useSelectedEditItems();
  const combined: CombinedTags = useMemo(
    () => combineTags(targets.map((item) => item.tags)),
    [targets],
  );

  const setTag = useCallback(
    (key: string, value: string) => {
      targets.forEach((item) => item.setTag(key, value));
    },
    [targets],
  );

  const removeTag = useCallback(
    (key: string) => {
      targets.forEach((item) => {
        item.setTagsEntries((prev) => {
          const index = prev.findIndex(([entryKey]) => entryKey === key);
          if (index === -1) return prev;
          return prev.toSpliced(index, 1);
        });
      });
    },
    [targets],
  );

  const renameTag = useCallback(
    (oldKey: string, newKey: string) => {
      const nextKey = newKey.trim();
      if (!nextKey || nextKey === oldKey) return;
      targets.forEach((item) => {
        item.setTagsEntries((prev) => replaceTagKey(prev, oldKey, nextKey));
      });
    },
    [targets],
  );

  return {
    isMulti: targets.length > 1,
    targets,
    tags: combined.shared,
    mixed: combined.mixed,
    keys: combined.keys,
    setTag,
    removeTag,
    renameTag,
  };
};
