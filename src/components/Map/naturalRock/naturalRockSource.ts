import { GeoJSONSource } from 'maplibre-gl';
import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { getGlobalMap } from '../../../services/mapStorage';
import { EMPTY_GEOJSON_SOURCE } from '../consts';
import { performOverpassSearch } from '../../../services/overpass/overpassSearch';
import { MAIN_OVERPASS_HOST } from '../../../services/overpass/fetchOverpass';
import { Bbox } from '../../utils/MapStateContext';
import {
  NATURAL_ROCK_SOURCE,
  naturalRockLayers,
} from '../styles/layers/naturalRockLayers';

// `natural=rock` polygons/nodes are not present in the vector basemap, so they
// are loaded on demand from Overpass for the current viewport. Kept above a
// minimum zoom to avoid huge bbox queries.
const MIN_ZOOM = 13;
const DEBOUNCE_MS = 600;

const EMPTY_FEATURE_COLLECTION = {
  type: 'FeatureCollection' as const,
  features: [],
};

let lastQueryKey = '';
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

const setData = (
  data: GeoJSON.FeatureCollection | typeof EMPTY_FEATURE_COLLECTION,
) => {
  getGlobalMap()?.getSource<GeoJSONSource>(NATURAL_ROCK_SOURCE)?.setData(data);
};

const fetchAndUpdate = async () => {
  const map = getGlobalMap();
  if (!map) {
    return;
  }

  if (map.getZoom() < MIN_ZOOM) {
    lastQueryKey = '';
    setData(EMPTY_FEATURE_COLLECTION);
    return;
  }

  const bounds = map.getBounds();
  const bbox: Bbox = [
    bounds.getWest(),
    bounds.getNorth(),
    bounds.getEast(),
    bounds.getSouth(),
  ];

  const queryKey = bbox.map((n) => n.toFixed(3)).join(',');
  if (queryKey === lastQueryKey) {
    return; // viewport practically unchanged – avoid hammering Overpass
  }
  lastQueryKey = queryKey;

  try {
    const geojson = await performOverpassSearch(bbox, 'nwr["natural"="rock"]', {
      hosts: [MAIN_OVERPASS_HOST], // only the main instance, no private.coffee fallback
    });
    setData(geojson);
  } catch (e) {
    lastQueryKey = ''; // allow a retry on the next move
    console.warn('natural=rock Overpass fetch error:', e); // eslint-disable-line no-console
  }
};

const updateData = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(fetchAndUpdate, DEBOUNCE_MS);
};

let eventsAdded = false;

export const addNaturalRockSource = (style: StyleSpecification) => {
  style.sources[NATURAL_ROCK_SOURCE] = EMPTY_GEOJSON_SOURCE;

  // Insert right after the existing rock landcover so the rocks sit low in the
  // stack – below trails, labels, POIs and the climbing overlay (which is
  // appended to the end). Also in `layersWithOsmId` for hover/click.
  const anchor = style.layers.findIndex((l) => l.id === 'landcover_rock');
  const insertAt = anchor === -1 ? style.layers.length : anchor + 1;
  style.layers.splice(insertAt, 0, ...naturalRockLayers);

  lastQueryKey = ''; // the rebuilt style starts empty – force a refetch

  if (!eventsAdded) {
    const map = getGlobalMap();
    map.on('load', updateData);
    map.on('styledata', updateData);
    map.on('moveend', updateData);
    eventsAdded = true;
  }
};

export const removeNaturalRockSource = () => {
  if (eventsAdded) {
    const map = getGlobalMap();
    map.off('load', updateData);
    map.off('styledata', updateData);
    map.off('moveend', updateData);
    eventsAdded = false;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
  }
  lastQueryKey = '';
};
