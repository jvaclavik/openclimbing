import type { Map } from 'maplibre-gl';
import SunCalc from 'suncalc';

// NOTE: don't import from `../consts` here — that module touches `window` at
// import time and this file is reachable from the SSR-rendered Map.tsx.
const apiKey = process.env.NEXT_PUBLIC_API_KEY_MAPTILER;

export const SUN_DEM_SOURCE_ID = 'osmapp-sun-dem';
export const SUN_HILLSHADE_LAYER_ID = 'osmapp-sun-hillshade';

export type SunPosition = {
  /** Compass bearing of the sun in degrees, 0 = north, 90 = east. */
  azimuthDeg: number;
  /** Angle above the horizon in degrees; negative means below horizon. */
  altitudeDeg: number;
};

const toDeg = (rad: number) => (rad * 180) / Math.PI;

export const getSunPosition = (
  date: Date,
  lat: number,
  lon: number,
): SunPosition => {
  const { azimuth, altitude } = SunCalc.getPosition(date, lat, lon);
  // SunCalc azimuth is measured from south, growing towards west (radians).
  // Convert to a compass bearing measured clockwise from north.
  const azimuthDeg = (toDeg(azimuth) + 180 + 360) % 360;
  return { azimuthDeg, altitudeDeg: toDeg(altitude) };
};

export type SunTimes = {
  sunrise: Date;
  solarNoon: Date;
  sunset: Date;
};

export const getSunTimes = (date: Date, lat: number, lon: number): SunTimes => {
  const times = SunCalc.getTimes(date, lat, lon);
  return {
    sunrise: times.sunrise,
    solarNoon: times.solarNoon,
    sunset: times.sunset,
  };
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Shadow/highlight tints driven by the sun's altitude. We deliberately use a
// saturated cool indigo for the shade and a warm glow for the lit side so the
// sun shadows read as their own thing and don't merge with the neutral grey
// relief hillshade of the basemap.
const sunColors = (altitudeDeg: number) => {
  if (altitudeDeg <= 0) {
    // Night: uniform cool darkening (both faces tinted the same).
    const night = 'rgba(22, 26, 66, 0.6)';
    return { shadow: night, highlight: night };
  }
  const t = clamp01(altitudeDeg / 45); // 0 = horizon, 1 = high sun
  const shadowAlpha = lerp(0.72, 0.48, t);
  const highlightAlpha = lerp(0.42, 0.14, t); // warm glow strongest near horizon
  return {
    shadow: `rgba(38, 40, 105, ${shadowAlpha.toFixed(2)})`,
    highlight: `rgba(255, 210, 130, ${highlightAlpha.toFixed(2)})`,
  };
};

// The hillshade source needs its own copy of the DEM (it must not be shared
// with the terrain source). We reuse the same tiles MapTiler terrain uses.
const getDemSourceSpec = () => ({
  type: 'raster-dem' as const,
  url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${apiKey}`,
  tileSize: 256,
});

const ensureSunHillshadeLayer = (map: Map) => {
  if (!map.getSource(SUN_DEM_SOURCE_ID)) {
    map.addSource(SUN_DEM_SOURCE_ID, getDemSourceSpec() as any);
  }
  if (!map.getLayer(SUN_HILLSHADE_LAYER_ID)) {
    map.addLayer({
      id: SUN_HILLSHADE_LAYER_ID,
      type: 'hillshade',
      source: SUN_DEM_SOURCE_ID,
      paint: {
        // `basic` shades purely by the angle between the surface and the
        // sun vector (direction + altitude), which is what we want here.
        'hillshade-method': 'basic',
        'hillshade-illumination-anchor': 'map',
        'hillshade-highlight-color': 'rgba(255, 198, 120, 0.1)',
        'hillshade-shadow-color': 'rgba(20, 26, 60, 0.45)',
      } as any,
    });
  }
};

// The basemap (outdoor/tourist) ships its own neutral relief hillshade. While
// the sun shadow is active we hide it so the two don't blend together, and we
// remember which layers we touched so they can be restored afterwards.
const hiddenBaseHillshades = new Set<string>();

const hideBaseHillshades = (map: Map) => {
  const layers = map.getStyle()?.layers ?? [];
  layers.forEach((layer) => {
    if (layer.type === 'hillshade' && layer.id !== SUN_HILLSHADE_LAYER_ID) {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
      hiddenBaseHillshades.add(layer.id);
    }
  });
};

const restoreBaseHillshades = (map: Map) => {
  hiddenBaseHillshades.forEach((id) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility', 'visible');
    }
  });
  hiddenBaseHillshades.clear();
};

export const applySunHillshade = (
  map: Map,
  date: Date,
  lat: number,
  lon: number,
): SunPosition => {
  ensureSunHillshadeLayer(map);
  hideBaseHillshades(map);
  const sun = getSunPosition(date, lat, lon);
  const belowHorizon = sun.altitudeDeg <= 0;
  const { shadow, highlight } = sunColors(sun.altitudeDeg);

  map.setPaintProperty(
    SUN_HILLSHADE_LAYER_ID,
    'hillshade-illumination-direction',
    Math.round(sun.azimuthDeg),
  );
  map.setPaintProperty(
    SUN_HILLSHADE_LAYER_ID,
    'hillshade-illumination-altitude',
    belowHorizon ? 1 : Math.round(sun.altitudeDeg),
  );
  map.setPaintProperty(
    SUN_HILLSHADE_LAYER_ID,
    'hillshade-shadow-color',
    shadow,
  );
  map.setPaintProperty(
    SUN_HILLSHADE_LAYER_ID,
    'hillshade-highlight-color',
    highlight,
  );

  return sun;
};

export const removeSunHillshade = (map: Map) => {
  restoreBaseHillshades(map);
  if (map.getLayer(SUN_HILLSHADE_LAYER_ID)) {
    map.removeLayer(SUN_HILLSHADE_LAYER_ID);
  }
  if (map.getSource(SUN_DEM_SOURCE_ID)) {
    map.removeSource(SUN_DEM_SOURCE_ID);
  }
};
