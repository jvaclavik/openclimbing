import type { AddProtocolAction } from 'maplibre-gl';
import type { Bbox } from '../../utils/MapStateContext';
import { MAPTILER_DEM_MAX_ZOOM, MAPTILER_DEM_TILE_URL } from '../maptilerDem';

// Czech national elevation models (ČÚZK) as a MapLibre `raster-dem` source.
//
// ČÚZK publishes DMR 5G (bare-earth terrain) and DMP 1G (surface incl.
// vegetation and buildings) only as ArcGIS ImageServers, not as terrain-rgb
// tiles. The `cuzkdem://<service>/{z}/{x}/{y}` protocol asks the ImageServer for
// the tile's bbox as raw Float32 heights (`format=bsq`) and re-encodes them as
// Mapbox terrain-rgb in the browser. Outside CZ (and in no-data pixels along
// the border) MapTiler terrain fills in, so the mesh stays continuous.
//
// NOTE: no `window` access at import time – `consts.ts` imports this module.

export const CUZK_DEM_PROTOCOL = 'cuzkdem';
export const CUZK_DEM_SERVICES = ['dmr5g', 'dmp1g'] as const;
type CuzkDemService = (typeof CUZK_DEM_SERVICES)[number];

export const CZ_BBOX: Bbox = [
  12.09, // west
  48.55, // south
  18.87, // east
  51.06, // north
];

/** Source resolution is 2 m/px – z16 (~1.5 m/px in CZ) keeps houses sharp. */
export const CUZK_DEM_MAX_ZOOM = 16;
/** Below this the whole country fits in a handful of tiles and the global
 *  model looks the same – don't load the ImageServer for nothing. */
const CUZK_DEM_MIN_ZOOM = 8;
const TILE_SIZE = 256;
const PIXELS = TILE_SIZE * TILE_SIZE;

const EARTH_RADIUS = 6378137;
const MERC_ORIGIN = Math.PI * EARTH_RADIUS;

const tileMercatorBbox = (z: number, x: number, y: number) => {
  const size = (2 * MERC_ORIGIN) / 2 ** z;
  return [
    -MERC_ORIGIN + x * size,
    MERC_ORIGIN - (y + 1) * size,
    -MERC_ORIGIN + (x + 1) * size,
    MERC_ORIGIN - y * size,
  ];
};

const tileLon = (x: number, z: number) => (x / 2 ** z) * 360 - 180;
const tileLat = (y: number, z: number) =>
  (180 / Math.PI) * Math.atan(Math.sinh(Math.PI - (2 * Math.PI * y) / 2 ** z));

const intersectsCz = (z: number, x: number, y: number) => {
  const [west, south, east, north] = CZ_BBOX;
  return (
    tileLon(x, z) < east &&
    tileLon(x + 1, z) > west &&
    tileLat(y + 1, z) < north &&
    tileLat(y, z) > south
  );
};

type CuzkHeights = { heights: Float32Array; valid: Uint8Array };

const fetchCuzkHeights = async (
  service: CuzkDemService,
  z: number,
  x: number,
  y: number,
  signal: AbortSignal,
): Promise<CuzkHeights> => {
  const params = new URLSearchParams({
    bbox: tileMercatorBbox(z, x, y).join(','),
    bboxSR: '3857',
    imageSR: '3857',
    size: `${TILE_SIZE},${TILE_SIZE}`,
    format: 'bsq',
    pixelType: 'F32',
    interpolation: 'RSP_BilinearInterpolation',
    f: 'image',
  });
  const url = `https://ags.cuzk.gov.cz/arcgis2/rest/services/${service}/ImageServer/exportImage?${params}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`ČÚZK DEM: HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < PIXELS * 4) {
    throw new Error('ČÚZK DEM: unexpected response');
  }

  // Band-sequential little-endian Float32, followed by a 1-bit validity mask
  // (MSB first, 1 = has data). No-data pixels hold 0.
  const view = new DataView(buffer);
  const heights = new Float32Array(PIXELS);
  for (let i = 0; i < PIXELS; i++) heights[i] = view.getFloat32(i * 4, true);

  const hasMask = buffer.byteLength >= PIXELS * 4 + PIXELS / 8;
  const mask = hasMask ? new Uint8Array(buffer, PIXELS * 4, PIXELS / 8) : null;
  const valid = new Uint8Array(PIXELS);
  for (let i = 0; i < PIXELS; i++) {
    valid[i] = mask ? (mask[i >> 3] >> (7 - (i & 7))) & 1 : 1;
  }
  return { heights, valid };
};

// MapTiler parent tiles are shared by many child tiles (z15 → z14), cache a few.
const MAPTILER_CACHE_SIZE = 32;
const maptilerCache = new Map<string, Promise<ImageData>>();

const loadMaptilerTile = (z: number, x: number, y: number) => {
  const key = `${z}/${x}/${y}`;
  const cached = maptilerCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    const response = await fetch(MAPTILER_DEM_TILE_URL(z, x, y));
    if (!response.ok) throw new Error(`MapTiler DEM: HTTP ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob(), {
      premultiplyAlpha: 'none',
      colorSpaceConversion: 'none',
    });
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  })();
  promise.catch(() => maptilerCache.delete(key));

  maptilerCache.set(key, promise);
  if (maptilerCache.size > MAPTILER_CACHE_SIZE) {
    maptilerCache.delete(maptilerCache.keys().next().value);
  }
  return promise;
};

const decodeTerrainRgb = (data: Uint8ClampedArray, i: number) =>
  -10000 + (data[i] * 65536 + data[i + 1] * 256 + data[i + 2]) * 0.1;

/** MapTiler heights resampled (bilinear) onto the z/x/y tile grid. */
const loadMaptilerHeights = async (z: number, x: number, y: number) => {
  const parentZ = Math.min(z, MAPTILER_DEM_MAX_ZOOM);
  const scale = 2 ** (z - parentZ);
  const parentX = Math.floor(x / scale);
  const parentY = Math.floor(y / scale);
  const { width, height, data } = await loadMaptilerTile(
    parentZ,
    parentX,
    parentY,
  );

  const sample = (px: number, py: number) => {
    const cx = Math.min(width - 1, Math.max(0, px));
    const cy = Math.min(height - 1, Math.max(0, py));
    return decodeTerrainRgb(data, (cy * width + cx) * 4);
  };

  const heights = new Float32Array(PIXELS);
  for (let j = 0; j < TILE_SIZE; j++) {
    const v = ((y - parentY * scale + (j + 0.5) / TILE_SIZE) / scale) * height;
    const fy = v - 0.5;
    const y0 = Math.floor(fy);
    const ty = fy - y0;
    for (let i = 0; i < TILE_SIZE; i++) {
      const u = ((x - parentX * scale + (i + 0.5) / TILE_SIZE) / scale) * width;
      const fx = u - 0.5;
      const x0 = Math.floor(fx);
      const tx = fx - x0;
      const top = sample(x0, y0) * (1 - tx) + sample(x0 + 1, y0) * tx;
      const bottom =
        sample(x0, y0 + 1) * (1 - tx) + sample(x0 + 1, y0 + 1) * tx;
      heights[j * TILE_SIZE + i] = top * (1 - ty) + bottom * ty;
    }
  }
  return heights;
};

const loadHeights = async (
  service: CuzkDemService,
  z: number,
  x: number,
  y: number,
  signal: AbortSignal,
) => {
  if (z < CUZK_DEM_MIN_ZOOM || !intersectsCz(z, x, y)) {
    return loadMaptilerHeights(z, x, y);
  }

  let cuzk: CuzkHeights;
  try {
    cuzk = await fetchCuzkHeights(service, z, x, y, signal);
  } catch (error) {
    if (signal.aborted) throw error;
    return loadMaptilerHeights(z, x, y);
  }

  const { heights, valid } = cuzk;
  if (valid.every(Boolean)) return heights;

  const fallback = await loadMaptilerHeights(z, x, y).catch(() => null);
  for (let i = 0; i < PIXELS; i++) {
    if (!valid[i]) heights[i] = fallback ? fallback[i] : 0;
  }
  return heights;
};

const MAX_TERRAIN_RGB = 256 ** 3 - 1;

const encodeTerrainRgb = (heights: Float32Array) => {
  const rgba = new Uint8ClampedArray(PIXELS * 4);
  for (let i = 0; i < PIXELS; i++) {
    const value = Math.min(
      MAX_TERRAIN_RGB,
      Math.max(0, Math.round((heights[i] + 10000) * 10)),
    );
    rgba[i * 4] = (value >> 16) & 255;
    rgba[i * 4 + 1] = (value >> 8) & 255;
    rgba[i * 4 + 2] = value & 255;
    rgba[i * 4 + 3] = 255;
  }
  return createImageBitmap(new ImageData(rgba, TILE_SIZE, TILE_SIZE), {
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
  });
};

const URL_RE = new RegExp(
  `^${CUZK_DEM_PROTOCOL}://(\\w+)/(\\d+)/(\\d+)/(\\d+)`,
);

const parseUrl = (url: string) => {
  const match = URL_RE.exec(url);
  const service = match?.[1] as CuzkDemService;
  if (!match || !CUZK_DEM_SERVICES.includes(service)) {
    throw new Error(`Invalid ČÚZK DEM url: ${url}`);
  }
  return {
    service,
    z: Number(match[2]),
    x: Number(match[3]),
    y: Number(match[4]),
  };
};

export const cuzkDemLoader: AddProtocolAction = async (
  params,
  abortController,
) => {
  const { service, z, x, y } = parseUrl(params.url);
  const heights = await loadHeights(service, z, x, y, abortController.signal);
  return { data: await encodeTerrainRgb(heights) };
};

export const cuzkDemTiles = (service: CuzkDemService) => [
  `${CUZK_DEM_PROTOCOL}://${service}/{z}/{x}/{y}`,
];
