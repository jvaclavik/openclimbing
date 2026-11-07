import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DOMParser } from '@xmldom/xmldom';
import { isTrack, Track } from '../../services/tours/tracks';

export const OSM_VARIANT_PILOT = 'norissteig-osm-variante';

const gpxPath = () =>
  join(process.cwd(), 'docs/project/norissteig-osm-variante.gpx');

export const parseServerGpx = (xml: string): Track => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const root = doc.documentElement;
  if (!root || root.localName !== 'gpx')
    throw new Error('Ungültige GPX-Datei.');
  const tracks = Array.from(root.childNodes).filter(
    (node) => node.localName === 'trk',
  );
  if (tracks.length !== 1)
    throw new Error('Die GPX-Datei muss genau einen Track enthalten.');
  const track = Array.from(tracks[0].childNodes)
    .filter((node) => node.localName === 'trkseg')
    .map((segment) =>
      Array.from(segment.childNodes)
        .filter((node) => node.localName === 'trkpt')
        .map((point) => {
          const element = point as unknown as {
            getAttribute(name: string): string | null;
          };
          return [
            Number(element.getAttribute('lon')),
            Number(element.getAttribute('lat')),
          ] as [number, number];
        }),
    );
  if (!isTrack(track))
    throw new Error(
      'Ungültige Koordinaten, zu kurze Segmente oder mehr als 5.000 Punkte.',
    );
  return track;
};

export const osmVariantRecord = (rightsConfirmed: unknown) => ({
  name: 'Norissteig ab Hirschbach – OSM-Variante',
  difficulty: null,
  duration_minutes: null,
  osm_ref: 'way/1156787758',
  source:
    '© OpenStreetMap contributors, ODbL 1.0. Datei docs/project/norissteig-osm-variante.gpx im Repository. Nicht der 291-Punkte-Originaltrack.',
  attribution:
    '© OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright',
  rights_confirmed: rightsConfirmed,
  track: parseServerGpx(readFileSync(gpxPath(), 'utf8')),
});

export const tourRecordFromBody = (
  body: Record<string, unknown> | undefined,
) => {
  if (!body || body.pilot === undefined) return body;
  if (body.pilot !== OSM_VARIANT_PILOT)
    throw new Error('Unbekannter vorbereiteter Track.');
  return osmVariantRecord(body.rights_confirmed);
};
