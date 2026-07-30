/**
 * Plain store shared between the React tree (search dropdown) and the map
 * source. It deliberately has no imports – it is loaded during SSR as well,
 * unlike `poiCategoriesSource.ts`, which touches `window` and maplibre.
 */

export type PoiCategoriesStatus = {
  loading: boolean;
  zoomTooLow: boolean;
  /** Number of active categories which need a higher zoom than the current one. */
  hiddenByZoom: number;
  count: number;
  error: string | null;
};

type Listener<T> = (value: T) => void;

const subscribeTo = <T>(listeners: Set<Listener<T>>, listener: Listener<T>) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

let activeKeys: string[] = [];
const keysListeners = new Set<Listener<string[]>>();

export const getActivePoiCategories = () => activeKeys;

export const setActivePoiCategories = (keys: string[]) => {
  activeKeys = keys;
  keysListeners.forEach((listener) => listener(keys));
};

export const subscribeActivePoiCategories = (listener: Listener<string[]>) =>
  subscribeTo(keysListeners, listener);

let status: PoiCategoriesStatus = {
  loading: false,
  zoomTooLow: false,
  hiddenByZoom: 0,
  count: 0,
  error: null,
};
const statusListeners = new Set<Listener<PoiCategoriesStatus>>();

export const getPoiCategoriesStatus = () => status;

export const setPoiCategoriesStatus = (
  partial: Partial<PoiCategoriesStatus>,
) => {
  const next = { ...status, ...partial };
  const changed = Object.keys(next).some((key) => next[key] !== status[key]);
  if (!changed) {
    return; // keeps the snapshot referentially stable for React subscribers
  }
  status = next;
  statusListeners.forEach((listener) => listener(status));
};

export const subscribePoiCategoriesStatus = (
  listener: Listener<PoiCategoriesStatus>,
) => subscribeTo(statusListeners, listener);
