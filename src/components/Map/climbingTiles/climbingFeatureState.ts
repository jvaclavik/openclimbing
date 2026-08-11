import type { GeoJSONSource, Map, MapSourceDataEvent } from 'maplibre-gl';
import type { Feature } from 'geojson';
import { CLIMBING_TILES_SOURCE } from './consts';

let presentIds = new Set<string | number>();
let hoverReset: (() => void) | null = null;
/** While true, all setFeatureState calls are ignored — source is mid-replace. */
let suspended = false;
let sourceEpoch = 0;

export const registerClimbingHoverReset = (fn: () => void) => {
  hoverReset = fn;
};

export const replaceClimbingFeatureIds = (
  ids: Iterable<string | number | undefined | null>,
) => {
  presentIds = new Set(
    [...ids].filter((id): id is string | number => id != null),
  );
};

export const hasClimbingFeatureId = (id: string | number | undefined | null) =>
  id != null && presentIds.has(id);

export const isClimbingFeatureStateSuspended = () => suspended;

/** map.getSource throws when style is mid-swap (style === undefined). */
export const getClimbingTilesSource = (map: Map | undefined) => {
  if (!map?.getStyle?.()) {
    return undefined;
  }
  try {
    return map.getSource(CLIMBING_TILES_SOURCE) as GeoJSONSource | undefined;
  } catch {
    return undefined;
  }
};

/**
 * Freeze feature-state, clear MapLibre's state map, and bump the epoch so stale
 * async completions cannot re-enable state on an older setData.
 */
export const beginClimbingSourceUpdate = (map: Map | undefined): number => {
  suspended = true;
  sourceEpoch += 1;
  presentIds = new Set();
  hoverReset?.();
  if (getClimbingTilesSource(map)) {
    try {
      map!.removeFeatureState({ source: CLIMBING_TILES_SOURCE });
    } catch {
      // Source may already be mid-replace.
    }
  }
  return sourceEpoch;
};

/**
 * setData + wait until the source (and feature index) is ready, then allow
 * setFeatureState again. Returns false if a newer update superseded this one.
 */
export const commitClimbingSourceData = (
  map: Map | undefined,
  features: Feature[],
  epoch: number,
  onReady?: () => void,
): boolean => {
  if (!map || epoch !== sourceEpoch) {
    return false;
  }

  const source = getClimbingTilesSource(map);
  if (!source) {
    return false;
  }

  const ids = features
    .map((feature) => feature.id)
    .filter((id): id is string | number => id != null);

  source.setData({
    type: 'FeatureCollection',
    features,
  });

  let finished = false;
  const finish = () => {
    if (finished || epoch !== sourceEpoch) {
      return;
    }
    finished = true;
    map.off('sourcedata', onSourceData);
    presentIds = new Set(ids);
    suspended = false;
    onReady?.();
  };

  const onSourceData = (event: MapSourceDataEvent) => {
    if (
      event.sourceId === CLIMBING_TILES_SOURCE &&
      event.isSourceLoaded &&
      epoch === sourceEpoch
    ) {
      // Feature index is built after the source reports loaded.
      requestAnimationFrame(finish);
    }
  };

  map.on('sourcedata', onSourceData);
  // Fallback if sourcedata already fired synchronously / was missed.
  setTimeout(finish, 300);

  return true;
};

/**
 * Queue feature-state only when the climbing-tiles source is stable and the id
 * is in the current GeoJSON. The MapLibre crash is async in coalesceChanges, so
 * try/catch around setFeatureState does not help.
 */
export const setClimbingFeatureState = (
  map: Map | undefined,
  id: string | number | undefined | null,
  state: Record<string, unknown>,
) => {
  if (suspended || !map || id == null || !presentIds.has(id)) {
    return;
  }
  if (!getClimbingTilesSource(map)) {
    return;
  }
  try {
    map.setFeatureState({ source: CLIMBING_TILES_SOURCE, id }, state);
  } catch {
    // Style may have been torn down between the check and apply.
  }
};
