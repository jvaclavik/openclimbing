import { useCallback, useRef } from 'react';
import { getApiId } from '../../../../services/helpers';
import { fetchFreshItem } from './itemsHelpers';
import { useEditContext } from './EditContext';
import { isInItems } from './utils';

// Loads edit-dialog items that are not in the session yet (e.g. a route picked
// from the crag map). New local items (negative ids) are never fetched.
export const useEnsureEditItems = () => {
  const { items, addItem } = useEditContext();
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const pendingRef = useRef(new Set<string>());

  return useCallback(
    async (shortIds: string[]) => {
      const missing = [...new Set(shortIds)].filter((shortId) => {
        if (isInItems(itemsRef.current, shortId)) return false;
        if (pendingRef.current.has(shortId)) return false;
        return getApiId(shortId).id > 0;
      });
      if (!missing.length) return;

      missing.forEach((shortId) => pendingRef.current.add(shortId));
      try {
        const fresh = await Promise.all(
          missing.map((shortId) => fetchFreshItem(getApiId(shortId))),
        );
        fresh.forEach((item) => {
          if (!isInItems(itemsRef.current, item.shortId)) addItem(item);
        });
      } finally {
        missing.forEach((shortId) => pendingRef.current.delete(shortId));
      }
    },
    [addItem],
  );
};
