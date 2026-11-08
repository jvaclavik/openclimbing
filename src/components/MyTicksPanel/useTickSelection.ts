import { useCallback, useMemo, useState } from 'react';
import {
  applySelectionClick,
  EMPTY_SELECTION,
  SelectionModifiers,
  SelectionState,
  setSelectionMany,
} from './tickSelection';

export type TickSelection = {
  active: boolean;
  selectedIds: ReadonlySet<number>;
  start: () => void;
  stop: () => void;
  clear: () => void;
  click: (
    id: number,
    modifiers: SelectionModifiers,
    orderedIds: readonly number[],
  ) => void;
  setMany: (ids: readonly number[], selected: boolean) => void;
};

export const useTickSelection = (): TickSelection => {
  const [active, setActive] = useState(false);
  const [state, setState] = useState<SelectionState>(EMPTY_SELECTION);

  const start = useCallback(() => setActive(true), []);
  const clear = useCallback(() => setState(EMPTY_SELECTION), []);
  const stop = useCallback(() => {
    setActive(false);
    setState(EMPTY_SELECTION);
  }, []);
  const click = useCallback<TickSelection['click']>(
    (id, modifiers, orderedIds) =>
      setState((prev) => applySelectionClick(prev, id, modifiers, orderedIds)),
    [],
  );
  const setMany = useCallback<TickSelection['setMany']>(
    (ids, selected) =>
      setState((prev) => setSelectionMany(prev, ids, selected)),
    [],
  );

  return useMemo(
    () => ({
      active,
      selectedIds: state.selectedIds,
      start,
      stop,
      clear,
      click,
      setMany,
    }),
    [active, state.selectedIds, start, stop, clear, click, setMany],
  );
};
