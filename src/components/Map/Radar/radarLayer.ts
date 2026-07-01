import type { ImageSource, Map } from 'maplibre-gl';

// Whole-image geographic extent shared by the ČHMÚ `pacz2gmaps3` composites
// (EPSG:3857): E 11.267°–20.770°, N 48.047°–52.167° (radar_description_en.pdf,
// products #23 radar MAX_Z and #25 MERGE 1h). The PNGs are already
// web-mercator, so mapping these lng/lat corners onto MapLibre's mercator plane
// lines the image up 1:1.
export const RADAR_BOUNDS = {
  west: 11.267,
  east: 20.77,
  south: 48.047,
  north: 52.167,
};

// The overlays are only offered when the map centre sits within the coverage
// (Czechia + a bit of the surrounding countries). A small margin keeps them
// available right at the border.
export const isInRadarCoverage = (lat: number, lon: number, margin = 0.5) =>
  !Number.isNaN(lat) &&
  !Number.isNaN(lon) &&
  lon >= RADAR_BOUNDS.west - margin &&
  lon <= RADAR_BOUNDS.east + margin &&
  lat >= RADAR_BOUNDS.south - margin &&
  lat <= RADAR_BOUNDS.north + margin;

export type Corners = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
];

// Corners of the padded whole-image PNG canvas (radar MAX_Z, MERGE 1h PNG).
export const RADAR_COORDINATES: Corners = [
  [RADAR_BOUNDS.west, RADAR_BOUNDS.north], // top-left
  [RADAR_BOUNDS.east, RADAR_BOUNDS.north], // top-right
  [RADAR_BOUNDS.east, RADAR_BOUNDS.south], // bottom-right
  [RADAR_BOUNDS.west, RADAR_BOUNDS.south], // bottom-left
];

// The MERGE HDF5 grids (used for our own accumulation maps) cover only the
// data extent, which is smaller than the padded PNG canvas
// (where@LL/UL/UR/LR in the ODIM files): E 11.267°–19.624°, N 48.047°–51.458°.
export const MERGE_DATA_COORDINATES: Corners = [
  [11.266869, 51.458369], // top-left (UL)
  [19.623974, 51.458369], // top-right (UR)
  [19.623974, 48.047275], // bottom-right (LR)
  [11.266869, 48.047275], // bottom-left (LL)
];

export type OverlayProductKey = 'maxz' | 'merge1h';

export type OverlayIds = {
  sourceId: string;
  layerId: string;
};

export const overlayFrameUrl = (product: OverlayProductKey, ts: string) =>
  `/api/radar-chmu?product=${product}&ts=${ts}`;

const CLIMBING_SOURCES = new Set(['climbing', 'climbing-tiles']);

// Climbing overlay layers all carry a `climbing…` id (and a climbing source).
const isClimbingLayer = (layer: { id: string; source?: string }) =>
  layer.id.startsWith('climbing') ||
  (layer.source != null && CLIMBING_SOURCES.has(layer.source));

// Stacking wanted: climbing areas on top → weather overlay → everything else.
// So the overlay is inserted right below the first climbing layer (i.e. above
// the whole basemap incl. its labels). With no climbing overlay it goes on top.
const overlayBeforeId = (map: Map): string | undefined =>
  map.getStyle()?.layers?.find(isClimbingLayer)?.id;

export const applyOverlay = (
  map: Map,
  { sourceId, layerId }: OverlayIds,
  url: string,
  coordinates: Corners,
  opacity: number,
) => {
  const source = map.getSource(sourceId) as ImageSource | undefined;

  if (!source) {
    map.addSource(sourceId, {
      type: 'image',
      url,
      coordinates,
    });
    map.addLayer(
      {
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': opacity,
          'raster-fade-duration': 0, // no cross-fade → clean frame swaps
        },
      },
      overlayBeforeId(map),
    );
    return;
  }

  source.updateImage({ url, coordinates });
  if (map.getLayer(layerId)) {
    map.setPaintProperty(layerId, 'raster-opacity', opacity);
  }
};

export const removeOverlay = (map: Map, { sourceId, layerId }: OverlayIds) => {
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
};
