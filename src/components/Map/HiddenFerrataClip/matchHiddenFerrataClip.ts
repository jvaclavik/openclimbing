import { View } from '../../utils/MapStateContext';

const EARTH_RADIUS_M = 6372795;

/** Map has to be this close before a clip appears. */
export const HIDDEN_FERRATA_MIN_ZOOM = 14;

/** Centre of the view, in metres, from the via ferrata point. */
export const HIDDEN_FERRATA_MAX_DISTANCE_M = 700;

export type HiddenFerrataClipMatch = {
  id: 'lenzsteig' | 'tegelberg' | 'mezzocorona';
  src: string;
};

const SPOTS: Array<HiddenFerrataClipMatch & { lat: number; lon: number }> = [
  {
    id: 'lenzsteig',
    src: '/versteckt/lenzsteig.mp4',
    // Lenzsteig, Karlstadt / Kalbenstein, OSM way 42213444
    lat: 49.9913425,
    lon: 9.7612947,
  },
  {
    id: 'tegelberg',
    src: '/versteckt/tegelberg.mp4',
    // Tegelbergsteig, OSM way 84013032
    lat: 47.5626131,
    lon: 10.7747456,
  },
  {
    id: 'mezzocorona',
    src: '/versteckt/mezzocorona.mp4',
    // Ferrata Burrone Giovannelli, Mezzocorona, OSM way 219231582
    lat: 46.2304381,
    lon: 11.0987999,
  },
];

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const distanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const latDiff = toRadians(lat2 - lat1);
  const lonDiff = toRadians(lon2 - lon1);
  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(lonDiff / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.asin(Math.sqrt(a));
};

const parseView = (view: View) => {
  const zoom = Number(view?.[0]);
  const lat = Number(view?.[1]);
  const lon = Number(view?.[2]);
  if (![zoom, lat, lon].every(Number.isFinite)) return null;
  return { zoom, lat, lon };
};

/** Which short clip, if any, belongs to the current map view. */
export const matchHiddenFerrataClip = (
  view: View,
): HiddenFerrataClipMatch | null => {
  const parsed = parseView(view);
  if (!parsed || parsed.zoom < HIDDEN_FERRATA_MIN_ZOOM) return null;

  let best: { spot: (typeof SPOTS)[number]; distance: number } | null = null;
  for (const spot of SPOTS) {
    const distance = distanceMeters(parsed.lat, parsed.lon, spot.lat, spot.lon);
    if (distance > HIDDEN_FERRATA_MAX_DISTANCE_M) continue;
    if (!best || distance < best.distance) best = { spot, distance };
  }

  if (!best) return null;
  return { id: best.spot.id, src: best.spot.src };
};
