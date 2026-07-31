import type { Feature as GeojsonFeature, FeatureCollection } from 'geojson';
import type { GeoJSONSource } from 'maplibre-gl';
import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import {
  fetchOverpass,
  MAIN_OVERPASS_HOST,
} from '../../../services/overpass/fetchOverpass';
import { getGlobalMap } from '../../../services/mapStorage';
import { getPoiClass } from '../../../services/getPoiClass';
import type { FeatureTags } from '../../../services/types';
import { EMPTY_GEOJSON_SOURCE } from '../consts';
import {
  getPoiCategories,
  getPoiCategoryColor,
  getPoiCategoryFill,
  getPoiCategoryMinZoom,
  getPoiCategoriesQueryParts,
  matchesPoiCategory,
  PoiCategory,
  POI_MIN_ZOOM,
} from './poiCategories';
import {
  POI_CATEGORIES_SOURCE,
  poiCategoriesLayers,
} from './poiCategoriesLayers';
import {
  getActivePoiCategories,
  setPoiCategoriesStatus,
  subscribeActivePoiCategories,
} from './poiCategoriesStore';

const DEBOUNCE_MS = 700;

// Results are cached per category in a fixed z14 grid, so panning back and forth
// or toggling a category off and on again costs no request at all. Only tiles
// missing from the cache are fetched – in one Overpass query for their union
// bbox, which is at most the current viewport.
const TILE_Z = 14;
const MAX_CACHE_ENTRIES = 6000;
// Keeps a single query bounded even on a huge screen at the lowest allowed zoom.
const MAX_TILES_PER_REQUEST = 40;

type Tile = { x: number; y: number };

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: FeatureTags;
};

// The sprite mixes 11px, 15px and even wider icons, so every icon is scaled to
// the same visual size – otherwise the markers look randomly sized.
const ICON_TARGET_PX = 12;
const iconScales = new Map<string, number>();

const getIconScale = (icon: string) => {
  const cached = iconScales.get(icon);
  if (cached !== undefined) {
    return cached;
  }

  const image = getGlobalMap()?.getImage(`${icon}_11`);
  if (!image) {
    return 1; // sprite not ready yet, not cached so it gets resolved later
  }

  const { width, height } = image.spriteData ?? image.data;
  const scale = Math.min(
    1,
    (ICON_TARGET_PX * (image.pixelRatio || 1)) / Math.max(width, height),
  );
  iconScales.set(icon, scale);
  return scale;
};

const EMPTY_FEATURE_COLLECTION: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

const tileCache = new Map<string, GeojsonFeature[]>();
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let inFlight = false;
let pendingUpdate = false;
let eventsAdded = false;

const lonToTileX = (lon: number, z: number) =>
  Math.floor(((lon + 180) / 360) * 2 ** z);

const latToTileY = (lat: number, z: number) => {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z,
  );
};

const tileXToLon = (x: number, z: number) => (x / 2 ** z) * 360 - 180;

const tileYToLat = (y: number, z: number) => {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
};

const getViewportTiles = (): Tile[] => {
  const bounds = getGlobalMap()?.getBounds();
  if (!bounds) {
    return [];
  }

  const max = 2 ** TILE_Z - 1;
  const clamp = (value: number) => Math.min(Math.max(value, 0), max);
  const minX = clamp(lonToTileX(bounds.getWest(), TILE_Z));
  const maxX = clamp(lonToTileX(bounds.getEast(), TILE_Z));
  const minY = clamp(latToTileY(bounds.getNorth(), TILE_Z));
  const maxY = clamp(latToTileY(bounds.getSouth(), TILE_Z));

  const tiles: Tile[] = [];
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      tiles.push({ x, y });
    }
  }
  return tiles;
};

const cacheKey = (categoryKey: string, { x, y }: Tile) =>
  `${categoryKey}/${x}/${y}`;

const evictCacheIfNeeded = () => {
  if (tileCache.size <= MAX_CACHE_ENTRIES) {
    return;
  }
  const toDelete = tileCache.size - MAX_CACHE_ENTRIES / 2;
  const keys = tileCache.keys();
  for (let i = 0; i < toDelete; i += 1) {
    tileCache.delete(keys.next().value);
  }
};

const getVisibleCategories = (zoom: number) =>
  getPoiCategories(getActivePoiCategories()).filter(
    (category) => zoom >= getPoiCategoryMinZoom(category),
  );

const buildFeature = (
  element: OverpassElement,
  category: PoiCategory,
): GeojsonFeature | null => {
  const lon = element.lon ?? element.center?.lon;
  const lat = element.lat ?? element.center?.lat;
  if (lon == null || lat == null) {
    return null;
  }

  const tags = element.tags ?? {};
  const mapTypes = { node: 0, way: 1, relation: 4 }; // as in convertOsmIdToMapId()

  return {
    type: 'Feature',
    id: parseInt(`${element.id}${mapTypes[element.type]}`, 10),
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: {
      ...getPoiClass(tags),
      ...tags,
      osmappType: element.type,
      poiCategory: category.key,
      poiIcon: category.icon,
      poiIconSize: getIconScale(category.icon),
      poiColor: getPoiCategoryColor(category),
      poiFill: getPoiCategoryFill(category),
    },
  } as GeojsonFeature;
};

const setData = (data: FeatureCollection) => {
  getGlobalMap()
    ?.getSource<GeoJSONSource>(POI_CATEGORIES_SOURCE)
    ?.setData(data);
};

const renderFromCache = () => {
  const map = getGlobalMap();
  if (!map) {
    return;
  }

  const zoom = map.getZoom();
  const categories = getVisibleCategories(zoom);
  if (!categories.length) {
    setData(EMPTY_FEATURE_COLLECTION);
    setPoiCategoriesStatus({ count: 0 });
    return;
  }

  const tiles = getViewportTiles();
  const byId = new Map<GeojsonFeature['id'], GeojsonFeature>();
  categories.forEach((category) => {
    tiles.forEach((tile) => {
      tileCache.get(cacheKey(category.key, tile))?.forEach((feature) => {
        if (!byId.has(feature.id)) {
          byId.set(feature.id, feature);
        }
      });
    });
  });

  const features = [...byId.values()];
  setData({ type: 'FeatureCollection', features });
  setPoiCategoriesStatus({ count: features.length });
};

const getOverpassQuery = (
  categories: PoiCategory[],
  bbox: [number, number, number, number], // south, west, north, east
) => {
  const parts = getPoiCategoriesQueryParts(categories);
  return `[out:json][timeout:30][bbox:${bbox.join(',')}];(${parts.join(';')};);out center qt;`;
};

const fetchBatch = async (tiles: Tile[], categories: PoiCategory[]) => {
  const bbox: [number, number, number, number] = [
    Math.min(...tiles.map(({ y }) => tileYToLat(y + 1, TILE_Z))),
    Math.min(...tiles.map(({ x }) => tileXToLon(x, TILE_Z))),
    Math.max(...tiles.map(({ y }) => tileYToLat(y, TILE_Z))),
    Math.max(...tiles.map(({ x }) => tileXToLon(x + 1, TILE_Z))),
  ];

  const response = await fetchOverpass(getOverpassQuery(categories, bbox), {
    hosts: [MAIN_OVERPASS_HOST], // one instance only, the mirrors are for user-triggered searches
  });

  // Empty arrays are stored too, so that empty areas are not re-requested.
  const requested = new Set<string>();
  categories.forEach(({ key }) =>
    tiles.forEach((tile) => {
      const key2 = cacheKey(key, tile);
      requested.add(key2);
      tileCache.set(key2, []);
    }),
  );

  (response?.elements ?? []).forEach((element: OverpassElement) => {
    const { tags } = element;
    if (!tags) {
      return;
    }
    categories.forEach((category) => {
      if (!matchesPoiCategory(tags, category)) {
        return;
      }
      const feature = buildFeature(element, category);
      if (!feature) {
        return;
      }
      const [lon, lat] = (feature.geometry as GeoJSON.Point).coordinates;
      const key = cacheKey(category.key, {
        x: lonToTileX(lon, TILE_Z),
        y: latToTileY(lat, TILE_Z),
      });
      // Overpass also returns objects whose center falls outside the queried
      // tiles – those are dropped, their own tile gets fetched on its own.
      if (requested.has(key)) {
        tileCache.get(key).push(feature);
      }
    });
  });

  evictCacheIfNeeded();
};

const fetchMissingTiles = async () => {
  const map = getGlobalMap();
  if (!map) {
    return;
  }

  const categories = getVisibleCategories(map.getZoom());
  const missing = getViewportTiles().filter((tile) =>
    categories.some(({ key }) => !tileCache.has(cacheKey(key, tile))),
  );
  if (!missing.length) {
    return;
  }

  setPoiCategoriesStatus({ loading: true, error: null });
  try {
    // Tiles come in column-major order, so the batches stay compact areas.
    for (let i = 0; i < missing.length; i += MAX_TILES_PER_REQUEST) {
      const batch = missing.slice(i, i + MAX_TILES_PER_REQUEST);
      await fetchBatch(batch, categories); // eslint-disable-line no-await-in-loop
      renderFromCache();
    }
    setPoiCategoriesStatus({ loading: false });
  } catch (e) {
    // Not cached, so the next viewport change retries.
    setPoiCategoriesStatus({ loading: false, error: `${e}`.substring(0, 120) });
    console.warn('POI categories Overpass fetch error:', e); // eslint-disable-line no-console
  }
};

const update = async () => {
  const map = getGlobalMap();
  if (!map) {
    return;
  }

  const zoom = map.getZoom();
  const categories = getPoiCategories(getActivePoiCategories());
  const hiddenByZoom = categories.filter(
    (category) => zoom < getPoiCategoryMinZoom(category),
  ).length;
  setPoiCategoriesStatus({
    zoomTooLow: categories.length > 0 && zoom < POI_MIN_ZOOM,
    hiddenByZoom,
  });

  renderFromCache(); // instant feedback from the cache, only then the network

  if (!categories.length || zoom < POI_MIN_ZOOM) {
    return;
  }

  if (inFlight) {
    pendingUpdate = true;
    return;
  }

  inFlight = true;
  try {
    await fetchMissingTiles();
  } finally {
    inFlight = false;
  }

  if (pendingUpdate) {
    pendingUpdate = false;
    void update();
  }
};

const updateDebounced = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(update, DEBOUNCE_MS);
};

export const addPoiCategoriesToStyle = (style: StyleSpecification) => {
  style.sources[POI_CATEGORIES_SOURCE] = EMPTY_GEOJSON_SOURCE;

  // Below the climbing overlay – crags and routes are the primary content.
  const climbingIndex = style.layers.findIndex(({ id }) =>
    id.startsWith('climbing'),
  );
  const insertAt = climbingIndex === -1 ? style.layers.length : climbingIndex;
  style.layers.splice(insertAt, 0, ...poiCategoriesLayers);

  if (!eventsAdded) {
    const map = getGlobalMap();
    map.on('load', updateDebounced);
    map.on('styledata', updateDebounced);
    map.on('moveend', updateDebounced);
    // A user toggle is not debounced – cached results appear immediately.
    subscribeActivePoiCategories(() => void update());
    eventsAdded = true;
  }
};
