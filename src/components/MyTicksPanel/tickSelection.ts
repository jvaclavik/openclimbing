export type SelectionModifiers = {
  shiftKey?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
};

export const modifiersFromEvent = (e: {
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
}): SelectionModifiers => ({
  shiftKey: e.shiftKey,
  metaKey: e.metaKey,
  ctrlKey: e.ctrlKey,
});

export type SelectionState = {
  selectedIds: ReadonlySet<number>;
  /** Last row clicked without SHIFT — start of a SHIFT range. */
  anchorId: number | null;
};

export const EMPTY_SELECTION: SelectionState = {
  selectedIds: new Set(),
  anchorId: null,
};

/**
 * Row click in selection mode:
 * - SHIFT: select everything between the anchor and the clicked row
 *   (in the currently visible order), keeping other selected rows.
 * - plain / CMD / CTRL: toggle the clicked row and make it the new anchor.
 */
export const applySelectionClick = (
  state: SelectionState,
  clickedId: number,
  modifiers: SelectionModifiers,
  orderedIds: readonly number[],
): SelectionState => {
  const next = new Set(state.selectedIds);

  if (modifiers.shiftKey && state.anchorId != null) {
    const from = orderedIds.indexOf(state.anchorId);
    const to = orderedIds.indexOf(clickedId);
    if (from !== -1 && to !== -1) {
      const [start, end] = from < to ? [from, to] : [to, from];
      orderedIds.slice(start, end + 1).forEach((id) => next.add(id));
      return { selectedIds: next, anchorId: state.anchorId };
    }
  }

  if (next.has(clickedId)) {
    next.delete(clickedId);
  } else {
    next.add(clickedId);
  }
  return { selectedIds: next, anchorId: clickedId };
};

export const setSelectionMany = (
  state: SelectionState,
  ids: readonly number[],
  selected: boolean,
): SelectionState => {
  const next = new Set(state.selectedIds);
  ids.forEach((id) => (selected ? next.add(id) : next.delete(id)));
  return { selectedIds: next, anchorId: state.anchorId };
};
