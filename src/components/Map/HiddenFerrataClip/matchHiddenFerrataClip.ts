import type { View } from '../../utils/MapStateContext';

const EARTH_RADIUS_M = 6372795;

/** Map has to be this close before a clip appears. */
export const HIDDEN_FERRATA_MIN_ZOOM = 14;

/** Centre of the view, in metres, from the via ferrata point. */
export const HIDDEN_FERRATA_MAX_DISTANCE_M = 700;

export type HiddenFerrataClipMatch = {
  id: string;
  sources: readonly [string, ...string[]];
};

type Spot = HiddenFerrataClipMatch & {
  lat: number;
  lon: number;
  shortId?: string;
};

const SPOTS: Spot[] = [
  {
    // Lenzsteig, Karlstadt / Kalbenstein, OSM way 42213444
    id: 'lenzsteig',
    shortId: 'w42213444',
    sources: [
      '/versteckt/lenzsteig.mp4',
      '/versteckt/lenzsteig-waldweg.mp4',
      '/versteckt/szene-13.mp4',
      '/versteckt/szene-23.mp4',
      '/versteckt/szene-25.mp4',
    ],
    lat: 49.9913425,
    lon: 9.7612947,
  },
  {
    // Tegelbergsteig, OSM way 84013032
    id: 'tegelberg',
    shortId: 'w84013032',
    sources: ['/versteckt/tegelberg.mp4'],
    lat: 47.5626131,
    lon: 10.7747456,
  },
  {
    // Ferrata Burrone Giovannelli, Mezzocorona, OSM way 219231582
    id: 'mezzocorona',
    shortId: 'w219231582',
    sources: [
      '/versteckt/mezzocorona.mp4',
      '/versteckt/mezzocorona-felsen.mp4',
      '/versteckt/mezzocorona-leiter.mp4',
    ],
    lat: 46.2304381,
    lon: 11.0987999,
  },
  {
    // Riva del Garda town centre and harbour
    id: 'rivadelgarda',
    sources: ['/versteckt/rivadelgarda.mp4', '/versteckt/szene-33.mp4'],
    lat: 45.8847708,
    lon: 10.8396942,
  },
  {
    // Norissteig, OSM way 1156787758
    id: 'norissteig',
    shortId: 'w1156787758',
    sources: ['/versteckt/norissteig.mp4'],
    lat: 49.5441152,
    lon: 11.5306697,
  },
  {
    // Laber summit and upper cable car station, OSM node 452941377
    id: 'laber',
    sources: [
      '/versteckt/laber.mp4',
      '/versteckt/laber-huette.mp4',
      '/versteckt/szene-32.mp4',
      '/versteckt/szene-35.mp4',
    ],
    lat: 47.5858442,
    lon: 11.102169,
  },
  {
    // Stopselzieher, OSM way 37293628
    id: 'stopselzieher',
    shortId: 'w37293628',
    sources: ['/versteckt/stopselzieher.mp4'],
    lat: 47.4225221,
    lon: 10.9729653,
  },
  {
    // Wiener-Neustädter-Hütte
    id: 'wiener-neustaedter-huette',
    sources: ['/versteckt/szene-14.mp4'],
    lat: 47.423253,
    lon: 10.970203,
  },
  {
    // Zugspitze summit, Wikidata Q3375
    id: 'zugspitze',
    sources: [
      '/versteckt/szene-15.mp4',
      '/versteckt/szene-16.mp4',
      '/versteckt/szene-29.mp4',
      '/versteckt/szene-30.mp4',
    ],
    lat: 47.42122,
    lon: 10.98631,
  },
  {
    // Schloss Neuschwanstein, OSM way 221601969
    id: 'neuschwanstein',
    sources: ['/versteckt/szene-26.mp4'],
    lat: 47.55755,
    lon: 10.74952,
  },
  {
    // Malcesine town centre, OSM node 64778921
    id: 'malcesine',
    sources: ['/versteckt/szene-27.mp4', '/versteckt/szene-28.mp4'],
    lat: 45.7643,
    lon: 10.8101,
  },
  {
    // Kofel summit, OSM node 296034076
    id: 'kofel',
    sources: ['/versteckt/szene-37.mp4'],
    lat: 47.5869,
    lon: 11.0595,
  },
  {
    // Cima Capi summit, Ferrata Fausto Susatti
    id: 'cima-capi',
    sources: ['/versteckt/szene-12.mp4'],
    lat: 45.869364,
    lon: 10.828636,
  },
  {
    // Cima Rocca summit, near the historic tunnels
    id: 'cima-rocca',
    sources: ['/versteckt/szene-11.mp4'],
    lat: 45.87222,
    lon: 10.82195,
  },
];

export const FERRATA_DETAIL_VIDEO_OPENED = 'kletterglueck:detail-video-opened';

export const getFerrataDetailClips = (shortId: string) =>
  SPOTS.find((spot) => spot.shortId === shortId)?.sources;

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

  let best: { spot: Spot; distance: number } | null = null;
  for (const spot of SPOTS) {
    const distance = distanceMeters(parsed.lat, parsed.lon, spot.lat, spot.lon);
    if (distance > HIDDEN_FERRATA_MAX_DISTANCE_M) continue;
    if (!best || distance < best.distance) best = { spot, distance };
  }

  return best?.spot ?? null;
};
