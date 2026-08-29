import { fetchJson } from '../fetch';
import { CLIMBING_TILES_HOST } from '../osm/consts';

export type DbExportInfo = {
  fileName: string;
  size: number;
  date: string;
};

// POST creates a fresh export and redirects to the file, GET returns metadata
export const DB_EXPORT_URL = `${CLIMBING_TILES_HOST}api/climbing-tiles/export`;

export const getDbExportInfo = async (): Promise<DbExportInfo | null> => {
  try {
    return await fetchJson<DbExportInfo | null>(DB_EXPORT_URL);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('getDbExportInfo failed', e);
    return null;
  }
};
