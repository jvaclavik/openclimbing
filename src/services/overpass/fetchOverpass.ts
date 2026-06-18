import { fetchJson } from '../fetch';
import { FetchError } from '../helpers';

// TODO add proper overpass types from refreshClimbingTilesHelpers.ts

export const MAIN_OVERPASS_HOST = 'overpass-api.de'; // main instance (minutely synced)

const OVERPASS_HOSTS = [
  MAIN_OVERPASS_HOST,
  'overpass.private.coffee', // alternative instance (minutely synced), we prefer it for bigger HW & less known
  'maps.mail.ru/osm/tools/overpass', // last alternative (minutely synced)
];

// Overpass lately experiences a lot of wierd issues ~ February 2026, see https://community.openstreetmap.org/t/overpass-api-performance-issues/140598
const isRetryableError = (e: FetchError) => {
  return (
    (e instanceof Error && e.message.includes('fetchJson: parse error')) ||
    (e instanceof FetchError &&
      (e.code === 'network' ||
        e.code === '429' ||
        e.code === '500' ||
        e.code === '502' ||
        e.code === '503' ||
        e.code === '504' ||
        e.code === '406'))
  );
};

interface FetchOverpassOpts {
  nocache?: boolean;
  hosts?: string[]; // override the default instances + fallback order
}

export const fetchOverpass = async (
  query: string,
  opts?: FetchOverpassOpts,
) => {
  const hosts = opts?.hosts ?? OVERPASS_HOSTS;
  const LAST_INDEX = hosts.length - 1;

  for (let i = 0; i < hosts.length; i++) {
    const host = hosts[i];

    try {
      const url = `https://${host}/api/interpreter?data=${encodeURIComponent(query)}`;
      const response = await fetchJson(url, {
        ...(opts?.nocache && { nocache: true }),
      });

      return response;
    } catch (e) {
      if (i === LAST_INDEX) {
        throw e;
      }

      if (isRetryableError(e)) {
        console.info(`Overpass ${host} failed, will try next host.`, e); // eslint-disable-line no-console
        continue;
      }

      throw e;
    }
  }
};
