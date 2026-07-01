import type { ImageSource, Map } from 'maplibre-gl';

export const RADAR_SOURCE_ID = 'chmu-radar';
export const RADAR_LAYER_ID = 'chmu-radar-layer';

// Whole-image geographic extent of the ČHMÚ masked MAX_Z composite (EPSG:3857):
// E 11.267°–20.770°, N 48.047°–52.167° (radar_description_en.pdf, product #23).
// The PNG is already web-mercator, so mapping these lng/lat corners onto
// MapLibre's mercator plane lines the image up 1:1.
export const RADAR_BOUNDS = {
  west: 11.267,
  east: 20.77,
  south: 48.047,
  north: 52.167,
};

// The button is only offered when the map centre sits within the radar coverage
// (Czechia + a bit of the surrounding countries). A small margin keeps it
// available right at the border.
export const isInRadarCoverage = (lat: number, lon: number, margin = 0.5) =>
  !Number.isNaN(lat) &&
  !Number.isNaN(lon) &&
  lon >= RADAR_BOUNDS.west - margin &&
  lon <= RADAR_BOUNDS.east + margin &&
  lat >= RADAR_BOUNDS.south - margin &&
  lat <= RADAR_BOUNDS.north + margin;

type Corners = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
];
const RADAR_COORDINATES: Corners = [
  [RADAR_BOUNDS.west, RADAR_BOUNDS.north], // top-left
  [RADAR_BOUNDS.east, RADAR_BOUNDS.north], // top-right
  [RADAR_BOUNDS.east, RADAR_BOUNDS.south], // bottom-right
  [RADAR_BOUNDS.west, RADAR_BOUNDS.south], // bottom-left
];

export const radarFrameUrl = (ts: string) => `/api/radar-chmu?ts=${ts}`;

const CLIMBING_SOURCES = new Set(['climbing', 'climbing-tiles']);

// Climbing overlay layers all carry a `climbing…` id (and a climbing source).
const isClimbingLayer = (layer: { id: string; source?: string }) =>
  layer.id.startsWith('climbing') ||
  (layer.source != null && CLIMBING_SOURCES.has(layer.source));

// Stacking wanted: climbing areas on top → radar → everything else. So the
// radar is inserted right below the first climbing layer (i.e. above the whole
// basemap incl. its labels). With no climbing overlay it goes on top.
const radarBeforeId = (map: Map): string | undefined =>
  map.getStyle()?.layers?.find(isClimbingLayer)?.id;

export const applyRadar = (map: Map, ts: string, opacity: number) => {
  const url = radarFrameUrl(ts);
  const source = map.getSource(RADAR_SOURCE_ID) as ImageSource | undefined;

  if (!source) {
    map.addSource(RADAR_SOURCE_ID, {
      type: 'image',
      url,
      coordinates: RADAR_COORDINATES,
    });
    map.addLayer(
      {
        id: RADAR_LAYER_ID,
        type: 'raster',
        source: RADAR_SOURCE_ID,
        paint: {
          'raster-opacity': opacity,
          'raster-fade-duration': 0, // no cross-fade → clean frame swaps
        },
      },
      radarBeforeId(map),
    );
    return;
  }

  source.updateImage({ url, coordinates: RADAR_COORDINATES });
  if (map.getLayer(RADAR_LAYER_ID)) {
    map.setPaintProperty(RADAR_LAYER_ID, 'raster-opacity', opacity);
  }
};

export const removeRadar = (map: Map) => {
  if (map.getLayer(RADAR_LAYER_ID)) {
    map.removeLayer(RADAR_LAYER_ID);
  }
  if (map.getSource(RADAR_SOURCE_ID)) {
    map.removeSource(RADAR_SOURCE_ID);
  }
};
