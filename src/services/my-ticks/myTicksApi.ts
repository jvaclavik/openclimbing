import { ClimbingTick, ClimbingTickDb } from '../../types';
import { fetchJson, fetchText } from '../fetch';
import { getApiId, getShortId } from '../helpers';
import { OsmType } from '../types';
import { parsePairing } from './tickPairing';
import type { MentionedClimbingTick } from './tickMentions';

const convertToDb = (tick: Partial<ClimbingTick>): Partial<ClimbingTickDb> => {
  const { shortId, ...rest } = tick;
  const osmId = shortId ? getApiId(shortId) : false;
  const osmDbId = osmId ? { osmType: osmId.type, osmId: osmId.id } : {};

  return {
    ...rest,
    ...osmDbId,
  };
};

export const convertClimbingTickFromDb = (
  dbRow: ClimbingTickDb,
): ClimbingTick => {
  const { osmType, osmId, pairing, ...rest } = dbRow;
  const idNum = osmId === null || osmId === undefined ? NaN : Number(osmId);
  const hasOsmRef =
    typeof osmType === 'string' &&
    osmType.trim() !== '' &&
    Number.isFinite(idNum) &&
    idNum >= 1;
  const shortId = hasOsmRef
    ? getShortId({ type: osmType as OsmType, id: idNum })
    : null;

  return {
    ...rest,
    pairing: parsePairing(pairing),
    shortId,
  };
};

export const postClimbingTick = async (
  tick: Partial<Omit<ClimbingTick, 'id' | 'osmUserId'>>,
) => {
  const id = await fetchText('/api/climbing-ticks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(convertToDb(tick)),
  });
  return parseInt(id, 10);
};

export const putClimbingTick = async (tick: Partial<ClimbingTick>) => {
  if (!tick.id) {
    throw new Error('Tick.id missing');
  }
  await fetchJson(`/api/climbing-ticks/${tick.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(convertToDb(tick)),
  });
};

export const getClimbingTicks = async () => {
  return fetchJson<ClimbingTick[]>('/api/climbing-ticks', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    nocache: true,
  });
};

export const fetchPublicClimbingTicksByDisplayName = async (
  displayName: string,
): Promise<{ displayName: string; ticks: ClimbingTick[] }> => {
  return await fetchJson(
    `/api/climbing-ticks/public/${encodeURIComponent(displayName)}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      nocache: true,
    },
  );
};

export type ClimbingLeaderboardEntry = {
  osmUserId: number;
  displayName: string;
  points: number;
  tickCount: number;
};

export const fetchClimbingTicksLeaderboard = async (
  rangeSelectValue: string,
): Promise<{
  entries: ClimbingLeaderboardEntry[];
  periodStartIso: string | null;
  periodEndIso: string | null;
  availableYears: number[];
  periodRange: string;
}> => {
  const q = encodeURIComponent(rangeSelectValue);
  return fetchJson(`/api/climbing-ticks/leaderboard?range=${q}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    nocache: true,
  });
};

export const deleteClimbingTick = async (id: number) => {
  return await fetchJson(`/api/climbing-ticks/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
};

export const bulkDeleteClimbingTicks = async (ids: number[]) => {
  return await fetchJson('/api/climbing-ticks/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', ids }),
  });
};

/** Each item must contain `id`; other fields are applied as partial updates. */
export const bulkUpdateClimbingTicks = async (
  ticks: (Partial<ClimbingTick> & { id: number })[],
) => {
  return await fetchJson('/api/climbing-ticks/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', ticks: ticks.map(convertToDb) }),
  });
};

/** Creates ticks for the logged-in user; returns new ids in input order. */
export const bulkCreateClimbingTicks = async (
  ticks: Partial<Omit<ClimbingTick, 'id' | 'osmUserId'>>[],
): Promise<number[]> => {
  const { ids } = await fetchJson<{ ids: number[] }>(
    '/api/climbing-ticks/bulk',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ticks: ticks.map(convertToDb) }),
    },
  );
  return ids;
};

/** Other users' ticks that mention the logged-in user as a partner. */
export const fetchMentionedClimbingTicks = async (): Promise<
  MentionedClimbingTick[]
> => {
  const { ticks } = await fetchJson<{ ticks: MentionedClimbingTick[] }>(
    '/api/climbing-ticks/mentions',
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      nocache: true,
    },
  );
  return ticks;
};
