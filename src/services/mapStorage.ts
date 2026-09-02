import type * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import { publishDbgObject } from '../utils';

let mapIsIdle: (value: maplibregl.Map) => void;
export const mapIdlePromise = new Promise<maplibregl.Map>((resolve) => {
  mapIsIdle = resolve;
});

// resolves much sooner than mapIdlePromise - the map has its size (and thus
// can compute camera) right after the constructor, long before it is idle
let mapIsCreated: (value: maplibregl.Map) => void;
export const mapCreatedPromise = new Promise<maplibregl.Map>((resolve) => {
  mapIsCreated = resolve;
});

let map: maplibregl.Map | undefined = undefined;
export const setGlobalMap = (newMap: maplibregl.Map) => {
  map = newMap;
  map?.on('idle', () => mapIsIdle(newMap));
  if (newMap) {
    mapIsCreated(newMap);
  }
  publishDbgObject('map', map);
};
export const getGlobalMap = () => map;

export const getOverpassSource = () =>
  getGlobalMap()?.getSource('overpass') as GeoJSONSource | undefined;
