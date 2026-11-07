import { FeatureGeometry, LonLat } from '../../../services/types';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '\u0026amp;')
    .replace(/</g, '\u0026lt;')
    .replace(/>/g, '\u0026gt;')
    .replace(/"/g, '\u0026quot;');

export const linesFromGeometry = (
  geometry?: FeatureGeometry,
): LonLat[][] => {
  if (!geometry) return [];
  if (geometry.type === 'LineString') return [geometry.coordinates];
  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.flatMap((part) => linesFromGeometry(part));
  }
  return [];
};

export const viaFerrataGpx = (name: string, lines: LonLat[][]) => {
  const segments = lines
    .filter((line) => line.length >= 2)
    .map(
      (line) =>
        `<trkseg>${line
          .map(
            ([lon, lat]) =>
              `<trkpt lat="${Number(lat)}" lon="${Number(lon)}"></trkpt>`,
          )
          .join('')}</trkseg>`,
    )
    .join('');
  if (!segments) return '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Klettersteig-Karte" xmlns="http://www.topografix.com/GPX/1/1">
<trk><name>${escapeXml(name)}</name>${segments}</trk>
</gpx>`;
};

export const gpxFileName = (name: string) => {
  const safe = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, '-')
    .replace(/^-|-$/g, '');
  return `${safe || 'klettersteig'}.gpx`;
};
