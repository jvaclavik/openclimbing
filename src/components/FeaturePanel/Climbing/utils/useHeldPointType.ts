import { useEffect, useRef } from 'react';
import { PointType } from '../types';
import { isTypingInFormField } from '../../../../helpers/hooks';

const POINT_TYPE_SHORTCUTS: Record<string, PointType> = {
  b: 'bolt',
  a: 'anchor',
  s: 'sling',
  p: 'piton',
  u: 'unfinished',
};

// Tracks a point-type shortcut key (b/a/s/p/u) held down while drawing, so a
// freshly placed point can be created with that type immediately.
export const useHeldPointType = (isEditMode: boolean) => {
  const heldPointTypeRef = useRef<PointType | null>(null);

  useEffect(() => {
    if (!isEditMode) {
      heldPointTypeRef.current = null;
      return undefined;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingInFormField(e.target)) return;
      if (e.metaKey || e.ctrlKey) return;
      const type = POINT_TYPE_SHORTCUTS[e.key];
      if (type) heldPointTypeRef.current = type;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const type = POINT_TYPE_SHORTCUTS[e.key];
      if (type && heldPointTypeRef.current === type) {
        heldPointTypeRef.current = null;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      heldPointTypeRef.current = null;
    };
  }, [isEditMode]);

  return heldPointTypeRef;
};
