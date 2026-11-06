import type { FeatureCollection, LineString, Point } from 'geojson';

export const NORISSTEIG_START: [number, number] = [11.525013, 49.551756];
export const NORISSTEIG_ENTRY: [number, number] = [11.523, 49.546417];

const GPX_NS = 'http://www.topografix.com/GPX/1/1';

export const readNorissteigTrack = (
  xml: string,
): FeatureCollection<LineString | Point> => {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const tracks = document.getElementsByTagNameNS(GPX_NS, 'trk');
  const segments = document.getElementsByTagNameNS(GPX_NS, 'trkseg');
  const points = Array.from(document.getElementsByTagNameNS(GPX_NS, 'trkpt'));
  const coordinates = points.map((point) => [
    Number(point.getAttribute('lon') ?? NaN),
    Number(point.getAttribute('lat') ?? NaN),
  ]);

  if (
    document.documentElement.localName !== 'gpx' ||
    tracks.length !== 1 ||
    segments.length !== 1 ||
    segments[0].parentNode !== tracks[0] ||
    coordinates.length !== 291 ||
    points.some((point) => point.parentNode !== segments[0]) ||
    coordinates.some(
      ([lon, lat]) =>
        !(lon > 11.5 && lon < 11.56 && lat > 49.53 && lat < 49.57),
    ) ||
    coordinates[0][0].toFixed(5) !== '11.52507' ||
    coordinates[0][1].toFixed(5) !== '49.55174' ||
    coordinates[290][0].toFixed(6) !== '11.524927' ||
    coordinates[290][1].toFixed(6) !== '49.551741'
  ) {
    throw new Error('Die Datei entspricht nicht dem Norissteig-Pilottrack.');
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates },
        properties: {},
      },
      ...[
        { coordinates: NORISSTEIG_START, label: 'Start' },
        { coordinates: NORISSTEIG_ENTRY, label: 'Einstieg' },
      ].map(({ coordinates, label }) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates },
        properties: { label },
      })),
    ],
  };
};
