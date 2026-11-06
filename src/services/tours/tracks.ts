export type TrackPoint = [longitude: number, latitude: number];
export type Track = TrackPoint[][];

export const MAX_TRACK_POINTS = 5000;

export const isTrack = (value: unknown): value is Track => {
  if (!Array.isArray(value) || value.length === 0) return false;
  let count = 0;
  for (const segment of value) {
    if (!Array.isArray(segment) || segment.length < 2) return false;
    count += segment.length;
    if (count > MAX_TRACK_POINTS) return false;
    for (const point of segment) {
      if (!Array.isArray(point) || point.length !== 2) return false;
      const [lon, lat] = point;
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;
      if (Math.abs(lon) > 180 || Math.abs(lat) > 90) return false;
    }
  }
  return true;
};

export const parseTourGpx = (xml: string): Track => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const root = doc.documentElement;
  const ns = root.namespaceURI;
  if (
    root.localName !== 'gpx' ||
    ![
      'http://www.topografix.com/GPX/1/0',
      'http://www.topografix.com/GPX/1/1',
    ].includes(ns)
  )
    throw new Error('Ungültige GPX-Datei.');

  const tracks = root.getElementsByTagNameNS(ns, 'trk');
  if (tracks.length !== 1)
    throw new Error('Die GPX-Datei muss genau einen Track enthalten.');
  const track = Array.from(tracks[0].children)
    .filter((el) => el.localName === 'trkseg' && el.namespaceURI === ns)
    .map((segment) =>
      Array.from(segment.children)
        .filter((el) => el.localName === 'trkpt' && el.namespaceURI === ns)
        .map((point) =>
          ['lon', 'lat'].map((key) =>
            Number(point.getAttribute(key)?.trim() || NaN),
          ),
        ),
    );
  if (!isTrack(track)) {
    throw new Error(
      'Ungültige Koordinaten, zu kurze Segmente oder mehr als 5.000 Punkte.',
    );
  }
  return track;
};

export type Tour = {
  id: string;
  name: string;
  difficulty: string | null;
  duration_minutes: number | null;
  osm_ref: string | null;
  source: string;
  attribution: string | null;
  track: Track;
  length_m: number;
};
