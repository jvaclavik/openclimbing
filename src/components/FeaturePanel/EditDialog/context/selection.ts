// Pure helpers for multi-selecting edited items (routes) shared between the
// items tablist and the crag map.

export const toggleSelectedId = (ids: string[], id: string): string[] => {
  if (ids.includes(id)) {
    // Never leave the selection empty — a click that would clear the last
    // selected item keeps it selected instead.
    return ids.length <= 1 ? ids : ids.filter((x) => x !== id);
  }
  return [...ids, id];
};

// Contiguous range in the given order, from the anchor (usually `current`) to
// the clicked target, inclusive. Used for Shift+click.
export const getRangeSelection = (
  orderedIds: string[],
  anchorId: string | undefined,
  targetId: string,
): string[] => {
  const targetIdx = orderedIds.indexOf(targetId);
  if (targetIdx === -1) return anchorId ? [anchorId] : [];
  const anchorIdx = anchorId ? orderedIds.indexOf(anchorId) : -1;
  if (anchorIdx === -1) return [targetId];
  const [lo, hi] =
    anchorIdx <= targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
  return orderedIds.slice(lo, hi + 1);
};
