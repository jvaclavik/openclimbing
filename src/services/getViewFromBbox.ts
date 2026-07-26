import { BBox } from 'geojson';
import { View } from '../components/utils/MapStateContext';

const WORLD_SIZE = 512; // px of the whole world at zoom 0 (maplibre tile size)
const MIN_SIZE = 50; // px, guard for tiny viewports
const DEFAULT_PADDING = 20; // px
const DEFAULT_MAX_ZOOM = 17;

type Viewport = {
  width: number;
  height: number;
  panelWidth?: number; // feature panel overlaying the map from the left
  padding?: number;
  maxZoom?: number;
};

const mercatorX = (lon: number) => lon / 360 + 0.5;

const mercatorY = (lat: number) => {
  const clamped = Math.min(Math.max(lat, -85.051129), 85.051129);
  return (
    0.5 -
    Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360)) / (2 * Math.PI)
  );
};

const lonFromMercator = (x: number) => (x - 0.5) * 360;

const latFromMercator = (y: number) =>
  (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;

/**
 * Computes the map view fitting given [w, s, e, n] bbox. Deliberately does not
 * use map.cameraForBounds() - the view is often needed before the map instance
 * exists (SSR feature open). Returns undefined for a bbox degenerated to a
 * point - such feature has no extent and the caller should use its center.
 */
export const getViewFromBbox = (
  bbox: BBox,
  {
    width,
    height,
    panelWidth = 0,
    padding = DEFAULT_PADDING,
    maxZoom = DEFAULT_MAX_ZOOM,
  }: Viewport,
): View | undefined => {
  const [w, s, e, n] = bbox;
  const x1 = mercatorX(w);
  const x2 = mercatorX(e);
  const y1 = mercatorY(n);
  const y2 = mercatorY(s);
  const spanX = Math.abs(x2 - x1);
  const spanY = Math.abs(y2 - y1);

  if (!spanX && !spanY) {
    return undefined;
  }

  const availableWidth = Math.max(width - panelWidth - 2 * padding, MIN_SIZE);
  const availableHeight = Math.max(height - 2 * padding, MIN_SIZE);
  const zoomX = spanX
    ? Math.log2(availableWidth / (WORLD_SIZE * spanX))
    : Infinity;
  const zoomY = spanY
    ? Math.log2(availableHeight / (WORLD_SIZE * spanY))
    : Infinity;
  const zoom = Math.max(Math.min(zoomX, zoomY, maxZoom), 0);

  // the panel covers the left part of the map, so the bbox has to sit right of it
  const scale = WORLD_SIZE * 2 ** zoom;
  const centerX = (x1 + x2) / 2 - panelWidth / 2 / scale;
  const centerY = (y1 + y2) / 2;

  return [
    zoom.toFixed(2),
    latFromMercator(centerY).toFixed(4),
    lonFromMercator(centerX).toFixed(4),
  ];
};
