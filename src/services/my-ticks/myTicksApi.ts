import { ClimbingTick, ClimbingTickDb } from '../../types';
import { fetchJson, fetchText } from '../fetch';
import { getApiId, getShortId } from '../helpers';
import { OsmType } from '../types';
import { parsePairing } from './tickPairing';

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
