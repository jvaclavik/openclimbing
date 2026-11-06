import { createHash, timingSafeEqual } from 'node:crypto';
import { isTrack, Track } from '../../services/tours/tracks';

export const MAX_MAP_TOURS = 25;

export const parseTourBounds = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const parts = value.split(',');
  if (parts.length !== 4 || parts.some((part) => !part.trim())) return null;
  const [west, south, east, north] = parts.map(Number);
  if (
    ![west, south, east, north].every(Number.isFinite) ||
    west < -180 ||
    east > 180 ||
    south < -90 ||
    north > 90 ||
    west >= east ||
    south >= north ||
    east - west > 8 ||
    north - south > 8
  )
    return null;
  return { west, south, east, north };
};

const trackSummary = (track: Track) => {
  let west = 180,
    east = -180,
    south = 90,
    north = -90,
    length = 0;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  for (const segment of track) {
    segment.forEach(([lon, lat], index) => {
      west = Math.min(west, lon);
      east = Math.max(east, lon);
      south = Math.min(south, lat);
      north = Math.max(north, lat);
      if (index === 0) return;
      const [previousLon, previousLat] = segment[index - 1];
      const a =
        Math.sin(radians(lat - previousLat) / 2) ** 2 +
        Math.cos(radians(lat)) *
          Math.cos(radians(previousLat)) *
          Math.sin(radians(lon - previousLon) / 2) ** 2;
      length += 12_742_000 * Math.asin(Math.sqrt(Math.min(1, a)));
    });
  }
  if (east - west > 8 || north - south > 8 || length < 1) {
    throw new Error(
      'Die Strecke muss eine lokale Tour mit mindestens einem Meter Länge sein.',
    );
  }
  const normalized = track.map((segment) =>
    segment.map((point) => point.map((value) => Math.round(value * 1e6))),
  );
  const forward = JSON.stringify(normalized);
  const reverse = JSON.stringify(
    normalized
      .slice()
      .reverse()
      .map((segment) => segment.slice().reverse()),
  );
  return {
    west,
    east,
    south,
    north,
    length_m: Math.round(length),
    track_hash: createHash('sha256')
      .update(forward < reverse ? forward : reverse)
      .digest('hex'),
  };
};

const field = (value: unknown, maximum: number) => {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > maximum)
    throw new Error('Ungültige Metadaten.');
  return value.trim() || null;
};

export const prepareTour = (body: Record<string, unknown>) => {
  const name = field(body?.name, 120);
  const source = field(body?.source, 500);
  const attribution = field(body?.attribution, 500);
  const difficulty = field(body?.difficulty, 30);
  const osm_ref = field(body?.osm_ref, 30);
  const duration_minutes = body?.duration_minutes ?? null;
  if (
    !name ||
    !source ||
    body?.rights_confirmed !== true ||
    !isTrack(body?.track)
  ) {
    throw new Error(
      'Name, Herkunft, zulässige Nutzungsrechte und ein gültiger Track sind erforderlich.',
    );
  }
  if (osm_ref && !/^(way|relation)\/[1-9]\d{0,17}$/.test(osm_ref)) {
    throw new Error('OSM-Bezug im Format way/123 oder relation/123 eingeben.');
  }
  if (
    duration_minutes !== null &&
    (typeof duration_minutes !== 'number' ||
      !Number.isInteger(duration_minutes) ||
      duration_minutes < 1 ||
      duration_minutes > 10_080)
  ) {
    throw new Error('Ungültige Dauer in Minuten.');
  }
  return {
    name,
    source,
    attribution,
    difficulty,
    osm_ref,
    duration_minutes,
    track: body.track,
    ...trackSummary(body.track),
    rights_confirmed_at: new Date().toISOString(),
  };
};

export const canWriteTours = (
  header: string | undefined,
  secret: string | undefined,
) => {
  if (!secret || secret.length < 32 || !header) return false;
  const expected = Uint8Array.from(Buffer.from('Bearer ' + secret));
  const actual = Uint8Array.from(Buffer.from(header));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};
