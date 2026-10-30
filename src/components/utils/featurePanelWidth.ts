import { useEffect, useLayoutEffect, useState } from 'react';
import { useMobileMode } from '../helpers';

export const FEATURE_PANEL_WIDTH = 480; // default
export const FEATURE_PANEL_MIN_WIDTH = 320; // homepage gallery fits one column
export const FEATURE_PANEL_MAX_WIDTH = 900;
const MIN_MAP_WIDTH = 240; // keep some map visible next to the panel

const CSS_VARIABLE = '--feature-panel-width';
const STORAGE_KEY = 'featurePanelWidth';

// For styled components – falls back to the default before the first sync (SSR).
export const FEATURE_PANEL_WIDTH_CSS = `var(${CSS_VARIABLE}, ${FEATURE_PANEL_WIDTH}px)`;

export const getFeaturePanelMaxWidth = (viewportWidth: number) =>
  Math.max(
    FEATURE_PANEL_MIN_WIDTH,
    Math.min(FEATURE_PANEL_MAX_WIDTH, viewportWidth - MIN_MAP_WIDTH),
  );

export const clampFeaturePanelWidth = (width: number, viewportWidth: number) =>
  Math.min(
    Math.max(width, FEATURE_PANEL_MIN_WIDTH),
    getFeaturePanelMaxWidth(viewportWidth),
  );

// Module-level store, so both React (useFeaturePanelWidth) and vanilla map code
// (getFeaturePanelWidth) read the live width – also while the user drags.
let currentWidth = FEATURE_PANEL_WIDTH;
const listeners = new Set<() => void>();

export const getFeaturePanelWidth = () => currentWidth;

export const setFeaturePanelWidth = (width: number) => {
  if (width === currentWidth) return;
  currentWidth = width;
  document.documentElement.style.setProperty(CSS_VARIABLE, `${width}px`);
  listeners.forEach((listener) => listener());
};

// The width the user dragged to. Kept in its own localStorage key (read
// synchronously on start), so the panel doesn't jump from the default on load.
const readPreferredWidth = (): number => {
  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    return stored > 0 ? stored : FEATURE_PANEL_WIDTH;
  } catch {
    return FEATURE_PANEL_WIDTH; // storage blocked
  }
};

const preferredListeners = new Set<(width: number) => void>();

export const saveFeaturePanelWidth = (width: number) => {
  const rounded = Math.round(width);
  try {
    window.localStorage.setItem(STORAGE_KEY, String(rounded));
  } catch {
    // storage blocked – keep it for this session only
  }
  preferredListeners.forEach((listener) => listener(rounded));
};

export const useFeaturePanelWidth = () => {
  const [width, setWidth] = useState(FEATURE_PANEL_WIDTH); // SSR-safe
  useLayoutEffect(() => {
    const listener = () => setWidth(currentWidth);
    listener();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return width;
};

export const useViewportWidth = () => {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? Infinity : window.innerWidth,
  );

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return viewportWidth;
};

// Applies the user's preferred width, shrunk to fit narrower windows. Mobile
// mode shows panels in a drawer, so only the search box uses the default there.
export const FeaturePanelWidthSync = () => {
  const [preferred, setPreferred] = useState(FEATURE_PANEL_WIDTH); // SSR-safe
  const viewportWidth = useViewportWidth();

  useLayoutEffect(() => {
    setPreferred(readPreferredWidth());
    preferredListeners.add(setPreferred);
    return () => {
      preferredListeners.delete(setPreferred);
    };
  }, []);

  const isMobileMode = useMobileMode();

  // before paint, so the stored width shows up without a jump from the default
  useLayoutEffect(() => {
    setFeaturePanelWidth(
      isMobileMode
        ? FEATURE_PANEL_WIDTH
        : clampFeaturePanelWidth(preferred, viewportWidth),
    );
  }, [isMobileMode, preferred, viewportWidth]);

  return null;
};
