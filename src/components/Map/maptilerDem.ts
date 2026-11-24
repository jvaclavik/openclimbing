// NOTE: keep this module free of `window` access at import time – it is
// reachable from the SSR-rendered Map.tsx (via the sun shadow layer).
const apiKey = process.env.NEXT_PUBLIC_API_KEY_MAPTILER;

/** MapTiler terrain-rgb-v2 (Mapbox terrain-rgb encoding, webp). */
export const MAPTILER_DEM_TILE_URL = (z: number, x: number, y: number) =>
  `https://api.maptiler.com/tiles/terrain-rgb-v2/${z}/${x}/${y}.webp?key=${apiKey}`;

export const MAPTILER_DEM_MAX_ZOOM = 14;
