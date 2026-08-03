import { useEffect, useState } from 'react';
import type { Snap } from './drawerSnap';

/**
 * Stacking for map chrome:
 *   hamburger            1500
 *   bottom-right raised  1300  (layers panel open – button must stay on top)
 *   drawer / layers      1200
 *   bottom-right default 1100  (under the feature/page drawer)
 */
export const BOTTOM_RIGHT_Z_DEFAULT = 1100;
export const BOTTOM_RIGHT_Z_RAISED = 1300;
export const LAYERS_DRAWER_Z = 1200;

type ChromeState = {
  layersOpen: boolean;
  drawerPeek: boolean;
  drawerSnap: Snap | null;
};

type Listener = (state: ChromeState) => void;

const listeners = new Set<Listener>();
const state: ChromeState = {
  layersOpen: false,
  drawerPeek: false,
  drawerSnap: null,
};

const emit = () => {
  listeners.forEach((listener) => listener({ ...state }));
};

export const setLayersPanelOpen = (open: boolean) => {
  if (state.layersOpen === open) return;
  state.layersOpen = open;
  emit();
};

/** Current mobile sheet snap; null when no drawer is mounted. */
export const setDrawerSnap = (snap: Snap | null) => {
  const peek = snap === 'quarter';
  if (state.drawerSnap === snap && state.drawerPeek === peek) return;
  state.drawerSnap = snap;
  state.drawerPeek = peek;
  emit();
};

export const useMapChrome = () => {
  const [chrome, setChrome] = useState<ChromeState>(state);

  useEffect(() => {
    const listener: Listener = (next) => setChrome(next);
    listeners.add(listener);
    setChrome({ ...state });
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return chrome;
};
