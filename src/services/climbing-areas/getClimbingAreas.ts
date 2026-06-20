import { fetchOverpass } from '../overpass/fetchOverpass';

type Member = { type: 'node' | 'way' | 'relation'; ref: number; role?: string };

export type ClimbingArea = {
  id: number;
  type: string;
  tags: {
    name: string;
  };
  members: Member[];
  center?: {
    lat: number;
    lon: number;
  };
  countryCode?: string;
};

type OsmEl = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  members?: Member[];
};

const CHUNK_SIZE = 100; // keeps the request URL well under any server limit

const walkForCenter = (
  el: OsmEl,
  byKey: Map<string, OsmEl>,
  visited: Set<string>,
): { lat: number; lon: number } | null => {
  const key = `${el.type}/${el.id}`;
  if (visited.has(key)) return null;
  visited.add(key);

  if (el.type === 'node' && el.lat != null && el.lon != null) {
    return { lat: el.lat, lon: el.lon };
  }
  if (el.center) return el.center;

  for (const m of el.members ?? []) {
    const child = byKey.get(`${m.type}/${m.ref}`);
    if (!child) continue;
    const c = walkForCenter(child, byKey, visited);
    if (c) return c;
  }
  return null;
};

const fetchCentersForChunk = async (
  ids: number[],
): Promise<Map<number, { lat: number; lon: number }>> => {
  const result = new Map<number, { lat: number; lon: number }>();

  // Recurse all descendants into the result set, then walk each relation's
  // member tree in JS to find a representative coordinate. Overpass's plain
  // `out center` doesn't compute a centre for relations whose members are only
  // sub-relations – see https://github.com/drolbr/Overpass-API/issues/733
  const query = `[out:json][timeout:300];rel(id:${ids.join(',')})->.a;(.a;.a >>;);out body center qt;`;

  try {
    const response = await fetchOverpass(query);
    const elements = (response?.elements ?? []) as OsmEl[];

    const byKey = new Map<string, OsmEl>();
    for (const el of elements) {
      byKey.set(`${el.type}/${el.id}`, el);
    }

    for (const id of ids) {
      const root = byKey.get(`relation/${id}`);
      if (!root) continue;
      const center = walkForCenter(root, byKey, new Set());
      if (center) result.set(id, center);
    }
  } catch (e) {
    console.warn('fetchCentersForChunk() failed:', e); // eslint-disable-line no-console
  }

  return result;
};

const fetchMissingCenters = async (
  ids: number[],
): Promise<Map<number, { lat: number; lon: number }>> => {
  const result = new Map<number, { lat: number; lon: number }>();
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const part = await fetchCentersForChunk(ids.slice(i, i + CHUNK_SIZE));
    for (const [id, c] of part) result.set(id, c);
  }
  return result;
};

export const getClimbingAreas = async (): Promise<ClimbingArea[]> => {
  const query = `[out:json][timeout:300]; rel["climbing"="area"]; out body center;`;

  const areas = (await fetchOverpass(query))?.elements as ClimbingArea[];
  if (!areas?.length) return areas;

  const missingIds = areas.filter((a) => !a.center).map((a) => a.id);
  if (missingIds.length > 0) {
    const centers = await fetchMissingCenters(missingIds);
    for (const area of areas) {
      if (!area.center) {
        const center = centers.get(area.id);
        if (center) area.center = center;
      }
    }
  }

  return areas;
};
