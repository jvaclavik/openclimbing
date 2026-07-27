import { useCallback, useEffect, useRef, useState } from 'react';
import { ClimbingRoute, PathPoints } from '../types';
import { Setter } from '../../../../types';

type EditableState = {
  routes: Array<ClimbingRoute>;
  protectionPointsByPhoto: Record<string, PathPoints>;
};

const MAX_UNDO_HISTORY = 100;

type Props = {
  isEditMode: boolean;
  routes: Array<ClimbingRoute>;
  protectionPointsByPhoto: Record<string, PathPoints>;
  setRoutes: Setter<ClimbingRoute[]>;
  setProtectionPointsByPhoto: Setter<Record<string, PathPoints>>;
  setPointSelectedIndex: Setter<number>;
  setProtectionPointSelectedIndex: Setter<number | null>;
  // While true (e.g. dragging a point), intermediate changes are coalesced
  // into a single undo step instead of one per mouse move.
  isCoalescing: boolean;
};

/**
 * Full undo/redo history for a climbing editing session. It steps back across
 * every action and route. One drawing click = one step; a whole drag gesture
 * (many mouse-move updates) collapses into a single step via `isCoalescing`.
 * Because each edit produces new immutable route/protection objects, states are
 * stored as plain references (no cloning) and compared by reference identity.
 */
export const useEditUndoHistory = ({
  isEditMode,
  routes,
  protectionPointsByPhoto,
  setRoutes,
  setProtectionPointsByPhoto,
  setPointSelectedIndex,
  setProtectionPointSelectedIndex,
  isCoalescing,
}: Props) => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoStackRef = useRef<Array<EditableState>>([]);
  const redoStackRef = useRef<Array<EditableState>>([]);
  const lastCommittedRef = useRef<EditableState | null>(null);
  const isRestoringRef = useRef(false);

  useEffect(() => {
    if (!isEditMode) return;
    undoStackRef.current = [];
    redoStackRef.current = [];
    lastCommittedRef.current = { routes, protectionPointsByPhoto };
    isRestoringRef.current = false;
    setCanUndo(false);
    setCanRedo(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;
    const current: EditableState = { routes, protectionPointsByPhoto };

    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      lastCommittedRef.current = current;
      return;
    }

    // Suspend recording during a drag gesture: keep the pre-drag state as the
    // baseline so the whole gesture becomes one undo step once it ends.
    if (isCoalescing) return;

    const prev = lastCommittedRef.current;
    if (prev === null) {
      lastCommittedRef.current = current;
      return;
    }

    const changed =
      prev.routes !== current.routes ||
      prev.protectionPointsByPhoto !== current.protectionPointsByPhoto;
    if (!changed) return;

    undoStackRef.current.push(prev);
    if (undoStackRef.current.length > MAX_UNDO_HISTORY) {
      undoStackRef.current.shift();
    }
    // A fresh edit invalidates the redo history.
    redoStackRef.current = [];
    lastCommittedRef.current = current;
    setCanUndo(true);
    setCanRedo(false);
  }, [routes, protectionPointsByPhoto, isEditMode, isCoalescing]);

  const restore = useCallback(
    (state: EditableState) => {
      isRestoringRef.current = true;
      setRoutes(state.routes);
      setProtectionPointsByPhoto(state.protectionPointsByPhoto);
      setPointSelectedIndex(null);
      setProtectionPointSelectedIndex(null);
    },
    [
      setRoutes,
      setProtectionPointsByPhoto,
      setPointSelectedIndex,
      setProtectionPointSelectedIndex,
    ],
  );

  const undo = useCallback(() => {
    const undoStack = undoStackRef.current;
    if (undoStack.length === 0) return;
    const previousState = undoStack.pop();
    if (lastCommittedRef.current) {
      redoStackRef.current.push(lastCommittedRef.current);
    }
    restore(previousState);
    setCanUndo(undoStack.length > 0);
    setCanRedo(true);
  }, [restore]);

  const redo = useCallback(() => {
    const redoStack = redoStackRef.current;
    if (redoStack.length === 0) return;
    const nextState = redoStack.pop();
    if (lastCommittedRef.current) {
      undoStackRef.current.push(lastCommittedRef.current);
    }
    restore(nextState);
    setCanRedo(redoStack.length > 0);
    setCanUndo(true);
  }, [restore]);

  return { undo, redo, canUndo, canRedo };
};
