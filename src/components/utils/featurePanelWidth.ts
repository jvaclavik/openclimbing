import { useEffect, useState } from 'react';
import { useUserSettingsContext } from './userSettings/UserSettingsContext';
import { useMobileMode } from '../helpers';

export const FEATURE_PANEL_WIDTH = 480; // default
export const FEATURE_PANEL_MIN_WIDTH = 360;
export const FEATURE_PANEL_MAX_WIDTH = 900;
const MIN_MAP_WIDTH = 240; // keep some map visible next to the panel

const CSS_VARIABLE = '--feature-panel-width';

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

export const useFeaturePanelWidth = () => {
  const [width, setWidth] = useState(FEATURE_PANEL_WIDTH); // SSR-safe
  useEffect(() => {
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
  const { userSettings } = useUserSettingsContext();
  const preferred = userSettings['panel.width'] ?? FEATURE_PANEL_WIDTH;
  const viewportWidth = useViewportWidth();
  const isMobileMode = useMobileMode();

  useEffect(() => {
    setFeaturePanelWidth(
      isMobileMode
        ? FEATURE_PANEL_WIDTH
        : clampFeaturePanelWidth(preferred, viewportWidth),
    );
  }, [isMobileMode, preferred, viewportWidth]);

  return null;
};
