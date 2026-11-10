import type {
  GeoJSONSourceSpecification,
  SourceSpecification,
} from '@maplibre/maplibre-gl-style-spec';
import { CUZK_DEM_MAX_ZOOM, cuzkDemTiles } from './Terrain3d/cuzkDem';

const apiKey = process.env.NEXT_PUBLIC_API_KEY_MAPTILER;

export const OSMAPP_SPRITE = [
  {
    id: 'default',
    url: `${window.location.protocol}//${window.location.host}/sprites/osmapp`,
  },
];

export const GLYPHS = `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${apiKey}`;

export const EMPTY_GEOJSON_SOURCE: GeoJSONSourceSpecification = {
  type: 'geojson' as const,
  data: {
    type: 'FeatureCollection' as const,
    features: [],
  },
};

export const OSMAPP_SOURCES: Record<string, SourceSpecification> = {
  maptiler_planet: {
    type: 'vector' as const,
    url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${apiKey}`,
  },
  ofr_planet: {
    type: 'vector' as const,
    url: `https://tiles.openfreemap.org/planet`,
  },
  'versatiles-shortbread': {
    type: 'vector' as const,
    scheme: 'xyz',
    tiles: ['https://vector.openstreetmap.org/shortbread_v1/{z}/{x}/{y}.mvt'],
    bounds: [-180, -85.0511287798066, 180, 85.0511287798066],
    minzoom: 0,
    maxzoom: 14,
  },
  contours: {
    type: 'vector' as const,
    url: `https://api.maptiler.com/tiles/contours-v2/tiles.json?key=${apiKey}`,
  },
  terrain3d: {
    url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${apiKey}`, // this source must be duplicated for terrain/hillshade https://github.com/maplibre/maplibre-gl-js/issues/2035
    type: 'raster-dem' as const,
    tileSize: 256,
  },
  // ČÚZK elevation for 3D in CZ (MapTiler fills in outside) – see cuzkDem.ts
  terrain3dDmr: {
    type: 'raster-dem' as const,
    tiles: cuzkDemTiles('dmr5g'),
    tileSize: 256,
    encoding: 'mapbox' as const,
    maxzoom: CUZK_DEM_MAX_ZOOM,
    attribution: '&copy; <a href="https://geoportal.cuzk.cz">ČÚZK</a> DMR 5G',
  },
  terrain3dDmp: {
    type: 'raster-dem' as const,
    tiles: cuzkDemTiles('dmp1g'),
    tileSize: 256,
    encoding: 'mapbox' as const,
    maxzoom: CUZK_DEM_MAX_ZOOM,
    attribution: '&copy; <a href="https://geoportal.cuzk.cz">ČÚZK</a> DMP 1G',
  },
  terrainHillshade: {
    url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${apiKey}`,
    type: 'raster-dem' as const,
    tileSize: 256,
  },
  outdoor: {
    url: `https://api.maptiler.com/tiles/outdoor/tiles.json?key=${apiKey}`,
    type: 'vector' as const,
  },
  overpass: EMPTY_GEOJSON_SOURCE,
};

export const BACKGROUND = [
  {
    id: 'background',
    type: 'background',
    paint: {
      'background-color': '#f8f4f0',
    },
  },
];
