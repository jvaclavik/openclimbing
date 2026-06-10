import { t } from '../intl';
import { FetchedClimbingTick } from './getMyTicks';

/** Heuristic time per route when computing the activity duration. */
const MINUTES_PER_ROUTE = 20;

/** Default time of day when only a date is known (10:00 local). */
const DEFAULT_TIME_OF_DAY = 'T10:00:00';

const parseLengthMeters = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const match = raw.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const n = parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const computeElevationGainMeters = (ticks: FetchedClimbingTick[]): number => {
  let total = 0;
  for (const tick of ticks) {
    const length = parseLengthMeters(tick.tags?.['climbing:length']);
    if (length != null) total += length;
  }
  return Math.round(total);
};

const pickLocation = (
  ticks: FetchedClimbingTick[],
): { lat: number; lon: number } | null => {
  for (const tick of ticks) {
    const c = tick.center;
    if (c && c.length >= 2 && Number.isFinite(c[0]) && Number.isFinite(c[1])) {
      return { lat: c[1], lon: c[0] };
    }
  }
  return null;
};

const buildTitle = (
  commonAreaName: string | null,
  singleCragName: string | null,
): string => {
  if (commonAreaName) {
    return t('my_ticks.share.gpx_title_at_area', { area: commonAreaName });
  }
  if (singleCragName) {
    return t('my_ticks.share.gpx_title_at_crag', { crag: singleCragName });
  }
  return t('my_ticks.share.gpx_title_generic');
};

/** Wraps a string in CDATA, escaping any literal "]]>" sequence inside. */
const cdata = (text: string): string => {
  const safe = text.replace(/]]>/g, ']]]]><![CDATA[>');
  return `<![CDATA[${safe}]]>`;
};

const escapeXmlAttr = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

type BuildSessionGpxOptions = {
  /** YYYY-MM-DD */
  sessionDate: string;
  sessionTicks: FetchedClimbingTick[];
  /** Pre-formatted body text (from buildSessionShareText). */
  description: string;
  commonAreaName: string | null;
  singleCragName: string | null;
};

export type SessionGpxResult = {
  xml: string;
  filename: string;
  title: string;
};

/**
 * Builds a GPX 1.1 document that can be imported into Strava as a Rock
 * Climbing activity. Includes:
 *  - title (track + metadata name)
 *  - description (the share text from buildSessionShareText)
 *  - start time (sessionDate at 10:00 local)
 *  - duration = ticks.length * 20 min (encoded as 2 trkpts apart in time)
 *  - elevation gain = sum of OSM `climbing:length` tags across ticks
 *  - <type>RockClimbing</type> hint for Strava auto-classification
 */
export const buildSessionGpx = ({
  sessionDate,
  sessionTicks,
  description,
  commonAreaName,
  singleCragName,
}: BuildSessionGpxOptions): SessionGpxResult => {
  const title = buildTitle(commonAreaName, singleCragName);
  const durationSec = Math.max(
    sessionTicks.length * MINUTES_PER_ROUTE * 60,
    60,
  );

  const start = new Date(`${sessionDate}${DEFAULT_TIME_OF_DAY}`);
  const end = new Date(start.getTime() + durationSec * 1000);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const location = pickLocation(sessionTicks) ?? { lat: 0, lon: 0 };
  const elevationGain = computeElevationGainMeters(sessionTicks);
  // Strava recomputes elevation from SRTM for many activities, but providing
  // a delta between two trkpts gives it the right shape regardless. Base 0 m
  // ASL — climbing total ascent is what matters, not absolute altitude.
  const startEle = 0;
  const endEle = elevationGain;

  const trkpt = (timeIso: string, ele: number) =>
    `      <trkpt lat="${escapeXmlAttr(String(location.lat))}" lon="${escapeXmlAttr(
      String(location.lon),
    )}">
        <ele>${ele}</ele>
        <time>${timeIso}</time>
      </trkpt>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="openclimbing.org" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${cdata(title)}</name>
    <desc>${cdata(description)}</desc>
    <time>${startIso}</time>
  </metadata>
  <trk>
    <name>${cdata(title)}</name>
    <type>RockClimbing</type>
    <trkseg>
${trkpt(startIso, startEle)}
${trkpt(endIso, endEle)}
    </trkseg>
  </trk>
</gpx>
`;

  return {
    xml,
    filename: `openclimbing_session_${sessionDate}.gpx`,
    title,
  };
};
