import type { Map, MapGeoJSONFeature } from 'maplibre-gl';
import { CLIMBING_TILES_SOURCE } from '../climbingTiles/consts';

const isFeatureIndexCrash = (error: unknown) =>
  error instanceof Error &&
  error.message.includes('feature index out of bounds');

/** Drop feature-state on every vector source (orphaned VT ids crash MapLibre). */
export const clearVectorTileFeatureStates = (map: Map | undefined) => {
  const sources = map?.getStyle()?.sources;
  if (!map || !sources) {
    return;
  }
  for (const [sourceId, source] of Object.entries(sources)) {
    if (source.type !== 'vector') {
      continue;
    }
    try {
      map.removeFeatureState({ source: sourceId });
    } catch {
      // Source may be mid-reload.
    }
  }
};

/**
 * setFeatureState on vector-tile features. Prefer removeFeatureState for clears
 * when the tile may already be gone — per-id setFeatureState then crashes in render.
 */
export const setVectorTileFeatureState = (
  map: Map,
  feature: MapGeoJSONFeature | null | undefined,
  state: Record<string, unknown>,
) => {
  if (!feature || feature.id == null || !feature.source) {
    return;
  }
  if (feature.source === CLIMBING_TILES_SOURCE) {
    return; // use setClimbingFeatureState instead
  }
  try {
    map.setFeatureState(feature, state);
  } catch {
    // Synchronous failures only; the common crash is async in _render.
  }
};

/**
 * Clear one vector-tile feature's state. removeFeatureState(id) is safe even
 * when the tile is gone; setFeatureState(false) is not (async paint crash).
 */
export const clearVectorTileFeature = (
  map: Map,
  feature: MapGeoJSONFeature | null | undefined,
) => {
  if (
    !feature?.source ||
    feature.id == null ||
    feature.source === CLIMBING_TILES_SOURCE
  ) {
    return;
  }
  try {
    map.removeFeatureState({
      source: feature.source,
      sourceLayer: feature.sourceLayer,
      id: feature.id,
    });
  } catch {
    // ignore
  }
};

const clearAllFeatureStates = (map: Map) => {
  clearVectorTileFeatureStates(map);
  try {
    if (map.getStyle()?.sources?.[CLIMBING_TILES_SOURCE]) {
      map.removeFeatureState({ source: CLIMBING_TILES_SOURCE });
    }
  } catch {
    // ignore
  }
};

/**
 * Guard against MapLibre 5.x bugs where tile reload races throw
 * "feature index out of bounds" from queryRenderedFeatures (mousemove layer
 * handlers) or from _render (orphaned feature-state). Upstream fix is only in
 * 6.0.0-15+ (#7765).
 */
export const installMapFeatureStateGuard = (map: Map) => {
  // Bump when the guard gains new patches so HMR / old maps re-install.
  const GUARD_VERSION = 2;
  if ((map as any).__featureStateGuard === GUARD_VERSION) {
    return;
  }
  (map as any).__featureStateGuard = GUARD_VERSION;

  map.on('zoomstart', () => clearVectorTileFeatureStates(map));

  // Layer mousemove handlers call this internally before our callback runs.
  if (!(map as any).__originalQueryRenderedFeatures) {
    (map as any).__originalQueryRenderedFeatures =
      map.queryRenderedFeatures.bind(map);
  }
  const originalQuery = (map as any)
    .__originalQueryRenderedFeatures as Map['queryRenderedFeatures'];
  map.queryRenderedFeatures = ((
    ...args: Parameters<Map['queryRenderedFeatures']>
  ) => {
    try {
      return originalQuery(...args);
    } catch (error) {
      if (!isFeatureIndexCrash(error)) {
        throw error;
      }
      return [];
    }
  }) as Map['queryRenderedFeatures'];

  if (!(map as any).__originalRender) {
    (map as any).__originalRender = (map as any)._render.bind(map);
  }
  const originalRender = (map as any).__originalRender;
  (map as any)._render = (...args: unknown[]) => {
    try {
      return originalRender(...args);
    } catch (error) {
      if (!isFeatureIndexCrash(error)) {
        throw error;
      }
      clearAllFeatureStates(map);
    }
  };
};
